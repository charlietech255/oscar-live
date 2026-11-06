import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, ArrowUp, ArrowDown, Upload, Loader2 } from "lucide-react";
import { usePackages } from "@/hooks/usePackages";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseM3U, guessCategory } from "@/lib/m3u";
import { CATEGORIES, formatTsh, hasAccess, validatePackage } from "@/lib/packages";
import { prepareChannelLogo } from "@/lib/channel-logo";
import { AppearanceEditor } from "@/components/AppearanceEditor";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Usimamizi — Kasigara TV" },
      { name: "description", content: "Simamia chaneli, watumiaji na malipo." },
      { property: "og:title", content: "Usimamizi — Kasigara TV" },
      { property: "og:description", content: "Dashibodi ya msimamizi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const empty = { id: "", name: "", category: "Michezo", stream_url: "", logo_url: "", description: "", is_live: true, is_premium: true, sort_order: 0 };
const emptyPkg = { id: "", label: "", price: 1000, days: 1, description: "", image_url: "", active: true, sort_order: 0 };

function Admin() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const logoInput = useRef<HTMLInputElement>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [savingChannel, setSavingChannel] = useState(false);
  const [pf, setPf] = useState(emptyPkg);
  const { data: PACKAGES = [] } = usePackages(true);
  const [m3uUrl, setM3uUrl] = useState("");
  const [m3uBusy, setM3uBusy] = useState(false);
  const [m3uPremium, setM3uPremium] = useState(true);
  const [pq, setPq] = useState("");
  const [pstat, setPstat] = useState<"all" | "on" | "off">("all");
  const shownPkgs = PACKAGES.filter((k) =>
    k.label.toLowerCase().includes(pq.trim().toLowerCase()) &&
    (pstat === "all" || (pstat === "on" ? k.active : !k.active)));

  const channels = useQuery({ queryKey: ["channels"], queryFn: async () => (await supabase.from("channels").select("*").order("sort_order")).data ?? [] });
  const payments = useQuery({ queryKey: ["allPayments"], enabled: isAdmin, queryFn: async () => (await supabase.from("payments").select("*").order("created_at", { ascending: false })).data ?? [] });
  const users = useQuery({ queryKey: ["allUsers"], enabled: isAdmin, queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [] });

  if (!user) return null;
  if (!isAdmin) return <main className="mx-auto max-w-md p-10 text-center text-muted-foreground">Ukurasa huu ni wa msimamizi pekee.</main>;

  const userName = (id: string) => users.data?.find((u) => u.id === id)?.display_name ?? id.slice(0, 8);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (logoBusy || savingChannel) return;
    setSavingChannel(true);
    const { id, ...row } = form;
    const payload = { ...row, logo_url: row.logo_url || null, description: row.description || null };
    try {
    const { error } = id ? await supabase.from("channels").update(payload).eq("id", id) : await supabase.from("channels").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(id ? "Chaneli imesasishwa" : "Chaneli imeongezwa");
    setForm(empty);
    qc.invalidateQueries({ queryKey: ["channels"] });
    } catch {
      toast.error("Imeshindikana kuhifadhi chaneli. Jaribu tena.");
    } finally { setSavingChannel(false); }
  }

  async function uploadLogo(file: File) {
    setLogoBusy(true);
    try {
      const logo = await prepareChannelLogo(file);
      setForm((current) => ({ ...current, logo_url: logo }));
      toast.success("Picha iko tayari. Bonyeza Hifadhi au Ongeza kuiweka kwenye chaneli.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Imeshindikana kupakia picha. Jaribu tena.");
    } finally { setLogoBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Futa chaneli hii?")) return;
    await supabase.from("channels").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["channels"] });
  }

  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_payment", { _payment_id: id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Kifurushi kimewashwa" : "Malipo yamekataliwa");
    qc.invalidateQueries({ queryKey: ["allPayments"] });
    qc.invalidateQueries({ queryKey: ["allUsers"] });
  }

  async function move(index: number, dir: -1 | 1) {
    const list = [...(channels.data ?? [])];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const t = list[index]!; list[index] = list[j]!; list[j] = t;
    await Promise.all(list.map((c, i) => supabase.from("channels").update({ sort_order: i + 1 }).eq("id", c.id)));
    qc.invalidateQueries({ queryKey: ["channels"] });
  }

  async function togglePremium(id: string, v: boolean) {
    await supabase.from("channels").update({ is_premium: v }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["channels"] });
  }

  async function savePkg(e: React.FormEvent) {
    e.preventDefault();
    const { id, ...row } = pf;
    const problem = validatePackage(row);
    if (problem) { toast.error(problem); return; }
    const payload = { ...row, label: row.label.trim(), description: row.description.trim() || null, image_url: row.image_url.trim() || null };
    const { error } = id
      ? await supabase.from("packages").update(payload).eq("id", id)
      : await supabase.from("packages").insert({ ...payload, id: row.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).slice(2, 6) });
    if (error) { toast.error("Imeshindikana kuhifadhi huduma: " + error.message); return; }
    toast.success(id ? `Huduma "${payload.label}" imesasishwa` : `Huduma "${payload.label}" imeongezwa`);
    setPf(emptyPkg);
    qc.invalidateQueries({ queryKey: ["packages"] });
  }

  async function removePkg(id: string, label: string) {
    if (!confirm(`Futa huduma "${label}"?`)) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) { toast.error("Imeshindikana kufuta: " + error.message + " (unaweza kuizima badala yake)"); return; }
    toast.success(`Huduma "${label}" imefutwa`);
    if (pf.id === id) setPf(emptyPkg);
    qc.invalidateQueries({ queryKey: ["packages"] });
  }

  async function importM3U(text: string) {
    const list = parseM3U(text);
    if (list.length === 0) { toast.error("Hakuna chaneli zilizopatikana kwenye playlist."); return; }
    const existing = new Set((channels.data ?? []).map((c) => c.stream_url));
    const start = (channels.data?.length ?? 0) + 1;
    const rows = list.filter((c) => !existing.has(c.stream_url)).map((c, i) => ({
      name: c.name.slice(0, 100), stream_url: c.stream_url, logo_url: c.logo_url, category: guessCategory(c.group),
      description: c.group, is_live: true, is_premium: m3uPremium, sort_order: start + i,
    }));
    if (rows.length === 0) { toast.info("Chaneli zote tayari zipo."); return; }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from("channels").insert(rows.slice(i, i + 200));
      if (error) { toast.error("Imeshindikana kuingiza: " + error.message); return; }
    }
    toast.success(`Chaneli ${rows.length} zimeongezwa`);
    setM3uUrl("");
    qc.invalidateQueries({ queryKey: ["channels"] });
  }

  async function importFromUrl() {
    if (!m3uUrl.trim()) return;
    setM3uBusy(true);
    try {
      const res = await fetch(m3uUrl.trim());
      if (!res.ok) throw new Error(String(res.status));
      await importM3U(await res.text());
    } catch {
      toast.error("Imeshindikana kupakua link hii. Pakua faili kisha uipakie hapa chini.");
    } finally { setM3uBusy(false); }
  }

  const pending = payments.data?.filter((p) => p.status === "pending").length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-wide">Usimamizi</h1>
      <Tabs defaultValue="payments" className="mt-6">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="payments">Malipo {pending > 0 && `(${pending})`}</TabsTrigger>
          <TabsTrigger value="channels">Chaneli</TabsTrigger>
          <TabsTrigger value="packages">Vifurushi</TabsTrigger>
          <TabsTrigger value="users">Watumiaji</TabsTrigger>
          <TabsTrigger value="appearance">Muonekano wa nje</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4 space-y-2">
          {payments.data?.length === 0 && <p className="text-muted-foreground">Hakuna malipo bado.</p>}
          {payments.data?.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{userName(p.user_id)} · {PACKAGES.find((k) => k.id === p.package)?.label} · {formatTsh(p.amount)}</div>
                <div className="text-sm text-muted-foreground">{p.network} · {p.sender_phone} · Ref: <b className="text-foreground">{p.reference}</b> · {new Date(p.created_at).toLocaleString("sw-TZ")}</div>
              </div>
              {p.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review(p.id, true)}>Thibitisha</Button>
                  <Button size="sm" variant="destructive" onClick={() => review(p.id, false)}>Kataa</Button>
                </div>
              ) : (
                <span className={p.status === "approved" ? "text-primary" : "text-destructive"}>{p.status === "approved" ? "Imethibitishwa" : "Imekataliwa"}</span>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="channels" className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-2">
            {channels.data?.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                <div className="flex flex-col">
                  <button aria-label="Panda juu" onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground"><ArrowUp className="h-4 w-4" /></button>
                  <button aria-label="Shuka chini" onClick={() => move(i, 1)} className="text-muted-foreground hover:text-foreground"><ArrowDown className="h-4 w-4" /></button>
                </div>
                {c.logo_url && <img src={c.logo_url} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{c.name} <span className="text-xs text-muted-foreground">· {c.category}{c.is_live ? " · LIVE" : ""}</span></div>
                  <div className="truncate text-xs text-muted-foreground">{c.stream_url}</div>
                </div>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Switch checked={c.is_premium} onCheckedChange={(v) => togglePremium(c.id, v)} />
                  {c.is_premium ? "Kulipia" : "Bure"}
                </label>
                <Button size="icon" variant="ghost" onClick={() => setForm({ ...empty, ...c, logo_url: c.logo_url ?? "", description: c.description ?? "" })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="space-y-4">
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-lg">Ingiza M3U Playlist</h2>
            <div className="space-y-1"><Label>Link ya playlist (.m3u)</Label>
              <div className="flex gap-2"><Input value={m3uUrl} onChange={(e) => setM3uUrl(e.target.value)} placeholder="https://…/playlist.m3u" />
              <Button type="button" disabled={m3uBusy} onClick={importFromUrl}>{m3uBusy ? "…" : "Ingiza"}</Button></div>
            </div>
            <div className="space-y-1"><Label>Au pakia faili</Label>
              <Input type="file" accept=".m3u,.m3u8,.txt" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await importM3U(await f.text()); e.target.value = ""; }} />
            </div>
            <div className="flex items-center gap-2"><Switch checked={m3uPremium} onCheckedChange={setM3uPremium} /><Label>{m3uPremium ? "Ziwe za kulipia" : "Ziwe bure kwa wote"}</Label></div>
          </div>
          <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-lg">{form.id ? "Hariri chaneli" : "Ongeza chaneli"}</h2>
            <div className="space-y-1"><Label>Jina</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Kundi</Label>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>Link ya stream (.m3u8)</Label><Input required value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} placeholder="https://…/index.m3u8" /></div>
             <div className="space-y-2">
               <Label>Nembo ya chaneli (si lazima)</Label>
               {form.logo_url && <img src={form.logo_url} alt="Nembo iliyochaguliwa" className="h-20 w-20 rounded border border-border bg-background object-contain" />}
               <input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" aria-label="Chagua picha ya nembo" onChange={(e) => {
                 const file = e.target.files?.[0];
                 e.target.value = "";
                 if (file) void uploadLogo(file);
               }} />
               <div className="flex flex-wrap gap-2">
                 <Button type="button" variant="secondary" disabled={logoBusy || savingChannel} onClick={() => logoInput.current?.click()}>
                   {logoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                   {logoBusy ? "Inaandaa picha…" : "Pakia picha"}
                 </Button>
                 {form.logo_url && <Button type="button" variant="ghost" disabled={logoBusy || savingChannel} onClick={() => setForm((current) => ({ ...current, logo_url: "" }))}><Trash2 className="h-4 w-4" />Ondoa picha</Button>}
               </div>
               <Input aria-label="Link ya logo" value={form.logo_url.startsWith("data:") ? "" : form.logo_url} disabled={logoBusy || savingChannel} placeholder="Au bandika link ya picha" onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
             </div>
            <div className="space-y-1"><Label>Maelezo</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Mpangilio</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_live} onCheckedChange={(v) => setForm({ ...form, is_live: v })} /><Label>Live sasa</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_premium} onCheckedChange={(v) => setForm({ ...form, is_premium: v })} /><Label>{form.is_premium ? "Ya kulipia" : "Bure kwa wote"}</Label></div>
            <div className="flex gap-2">
               <Button type="submit" disabled={logoBusy || savingChannel}>{savingChannel ? "Inahifadhi…" : form.id ? "Hifadhi" : "Ongeza"}</Button>
               {form.id && <Button type="button" variant="secondary" disabled={logoBusy || savingChannel} onClick={() => setForm(empty)}>Ghairi</Button>}
            </div>
          </form>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Input className="flex-1" value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Tafuta huduma kwa jina…" />
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={pstat} onChange={(e) => setPstat(e.target.value as typeof pstat)}>
                <option value="all">Zote</option>
                <option value="on">Zimewashwa</option>
                <option value="off">Zimezimwa</option>
              </select>
            </div>
            {shownPkgs.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Hakuna huduma iliyopatikana.</p>}
            {shownPkgs.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                {k.image_url && <img src={k.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{k.label} · <span className="text-primary">{formatTsh(k.price)}</span> <span className="text-xs text-muted-foreground">· Siku {k.days}{k.active ? "" : " · IMEZIMWA"}</span></div>
                  {k.description && <div className="text-xs text-muted-foreground">{k.description}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => setPf({ ...emptyPkg, ...k, description: k.description ?? "", image_url: k.image_url ?? "" })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Futa huduma" onClick={() => removePkg(k.id, k.label)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <form onSubmit={savePkg} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-lg">{pf.id ? "Hariri kifurushi" : "Tengeneza kifurushi"}</h2>
            <div className="space-y-1"><Label>Jina</Label><Input required value={pf.label} onChange={(e) => setPf({ ...pf, label: e.target.value })} placeholder="mf. Miezi 3" /></div>
            <div className="space-y-1"><Label>Bei (TSh)</Label><Input type="number" min={1} required value={pf.price} onChange={(e) => setPf({ ...pf, price: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Idadi ya siku</Label><Input type="number" min={1} required value={pf.days} onChange={(e) => setPf({ ...pf, days: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Maelezo</Label><Input value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Picha / nembo (linki ya picha)</Label><Input value={pf.image_url} placeholder="https://..." onChange={(e) => setPf({ ...pf, image_url: e.target.value })} /></div>
            <div className="space-y-1"><Label>Mpangilio</Label><Input type="number" value={pf.sort_order} onChange={(e) => setPf({ ...pf, sort_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><Switch checked={pf.active} onCheckedChange={(v) => setPf({ ...pf, active: v })} /><Label>Kinaonekana kwa wateja</Label></div>
            <div className="flex gap-2">
              <Button type="submit">{pf.id ? "Hifadhi" : "Tengeneza"}</Button>
              {pf.id && <Button type="button" variant="secondary" onClick={() => setPf(emptyPkg)}>Ghairi</Button>}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="p-3">Jina</th><th className="p-3">Simu/Email</th><th className="p-3">Majaribio hadi</th><th className="p-3">Kifurushi hadi</th><th className="p-3">Hali</th></tr></thead>
              <tbody>
                {users.data?.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3">{u.display_name}</td>
                    <td className="p-3">{u.contact}</td>
                    <td className="p-3">{new Date(u.trial_ends_at).toLocaleString("sw-TZ")}</td>
                    <td className="p-3">{u.subscription_ends_at ? new Date(u.subscription_ends_at).toLocaleString("sw-TZ") : "—"}</td>
                    <td className="p-3">{hasAccess(u) ? <span className="text-primary">Hai</span> : <span className="text-muted-foreground">Imeisha</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="appearance" className="mt-6"><AppearanceEditor /></TabsContent>
      </Tabs>
    </main>
  );
}
