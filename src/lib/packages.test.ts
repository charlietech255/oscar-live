import { describe, it, expect } from "vitest";
import { PAY_NUMBER, toLoginEmail, hasAccess } from "./packages";

describe("vifurushi", () => {
  it("namba ya malipo", () => expect(PAY_NUMBER).toBe("0769564254"));
  it("simu na 255 inalingana na 0", () => expect(toLoginEmail("+255 769 564 254")).toBe(toLoginEmail("0769564254")));
  it("muda wa majaribio ukiisha hakuna ruhusa", () => {
    const now = new Date("2026-01-02");
    expect(hasAccess({ trial_ends_at: "2026-01-01", subscription_ends_at: null }, now)).toBe(false);
    expect(hasAccess({ trial_ends_at: "2026-01-01", subscription_ends_at: "2026-01-05" }, now)).toBe(true);
  });
});
