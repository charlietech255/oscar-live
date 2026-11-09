import { describe, expect, it } from "vitest";
import { emptySettings, readSettings, sectionVisible, translateWord } from "./app-settings";
describe("owner content controls", () => {
  it("lets the admin replace any wording", () => expect(translateWord({ ...emptySettings, words: { "Vifurushi": "Huduma zangu" } }, "Vifurushi")).toBe("Huduma zangu"));
  it("clears wording without resurrecting the default", () => expect(translateWord({ ...emptySettings, words: { "KASIGARA TV": "" } }, "KASIGARA TV")).toBe(""));
  it("keeps the viewing screen free of scoreboards by default", () => expect(sectionVisible(emptySettings, "scoreboard")).toBe(false));
  it("keeps match statistics hidden by default", () => expect(sectionVisible(emptySettings, "matchStats")).toBe(false));
  it("keeps LIVE badges hidden by default", () => expect(sectionVisible(emptySettings, "liveBadges")).toBe(false));
  it("accepts explicit section removal", () => expect(sectionVisible({ ...emptySettings, sections: { comments: false } }, "comments")).toBe(false));
  it("preserves a deliberately empty slideshow", () => expect(readSettings({ slides: [] }).slides).toEqual([]));
  it("preserves removal of all data offers", () => expect(readSettings({ dataOffers: [] }).dataOffers).toEqual([]));
});