import { MyTvStreamPlayer } from "@/components/MyTvStreamPlayer";

export interface HlsPlayerProps {
  src: string;
  streamType?: "dash" | "hls" | "direct" | string;
  kid?: string;
  key?: string;
  licenseUrl?: string;
  poster?: string;
}

/**
 * Universal Streaming Player
 *
 * Plays MPEG-DASH via Shaka Player with W3C ClearKey DRM and 20s buffering goal.
 * Plays HLS via Hls.js with 20s buffering goal.
 * Backwards compatible with existing HlsPlayer usages.
 */
export function HlsPlayer({ src, streamType, kid, key, licenseUrl, poster }: HlsPlayerProps) {
  return (
    <MyTvStreamPlayer
      src={src}
      streamType={streamType}
      kid={kid}
      clearKey={key}
      licenseUrl={licenseUrl}
      poster={poster}
      autoPlay={true}
    />
  );
}
