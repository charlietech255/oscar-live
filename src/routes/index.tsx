import { useAppSettings } from "@/components/AppSettingsProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Radio, Lock, Sparkles, Play, Tv } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiFindChannels, type AiSearchResult } from "@/lib/ai-search.functions";
import { supabase } from "@/integrations/supabase/client";
import { HlsPlayer } from "@/components/HlsPlayer";
import { MyTvLiveStreaming } from "@/components/MyTvLiveStreaming";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, hasAccess } from "@/lib/packages";
import { cn } from "@/lib/utils";
import channelCover from "@/assets/channel-cover.jpg";
import { Showcase } from "@/components/Showcase";
import { trialSeconds } from "@/lib/customer-controls";
import { Scoreboard, MatchStats, LiveComments } from "@/components/MatchCenter";

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
  const [view, setView] = useState<"mytv" | "local">("mytv");

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs shadow-sm">
          <button
            type="button"
            onClick={() => setView("mytv")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              view === "mytv"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tv className="h-3.5 w-3.5" /> myTV Live (136 Chaneli)
          </button>
          <button
            type="button"
            onClick={() => setView("local")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              view === "local"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Radio className="h-3.5 w-3.5" /> Chaneli za Ndani
          </button>
        </div>
      </div>

      {view === "mytv" ? <MyTvLiveStreaming /> : <ChannelScreen />}
    </div>
  );
}
export function ChannelScreen({liveOnly=false}:{liveOnly?:boolean}) {
  const { t, visible, image } = useAppSettings();
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
  const [now,setNow] = useState(()=>Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(timer);},[]);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("channels").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(
    () => channels.filter((c) => (!liveOnly||c.is_live) && (cat === "Zote" || c.category === cat) && c.name.toLowerCase().includes(q.toLowerCase())),
    [channels, cat, q, liveOnly],
  );
  const current = channels.find((c) => c.id === selectedId) ?? (liveOnly?channels.find(c=>c.is_live):channels[0]);
  const access = !!current && !profile?.is_suspended && (!current.is_premium || hasAccess(profile,new Date(now)));
  const shownChannels = ai?.ids.length
    ? ai.ids.flatMap((id) => { const channel = channels.find((c) => c.id === id); return channel ? [channel] : []; })
    : filtered;

  function openChannel(id: string) {
    setSelectedId(id);
    setFoundName(null);
    playerRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    if (current?.id === id) {
      const video = playerRef.current?.querySelector("video");
      if (video) video.play().catch(() => { video.muted = true; void video.play().catch(() => {}); });
    }
  }

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

  const trialLeft = trialSeconds(profile?.trial_ends_at,now);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Shortcut to myTV Live Streaming API */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Tv className="h-5 w-5 text-primary" />
          <div>
            <div className="text-xs font-bold text-foreground">myTV Streaming API (Live Catalog)</div>
            <div className="text-[11px] text-muted-foreground">MPEG-DASH (Shaka Player + W3C ClearKey DRM) &amp; HLS (Hls.js)</div>
          </div>
        </div>
        <Button size="sm" asChild className="gap-1.5">
          <Link to="/live">
            <Play className="h-3.5 w-3.5 fill-current" /> Tazama myTV Live
          </Link>
        </Button>
      </div>
      {visible("insideShowcase") && <Showcase/>}
      {visible("trialNotice") && user && trialLeft>0 && !hasAccess(profile?.subscription_ends_at?{trial_ends_at:"1970-01-01",subscription_ends_at:profile.subscription_ends_at}:null,new Date(now)) && <p role="timer" className="mb-4 text-xs font-semibold text-primary">{t("Ofa ya bure ·") + " "}{Math.floor(trialLeft/60)}:{String(trialLeft%60).padStart(2,"0")}</p>}
      {visible("aiSearch") && <form
        onSubmit={(e) => { e.preventDefault(); runAi(aiQ); }}
        className="mb-5 rounded-xl border border-accent/40 bg-accent/5 p-3"
      >
        <label className="flex items-center gap-1 text-sm font-semibold text-accent"><Sparkles className="h-4 w-4" />{" " + t("Tafuta mechi kwa AI")}</label>
        <div className="mt-2 flex gap-2">
          <Input value={aiQ} onChange={(e) => setAiQ(e.target.value)} placeholder={t("Mf. Simba vs Yanga, Ligi Kuu, Arsenal…")} maxLength={300} />
          <Button type="submit" disabled={aiBusy}>{aiBusy ? "Inatafuta…" : t("Tafuta")}</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Ligi Kuu", "Mechi za leo", "Chaneli za bure", "Filamu"].map((term) => (
            <button key={term} type="button" disabled={aiBusy} onClick={() => { setAiQ(term); runAi(term); }}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-muted">{t(term)}</button>
          ))}
        </div>
        {ai && (
          <p className={cn("mt-2 text-sm", ai.error ? "text-destructive" : "text-muted-foreground")}>
            {ai.error ?? (ai.message || (ai.ids.length ? "" : t("Hakuna chaneli inayolingana.")))}
            {ai.ids.length > 0 && (
              <button type="button" className="ml-2 underline" onClick={() => setAi(null)}>{t("Onyesha zote")}</button>
            )}
          </p>
        )}
      </form>}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section ref={playerRef} className="scroll-mt-20">
          {foundName && (
            <p className="mb-2 rounded-lg bg-primary/15 px-3 py-2 text-sm font-semibold text-primary">{t("Tumekupatia:") + " "}{foundName}{" " + t("— inacheza sasa!")}</p>
          )}
          {current && access ? (
            <div className="relative">
              <HlsPlayer key={current.id} src={current.stream_url} />
              {visible("scoreboard") && <Scoreboard />}
              {visible("liveBadges") && <span className={cn("pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-bold", current.is_live ? "bg-live text-destructive-foreground" : "bg-secondary text-secondary-foreground")}>
                {current.is_live ? <><span className="h-2 w-2 animate-pulse rounded-full bg-destructive-foreground" />{" " + t("LIVE")}</> : t("HAIPO LIVE (MARUDIO)")}
              </span>}
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
              <Lock className="h-10 w-10 text-primary" />
              {!ready || isLoading ? (
                <p className="text-muted-foreground">{t("Inapakia…")}</p>
              ) : profile?.is_suspended ? (<p>{t("Akaunti yako imesimamishwa. Wasiliana na msimamizi.")}</p>) : !user ? (
                <>
                  <p className="font-display text-xl">{t("Jisajili upate majaribio ya bure")}</p>
                  <p className="text-muted-foreground">{t("Dakika 12 bure — hakuna malipo kuanza.")}</p>
                  <Button asChild><Link to="/auth">{t("Anza bure")}</Link></Button>
                </>
              ) : (
                <>
                  <p className="font-display text-xl">{t("Muda wako umekwisha")}</p>
                  <p className="text-muted-foreground">{t("Lipia kifurushi uendelee kutazama.")}</p>
                  <Button asChild><Link to="/vifurushi">{t("Angalia vifurushi")}</Link></Button>
                </>
              )}
            </div>
          )}
          {visible("channelDetails") && current && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {visible("liveBadges") && current.is_live && (
                <span className="inline-flex items-center gap-1 rounded bg-live px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                  <Radio className="h-3 w-3" />{" " + t("LIVE") + " "}</span>
              )}
              <h1 className="font-display text-2xl tracking-wide">{current.name}</h1>
              <span className="text-sm text-muted-foreground">{current.category}</span>
            </div>
          )}
          {visible("channelDetails") && current?.description && <p className="mt-1 text-muted-foreground">{current.description}</p>}
          {visible("matchStats") && <MatchStats />}
          {visible("comments") && <LiveComments />}
          {visible("trialNotice") && user && trialLeft > 0 && !profile?.subscription_ends_at && (
            <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">{" " + t("Ofa yako inaisha baada ya dakika") + " "}{Math.floor(trialLeft/60)}{" " + t("na sekunde") + " "}{trialLeft%60}.{" "}
              <Link to="/vifurushi" className="font-semibold text-accent underline">{t("Lipia kifurushi")}</Link>
            </p>
          )}
          {visible("trialNotice") && profile?.subscription_ends_at && new Date(profile.subscription_ends_at) > new Date() && (
            <p className="mt-4 text-sm text-primary">{" " + t("Kifurushi chako kinaisha:") + " "}{new Date(profile.subscription_ends_at).toLocaleString("sw-TZ")}
            </p>
          )}
        </section>

        <aside className="min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setAi(null); }} placeholder={t("Tafuta chaneli…")} className="pl-9" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Zote", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => { setCat(c); setAi(null); }}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted",
                )}
              >
                {c === "Michezo" ? t("Michezo / Ligi Kuu") : t(c)}
              </button>
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:max-h-[70vh] lg:overflow-y-auto lg:p-1">
            {shownChannels.map((c) => (
              <li key={c.id} className="min-w-0">
                <Button
                  variant="ghost"
                  aria-label={`Tazama ${c.name}`}
                  aria-pressed={current?.id === c.id}
                  onClick={() => openChannel(c.id)}
                  className={cn(
                    "group flex h-auto w-full flex-col items-stretch gap-0 overflow-hidden whitespace-normal rounded-lg border p-0 text-left transition-colors",
                    current?.id === c.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-card hover:bg-secondary",
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                    <img src={c.logo_url || image("channelFallback", channelCover)} alt="" className="h-full w-full object-contain" loading="lazy" width={384} height={216} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = channelCover; }} />
                    {visible("cardBadges") && <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-primary">
                      {c.is_premium && !hasAccess(profile) ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                    </span>}
                    {visible("cardBadges") && !c.is_premium && <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{t("BURE")}</span>}
                    {visible("liveBadges") && c.is_live && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground"><Radio className="h-3 w-3" />{" " + t("LIVE")}</span>}
                  </div>
                  <div className="min-w-0 p-2.5">
                    <div className="min-h-8 break-words text-xs font-semibold leading-4">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t(c.category)}</div>
                  </div>
                </Button>
              </li>
            ))}
            {isLoading && <li className="col-span-2 p-4 text-center text-sm text-muted-foreground">{t("Inapakia chaneli…")}</li>}
            {!isLoading && shownChannels.length === 0 && <li className="col-span-2 p-4 text-center text-sm text-muted-foreground">{t("Hakuna chaneli iliyopatikana.")}</li>}
          </ul>
        </aside>
      </div>
    </main>
  );
}
