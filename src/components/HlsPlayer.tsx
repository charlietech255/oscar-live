import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function HlsPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Jaribu kucheza; kama kivinjari kikizuia sauti, anzisha kimyagiza kisha mtumiaji afanye unmute
  const tryPlay = (video: HTMLVideoElement) => {
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  };

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setError(false);
    let hls: { destroy: () => void } | undefined;
    let cancelled = false;
    let retries = 0;
    const isHls = /\.m3u8($|\?)/i.test(src);
    video.loop = !isHls;
    if (!isHls) {
      // Video ya kawaida (mp4/webm) — cheza moja kwa moja, ikirudia kama chaneli
      video.src = src;
      video.onerror = () => setError(true);
      tryPlay(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.onerror = () => setError(true);
      tryPlay(video);
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return setError(true);
        const h = new Hls({
          lowLatencyMode: true,
          liveSyncDurationCount: 3,
          manifestLoadingMaxRetry: 6,
          levelLoadingMaxRetry: 6,
          fragLoadingMaxRetry: 6,
        });
        h.loadSource(src);
        h.attachMedia(video);
        h.on(Hls.Events.MANIFEST_PARSED, () => tryPlay(video));
        h.on(Hls.Events.ERROR, (_e, d) => {
          if (!d.fatal) return;
          // Jaribu kurudisha mtiririko kabla ya kuonyesha hitilafu
          if (retries < 3 && d.type === Hls.ErrorTypes.NETWORK_ERROR) { retries++; setTimeout(() => h.startLoad(), 1500 * retries); return; }
          if (retries < 3 && d.type === Hls.ErrorTypes.MEDIA_ERROR) { retries++; h.recoverMediaError(); return; }
          setError(true);
        });
        hls = h;
      });
    }
    return () => {
      cancelled = true;
      video.onerror = null;
      hls?.destroy();
    };
  }, [src, attempt]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-card">
      <video ref={ref} controls playsInline autoPlay muted={false} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 p-4 text-center text-muted-foreground">
          <p>Mtiririko huu haupatikani kwa sasa.</p>
          <Button size="sm" onClick={() => setAttempt((a) => a + 1)}>Jaribu tena</Button>
        </div>
      )}
    </div>
  );
}
