import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Trash2, RotateCcw, Plus, Loader2, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { appSettingsOptions, sectionDefaults, settingsProblem, type AppSettings, type SectionKey } from "@/lib/app-settings";
import wordCatalog from "@/lib/app-word-catalog.json";
import { appearanceOptions, defaultAppearance } from "@/lib/site-appearance";
import { defaultSlides, readSlides } from "@/lib/showcase";
import { prepareChannelLogo } from "@/lib/channel-logo";
import { dataBundles } from "@/lib/data-bundles";
import { PaymentSettings } from "@/components/PaymentSettings";
import { AppearanceEditor } from "@/components/AppearanceEditor";
import { LiveComments } from "@/components/MatchCenter";
import mobileData from "@/assets/mobile-data.jpg";
import insidePreview from "@/assets/app-inside-preview.jpg";
import channelCover from "@/assets/channel-cover.jpg";

const groupNames: Record<string, string> = { "src/routes/index.tsx": "Chaneli na kutazama", "src/routes/auth.tsx": "Usajili na kuingia", "src/routes/akaunti.tsx": "Akaunti", "src/routes/sakinisha.tsx": "Sakinisha", "src/routes/vifurushi.tsx": "Vifurushi na malipo", "src/components/InstallGate.tsx": "Ukurasa wa nje", "src/components/SiteHeader.tsx": "Jina na menyu ya juu", "src/components/BottomNavigation.tsx": "Menyu ya chini", "src/components/HlsPlayer.tsx": "Video", "src/components/MatchCenter.tsx": "Mechi na maoni", "src/components/Community.tsx": "Jamii", "src/lib/showcase.ts": "Majina ya picha" };
const sectionNames: Record<SectionKey, string> = { headerName: "Jina la app juu", insideShowcase: "Picha zinazobadilika ndani", aiSearch: "Utafutaji wa AI", trialNotice: "Taarifa za muda na kifurushi", scoreboard: "Ubao wa matokeo", matchStats: "Takwimu za mechi", liveBadges: "Alama za LIVE", cardBadges: "Vibandiko juu ya nembo", channelDetails: "Maelezo chini ya video", comments: "Maoni ya wateja", bottomNavigation: "Menyu ya chini", community: "Kitufe cha WhatsApp", outsideLikes: "Like za nje", phoneIntroduction: "Maelezo ya app kwenye simu", dataOffers: "Ofa za GB", insidePreview: "Picha ya muonekano wa ndani", installInstructions: "Hatua za kusakinisha" };
const pictures = [{ key: "appLogo", name: "Nembo ya app", fallback: "/icon-192.png" }, { key: "mobileData", name: "Picha ya GB", fallback: mobileData }, { key: "insidePreview", name: "Muonekano wa ndani", fallback: insidePreview }, { key: "channelFallback", name: "Picha ya chaneli isiyo na nembo", fallback: channelCover }];
export function AppSettingsEditor({ manage }: { manage: (tab: string) => void }) {
  const query = useQuery(appSettingsOptions);
  if (query.isPending) return <p>Inapakia mipangilio…</p>;
  if (query.isError) return <Button onClick={() => query.refetch()}>Jaribu tena</Button>;
  return <SettingsForm initial={query.data} manage={manage} />;
}
function SettingsForm({ initial, manage }: { initial: AppSettings; manage: (tab: string) => void }) {
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const qc = useQueryClient();
  const { data: appearance = defaultAppearance } = useQuery(appearanceOptions);
  const update = (next: AppSettings) => { setForm(next); setDirty(true); };
  const slides = form.slides ?? (readSlides(appearance.slides).length ? readSlides(appearance.slides) : defaultSlides);
  const words = Array.from(new Set(Object.entries(wordCatalog).filter(([key]) => group === "all" || key === group).flatMap(([, values]) => values).concat(Object.keys(form.words), appearance.title, appearance.tagline, appearance.description, appearance.button_label, "Zote", "Michezo", "Habari", "Filamu", "Burudani", "Muziki", "Inatafuta…", "Inasakinisha…", "Inatuma…", "MAONI", "TSh"))).filter(word => word.toLocaleLowerCase().includes(search.toLocaleLowerCase()) || (form.words[word] ?? "").toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  async function save() {
    const problem = settingsProblem(form); if (problem) { toast.error(problem); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("app_settings").upsert({ id: "main", content: JSON.parse(JSON.stringify(form)), updated_at: new Date().toISOString() });
      if (error) throw error;
      await qc.invalidateQueries(appSettingsOptions); setDirty(false); toast.success("Mipangilio imehifadhiwa kwa wateja wote.");
    } catch { toast.error("Haijahifadhiwa. Hakikisha umeingia kama admin, kisha jaribu tena."); }
    finally { setBusy(false); }
  }
  async function upload(file: File | undefined, apply: (image: string) => void) {
    if (!file) return; setBusy(true);
    try { apply(await prepareChannelLogo(file, 1280)); } catch (e) { toast.error(e instanceof Error ? e.message : "Picha haijapakiwa."); } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background py-3">
      <div><h2 className="font-display text-2xl">Mipangilio ya app nzima</h2><p className="text-xs text-muted-foreground" role="status">{dirty ? "Kuna mabadiliko hayajahifadhiwa" : "Mipangilio yako"}</p></div>
      <Button onClick={save} disabled={busy || !dirty}>{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Hifadhi mipangilio</Button>
    </div>
    <Tabs defaultValue="words">
      <TabsList className="h-auto flex-wrap justify-start"><TabsTrigger value="words">Maandishi</TabsTrigger><TabsTrigger value="pictures">Picha</TabsTrigger><TabsTrigger value="sections">Sehemu</TabsTrigger><TabsTrigger value="blocks">Ongeza maudhui</TabsTrigger><TabsTrigger value="data">GB</TabsTrigger><TabsTrigger value="payments">Malipo</TabsTrigger><TabsTrigger value="outside">Muonekano wa nje</TabsTrigger><TabsTrigger value="chat">Maoni</TabsTrigger><TabsTrigger value="manage">Huduma</TabsTrigger></TabsList>
      <TabsContent value="words" className="space-y-4">
        <div className="flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input aria-label="Tafuta maandishi" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta neno lolote…"/></div><select aria-label="Chagua ukurasa" className="max-w-full rounded-md border border-input bg-background p-2 text-sm" value={group} onChange={e => setGroup(e.target.value)}><option value="all">App nzima</option>{Object.entries(groupNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>
        <div className="divide-y divide-border">{words.map(word => <div key={word} className="grid gap-2 py-4 md:grid-cols-[1fr_1fr_auto]"><Label className="break-words text-xs leading-5">{word}</Label><Textarea aria-label={`Hariri: ${word}`} value={form.words[word] ?? word} rows={2} onChange={e => update({ ...form, words: { ...form.words, [word]: e.target.value } })}/><div className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Futa maandishi: ${word}`} title="Futa maandishi" onClick={() => update({ ...form, words: { ...form.words, [word]: "" } })}><Trash2 className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label={`Rudisha: ${word}`} title="Rudisha ya awali" onClick={() => { const next = { ...form.words }; delete next[word]; update({ ...form, words: next }); }}><RotateCcw className="h-4 w-4"/></Button></div></div>)}</div>
      </TabsContent>
      <TabsContent value="sections" className="divide-y divide-border">{(Object.keys(sectionDefaults) as SectionKey[]).map(key => <div key={key} className="flex items-center justify-between gap-4 py-4"><Label htmlFor={`section-${key}`}>{sectionNames[key]}</Label><Switch id={`section-${key}`} checked={form.sections[key] ?? sectionDefaults[key]} onCheckedChange={checked => update({ ...form, sections: { ...form.sections, [key]: checked } })}/></div>)}</TabsContent>
      <TabsContent value="pictures" className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">{pictures.map(p => <div key={p.key} className="space-y-3 border-b border-border pb-5"><Label>{p.name}</Label>{(form.images[p.key] ?? p.fallback) && <img src={form.images[p.key] ?? p.fallback} alt={p.name} className="h-40 w-full bg-card object-contain"/>}<Input aria-label={`Pakia ${p.name}`} type="file" accept="image/*" disabled={busy} onChange={e => { void upload(e.target.files?.[0], img => update({ ...form, images: { ...form.images, [p.key]: img } })); e.target.value = ""; }}/><div className="flex gap-2"><Button variant="outline" onClick={() => update({ ...form, images: { ...form.images, [p.key]: "" } })}><Trash2 className="h-4 w-4"/>Ondoa</Button><Button variant="ghost" onClick={() => { const next = { ...form.images }; delete next[p.key]; update({ ...form, images: next }); }}><RotateCcw className="h-4 w-4"/>Ya awali</Button></div></div>)}</div>
        <h3 className="font-display text-xl">Picha zinazobadilika ndani na nje</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{slides.map((slide, i) => <div key={i} className="space-y-2"><img src={slide.image} alt={slide.title} className="aspect-video w-full object-contain"/><Input aria-label={`Jina la bango ${i + 1}`} value={slide.title} onChange={e => update({ ...form, slides: slides.map((s, j) => j === i ? { ...s, title: e.target.value } : s) })}/><Input aria-label={`Badili picha ${i + 1}`} type="file" accept="image/*" disabled={busy} onChange={e => { void upload(e.target.files?.[0], image => update({ ...form, slides: slides.map((s, j) => j === i ? { ...s, image } : s) })); e.target.value = ""; }}/><Button variant="ghost" onClick={() => update({ ...form, slides: slides.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4"/>Futa picha</Button></div>)}</div>
        <Label htmlFor="new-slide">Ongeza picha</Label><Input id="new-slide" type="file" accept="image/*" disabled={busy} onChange={e => { void upload(e.target.files?.[0], image => update({ ...form, slides: [...slides, { image, title: "" }] })); e.target.value = ""; }}/>
      </TabsContent>
      <TabsContent value="blocks" className="space-y-5">{form.blocks.map(block => <div key={block.id} className="space-y-3 border-b border-border py-4"><Input aria-label="Kichwa cha maudhui" value={block.title} onChange={e => update({ ...form, blocks: form.blocks.map(b => b.id === block.id ? { ...b, title: e.target.value } : b) })}/><Textarea aria-label="Maelezo ya maudhui" value={block.body} onChange={e => update({ ...form, blocks: form.blocks.map(b => b.id === block.id ? { ...b, body: e.target.value } : b) })}/><select aria-label="Ukurasa wa maudhui" value={block.page} className="rounded border border-input bg-background p-2" onChange={e => update({ ...form, blocks: form.blocks.map(b => b.id === block.id ? { ...b, page: e.target.value } : b) })}>{[["/outside", "Nje"], ["/", "Chaneli"], ["/vifurushi", "Vifurushi"], ["/sakinisha", "Sakinisha"], ["/akaunti", "Akaunti"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Input aria-label="Pakia picha ya maudhui" type="file" accept="image/*" onChange={e => { void upload(e.target.files?.[0], image => update({ ...form, blocks: form.blocks.map(b => b.id === block.id ? { ...b, image } : b) })); e.target.value = ""; }}/><div className="flex flex-wrap items-center gap-3"><Switch aria-label="Onyesha maudhui" checked={block.active} onCheckedChange={active => update({ ...form, blocks: form.blocks.map(b => b.id === block.id ? { ...b, active } : b) })}/><Button variant="ghost" onClick={() => update({ ...form, blocks: form.blocks.map(b => b.id === block.id ? { ...b, image: "" } : b) })}>Ondoa picha</Button><Button variant="destructive" onClick={() => update({ ...form, blocks: form.blocks.filter(b => b.id !== block.id) })}><Trash2 className="h-4 w-4"/>Futa sehemu</Button></div></div>)}<Button variant="outline" onClick={() => update({ ...form, blocks: [...form.blocks, { id: crypto.randomUUID(), title: "", body: "", image: "", page: "/outside", active: true }] })}><Plus className="h-4 w-4"/>Ongeza sehemu</Button></TabsContent>
      <TabsContent value="data" className="space-y-4">{(form.dataOffers ?? dataBundles).map((offer, i, offers) => <div key={i} className="flex flex-wrap gap-2"><Input aria-label={`Jina la ofa ${i + 1}`} className="w-36" value={offer.label} onChange={e => update({ ...form, dataOffers: offers.map((o, j) => j === i ? { ...o, label: e.target.value } : o) })}/><Input aria-label={`Bei ya ofa ${i + 1}`} className="w-36" type="number" min={0} value={offer.price} onChange={e => update({ ...form, dataOffers: offers.map((o, j) => j === i ? { ...o, price: Number(e.target.value) } : o) })}/><Button size="icon" variant="ghost" aria-label="Futa ofa" onClick={() => update({ ...form, dataOffers: offers.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4"/></Button></div>)}<Button variant="outline" onClick={() => update({ ...form, dataOffers: [...(form.dataOffers ?? dataBundles), { label: "", price: 0 }] })}><Plus className="h-4 w-4"/>Ongeza ofa</Button></TabsContent>
      <TabsContent value="payments"><PaymentSettings/></TabsContent>
      <TabsContent value="outside"><AppearanceEditor/><div className="mt-6"><Label htmlFor="settings-group">Group la WhatsApp</Label><Input id="settings-group" defaultValue={appearance.group_url} onBlur={async e => { const url = e.target.value.trim(); if (url && !/^https:\/\/chat\.whatsapp\.com\//.test(url)) { toast.error("Weka linki sahihi ya group."); return; } const { error } = await supabase.from("site_appearance").upsert({ ...appearance, group_url: url }); if (error) toast.error("Group halijahifadhiwa."); else { await qc.invalidateQueries(appearanceOptions); toast.success("Group limehifadhiwa."); } }}/></div></TabsContent>
      <TabsContent value="chat"><LiveComments/></TabsContent>
      <TabsContent value="manage" className="flex flex-wrap gap-3">{([["channels", "Chaneli: majina, picha na video"], ["packages", "Vifurushi: bei, picha na muda"], ["match", "Mechi, matokeo na takwimu"], ["users", "Watumiaji"], ["payments", "Uthibitisho wa malipo"]] as const).map(([tab, label]) => <Button key={tab} variant="outline" onClick={() => manage(tab)}>{label}</Button>)}</TabsContent>
    </Tabs>
  </div>;
}