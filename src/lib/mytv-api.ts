/**
 * myTV Streaming API Client
 *
 * Implements integration with clver.store / myTV Streaming endpoints:
 * - GET /channels.php with header `X-API-Key`
 * - GET /stream.php?id={id} with header `X-API-Key`
 * - W3C ClearKey DRM kid & key extraction and normalization
 * - MPEG-DASH and HLS stream type resolution
 */

export const MYTV_DEFAULT_API_KEY = "dev_pub_d6f14e5b75fc266a2f203bdfd7d04c8d";
export const MYTV_DEFAULT_API_BASE = "https://clver.store/api/dev";

export interface MyTvChannel {
  id: string | number;
  name: string;
  category?: string;
  logo?: string;
  logo_url?: string;
  is_live?: boolean;
  stream_type?: "dash" | "hls" | string;
  description?: string;
}

export interface ClearKeyDrm {
  kid: string;
  key: string;
}

export interface MyTvStreamResponse {
  ok?: boolean;
  id?: string | number;
  url?: string;
  stream_url?: string;
  manifest_url?: string;
  streamUrl?: string;
  type?: "dash" | "hls" | string;
  stream_type?: string;
  format?: string;
  kid?: string;
  key?: string;
  clearKey?: ClearKeyDrm;
  clearkey?: ClearKeyDrm;
  drm?: {
    clearKey?: ClearKeyDrm;
    clearkey?: ClearKeyDrm;
    kid?: string;
    key?: string;
    [key: string]: any;
  };
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Normalizes a hex string or UUID to lowercase 32-character hex without dashes
 */
export function normalizeHex(val?: string | null): string | undefined {
  if (!val) return undefined;
  const cleaned = val.replace(/[-:\s]/g, "").trim().toLowerCase();
  if (/^[0-9a-f]{32}$/.test(cleaned)) {
    return cleaned;
  }
  // If base64/base64url format, attempt conversion
  try {
    const base64 = val.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    if (binary.length === 16) {
      return Array.from(binary)
        .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
        .toLowerCase();
    }
  } catch {
    // not valid base64
  }
  return cleaned;
}

/**
 * Extracts W3C ClearKey kid & key from API stream responses in various formats
 */
export function extractClearKey(data: MyTvStreamResponse): ClearKeyDrm | null {
  if (!data) return null;

  const rawKid =
    data.kid ||
    data.stream?.clearkey?.kid ||
    data.stream?.clearKey?.kid ||
    data.clearkey?.kid ||
    data.clearKey?.kid ||
    data.drm?.clearKey?.kid ||
    data.drm?.clearkey?.kid ||
    data.drm?.kid;

  const rawKey =
    data.key ||
    data.stream?.clearkey?.key ||
    data.stream?.clearKey?.key ||
    data.clearkey?.key ||
    data.clearKey?.key ||
    data.drm?.clearKey?.key ||
    data.drm?.clearkey?.key ||
    data.drm?.key;

  if (rawKid && rawKey) {
    const normKid = normalizeHex(rawKid) || rawKid;
    const normKey = normalizeHex(rawKey) || rawKey;
    return { kid: normKid, key: normKey };
  }

  return null;
}

/**
 * Resolves stream type: 'dash', 'hls', or 'direct'
 */
export function detectStreamType(
  url?: string | null,
  explicitType?: string | null
): "dash" | "hls" | "direct" {
  const normType = (explicitType || "").toLowerCase();
  if (normType.includes("dash") || normType.includes("mpd")) return "dash";
  if (normType.includes("hls") || normType.includes("m3u8")) return "hls";

  if (!url) return "hls";
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes(".mpd")) return "dash";
  if (lowerUrl.includes(".m3u8")) return "hls";

  return "direct";
}

/**
 * Verified test demo streams for fallback testing when unauthenticated dev key returns invalid_key
 */
export const DEMO_FALLBACK_CATALOG: MyTvChannel[] = [
  {
    id: "demo-dash-clearkey",
    name: "myTV Sports 1 (MPEG-DASH / ClearKey DRM)",
    category: "Michezo",
    stream_type: "dash",
    is_live: true,
    description: "MPEG-DASH stream na W3C ClearKey DRM na buffering goal ya sekunde 20 kwa Shaka Player.",
  },
  {
    id: "demo-hls-stream",
    name: "myTV Premier Live (HLS)",
    category: "Ligi Kuu",
    stream_type: "hls",
    is_live: true,
    description: "HLS stream inayochezwa kwa Hls.js ikiwa na buffering goal ya sekunde 20.",
  },
  {
    id: "demo-hls-news",
    name: "myTV Habari 24/7 (HLS)",
    category: "Habari",
    stream_type: "hls",
    is_live: true,
    description: "Habari za moja kwa moja kupitia mtandao wa Hls.js.",
  },
];

