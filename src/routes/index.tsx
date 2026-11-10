import { useAppSettings } from "@/components/AppSettingsProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Radio, Lock, Sparkles, Play } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiFindChannels, type AiSearchResult } from "@/lib/ai-search.functions";
import { supabase } from "@/integrations/supabase/client";
import { HlsPlayer } from "@/components/HlsPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, hasAccess } from "@/lib/packages";
import { cn } from "@/lib/utils";
import channelCover from "@/assets/channel-cover.jpg";
import { Showcase } from "@/components/Showcase";
import { trialSeconds } from "@/lib/customer-controls";
import { Scoreboard, MatchStats, LiveComments } from "@/components/MatchCenter";
import {
  fetchMyTvCatalogServerFn,
  fetchMyTvStreamServerFn,
} from "@/lib/mytv.functions";
import { MYTV_DEFAULT_API_KEY, MYTV_DEFAULT_API_BASE } from "@/lib/mytv-api";

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
  return <ChannelScreen />;
}

export interface UnifiedChannel {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  stream_url?: string;
  is_live: boolean;
  is_premium: boolean;
  is_mytv: boolean;
  stream_type?: string;
  description?: string;
  sort_order: number;
}

export function ChannelScreen({ liveOnly = false }: { liveOnly?: boolean }) {
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
  const [now, setNow] = useState(() => Date.now());

  const [streamInfo, setStreamInfo] = useState<{
    url: string;
    type?: string;
    kid?: string;
    key?: string;
    licenseUrl?: string;
  } | null>(null);
  const [loadingStream, setLoadingStream] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Map myTV English categories into Kasigara TV Swahili categories
  const mapCategory = (rawCat?: string): string => {
    const c = (rawCat || "").toUpperCase();
    if (c.includes("SPORT") || c.includes("LIGI")) return "Michezo";
    if (c.includes("MOVIE") || c.includes("FILAMU") || c.includes("CINEMA")) return "Filamu";
    if (c.includes("NEWS") || c.includes("HABARI")) return "Habari";
    if (c.includes("LOCAL") || c.includes("KITAIFA")) return "Kitaifa";
    if (c.includes("KIDS") || c.includes("WATOTO")) return "Watoto";
    if (c.includes("DINI") || c.includes("RELIG")) return "Dini";
    return "Burudani";
  };

  // 1. Fetch live channels from myTV Streaming API via server function
  const myTvQuery = useQuery({
    queryKey: ["mytv-live-catalog"],
    queryFn: async () => {
      try {
        const res = await fetchMyTvCatalogServerFn({
          data: { apiKey: MYTV_DEFAULT_API_KEY, apiBase: MYTV_DEFAULT_API_BASE },
        });
        return res?.channels ?? [];
      } catch (err) {
        console.warn("Server catalog fetch error:", err);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch local database channels from Supabase
  const localQuery = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("channels").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Combine channels into unified catalog
  const channels = useMemo<UnifiedChannel[]>(() => {
    const myTvChannels: UnifiedChannel[] = (myTvQuery.data || []).map((c, i) => ({
      id: String(c.id),
      name: c.name,
      category: mapCategory(c.category),
      logo_url: c.logo || c.logo_url,
      stream_url: "",
      is_live: true,
      is_premium: false,
      is_mytv: true,
      stream_type: c.stream_type || "dash",
      description: c.description || "",
      sort_order: i + 1,
    }));

    const localChannels: UnifiedChannel[] = (localQuery.data || []).map((c, i) => ({
      id: c.id,
      name: c.name,
      category: c.category || "Burudani",
      logo_url: c.logo_url ?? undefined,
      stream_url: c.stream_url ?? undefined,
      is_live: Boolean(c.is_live),
      is_premium: Boolean(c.is_premium),
      is_mytv: false,
      stream_type: "hls",
      description: c.description ?? undefined,
      sort_order: (c.sort_order ?? 100) + 1000,
    }));

    if (myTvChannels.length > 0) {
      return [...myTvChannels, ...localChannels];
    }
    return localChannels;
  }, [myTvQuery.data, localQuery.data]);

  const isLoading = myTvQuery.isLoading && localQuery.isLoading;

  const filtered = useMemo(
    () =>
      channels.filter(
        (c) =>
          (!liveOnly || c.is_live) &&
          (cat === "Zote" || c.category === cat) &&
          c.name.toLowerCase().includes(q.toLowerCase())
      ),
    [channels, cat, q, liveOnly]
  );

  const current = channels.find((c) => c.id === selectedId) ?? (liveOnly ? channels.find((c) => c.is_live) : channels[0]);
  const access = !!current && !profile?.is_suspended && (!current.is_premium || hasAccess(profile, new Date(now)));

  // Resolve stream when current channel changes
  useEffect(() => {
    if (!current) {
      setStreamInfo(null);
      return;
    }

    if (current.is_mytv) {
      setLoadingStream(true);
      fetchMyTvStreamServerFn({
        data: { id: current.id, apiKey: MYTV_DEFAULT_API_KEY, apiBase: MYTV_DEFAULT_API_BASE },
      })
        .then((res: any) => {
          const stream = res?.stream || res;
          const playbackUrl = stream?.playback_url || stream?.url || stream?.stream_url;
          const clearKey = stream?.clearkey || stream?.clearKey;
          setStreamInfo({
            url: playbackUrl,
            type: stream?.type || current.stream_type || "dash",
            kid: clearKey?.kid,
            key: clearKey?.key,
            licenseUrl: stream?.drm_license_url,
          });
        })
        .catch((err) => {
          console.error("Stream resolution failed:", err);
        })
        .finally(() => {
          setLoadingStream(false);
        });
    } else {
      setStreamInfo({
        url: current.stream_url || "",
        type: "hls",
      });
    }
  }, [current?.id, current?.is_mytv]);

  const shownChannels = ai?.ids.length
    ? ai.ids.flatMap((id) => {
        const channel = channels.find((c) => c.id === id);
        return channel ? [channel] : [];
      })
    : filtered;

  function openChannel(id: string) {
    setSelectedId(id);
    setFoundName(null);
    playerRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
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

  const trialLeft = trialSeconds(profile?.trial_ends_at, now);

  const categoryOptions = useMemo(() => {
    return ["Zote", ...CATEGORIES, "Kitaifa", "Watoto"];
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {visible("insideShowcase") && <Showcase />}
      {visible("trialNotice") && user && trialLeft > 0 && !hasAccess(profile?.subscription_ends_at ? { trial_ends_at: "1970-01-01", subscription_ends_at: profile.subscription_ends_at } : null, new Date(now)) && (
        <p role="timer" className="mb-4 text-xs font-semibold text-primary">
          {t("Ofa ya bure ·") + " "}{Math.floor(trialLeft / 60)}:{String(trialLeft % 60).padStart(2, "0")}
        </p>
      )}
      {visible("aiSearch") && (
        <form
          onSubmit={(e) => { e.preventDefault(); runAi(aiQ); }}
          className="mb-5 rounded-xl border border-accent/40 bg-accent/5 p-3"
        >
          <label className="flex items-center gap-1 text-sm font-semibold text-accent">
            <Sparkles className="h-4 w-4" />{" " + t("Tafuta mechi kwa AI")}
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              value={aiQ}
              onChange={(e) => setAiQ(e.target.value)}
              placeholder={t("Mf. Simba vs Yanga, Ligi Kuu, Arsenal…")}
              maxLength={300}
            />
            <Button type="submit" disabled={aiBusy}>
              {aiBusy ? "Inatafuta…" : t("Tafuta")}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Ligi Kuu", "Mechi za leo", "Chaneli za bure", "Filamu"].map((term) => (
              <button
                key={term}
                type="button"
                disabled={aiBusy}
                onClick={() => { setAiQ(term); runAi(term); }}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-muted"
              >
                {t(term)}
              </button>
            ))}
          </div>
          {ai && (
            <p className={cn("mt-2 text-sm", ai.error ? "text-destructive" : "text-muted-foreground")}>
              {ai.error ?? (ai.message || (ai.ids.length ? "" : t("Hakuna chaneli inayolingana.")))}
              {ai.ids.length > 0 && (
                <button type="button" className="ml-2 underline" onClick={() => setAi(null)}>
                  {t("Onyesha zote")}
                </button>
              )}
            </p>
          )}
        </form>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section ref={playerRef} className="scroll-mt-20">
          {foundName && (
            <p className="mb-2 rounded-lg bg-primary/15 px-3 py-2 text-sm font-semibold text-primary">
              {t("Tumekupatia:") + " "}{foundName}{" " + t("— inacheza sasa!")}
            </p>
          )}
          {current && access ? (
            <div className="relative">
              {loadingStream ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-card text-muted-foreground">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs">{t("Inafungua")} {current.name}…</span>
                </div>
              ) : streamInfo?.url ? (
                <HlsPlayer
                  key={`${current.id}-${streamInfo.url}`}
                  src={streamInfo.url}
                  streamType={streamInfo.type}
                  kid={streamInfo.kid}
                  key={streamInfo.key}
                  licenseUrl={streamInfo.licenseUrl}
                />
              ) : (
                <HlsPlayer key={current.id} src={current.stream_url || ""} />
              )}
              {visible("scoreboard") && <Scoreboard />}
              {visible("liveBadges") && (
                <span
                  className={cn(
                    "pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-bold",
                    current.is_live ? "bg-live text-destructive-foreground" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {current.is_live ? (
                    <>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-destructive-foreground" />
                      {" " + t("LIVE")}
                    </>
                  ) : (
                    t("HAIPO LIVE (MARUDIO)")
                  )}
                </span>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
              <Lock className="h-10 w-10 text-primary" />
              {!ready || isLoading ? (
                <p className="text-muted-foreground">{t("Inapakia…")}</p>
              ) : profile?.is_suspended ? (
                <p>{t("Akaunti yako imesimamishwa. Wasiliana na msimamizi.")}</p>
              ) : !user ? (
                <>
                  <p className="font-display text-xl">{t("Jisajili upate majaribio ya bure")}</p>
                  <p className="text-muted-foreground">{t("Dakika 12 bure — hakuna malipo kuanza.")}</p>
                  <Button asChild>
                    <Link to="/auth">{t("Anza bure")}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-display text-xl">{t("Muda wako umekwisha")}</p>
                  <p className="text-muted-foreground">{t("Lipia kifurushi uendelee kutazama.")}</p>
                  <Button asChild>
                    <Link to="/vifurushi">{t("Angalia vifurushi")}</Link>
                  </Button>
                </>
              )}
            </div>
          )}
          {visible("channelDetails") && current && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {visible("liveBadges") && current.is_live && (
                <span className="inline-flex items-center gap-1 rounded bg-live px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                  <Radio className="h-3 w-3" />{" " + t("LIVE") + " "}
                </span>
              )}
              <h1 className="font-display text-2xl tracking-wide">{current.name}</h1>
              <span className="text-sm text-muted-foreground">{current.category}</span>
            </div>
          )}
          {visible("channelDetails") && current?.description && (
            <p className="mt-1 text-muted-foreground">{current.description}</p>
          )}
          {visible("matchStats") && <MatchStats />}
          {visible("comments") && <LiveComments />}
          {visible("trialNotice") && user && trialLeft > 0 && !profile?.subscription_ends_at && (
            <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              {" " + t("Ofa yako inaisha baada ya dakika") + " "}{Math.floor(trialLeft / 60)}{" " + t("na sekunde") + " "}{trialLeft % 60}.{" "}
              <Link to="/vifurushi" className="font-semibold text-accent underline">
                {t("Lipia kifurushi")}
              </Link>
            </p>
          )}
          {visible("trialNotice") && profile?.subscription_ends_at && new Date(profile.subscription_ends_at) > new Date() && (
            <p className="mt-4 text-sm text-primary">
              {" " + t("Kifurushi chako kinaisha:") + " "}{new Date(profile.subscription_ends_at).toLocaleString("sw-TZ")}
            </p>
          )}
        </section>

        <aside className="min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setAi(null); }}
              placeholder={t("Tafuta chaneli…")}
              className="pl-9"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <button
                key={c}
                onClick={() => { setCat(c); setAi(null); }}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
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
                    current?.id === c.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-card hover:bg-secondary"
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                    <img
                      src={c.logo_url || image("channelFallback", channelCover)}
                      alt=""
                      className="h-full w-full object-contain p-2"
                      loading="lazy"
                      width={384}
                      height={216}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = channelCover;
                      }}
                    />
                    {visible("cardBadges") && (
                      <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-primary">
                        {c.is_premium && !hasAccess(profile) ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                      </span>
                    )}
                    {visible("cardBadges") && !c.is_premium && (
                      <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {t("BURE")}
                      </span>
                    )}
                    {visible("liveBadges") && c.is_live && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                        <Radio className="h-3 w-3" />{" " + t("LIVE")}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 p-2.5">
                    <div className="min-h-8 break-words text-xs font-semibold leading-4">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t(c.category)}</div>
                  </div>
                </Button>
              </li>
            ))}
            {isLoading && (
              <li className="col-span-2 p-4 text-center text-sm text-muted-foreground">{t("Inapakia chaneli…")}</li>
            )}
            {!isLoading && shownChannels.length === 0 && (
              <li className="col-span-2 p-4 text-center text-sm text-muted-foreground">{t("Hakuna chaneli iliyopatikana.")}</li>
            )}
          </ul>
        </aside>
      </div>
    </main>
  );
}
