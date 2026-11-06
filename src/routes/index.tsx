import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Search, Radio, Lock, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiFindChannels, type AiSearchResult } from "@/lib/ai-search.functions";
import { supabase } from "@/integrations/supabase/client";
import { HlsPlayer } from "@/components/HlsPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, hasAccess } from "@/lib/packages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kasigara TV — Michezo Live na Chaneli za TV" },
      { name: "description", content: "Tazama mechi za moja kwa moja, habari, burudani na filamu kwa Kiswahili." },
      { property: "og:title", content: "Kasigara TV — Michezo Live" },
      { property: "og:description", content: "Mechi za moja kwa moja na chaneli za TV kwenye simu yako." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, ready, profile } = useAuth();
  const [cat, setCat] = useState<string>("Zote");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiQ, setAiQ] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [ai, setAi] = useState<AiSearchResult | null>(null);
  const findFn = useServerFn(aiFindChannels);
  const playerRef = useRef<HTMLElement>(null);
  const [foundName, setFoundName] = useState<string | null>(null);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("channels").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(
    () => channels.filter((c) => (cat === "Zote" || c.category === cat) && c.name.toLowerCase().includes(q.toLowerCase())),
    [channels, cat, q],
  );
  const current = channels.find((c) => c.id === selectedId) ?? channels[0];
  const access = !!current && (!current.is_premium || hasAccess(profile));

  async function runAi(query: string) {
    if (query.trim().length < 2 || aiBusy) return;
    setAiBusy(true);
    setFoundName(null);
    try {
      const r = await findFn({ data: { query } });
      setAi(r);
      const first = channels.find((c) => c.id === r.ids[0]);
      if (first) {
        setSelectedId(first.id);
        setFoundName(first.name);
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      setAi({ ids: [], message: "", error: "Imeshindikana kutafuta kwa sasa." });
    } finally {
      setAiBusy(false);
    }
  }

  const trialLeft = profile && new Date(profile.trial_ends_at) > new Date()
    ? Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 3600000)
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <form
        onSubmit={(e) => { e.preventDefault(); runAi(aiQ); }}
        className="mb-5 rounded-xl border border-accent/40 bg-accent/5 p-3"
      >
        <label className="flex items-center gap-1 text-sm font-semibold text-accent"><Sparkles className="h-4 w-4" /> Tafuta mechi kwa AI</label>
        <div className="mt-2 flex gap-2">
          <Input value={aiQ} onChange={(e) => setAiQ(e.target.value)} placeholder="Mf. Simba vs Yanga, Ligi Kuu, Arsenal…" maxLength={300} />
          <Button type="submit" disabled={aiBusy}>{aiBusy ? "Inatafuta…" : "Tafuta"}</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Ligi Kuu", "Mechi za leo", "Chaneli za bure", "Filamu"].map((t) => (
            <button key={t} type="button" disabled={aiBusy} onClick={() => { setAiQ(t); runAi(t); }}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-muted">{t}</button>
          ))}
        </div>
        {ai && (
          <p className={cn("mt-2 text-sm", ai.error ? "text-destructive" : "text-muted-foreground")}>
            {ai.error ?? (ai.message || (ai.ids.length ? "" : "Hakuna chaneli inayolingana."))}
            {ai.ids.length > 0 && (
              <button type="button" className="ml-2 underline" onClick={() => setAi(null)}>Onyesha zote</button>
            )}
          </p>
        )}
      </form>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section ref={playerRef} className="scroll-mt-20">
          {foundName && (
            <p className="mb-2 rounded-lg bg-primary/15 px-3 py-2 text-sm font-semibold text-primary">Tumekupatia: {foundName} — inacheza sasa!</p>
          )}
          {current && access ? (
            <HlsPlayer src={current.stream_url} />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
              <Lock className="h-10 w-10 text-primary" />
              {!ready || isLoading ? (
                <p className="text-muted-foreground">Inapakia…</p>
              ) : !user ? (
                <>
                  <p className="font-display text-3xl">Jisajili upate majaribio ya bure</p>
                  <p className="text-muted-foreground">Masaa 24 bure — hakuna malipo kuanza.</p>
                  <Button asChild><Link to="/auth">Anza bure</Link></Button>
                </>
              ) : (
                <>
                  <p className="font-display text-3xl">Muda wako umekwisha</p>
                  <p className="text-muted-foreground">Lipia kifurushi uendelee kutazama.</p>
                  <Button asChild><Link to="/vifurushi">Angalia vifurushi</Link></Button>
                </>
              )}
            </div>
          )}
          {current && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {current.is_live && (
                <span className="inline-flex items-center gap-1 rounded bg-live px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                  <Radio className="h-3 w-3" /> LIVE
                </span>
              )}
              <h1 className="font-display text-4xl tracking-wide">{current.name}</h1>
              <span className="text-sm text-muted-foreground">{current.category}</span>
            </div>
          )}
          {current?.description && <p className="mt-1 text-muted-foreground">{current.description}</p>}
          {user && trialLeft > 0 && !profile?.subscription_ends_at && (
            <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              Uko kwenye majaribio ya bure — yamebaki takriban masaa {trialLeft}.{" "}
              <Link to="/vifurushi" className="font-semibold text-accent underline">Lipia kifurushi</Link>
            </p>
          )}
          {profile?.subscription_ends_at && new Date(profile.subscription_ends_at) > new Date() && (
            <p className="mt-4 text-sm text-primary">
              Kifurushi chako kinaisha: {new Date(profile.subscription_ends_at).toLocaleString("sw-TZ")}
            </p>
          )}
        </section>

        <aside className="rounded-xl border border-border bg-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta chaneli…" className="pl-9" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Zote", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted",
                )}
              >
                {c === "Michezo" ? "Michezo / Ligi Kuu" : c}
              </button>
            ))}
          </div>
          <ul className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
            {(ai?.ids.length ? ai.ids.map((id) => channels.find((c) => c.id === id)!).filter(Boolean) : filtered).map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => { setSelectedId(c.id); setFoundName(null); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                    current?.id === c.id ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-secondary",
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary font-display text-lg text-primary">
                    {c.logo_url ? <img src={c.logo_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : c.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.category}</div>
                  </div>
                  {!c.is_premium && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">BURE</span>}
                  {c.is_live && <span className="h-2 w-2 rounded-full bg-live" />}
                </button>
              </li>
            ))}
            {!isLoading && filtered.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">Hakuna chaneli iliyopatikana.</li>}
          </ul>
        </aside>
      </div>
    </main>
  );
}
