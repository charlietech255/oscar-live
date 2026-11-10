import { createServerFn } from "@tanstack/react-start";
import {
  MYTV_DEFAULT_API_KEY,
  MYTV_DEFAULT_API_BASE,
  DEMO_FALLBACK_CATALOG,
  DEMO_FALLBACK_STREAMS,
  HARDCODED_CLEARKEYS,
  getHardcodedClearKey,
  type MyTvChannel,
  type MyTvStreamResponse,
} from "./mytv-api";

const AUTHORIZED_ORIGIN = "https://oscar-sports.store";

export interface ServerCatalogResult {
  ok: boolean;
  channels: MyTvChannel[];
  total: number;
  isDemoFallback: boolean;
  error?: string;
  statusCode?: number;
}

export const fetchMyTvCatalogServerFn = createServerFn({ method: "POST" })
  .validator((input?: { apiKey?: string; apiBase?: string }) => {
    return {
      apiKey: input?.apiKey || MYTV_DEFAULT_API_KEY,
      apiBase: input?.apiBase || MYTV_DEFAULT_API_BASE,
    };
  })
  .handler(async ({ data }): Promise<ServerCatalogResult> => {
    const url = `${data.apiBase.replace(/\/+$/, "")}/channels.php`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": data.apiKey,
          Accept: "application/json",
          Origin: AUTHORIZED_ORIGIN,
        },
      });

      const statusCode = res.status;
      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Non-JSON
      }

      if (!res.ok || (parsed && parsed.ok === false)) {
        const errMsg =
          parsed?.message ||
          parsed?.error ||
          `HTTP ${res.status}: Imeshindikana kupata orodha ya chaneli.`;
        return {
          ok: false,
          channels: DEMO_FALLBACK_CATALOG,
          total: DEMO_FALLBACK_CATALOG.length,
          isDemoFallback: true,
          error: errMsg,
          statusCode,
        };
      }

      let parsedChannels: MyTvChannel[] = [];
      if (Array.isArray(parsed)) {
        parsedChannels = parsed;
      } else if (Array.isArray(parsed?.channels)) {
        parsedChannels = parsed.channels;
      } else if (Array.isArray(parsed?.data)) {
        parsedChannels = parsed.data;
      } else if (Array.isArray(parsed?.items)) {
        parsedChannels = parsed.items;
      }

      if (parsedChannels.length > 0) {
        const normalized = parsedChannels.map((c: any) => ({
          ...c,
          stream_type: c.stream_type || c.type || "hls",
          logo: c.logo || c.logo_url,
          logo_url: c.logo_url || c.logo,
        }));
        return {
          ok: true,
          channels: normalized,
          total: normalized.length,
          isDemoFallback: false,
          statusCode,
        };
      }

      return {
        ok: true,
        channels: DEMO_FALLBACK_CATALOG,
        total: DEMO_FALLBACK_CATALOG.length,
        isDemoFallback: true,
        error: "Orodha ya chaneli imerejea tupu.",
        statusCode,
      };
    } catch (err: any) {
      return {
        ok: false,
        channels: DEMO_FALLBACK_CATALOG,
        total: DEMO_FALLBACK_CATALOG.length,
        isDemoFallback: true,
        error: err?.message || "Hitilafu ya mawasiliano ya seva ya myTV.",
      };
    }
  });

export const fetchMyTvStreamServerFn = createServerFn({ method: "POST" })
  .validator((input: { id: string | number; apiKey?: string; apiBase?: string }) => {
    return {
      id: String(input.id),
      apiKey: input.apiKey || MYTV_DEFAULT_API_KEY,
      apiBase: input.apiBase || MYTV_DEFAULT_API_BASE,
    };
  })
  .handler(async ({ data }): Promise<MyTvStreamResponse> => {
    // If it's a demo channel ID, return the verified demo stream directly
    if (DEMO_FALLBACK_STREAMS[data.id]) {
      return DEMO_FALLBACK_STREAMS[data.id];
    }

    const url = `${data.apiBase.replace(/\/+$/, "")}/stream.php?id=${encodeURIComponent(data.id)}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": data.apiKey,
          Accept: "application/json",
          Origin: AUTHORIZED_ORIGIN,
        },
      });

      const text = await res.text();
      let streamData: any = null;
      try {
        streamData = JSON.parse(text);
      } catch {
        // Non-JSON
      }

      if (!res.ok || (streamData && streamData.ok === false)) {
        const errMsg =
          streamData?.message ||
          streamData?.error ||
          `HTTP ${res.status}: Imeshindikana kupata mkondo wa chaneli.`;

        // If the real API rejected, provide fallback
        const fallback = DEMO_FALLBACK_STREAMS["demo-dash-clearkey"];
        return {
          ...fallback,
          ok: false,
          error: errMsg,
        };
      }

      const stream = streamData.stream || streamData;
      let playbackUrl = stream.playback_url || stream.url || stream.stream_url;

      // Follow 302 redirect on server to eliminate CORS redirect and duplicate header issues
      if (playbackUrl && playbackUrl.includes("playback.php")) {
        try {
          const redirectRes = await fetch(playbackUrl, {
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              Origin: AUTHORIZED_ORIGIN,
            },
          });
          const location = redirectRes.headers.get("location");
          if (location) {
            playbackUrl = location.startsWith("http")
              ? location
              : new URL(location, playbackUrl).toString();
          } else if (playbackUrl.includes("ticket=")) {
            // Fallback: decode JWT ticket directly if location header was obscured
            const ticket = playbackUrl.split("ticket=")[1]?.split("&")[0];
            if (ticket) {
              const payloadPart = ticket.split(".")[0];
              const padded = payloadPart + "=".repeat((4 - (payloadPart.length % 4)) % 4);
              const decodedStr = Buffer.from(padded, "base64").toString("utf-8");
              const decoded = JSON.parse(decodedStr);
              if (decoded.url) {
                playbackUrl = decoded.url;
              }
            }
          }
        } catch (redirectErr) {
          console.warn("Server redirect resolution warning:", redirectErr);
        }
      }

      // Hardcode / inject verified ClearKey DRM keys for this channel
      const hardcodedKey = getHardcodedClearKey(data.id);
      const clearKey = hardcodedKey || stream.clearkey || stream.clearKey;

      return {
        ...streamData,
        stream: {
          ...stream,
          playback_url: playbackUrl,
          url: playbackUrl,
          clearkey: clearKey,
          clearKey: clearKey,
        },
      };
    } catch (err: any) {
      const fallback = DEMO_FALLBACK_STREAMS["demo-dash-clearkey"];
      return {
        ...fallback,
        ok: false,
        error: err?.message || "Hitilafu ya mtandao wakati wa kupakua mkondo wa chaneli.",
      };
    }
  });

