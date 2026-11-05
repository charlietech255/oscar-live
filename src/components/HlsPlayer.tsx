import { useEffect, useRef, useState } from "react";

export function HlsPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setError(false);
    let hls: { destroy: () => void } | undefined;
    let cancelled = false;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return setError(true);
        const h = new Hls({ lowLatencyMode: true });
        h.loadSource(src);
        h.attachMedia(video);
        h.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        h.on(Hls.Events.ERROR, (_e, d) => d.fatal && setError(true));
        hls = h;
      });
    }
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-card">
      <video ref={ref} controls playsInline className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4 text-center text-muted-foreground">
          Mtiririko huu haupatikani kwa sasa. Jaribu chaneli nyingine.
        </div>
      )}
    </div>
  );
}
