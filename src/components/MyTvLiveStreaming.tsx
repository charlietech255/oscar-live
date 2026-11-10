import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Radio,
  Tv,
  Key,
  ShieldCheck,
  AlertCircle,
  Play,
  Settings2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchLiveCatalog,
  fetchStreamDetails,
  MYTV_DEFAULT_API_KEY,
  MYTV_DEFAULT_API_BASE,
  type MyTvChannel,
  type MyTvStreamResponse,
} from "@/lib/mytv-api";
import { MyTvStreamPlayer } from "@/components/MyTvStreamPlayer";
import channelCover from "@/assets/channel-cover.jpg";

export function MyTvLiveStreaming() {
  const [apiKey, setApiKey] = useState<string>(MYTV_DEFAULT_API_KEY);
  const [apiBase, setApiBase] = useState<string>(MYTV_DEFAULT_API_BASE);
  const [keyInput, setKeyInput] = useState<string>(MYTV_DEFAULT_API_KEY);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const [channels, setChannels] = useState<MyTvChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<MyTvChannel | null>(null);
  const [streamDetails, setStreamDetails] = useState<MyTvStreamResponse | null>(null);

  const [loadingChannels, setLoadingChannels] = useState<boolean>(true);
  const [loadingStream, setLoadingStream] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDemoFallback, setIsDemoFallback] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Zote");

  const playerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------
  // Requirement 1: Fetch live catalog via GET /channels.php (send X-API-Key header)
  // -------------------------------------------------------------
  const loadCatalog = async (key: string, base: string) => {
    setLoadingChannels(true);
    setApiError(null);

    const result = await fetchLiveCatalog(key, base);
    setChannels(result.channels);
    setIsDemoFallback(result.isDemoFallback);
    if (result.error) {
      setApiError(result.error);
    }

    if (result.channels.length > 0) {
      const first = result.channels[0];
      setSelectedChannel(first);
      // Auto load first channel stream
      loadStream(first.id, key, base);
    } else {
      setSelectedChannel(null);
      setStreamDetails(null);
    }

    setLoadingChannels(false);
  };

  // -------------------------------------------------------------
  // Requirement 2: When user clicks a channel, request GET /stream.php?id={id}
  // -------------------------------------------------------------
  const loadStream = async (channelId: string | number, key: string, base: string) => {
    setLoadingStream(true);
    const data = await fetchStreamDetails(channelId, key, base);
    setStreamDetails(data);
    setLoadingStream(false);
  };

  useEffect(() => {
    loadCatalog(apiKey, apiBase);
  }, [apiKey, apiBase]);

  const handleChannelClick = (channel: MyTvChannel) => {
    setSelectedChannel(channel);
    loadStream(channel.id, apiKey, apiBase);
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleApplyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(keyInput.trim() || MYTV_DEFAULT_API_KEY);
    setShowConfig(false);
  };

  const handleResetKey = () => {
    setKeyInput(MYTV_DEFAULT_API_KEY);
    setApiKey(MYTV_DEFAULT_API_KEY);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["Zote", ...Array.from(set)];
  }, [channels]);

  // Filtered channels
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesCat = selectedCategory === "Zote" || c.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [channels, selectedCategory, searchQuery]);

  const activeStreamUrl = streamDetails?.stream_url || streamDetails?.url;
  const activeStreamType = streamDetails?.type || streamDetails?.stream_type || selectedChannel?.stream_type;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* API Header & Key Manager */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tv className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-bold leading-none tracking-tight">
                myTV Streaming API
              </h2>
              <p className="text-xs text-muted-foreground">
                Imeunganishwa na <code className="text-primary">{apiBase}</code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/40 bg-primary/10 text-primary">
              <Key className="h-3 w-3" />
              API Key: {apiKey === MYTV_DEFAULT_API_KEY ? "dev_live_demo" : `${apiKey.slice(0, 10)}…`}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="gap-1.5"
            >
              <Settings2 className="h-4 w-4" />
              {showConfig ? "Funga" : "Mipangilio ya API"}
            </Button>
          </div>
        </div>

        {/* API Configuration Collapsible */}
        {showConfig && (
          <form onSubmit={handleApplyConfig} className="mt-4 border-t border-border pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  API Key (X-API-Key Header)
                </label>
                <Input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Weka API Key..."
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">API Base URL</label>
                <Input
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="https://clver.store/api/dev"
                  className="mt-1 font-mono text-xs"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="submit" size="sm">
                Thibitisha na Upakie Upya
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleResetKey}>
                Rudisha Default Demo Key
              </Button>
            </div>
          </form>
        )}

        {/* Informative notice if dev key returns unauthorized / invalid_key */}
        {apiError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">
                Taarifa ya Seva ya clver.store: {apiError}
              </p>
              <p className="mt-1 text-amber-200/80">
                Ufunguo <code>&quot;{apiKey}&quot;</code> umerudisha jibu la seva. Mfumo umewasha
                otomatiki mifano ya chaneli za majaribio (MPEG-DASH na W3C ClearKey DRM &amp; HLS
                na 20s buffer) ili uweze kuthibitisha uchezaji kikamilifu.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Player on Left, Channels on Right */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Stream Player Section */}
        <section ref={playerRef} className="scroll-mt-20">
          {activeStreamUrl ? (
            <div className="space-y-3">
              <MyTvStreamPlayer
                key={`${selectedChannel?.id}-${activeStreamUrl}`}
                src={activeStreamUrl}
                streamType={activeStreamType}
                kid={streamDetails?.kid}
                clearKey={streamDetails?.key}
                streamDetails={streamDetails}
                channelName={selectedChannel?.name}
                autoPlay={true}
              />

              {/* Active Channel Metadata Card */}
              {selectedChannel && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {selectedChannel.is_live && (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                          <Radio className="h-3 w-3 animate-pulse" /> LIVE
                        </span>
                      )}
                      <h1 className="text-xl font-bold tracking-tight">{selectedChannel.name}</h1>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeStreamType === "dash" && (
                        <Badge variant="secondary" className="bg-indigo-900/60 text-indigo-200">
                          MPEG-DASH
                        </Badge>
                      )}
                      {activeStreamType === "hls" && (
                        <Badge variant="secondary" className="bg-orange-900/60 text-orange-200">
                          HLS
                        </Badge>
                      )}
                      {streamDetails?.kid && (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                          <ShieldCheck className="mr-1 h-3 w-3" /> ClearKey DRM
                        </Badge>
                      )}
                    </div>
                  </div>

                  {selectedChannel.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedChannel.description}
                    </p>
                  )}

                  {/* Streaming Specs Details */}
                  <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">Channel ID:</span>{" "}
                        <span className="font-mono font-medium">{selectedChannel.id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Format:</span>{" "}
                        <span className="font-mono font-medium uppercase">
                          {activeStreamType || "Auto"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Buffer Goal:</span>{" "}
                        <span className="font-mono font-medium text-primary">20s</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">DRM Engine:</span>{" "}
                        <span className="font-mono font-medium">
                          {streamDetails?.kid ? "W3C ClearKey" : "Bure / None"}
                        </span>
                      </div>
                    </div>
                    {streamDetails?.kid && (
                      <div className="mt-2 border-t border-border/50 pt-2 font-mono text-[11px] text-muted-foreground">
                        <div>KID: {streamDetails.kid}</div>
                        <div>KEY: {streamDetails.key}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
              {loadingStream ? (
                <>
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Inapakia mtiririko kutoka GET /stream.php…
                  </p>
                </>
              ) : (
                <>
                  <Tv className="h-10 w-10 text-muted-foreground/60" />
                  <p className="font-semibold">Chagua chaneli kuanza kutazama</p>
                  <p className="text-xs text-muted-foreground">
                    Mfumo utaita <code>GET /stream.php?id=&#123;id&#125;</code> na kucheza kupitia
                    Shaka Player au Hls.js
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        {/* Right: Channels Catalog Section */}
        <aside className="min-w-0 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tafuta chaneli ya myTV…"
              className="pl-9 text-sm"
            />
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Channels List */}
          <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {loadingChannels ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Inapakia orodha kutoka GET /channels.php…
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Hakuna chaneli iliyopatikana.
              </div>
            ) : (
              filteredChannels.map((c) => {
                const isSelected = selectedChannel?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleChannelClick(c)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    {/* Thumbnail / Logo */}
                    <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded bg-secondary">
                      <img
                        src={c.logo || c.logo_url || channelCover}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = channelCover;
                        }}
                      />
                      <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-primary">
                        <Play className="h-2.5 w-2.5 fill-current" />
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-xs font-bold leading-tight">{c.name}</h3>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {c.category && <span>{c.category}</span>}
                        <span>•</span>
                        <span className="font-mono text-[10px] uppercase text-primary">
                          {c.stream_type || "Live"}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

