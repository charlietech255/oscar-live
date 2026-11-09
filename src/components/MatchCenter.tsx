import { useAppSettings } from "@/components/AppSettingsProvider";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const matchOptions = {
  queryKey: ["match_day"],
  refetchInterval: 15000,
  queryFn: async () => (await supabase.from("match_day").select("*").eq("id", "main").maybeSingle()).data,
};

export function Scoreboard() {
  const { data: m } = useQuery(matchOptions);
  if (!m?.visible) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-11 z-10 mx-auto flex w-fit items-center gap-2 rounded-lg bg-background/85 px-3 py-1.5 text-sm font-bold">
      <span>{m.home}</span>
      <span className="rounded bg-primary px-2 text-primary-foreground">{m.home_score} - {m.away_score}</span>
      <span>{m.away}</span>
      <span className="ml-1 text-xs text-accent">{m.minute}</span>
    </div>
  );
}

function StatRow({ label, home, away, pct }: { label: string; home: number; away: number; pct?: boolean }) {
  const { t } = useAppSettings();
  const total = home + away || 1;
  return (
    <div>
      <div className="flex justify-between text-xs"><b>{home}{pct && "%"}</b><span className="text-muted-foreground">{t(label)}</span><b>{away}{pct && "%"}</b></div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="bg-primary" style={{ width: `${(home / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function MatchStats() {
  const { t } = useAppSettings();
  const { data: m } = useQuery(matchOptions);
  if (!m?.visible) return null;
  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg tracking-wide">{t("TAKWIMU ZA MECHI ·") + " "}<span className="text-primary">{m.competition}</span></h2>
      <div className="space-y-3">
        <StatRow label="Umiliki wa mpira" home={m.possession} away={100 - m.possession} pct />
        <StatRow label="Mashuti" home={m.home_shots} away={m.away_shots} />
        <StatRow label="Kadi za njano" home={m.home_yellow} away={m.away_yellow} />
        <StatRow label="Kona" home={m.home_corners} away={m.away_corners} />
      </div>
    </section>
  );
}

export function LiveComments() {
  const { t } = useAppSettings();
  const { user, profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: comments = [] } = useQuery({
    queryKey: ["match_comments"],
    enabled: !!user,
    refetchInterval: 8000,
    queryFn: async () => (await supabase.from("match_comments").select("*").order("created_at", { ascending: false }).limit(30)).data ?? [],
  });
  if (!user) return null;
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!user || !body || busy) return;
    setBusy(true);
    const author = profile?.display_name || user.email?.split("@")[0] || "Shabiki";
    const { error } = await supabase.from("match_comments").insert({ body: body.slice(0, 200), author: author.slice(0, 40), user_id: user.id });
    setBusy(false);
    if (error) { toast.error("Maoni hayakutumwa."); return; }
    setText("");
    qc.invalidateQueries({ queryKey: ["match_comments"] });
  }
  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg tracking-wide"><MessageCircle className="h-4 w-4 text-primary" />{" " + t("MAONI LIVE")}</h2>
      <form onSubmit={send} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder={t("Andika maoni yako…")} />
        <Button type="submit" size="icon" disabled={busy} aria-label={t("Tuma")}><Send className="h-4 w-4" /></Button>
      </form>
      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm"><div className="min-w-0 flex-1"><b className="text-primary">{c.author}</b> <span className="break-words">{c.body}</span> <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleTimeString("sw-TZ", { hour: "2-digit", minute: "2-digit" })}</span></div>{isAdmin && <Button size="icon" variant="ghost" aria-label="Futa ujumbe" onClick={async () => { if (!confirm("Futa ujumbe huu?")) return; const { error } = await supabase.from("match_comments").delete().eq("id", c.id); if (error) toast.error("Ujumbe haujafutwa."); else await qc.invalidateQueries({ queryKey: ["match_comments"] }); }}><Trash2 className="h-4 w-4"/></Button>}</li>
        ))}
        {comments.length === 0 && <li className="text-sm text-muted-foreground">{t("Kuwa wa kwanza kuandika maoni.")}</li>}
      </ul>
    </section>
  );
}

export function MatchEditor() {
  const { t } = useAppSettings();
  const qc = useQueryClient();
  const { data: m } = useQuery(matchOptions);
  const [form, setForm] = useState<Record<string, string | number | boolean> | null>(null);
  const f = form ?? (m as Record<string, string | number | boolean> | null);
  if (!f) return <p className="text-muted-foreground">{t("Inapakia…")}</p>;
  const set = (k: string, v: string | number | boolean) => setForm({ ...f, [k]: v });
  const num = (k: string) => <Input type="number" min={0} max={99} value={String(f[k])} onChange={(e) => set(k, Math.max(0, Math.min(99, Number(e.target.value) || 0)))} />;
  async function save() {
    const { error } = await supabase.from("match_day").update(f as never).eq("id", "main");
    if (error) { toast.error("Imeshindikana kuhifadhi mechi."); return; }
    toast.success("Mechi imehifadhiwa.");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["match_day"] });
  }
  const pairs: [string, string, string][] = [["Magoli", "home_score", "away_score"], ["Mashuti", "home_shots", "away_shots"], ["Kadi za njano", "home_yellow", "away_yellow"], ["Kona", "home_corners", "away_corners"]];
  return (
    <div className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(f["visible"])} onChange={(e) => set("visible", e.target.checked)} />{" " + t("Onyesha ubao wa mechi na takwimu")}</label>
      <div className="grid grid-cols-2 gap-2">
        <Input value={String(f["home"])} maxLength={30} onChange={(e) => set("home", e.target.value)} placeholder={t("Timu ya nyumbani")} />
        <Input value={String(f["away"])} maxLength={30} onChange={(e) => set("away", e.target.value)} placeholder={t("Timu ya ugenini")} />
        <Input value={String(f["minute"])} maxLength={10} onChange={(e) => set("minute", e.target.value)} placeholder={t("Dakika (74:12)")} />
        <Input value={String(f["competition"])} maxLength={40} onChange={(e) => set("competition", e.target.value)} placeholder="Ligi" />
      </div>
      {pairs.map(([l, a, b]) => <div key={l}><p className="text-xs text-muted-foreground">{l}{" " + t("(nyumbani / ugenini)")}</p><div className="grid grid-cols-2 gap-2">{num(a)}{num(b)}</div></div>)}
      <div><p className="text-xs text-muted-foreground">{t("Umiliki wa mpira wa timu ya nyumbani (%)")}</p><Input type="number" min={0} max={100} value={String(f["possession"])} onChange={(e) => set("possession", Math.max(0, Math.min(100, Number(e.target.value) || 0)))} /></div>
      <Button onClick={save}>{t("Hifadhi mechi")}</Button>
    </div>
  );
}
