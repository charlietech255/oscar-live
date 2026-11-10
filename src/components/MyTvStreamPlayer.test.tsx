import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MyTvStreamPlayer } from "./MyTvStreamPlayer";

// Mock Shaka Player
const mockPlayerInstance = {
  attach: vi.fn().mockResolvedValue(undefined),
  configure: vi.fn(),
  load: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn().mockResolvedValue(undefined),
  addEventListener: vi.fn(),
};

function MockShakaPlayer(this: any) {
  Object.assign(this, mockPlayerInstance);
}
(MockShakaPlayer as any).isBrowserSupported = vi.fn().mockReturnValue(true);

const mockShaka = {
  Player: MockShakaPlayer,
  polyfill: {
    installAll: vi.fn(),
  },
};

// Mock loader
vi.mock("@/lib/shaka-loader", () => ({
  loadShakaPlayer: vi.fn().mockImplementation(async () => mockShaka),
}));

// Mock Hls.js
const mockHlsInstance = {
  loadSource: vi.fn(),
  attachMedia: vi.fn(),
  on: vi.fn(),
  destroy: vi.fn(),
};

function MockHlsConstructor(this: any, config: any) {
  this.config = config;
  Object.assign(this, mockHlsInstance);
}
(MockHlsConstructor as any).isSupported = vi.fn().mockReturnValue(true);
(MockHlsConstructor as any).Events = {
  MANIFEST_PARSED: "hlsManifestParsed",
  ERROR: "hlsError",
};
(MockHlsConstructor as any).ErrorTypes = {
  NETWORK_ERROR: "networkError",
  MEDIA_ERROR: "mediaError",
};

vi.mock("hls.js", () => ({
  default: MockHlsConstructor,
}));

describe("MyTvStreamPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Requirement 3 & 5: Configures Shaka Player with ClearKey DRM and 20s buffering goal for DASH", async () => {
    render(
      <MyTvStreamPlayer
        src="https://example.com/manifest.mpd"
        streamType="dash"
        kid="4d979fb36e8b4e44937511f89f005703"
        clearKey="d419b4561fe405523a6f3b069d587c6e"
      />
    );

    await waitFor(() => {
      expect(mockPlayerInstance.attach).toHaveBeenCalled();
      expect(mockPlayerInstance.configure).toHaveBeenCalled();
      expect(mockPlayerInstance.load).toHaveBeenCalledWith("https://example.com/manifest.mpd");
    });

    const configCall = mockPlayerInstance.configure.mock.calls[0][0];

    // Requirement 5: Buffering goal 20s
    expect(configCall.streaming.bufferingGoal).toBe(20);

    // Requirement 3: W3C ClearKey DRM
    expect(configCall.drm.clearKeys).toBeDefined();
    expect(configCall.drm.clearKeys["4d979fb36e8b4e44937511f89f005703"]).toBe(
      "d419b4561fe405523a6f3b069d587c6e"
    );
  });

  it("Requirement 4 & 5: Plays HLS streams using Hls.js with 20s buffering goal", async () => {
    render(
      <MyTvStreamPlayer
        src="https://example.com/stream.m3u8"
        streamType="hls"
      />
    );

    await waitFor(() => {
      expect(mockHlsInstance.loadSource).toHaveBeenCalledWith("https://example.com/stream.m3u8");
      expect(mockHlsInstance.attachMedia).toHaveBeenCalled();
    });
  });
});