export const DEMO_FALLBACK_STREAMS: Record<string, MyTvStreamResponse> = {
  "demo-dash-clearkey": {
    ok: true,
    id: "demo-dash-clearkey",
    url: "https://storage.googleapis.com/shaka-demo-assets/angel-one-clearkey/dash.mpd",
    stream_url: "https://storage.googleapis.com/shaka-demo-assets/angel-one-clearkey/dash.mpd",
    type: "dash",
    stream_type: "dash",
    kid: "4d979fb36e8b4e44937511f89f005703",
    key: "d419b4561fe405523a6f3b069d587c6e",
    drm: {
      clearKey: {
        kid: "4d979fb36e8b4e44937511f89f005703",
        key: "d419b4561fe405523a6f3b069d587c6e",
      },
    },
  },
  "demo-hls-stream": {
    ok: true,
    id: "demo-hls-stream",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    type: "hls",
    stream_type: "hls",
  },
  "demo-hls-news": {
    ok: true,
    id: "demo-hls-news",
    url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    stream_url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    type: "hls",
    stream_type: "hls",
  },
};

/**
 * Requirement 1: Fetch live catalog via GET /channels.php (send X-API-Key header)
 */
export async function fetchLiveCatalog(
  apiKey: string = MYTV_DEFAULT_API_KEY,
  apiBase: string = MYTV_DEFAULT_API_BASE
): Promise<{
  channels: MyTvChannel[];
  isDemoFallback: boolean;
  error?: string;
  statusCode?: number;
}> {
  const url = `${apiBase.replace(/\/+$/, "")}/channels.php`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
    });

    const statusCode = res.status;
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response
    }

    if (!res.ok || (data && data.ok === false)) {
      const errMsg =
        data?.message ||
        data?.error ||
        `HTTP ${res.status}: Imeshindikana kupata orodha ya chaneli.`;
      return {
        channels: DEMO_FALLBACK_CATALOG,
        isDemoFallback: true,
        error: errMsg,
        statusCode,
      };
    }

    let parsedChannels: MyTvChannel[] = [];
    if (Array.isArray(data)) {
      parsedChannels = data;
    } else if (Array.isArray(data?.channels)) {
      parsedChannels = data.channels;
    } else if (Array.isArray(data?.data)) {
      parsedChannels = data.data;
    } else if (Array.isArray(data?.items)) {
      parsedChannels = data.items;
    }

    if (parsedChannels.length > 0) {
      const normalized = parsedChannels.map((c: any) => ({
        ...c,
        stream_type: c.stream_type || c.type || "hls",
        logo: c.logo || c.logo_url,
        logo_url: c.logo_url || c.logo,
      }));
      return {
        channels: normalized,
        isDemoFallback: false,
        statusCode,
      };
    }

    // If API returned empty array, offer fallback demo catalog
    return {
      channels: DEMO_FALLBACK_CATALOG,
      isDemoFallback: true,
      error: "Orodha ya chaneli imerejea tupu kutoka kwa seva.",
      statusCode,
    };
  } catch (err: any) {
    return {
      channels: DEMO_FALLBACK_CATALOG,
      isDemoFallback: true,
      error: err?.message || "Imeshindikana kuunganisha na seva ya clver.store.",
    };
  }
}

/**
 * Requirement 2: Request GET /stream.php?id={id} (send X-API-Key header)
 */
export async function fetchStreamDetails(
  id: string | number,
  apiKey: string = MYTV_DEFAULT_API_KEY,
  apiBase: string = MYTV_DEFAULT_API_BASE
): Promise<MyTvStreamResponse> {
  const channelId = String(id);

  // If this is a demo fallback channel id, return verified demo stream immediately
  if (DEMO_FALLBACK_STREAMS[channelId]) {
    return DEMO_FALLBACK_STREAMS[channelId];
  }

  const url = `${apiBase.replace(/\/+$/, "")}/stream.php?id=${encodeURIComponent(channelId)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response
    }

    if (!res.ok || (data && data.ok === false)) {
      const errMsg =
        data?.message ||
        data?.error ||
        `HTTP ${res.status}: Imeshindikana kupata mtiririko wa chaneli ${id}.`;

      // Fallback if demo channel or invalid key
      const fallback =
        DEMO_FALLBACK_STREAMS[channelId] || DEMO_FALLBACK_STREAMS["demo-dash-clearkey"];
      return {
        ...fallback,
        ok: false,
        error: errMsg,
      };
    }

    const stream = data.stream || {};
    const playbackUrl =
      stream.playback_url ||
      stream.url ||
      data.url ||
      data.stream_url ||
      data.manifest_url ||
      data.streamUrl;

    const streamType =
      stream.type ||
      stream.stream_type ||
      data.channel?.type ||
      data.type ||
      data.stream_type;

    const kid =
      stream.clearkey?.kid ||
      stream.clearKey?.kid ||
      stream.kid ||
      data.kid ||
      data.clearkey?.kid ||
      data.clearKey?.kid;

    const key =
      stream.clearkey?.key ||
      stream.clearKey?.key ||
      stream.key ||
      data.key ||
      data.clearkey?.key ||
      data.clearKey?.key;

    return {
      ok: true,
      ...data,
      ...stream,
      url: playbackUrl,
      stream_url: playbackUrl,
      type: streamType,
      stream_type: streamType,
      kid,
      key,
      clearkey: stream.clearkey || data.clearkey,
      clearKey: stream.clearKey || data.clearKey,
    };
  } catch (err: any) {
    const fallback =
      DEMO_FALLBACK_STREAMS[channelId] || DEMO_FALLBACK_STREAMS["demo-dash-clearkey"];
    return {
      ...fallback,
      ok: false,
      error: err?.message || "Imeshindikana kuunganisha na seva ya stream.php.",
    };
  }
}

