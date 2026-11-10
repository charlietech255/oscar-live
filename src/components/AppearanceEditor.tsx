import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { appearanceOptions, defaultAppearance, validateAppearance, type Appearance } from "@/lib/site-appearance";
import { prepareChannelLogo } from "@/lib/channel-logo";
import stadium from "@/assets/install-stadium.jpg";

export function AppearanceEditor() {
  const query = useQuery(appearanceOptions);
  if (query.isPending) return <p>Inapakia muonekano…</p>;
  if (query.isError) return <Button variant="outline" onClick={() => query.refetch()}>Jaribu kupakia tena</Button>;
  return <AppearanceForm initial={query.data ?? defaultAppearance} />;
}

function AppearanceForm({ initial }: { initial: Appearance }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const update = (field: keyof Appearance, value: string | null) => setForm(current => ({ ...current, [field]: value }));
  async function upload(file: File | undefined, field: "image_url" | "logo_url") {
    if (!file) return;
    setBusy(true);
    try { update(field, await prepareChannelLogo(file, field === "image_url" ? 1536 : 384)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Picha haijapakiwa."); }
    finally { setBusy(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const errorMessage = validateAppearance(form);
    if (errorMessage) { toast.error(errorMessage); return; }
    setBusy(true);
    const clean = { ...form, title: form.title.trim(), tagline: form.tagline.trim(), description: form.description.trim(), button_label: form.button_label.trim() };
    try {
      const { error } = await supabase.from("site_appearance").upsert(clean);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["siteAppearance"] });
      toast.success("Muonekano wa nje umehifadhiwa. Wateja wataona mabadiliko yako.");
    } catch { toast.error("Muonekano haujahifadhiwa. Hakikisha umeingia kama msimamizi, kisha jaribu tena."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-display text-xl">Muonekano wa nje</h2>
        <div><Label htmlFor="outside-title">Jina kubwa</Label><Input id="outside-title" value={form.title} onChange={e => update("title", e.target.value)} maxLength={50} /></div>
        <div><Label htmlFor="outside-tagline">Kionjo kifupi</Label><Input id="outside-tagline" value={form.tagline} onChange={e => update("tagline", e.target.value)} maxLength={100} /></div>
        <div><Label htmlFor="outside-description">Maelezo</Label><Textarea id="outside-description" value={form.description} onChange={e => update("description", e.target.value)} maxLength={500} /></div>
        <div><Label htmlFor="outside-button">Jina la kitufe cha kusakinisha</Label><Input id="outside-button" value={form.button_label} onChange={e => update("button_label", e.target.value)} maxLength={40} /></div>
        <fieldset><legend className="mb-2 text-sm font-medium">Rangi ya app nzima</legend><div className="flex flex-wrap gap-3">{[{id:"green",name:"Kijani"},{id:"red",name:"Nyekundu"},{id:"cyan",name:"Samawati"}].map(theme => <label key={theme.id} className={`install-theme-${theme.id} flex cursor-pointer items-center gap-2`}><input type="radio" name="outside-theme" value={theme.id} checked={form.theme===theme.id} onChange={() => update("theme",theme.id)} /><span className="h-5 w-5 rounded-full bg-primary" />{theme.name}</label>)}</div></fieldset>
        <Button disabled={busy} type="submit">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Hifadhi muonekano</Button>
      </div>
      <div className="space-y-6">
        {(["image_url", "logo_url"] as const).map(field => <div key={field} className="space-y-3">
          <Label htmlFor={`upload-${field}`}>{field === "image_url" ? "Picha kubwa ya nje" : "Nembo ya nje"}</Label>
          <img src={form[field] || (field === "image_url" ? stadium : "/icon-192.png")} alt={field === "image_url" ? "Picha ya nje" : "Nembo ya nje"} className={field === "image_url" ? "aspect-video w-full rounded-lg object-cover" : "h-20 w-20 rounded-lg object-contain"} />
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline" disabled={busy}><label className="cursor-pointer" htmlFor={`upload-${field}`}><Upload className="mr-2 h-4 w-4" />{field === "image_url" ? "Pakia picha ya nje" : "Pakia nembo ya nje"}</label></Button><Button type="button" variant="ghost" disabled={busy} onClick={() => update(field,null)}>Rudisha ya awali</Button></div>
          <input id={`upload-${field}`} className="hidden" type="file" disabled={busy} accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => { void upload(e.target.files?.[0],field); e.target.value=""; }} />
        </div>)}
      </div>
    </form>
  );
}