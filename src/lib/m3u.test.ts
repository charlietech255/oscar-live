import { describe, it, expect } from "vitest";
import { parseM3U, guessCategory } from "./m3u";

describe("parseM3U", () => {
  it("reads name, logo, group and link", () => {
    const r = parseM3U(`#EXTM3U\n#EXTINF:-1 tvg-logo="http://l.png" group-title="Sports",Azam Sports\nhttp://x/a.m3u8\n#EXTINF:-1,News 1\nhttps://y/b.m3u8`);
    expect(r).toEqual([
      { name: "Azam Sports", logo_url: "http://l.png", group: "Sports", stream_url: "http://x/a.m3u8" },
      { name: "News 1", logo_url: null, group: null, stream_url: "https://y/b.m3u8" },
    ]);
  });
  it("maps sports group to Michezo", () => expect(guessCategory("Sports HD")).toBe("Michezo"));
});
