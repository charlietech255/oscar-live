import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Maximize, RefreshCw, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadShakaPlayer } from "@/lib/shaka-loader";
import {
  detectStreamType,
  extractClearKey,
  getHardcodedClearKey,
  type MyTvStreamResponse,
} from "@/lib/mytv-api";

export interface MyTvStreamPlayerProps {
  src: string;
  streamType?: "dash" | "hls" | "direct" | string;
  channelId?: string;
  channelName?: string;
  kid?: string;
  key?: string;
  clearKey?: string;
  licenseUrl?: string;
  streamDetails?: MyTvStreamResponse | null;
  poster?: string;
  autoPlay?: boolean;
  showDebugBadge?: boolean;
  onStreamReady?: () => void;
  onError?: (error: Error | string) => void;
}

export function MyTvStreamPlayer({
  src,
  streamType,
  channelId,
  channelName,
  kid: propKid,
  key: propKey,
  clearKey,
  licenseUrl,
  streamDetails,
  poster,
  autoPlay = true,
  showDebugBadge = false,
  onStreamReady,
  onError,
}: MyTvStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeEngine, setActiveEngine] = useState<"shaka" | "hlsjs" | "native" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKid, setActiveKid] = useState<string | null>(null);

  // Extract ClearKey DRM credentials from hardcoded catalog, props, or streamDetails
  const hardcoded =
    (channelId ? getHardcodedClearKey(channelId) : null) ||
    (channelName ? getHardcodedClearKey(channelName) : null);
  const drm = streamDetails ? extractClearKey(streamDetails) : null;
  const effectiveKid = propKid || drm?.kid || hardcoded?.kid;
  const effectiveKey = clearKey || propKey || drm?.key || hardcoded?.key;

  // Resolve stream type: DASH vs HLS vs Direct
  const resolvedType = detectStreamType(src, streamType || streamDetails?.type || streamDetails?.stream_type);

  // Safe play attempt with autoplay-policy handling
  const tryPlay = useCallback((video: HTMLVideoElement) => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          onStreamReady?.();
        })
        .catch(() => {
          // Autoplay blocked with audio: fallback to muted autoplay
          video.muted = true;
          setMuted(true);
          video.play().then(() => {
            setIsPlaying(true);
            onStreamReady?.();
          }).catch((err) => {
            console.warn("Autoplay muted failed:", err);
          });
        });
    }
  }, [onStreamReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    let destroyed = false;
    let shakaPlayerInstance: any = null;
    let hlsInstance: any = null;

    setActiveKid(effectiveKid ? effectiveKid.slice(0, 8) + "…" : null);

    // Decode JWT ticket if src is still an unredirected playback.php URL
    let effectiveSrc = src;
    if (effectiveSrc && effectiveSrc.includes("playback.php?ticket=")) {
      try {
        const ticketParam = effectiveSrc.split("ticket=")[1]?.split("&")[0];
        if (ticketParam) {
          const payloadPart = ticketParam.split(".")[0];
          const padded = payloadPart + "=".repeat((4 - (payloadPart.length % 4)) % 4);
          const decodedJson = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
          const parsed = JSON.parse(decodedJson);
          if (parsed.url) {
            effectiveSrc = parsed.url;
          }
        }
      } catch {
        // Fallback to original src
      }
    }

    // -------------------------------------------------------------
    // Requirement 3: MPEG-DASH playback via Shaka Player with ClearKey DRM
    // Requirement 5: Buffering goal configured to 20 seconds
    // -------------------------------------------------------------
    if (resolvedType === "dash") {
      setActiveEngine("shaka");

      loadShakaPlayer()
        .then(async (shaka) => {
          if (destroyed) return;
          if (!shaka || !shaka.Player) {
            throw new Error("Shaka Player library is unavailable.");
          }

          if (!shaka.Player.isBrowserSupported()) {
            throw new Error("This browser does not support Shaka Player / MediaSource Extensions.");
          }

          const player = new shaka.Player();
          shakaPlayerInstance = player;
          await player.attach(video);

          if (destroyed) {
            await player.destroy();
            return;
          }

          // Network filter to ensure CORS header resilience
          const netEngine = player.getNetworkingEngine?.();
          if (netEngine && netEngine.registerResponseFilter) {
            netEngine.registerResponseFilter((_type: any, response: any) => {
              if (response?.headers) {
                response.headers["access-control-allow-origin"] = "*";
              }
            });
          }

          // Build W3C ClearKey DRM configuration
          const drmConfig: any = {};
          if (effectiveKid && effectiveKey) {
            const cleanKid = effectiveKid.replace(/[-:\s]/g, "").toLowerCase();
            const cleanKey = effectiveKey.replace(/[-:\s]/g, "").toLowerCase();

            drmConfig.clearKeys = {
              [cleanKid]: cleanKey,
              ...(effectiveKid !== cleanKid ? { [effectiveKid]: effectiveKey } : {}),
            };
          }

          const effectiveLicenseUrl = licenseUrl || streamDetails?.drm_license_url;
          if (effectiveLicenseUrl) {
            drmConfig.servers = {
              ...(drmConfig.servers || {}),
              "org.w3.clearkey": effectiveLicenseUrl,
            };
          }

          // Requirement 5: Configure buffering goal to 20 seconds
          player.configure({
            streaming: {
              bufferingGoal: 20, // 20 seconds buffering goal
              rebufferingGoal: 2,
              bufferBehind: 30,
              jumpLargeGaps: true,
            },
            manifest: {
              dash: {
                ignoreMinBufferTime: true,
              },
            },
            drm: drmConfig,
          });

          // Error handling
          player.addEventListener("error", (event: any) => {
            const detail = event?.detail;
            console.error("Shaka Player Error:", detail);
            if (!destroyed) {
              const msg = detail?.message || `Shaka error code ${detail?.code || "unknown"}`;
              setError(`Hitilafu ya Shaka Player: ${msg}`);
              onError?.(msg);
            }
          });

          // Load MPEG-DASH manifest
          await player.load(effectiveSrc);
          if (!destroyed && autoPlay) {
            tryPlay(video);
          }
        })
        .catch((err) => {
          if (!destroyed) {
            const msg = err?.message || "Imeshindikana kucheza MPEG-DASH mtiririko.";
            setError(msg);
            onError?.(err);
          }
        });
    }

    // -------------------------------------------------------------
    // Requirement 4: If stream type is HLS, play using Hls.js
    // Requirement 5: Configure buffering goal to 20 seconds
    // -------------------------------------------------------------
    else if (resolvedType === "hls") {
      let retries = 0;

      import("hls.js")
        .then(({ default: Hls }) => {
          if (destroyed) return;

          if (Hls.isSupported()) {
            setActiveEngine("hlsjs");

            // Requirement 5: Configure buffering goal to 20 seconds
            const hls = new Hls({
              maxBufferLength: 20, // Buffering goal: 20 seconds
              maxMaxBufferLength: 20, // Max buffer cap: 20 seconds
              liveSyncDurationCount: 3,
              manifestLoadingMaxRetry: 6,
              levelLoadingMaxRetry: 6,
              fragLoadingMaxRetry: 6,
              enableWorker: true,
              lowLatencyMode: true,
            });
            hlsInstance = hls;

            hls.loadSource(effectiveSrc);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!destroyed && autoPlay) {
                tryPlay(video);
              }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (destroyed || !data.fatal) return;

              if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retries < 3) {
                retries++;
                setTimeout(() => {
                  if (!destroyed) hls.startLoad();
                }, 1500 * retries);
                return;
              }

              if (data.type === Hls.ErrorTypes.MEDIA_ERROR && retries < 3) {
                retries++;
                hls.recoverMediaError();
                return;
              }

              const msg = `Hitilafu ya Hls.js (${data.details || data.type})`;
              setError(msg);
              onError?.(msg);
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            // Safari iOS/macOS native HLS fallback
            setActiveEngine("native");
            video.src = effectiveSrc;
            video.onerror = () => {
              setError("Hitilafu ya mtiririko wa asili.");
              onError?.("Native HLS playback error");
            };
            if (autoPlay) {
              tryPlay(video);
            }
          } else {
            setError("Kivinjari hiki hakitumii Hls.js wala mtiririko wa HLS.");
            onError?.("HLS not supported in this browser");
          }
        })
        .catch((err) => {
          if (!destroyed) {
            setError(err?.message || "Imeshindikana kupakia Hls.js");
            onError?.(err);
          }
        });
    }

    // Direct MP4 / WebM video
    else {
      setActiveEngine("native");
      video.src = effectiveSrc;
      video.loop = true;
      video.onerror = () => {
        setError("Hitilafu ya kucheza video ya moja kwa moja.");
        onError?.("Direct video playback failed");
      };
      if (autoPlay) {
        tryPlay(video);
      }
    }

    // Cleanup resources
    return () => {
      destroyed = true;
      video.onerror = null;

      if (shakaPlayerInstance) {
        shakaPlayerInstance.destroy().catch(() => {});
      }
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [src, resolvedType, effectiveKid, effectiveKey, autoPlay, attempt, tryPlay, onError]);

  // Fullscreen helper
  const toggleFullscreen = () => {
    const box = containerRef.current;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (box?.requestFullscreen) {
      box.requestFullscreen().catch(() => video?.webkitEnterFullscreen?.());
    } else if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  };

  // Sound toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !video.muted;
    video.muted = newMuted;
    setMuted(newMuted);
    if (!newMuted && video.volume === 0) {
      video.volume = 1;
    }
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg"
    >
      <video
        ref={videoRef}
        controls
        playsInline
        poster={poster}
        className="h-full w-full object-contain"
        onVolumeChange={(e) => setMuted(e.currentTarget.muted || e.currentTarget.volume === 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Engine & Buffering HUD Overlay (Only when showDebugBadge is enabled) */}
      {showDebugBadge && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
          {activeEngine === "shaka" && (
            <span className="inline-flex items-center gap-1 rounded bg-indigo-600/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              <Cpu className="h-3 w-3" /> Shaka Player (DASH)
            </span>
          )}

          {activeEngine === "hlsjs" && (
            <span className="inline-flex items-center gap-1 rounded bg-orange-600/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              <Cpu className="h-3 w-3" /> Hls.js (HLS)
            </span>
          )}

          {activeKid && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-600/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> ClearKey DRM ({activeKid})
            </span>
          )}

          <span className="inline-flex items-center rounded bg-zinc-800/85 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur">
            20s Buffer Goal
          </span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 bg-background/80 px-2.5 backdrop-blur hover:bg-background"
          onClick={toggleMute}
          aria-label={muted ? "Washa sauti" : "Zima sauti"}
        >
          {muted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
          <span className="ml-1 text-xs hidden sm:inline">{muted ? "Washa sauti" : "Sauti"}</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          className="h-8 bg-background/80 px-2.5 backdrop-blur hover:bg-background"
          onClick={toggleFullscreen}
          aria-label="Skrini nzima"
        >
          <Maximize className="h-4 w-4" />
          <span className="ml-1 text-xs hidden sm:inline">Skrini nzima</span>
        </Button>
      </div>

      {/* Error Recovery Overlay */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center text-foreground backdrop-blur">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            {channelName ? `Chaneli: ${channelName}` : "Hakikisha unganisho la mtandao na ufunguo wa API."}
          </p>
          <Button
            size="sm"
            onClick={() => setAttempt((a) => a + 1)}
            className="mt-1 flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" /> Jaribu tena
          </Button>
        </div>
      )}
    </div>
  );
}

