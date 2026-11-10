import { useAppSettings } from "@/components/AppSettingsProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Radio, Lock, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HlsPlayer } from "@/components/HlsPlayer";
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

function Index() { return <ChannelScreen/>; }
export function ChannelScreen({liveOnly=false}:{liveOnly?:boolean}) {
  const { t, visible, image } = useAppSettings();
  const { user, ready, profile } = useAuth();
  const [cat, setCat] = useState<string>("Zote");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const playerRef = useRef<HTMLElement>(null);
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
    () => channels.filter((c) => (!liveOnly||c.is_live) && (cat === "Zote" || c.category === cat)),
    [channels, cat, liveOnly],
  );
  const current = channels.find((c) => c.id === selectedId) ?? (liveOnly?channels.find(c=>c.is_live):channels[0]);
  const access = !!current && !profile?.is_suspended && (!current.is_premium || hasAccess(profile,new Date(now)));
  const shownChannels = filtered;

  function openChannel(id: string) {
    setSelectedId(id);
    playerRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    if (current?.id === id) {
      const video = playerRef.current?.querySelector("video");
      if (video) video.play().catch(() => { video.muted = true; void video.play().catch(() => {}); });
    }
  }

  const trialLeft = trialSeconds(profile?.trial_ends_at,now);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {visible("insideShowcase") && <Showcase/>}
      {visible("trialNotice") && user && trialLeft>0 && !hasAccess(profile?.subscription_ends_at?{trial_ends_at:"1970-01-01",subscription_ends_at:profile.subscription_ends_at}:null,new Date(now)) && <p role="timer" className="mb-4 text-xs font-semibold text-primary">{t("Ofa ya bure ·") + " "}{Math.floor(trialLeft/60)}:{String(trialLeft%60).padStart(2,"0")}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section ref={playerRef} className="scroll-mt-20">
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
          <div className="flex flex-wrap gap-2">
            {["Zote", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
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
                    current?.id === c.id ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-primary/50 bg-card hover:border-primary hover:bg-secondary",
                  )}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-secondary p-4">
                    <img src={c.logo_url || image("channelFallback", channelCover)} alt="" className="h-full w-full object-contain" loading="lazy" width={384} height={384} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = channelCover; }} />
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
