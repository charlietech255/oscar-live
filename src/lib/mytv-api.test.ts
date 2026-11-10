import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeHex,
  extractClearKey,
  detectStreamType,
  fetchLiveCatalog,
  fetchStreamDetails,
  MYTV_DEFAULT_API_KEY,
  MYTV_DEFAULT_API_BASE,
  type MyTvStreamResponse,
} from "./mytv-api";

describe("myTV Streaming API & Player Utilities", () => {
  describe("normalizeHex", () => {
    it("should remove hyphens and lowercase hex characters", () => {
      const uuid = "4D979FB3-6E8B-4E44-9375-11F89F005703";
      expect(normalizeHex(uuid)).toBe("4d979fb36e8b4e44937511f89f005703");
    });

    it("should preserve 32-character lowercase hex", () => {
      const hex = "d419b4561fe405523a6f3b069d587c6e";
      expect(normalizeHex(hex)).toBe(hex);
    });

    it("should return undefined for falsy input", () => {
      expect(normalizeHex(null)).toBeUndefined();
      expect(normalizeHex(undefined)).toBeUndefined();
    });
  });

  describe("extractClearKey", () => {
    it("should extract kid & key from drm.clearKey structure", () => {
      const data: MyTvStreamResponse = {
        drm: {
          clearKey: {
            kid: "4d979fb3-6e8b-4e44-9375-11f89f005703",
            key: "d419b456-1fe4-0552-3a6f-3b069d587c6e",
          },
        },
      };
      const result = extractClearKey(data);
      expect(result).not.toBeNull();
      expect(result?.kid).toBe("4d979fb36e8b4e44937511f89f005703");
      expect(result?.key).toBe("d419b4561fe405523a6f3b069d587c6e");
    });

    it("should extract kid & key from top-level response properties", () => {
      const data: MyTvStreamResponse = {
        kid: "4d979fb36e8b4e44937511f89f005703",
        key: "d419b4561fe405523a6f3b069d587c6e",
      };
      const result = extractClearKey(data);
      expect(result?.kid).toBe("4d979fb36e8b4e44937511f89f005703");
      expect(result?.key).toBe("d419b4561fe405523a6f3b069d587c6e");
    });

    it("should return null when keys are missing", () => {
      expect(extractClearKey({})).toBeNull();
    });
  });

  describe("detectStreamType", () => {
    it("should identify MPEG-DASH from explicit type or .mpd extension", () => {
      expect(detectStreamType("https://example.com/live/manifest.mpd")).toBe("dash");
      expect(detectStreamType("https://example.com/stream?token=abc.mpd?sig=123")).toBe("dash");
      expect(detectStreamType("https://example.com/stream", "dash")).toBe("dash");
      expect(detectStreamType("https://example.com/stream", "DASH")).toBe("dash");
    });

    it("should identify HLS from explicit type or .m3u8 extension", () => {
      expect(detectStreamType("https://example.com/live/playlist.m3u8")).toBe("hls");
      expect(detectStreamType("https://example.com/stream?token=x.m3u8&auth=1")).toBe("hls");
      expect(detectStreamType("https://example.com/stream", "hls")).toBe("hls");
      expect(detectStreamType("https://example.com/stream", "HLS")).toBe("hls");
    });

    it("should fallback to direct or hls for unspecified urls", () => {
      expect(detectStreamType("https://example.com/video.mp4")).toBe("direct");
      expect(detectStreamType(null)).toBe("hls");
    });
  });

  describe("fetchLiveCatalog (Requirement 1: GET /channels.php with X-API-Key)", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("should send GET /channels.php with X-API-Key header and parse channels", async () => {
      const mockChannels = [
        { id: "101", name: "SuperSport Live", category: "Michezo", stream_type: "dash" },
        { id: "102", name: "Premier Live", category: "Ligi Kuu", stream_type: "hls" },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockChannels),
      });

      const result = await fetchLiveCatalog("test_api_key", "https://clver.store/api/dev");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://clver.store/api/dev/channels.php",
        expect.objectContaining({
          method: "GET",
          headers: {
            "X-API-Key": "test_api_key",
            Accept: "application/json",
          },
        })
      );

      expect(result.channels).toHaveLength(2);
      expect(result.channels[0].name).toBe("SuperSport Live");
      expect(result.isDemoFallback).toBe(false);
    });

    it("should gracefully handle API error and provide demo fallback catalog", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () =>
          JSON.stringify({
            ok: false,
            error: "invalid_key",
            message: "API Key uliyoweka si sahihi au imesimamishwa.",
          }),
      });

      const result = await fetchLiveCatalog(MYTV_DEFAULT_API_KEY, MYTV_DEFAULT_API_BASE);

      expect(result.isDemoFallback).toBe(true);
      expect(result.error).toContain("API Key uliyoweka si sahihi");
      expect(result.channels.length).toBeGreaterThan(0);
    });
  });

  describe("fetchStreamDetails (Requirement 2: GET /stream.php?id={id} with X-API-Key)", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("should request GET /stream.php?id={id} with X-API-Key header", async () => {
      const mockStream = {
        ok: true,
        id: "201",
        url: "https://example.com/stream.mpd",
        type: "dash",
        kid: "4d979fb36e8b4e44937511f89f005703",
        key: "d419b4561fe405523a6f3b069d587c6e",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockStream),
      });

      const result = await fetchStreamDetails("201", "test_key", "https://clver.store/api/dev");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://clver.store/api/dev/stream.php?id=201",
        expect.objectContaining({
          method: "GET",
          headers: {
            "X-API-Key": "test_key",
            Accept: "application/json",
          },
        })
      );

      expect(result.url).toBe("https://example.com/stream.mpd");
      expect(result.type).toBe("dash");
      expect(result.kid).toBe("4d979fb36e8b4e44937511f89f005703");
      expect(result.key).toBe("d419b4561fe405523a6f3b069d587c6e");
    });

    it("should return verified demo stream for demo fallback channel IDs without network", async () => {
      const result = await fetchStreamDetails("demo-dash-clearkey");
      expect(result.type).toBe("dash");
      expect(result.kid).toBe("4d979fb36e8b4e44937511f89f005703");
      expect(result.key).toBe("d419b4561fe405523a6f3b069d587c6e");
      expect(result.url).toContain(".mpd");
    });
  });
});

