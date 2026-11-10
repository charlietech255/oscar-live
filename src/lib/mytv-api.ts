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

/**
 * Hardcoded W3C ClearKey DRM mappings for verified live channels
 */
export const HARDCODED_CLEARKEYS: Record<string, ClearKeyDrm> = {
  // Demo Stream
  "demo-dash-clearkey": {
    kid: "4d979fb36e8b4e44937511f89f005703",
    key: "d419b4561fe405523a6f3b069d587c6e",
  },

  // 1. Azam Sports & Local Tanzanian Channels
  "7a52341c-471f-4274-928b-61d27f150e68": {
    kid: "c31df1600afc33799ecac543331803f2",
    key: "dd2101530e222f545997d4c553787f85",
  },
  "azam sport 1": {
    kid: "c31df1600afc33799ecac543331803f2",
    key: "dd2101530e222f545997d4c553787f85",
  },
  "fe7074e7-f891-4bb3-b220-1b3b7ea34c87": {
    kid: "739e7499125b31cc9948da8057b84cf9",
    key: "1b7d44d798c351acc02f33ddfbb7682a",
  },
  "azam sport 2": {
    kid: "739e7499125b31cc9948da8057b84cf9",
    key: "1b7d44d798c351acc02f33ddfbb7682a",
  },
  "4430a8a4-3cdb-4936-a0ed-691aa8a1e048": {
    kid: "2f12d7b889de381a9fb5326ca3aa166d",
    key: "51c2d733a54306fdf89acd4c9d4f6005",
  },
  "azam sport 3": {
    kid: "2f12d7b889de381a9fb5326ca3aa166d",
    key: "51c2d733a54306fdf89acd4c9d4f6005",
  },
  "252ae3b7-46a8-41d4-a158-75ea87bbf03a": {
    kid: "fbcac74e355b3b5d9b6cbc56c7597dbf",
    key: "5f980e872b378d88b46f656a806205c3",
  },
  "azam sport 4": {
    kid: "fbcac74e355b3b5d9b6cbc56c7597dbf",
    key: "5f980e872b378d88b46f656a806205c3",
  },

  // 2. Movies & Entertainment
  "f5fda6d8-f6da-42b2-bcb9-37d7be2e2bba": {
    kid: "d628ae37a8f0336b970f250d9699461e",
    key: "1194c3d60bb494aabe9114ca46c2738e",
  },
  "sinema zetu": {
    kid: "d628ae37a8f0336b970f250d9699461e",
    key: "1194c3d60bb494aabe9114ca46c2738e",
  },
  "38c2abf2-3e3a-48bb-985f-ab68e22549fd": {
    kid: "31b8fc6289fe3ca698588a59d845160c",
    key: "f8c4e73f419cb80db3bdf4a974e31894",
  },
  "utv": {
    kid: "31b8fc6289fe3ca698588a59d845160c",
    key: "f8c4e73f419cb80db3bdf4a974e31894",
  },
  "26703627-c7dc-4d42-b612-64dafa5e61e7": {
    kid: "a7e155b282f33335ae8d553f169f443c",
    key: "c3fdcfd5d509f1ed8550d76a525e34e5",
  },
  "kix movie": {
    kid: "a7e155b282f33335ae8d553f169f443c",
    key: "c3fdcfd5d509f1ed8550d76a525e34e5",
  },
  "a6997ada-a940-4bf3-8ced-d6e033aba97e": {
    kid: "e91fec140bc5316f919b4dc9c16287d7",
    key: "79884fad0dbfcdc43d3e33c82a1f1cfa",
  },
  "zbc": {
    kid: "e91fec140bc5316f919b4dc9c16287d7",
    key: "79884fad0dbfcdc43d3e33c82a1f1cfa",
  },
  "6b8e130d-af50-4f85-8abf-0c36af882613": {
    kid: "2d60429f7d043a638beb7349ae25f008",
    key: "f9b38900f31ce549425df1de2ea28f9d",
  },
  "zbc 2": {
    kid: "2d60429f7d043a638beb7349ae25f008",
    key: "f9b38900f31ce549425df1de2ea28f9d",
  },

  // 3. International Sports & Football Channels
  "516f3314-ae31-42e0-89c9-118ebaa3df5f": {
    kid: "1444f4235529f183f0a5a486befe9cdb",
    key: "e5e3fec67a1bb3472a2089c8a0a2557f",
  },
  "premier sport 1": {
    kid: "1444f4235529f183f0a5a486befe9cdb",
    key: "e5e3fec67a1bb3472a2089c8a0a2557f",
  },
  "d0a5a6ea-053e-453f-a3e8-961325d2d2a9": {
    kid: "7995c724a13748ed970840a8ab5bb9b3",
    key: "67bdaf1e2175b9ff682fcdf0e2354b1e",
  },
  "bein sport 3": {
    kid: "7995c724a13748ed970840a8ab5bb9b3",
    key: "67bdaf1e2175b9ff682fcdf0e2354b1e",
  },
  "433dbf41-f7b9-4881-ab55-d47ecd75e095": {
    kid: "e3eb6e0656ec3c22aa308aaa3f82c565",
    key: "a7634d6defd2c255135095c45bc442fb",
  },
  "crown tv": {
    kid: "e3eb6e0656ec3c22aa308aaa3f82c565",
    key: "a7634d6defd2c255135095c45bc442fb",
  },
  "crown 👑 tv": {
    kid: "e3eb6e0656ec3c22aa308aaa3f82c565",
    key: "a7634d6defd2c255135095c45bc442fb",
  },
  "6891a9db-7bf3-4976-8f94-8eeb8f44062f": {
    kid: "e3ce77324a3d4fa2a913b26cc1976052",
    key: "17774f82a3b9e33ea7a149596acbb20f",
  },
  "mbc 2": {
    kid: "e3ce77324a3d4fa2a913b26cc1976052",
    key: "17774f82a3b9e33ea7a149596acbb20f",
  },
  "68b06c2e-3c88-4bb7-9ff6-15c5913c3ed1": {
    kid: "1444f4235529f183f0a5a486befe9cdb",
    key: "e5e3fec67a1bb3472a2089c8a0a2557f",
  },
  "premier sport": {
    kid: "1444f4235529f183f0a5a486befe9cdb",
    key: "e5e3fec67a1bb3472a2089c8a0a2557f",
  },
  "d6218ad5-f79d-45bc-b570-35d07cc8bfce": {
    kid: "1a5df53609ebc9857898c490f4724918",
    key: "77f62980d582ec541280796acf8b2d19",
  },
  "premier sport 2": {
    kid: "1a5df53609ebc9857898c490f4724918",
    key: "77f62980d582ec541280796acf8b2d19",
  },
  "805650cf-992e-4b94-b31f-0b3cf57c84a1": {
    kid: "d9623774ac5c8c351aafe97c5fe70267",
    key: "5164e6d05164a2d65fa8fcc962aa4861",
  },
  "champion league": {
    kid: "d9623774ac5c8c351aafe97c5fe70267",
    key: "5164e6d05164a2d65fa8fcc962aa4861",
  },
  "champion 🏆 league": {
    kid: "d9623774ac5c8c351aafe97c5fe70267",
    key: "5164e6d05164a2d65fa8fcc962aa4861",
  },
  "76301f0d-699c-4a42-b04b-5b87d5690d43": {
    kid: "0b42be2664d7e811d04f3e504e0924c5",
    key: "ae24090123b8c72ac5404dc152847cb8",
  },
  "beinsport 2": {
    kid: "0b42be2664d7e811d04f3e504e0924c5",
    key: "ae24090123b8c72ac5404dc152847cb8",
  },
  "81ded24c-e532-41ed-b440-7d89fb149d8b": {
    kid: "7995c724a13748ed970840a8ab5bb9b3",
    key: "67bdaf1e2175b9ff682fcdf0e2354b1e",
  },
  "beinsport 3": {
    kid: "7995c724a13748ed970840a8ab5bb9b3",
    key: "67bdaf1e2175b9ff682fcdf0e2354b1e",
  },
  "1848ffb1-57db-43b9-a6de-cf60cad9526e": {
    kid: "f3df7843080ae743bf865dc5fdf64c68",
    key: "567c863bc12eb74788ea74888c042e1b",
  },
  "tnt sports 1 hd": {
    kid: "f3df7843080ae743bf865dc5fdf64c68",
    key: "567c863bc12eb74788ea74888c042e1b",
  },
  "0bc3994d-59a1-41bf-afce-8cf52f7cec61": {
    kid: "8ec2e6248abe2e10e16e439c9b85ffd8",
    key: "f121b015c2a5197828355fb6a874c297",
  },
  "fox mexico": {
    kid: "8ec2e6248abe2e10e16e439c9b85ffd8",
    key: "f121b015c2a5197828355fb6a874c297",
  },
  "0d015da8-3618-4a11-9416-c3896d44d1a6": {
    kid: "ac695bb41278318c93864a50f52ec0c1",
    key: "4d6036055b1eccb7ac632467175c7236",
  },
  "tv3 sports": {
    kid: "ac695bb41278318c93864a50f52ec0c1",
    key: "4d6036055b1eccb7ac632467175c7236",
  },
  "d3f52135-c433-4fbc-9217-bd2b80cd8e2c": {
    kid: "6979b20d655d6c2e93ef306b",
    key: "3c93be7ee24f4acf851330e8ffeee040",
  },
  "trace urban": {
    kid: "6979b20d655d6c2e93ef306b",
    key: "3c93be7ee24f4acf851330e8ffeee040",
  },
  "2b3f3fb5-aa65-4465-a8f2-7c17a34b031e": {
    kid: "dc69b6159a0f9f0a4e03b3ff91cbacd5",
    key: "d0dcbcd7723bc40df0bf34c9c092d51f",
  },
  "super sports": {
    kid: "dc69b6159a0f9f0a4e03b3ff91cbacd5",
    key: "d0dcbcd7723bc40df0bf34c9c092d51f",
  },
  "13ca200d-dba7-4e3b-92fa-10d9e5feaa31": {
    kid: "69a5aa835a061ce64a630d1046727e40",
    key: "d02feac8a999bd06bf4059bf33411749",
  },
  "super premier": {
    kid: "69a5aa835a061ce64a630d1046727e40",
    key: "d02feac8a999bd06bf4059bf33411749",
  },
  "7c867f33-87ab-4674-809e-766275839449": {
    kid: "f3df7843080ae743bf865dc5fdf64c68",
    key: "567c863bc12eb74788ea74888c042e1b",
  },
  "super cup": {
    kid: "f3df7843080ae743bf865dc5fdf64c68",
    key: "567c863bc12eb74788ea74888c042e1b",
  },
  "c60cda03-4928-47b2-a50d-93773f877c6e": {
    kid: "d9ac48f5131641a789328257e778ad3a",
    key: "b6e67c37239901980c6e37e0607ceee6",
  },
  "wild animals": {
    kid: "d9ac48f5131641a789328257e778ad3a",
    key: "b6e67c37239901980c6e37e0607ceee6",
  },
  "02f3a58b-b363-4526-b18d-06d8fa23b895": {
    kid: "1444f4235529f183f0a5a486befe9cdb",
    key: "e5e3fec67a1bb3472a2089c8a0a2557f",
  },
  "sports xtra": {
    kid: "1444f4235529f183f0a5a486befe9cdb",
    key: "e5e3fec67a1bb3472a2089c8a0a2557f",
  },
  "68385d7f-a436-4332-a082-a8b4cba1b3c1": {
    kid: "a7724b7ca2604c33bb2e963a0319968a",
    key: "6f97e3e2eb2bade626e0281ec01d3675",
  },
  "love nature": {
    kid: "a7724b7ca2604c33bb2e963a0319968a",
    key: "6f97e3e2eb2bade626e0281ec01d3675",
  },
  "2e77e6b7-e13d-47ca-af1c-37f83d1f6333": {
    kid: "1a5df53609ebc9857898c490f4724918",
    key: "77f62980d582ec541280796acf8b2d19",
  },
  "e-sports": {
    kid: "1a5df53609ebc9857898c490f4724918",
    key: "77f62980d582ec541280796acf8b2d19",
  },
  "48d73631-1af8-4fcf-8cb0-99dcdd9e4bfd": {
    kid: "7995c724a13748ed970840a8ab5bb9b3",
    key: "67bdaf1e2175b9ff682fcdf0e2354b1e",
  },
  "one-sports": {
    kid: "7995c724a13748ed970840a8ab5bb9b3",
    key: "67bdaf1e2175b9ff682fcdf0e2354b1e",
  },
  "827fac6e-acfd-4031-b8c4-ea54c3133904": {
    kid: "b253c726c24c7c94a3ddf9b1907e2c76",
    key: "097963d6ad73c3d712a104981de0ed42",
  },
  "starz play sports 1": {
    kid: "b253c726c24c7c94a3ddf9b1907e2c76",
    key: "097963d6ad73c3d712a104981de0ed42",
  },
  "6167e821-082f-49c6-9057-5d4fcd2f9b6b": {
    kid: "ee861edcd99093153a763a94b14c2c5a",
    key: "ab3991f6a7729ba1ea4bcdba0c1ae6c0",
  },
  "starz play sports 2": {
    kid: "ee861edcd99093153a763a94b14c2c5a",
    key: "ab3991f6a7729ba1ea4bcdba0c1ae6c0",
  },
  "3186ae6f-8098-4792-b7e5-691fc7e964c9": {
    kid: "117c29396ec6fd295880013241a466e1",
    key: "3dfb883251884e66d784111877c44b13",
  },
  "starz play sports 3": {
    kid: "117c29396ec6fd295880013241a466e1",
    key: "3dfb883251884e66d784111877c44b13",
  },
};

/**
 * Returns hardcoded ClearKey DRM keys by channel id or name
 */
export function getHardcodedClearKey(idOrName?: string | number | null): ClearKeyDrm | null {
  if (!idOrName) return null;
  const raw = String(idOrName).trim();
  if (HARDCODED_CLEARKEYS[raw]) return HARDCODED_CLEARKEYS[raw];

  const lower = raw.toLowerCase();
  if (HARDCODED_CLEARKEYS[lower]) return HARDCODED_CLEARKEYS[lower];

  // Fuzzy check for partial name matches
  for (const [key, val] of Object.entries(HARDCODED_CLEARKEYS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return val;
    }
  }

  return null;
}

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

