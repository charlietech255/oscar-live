import { describe, expect, it } from "vitest";
import { TRIAL_MINUTES, trialSeconds, validateBonusMinutes, validateCorrection } from "./customer-controls";
import { hasAccess } from "./packages";
describe("customer rules", () => {
  it("offers exactly twelve minutes", () => { expect(TRIAL_MINUTES).toBe(12); expect(trialSeconds("2026-11-07T04:12:00Z", Date.parse("2026-11-07T04:00:00Z"))).toBe(720); });
  it("locks at the expiry instant", () => { const p = { trial_ends_at: "2026-11-07T04:12:00Z", subscription_ends_at: null }; expect(hasAccess(p, new Date("2026-11-07T04:11:59Z"))).toBe(true); expect(hasAccess(p, new Date(p.trial_ends_at))).toBe(false); });
  it("suspension overrides an active subscription", () => expect(hasAccess({trial_ends_at:"2099-01-01",subscription_ends_at:"2099-01-01",is_suspended:true})).toBe(false));
  it("correction must match paid package price", () => { expect(validateCorrection(500,2500,"Wrong package")).not.toBeNull(); expect(validateCorrection(2500,2500,"Wrong package")).toBeNull(); });
  it("allows a five-minute customer offer", () => expect(validateBonusMinutes(5)).toBeNull());
  it("rejects zero or fractional bonus minutes", () => { expect(validateBonusMinutes(0)).not.toBeNull(); expect(validateBonusMinutes(5.5)).not.toBeNull(); });
});