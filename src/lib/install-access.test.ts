import { describe, expect, it } from "vitest";
import { canViewServices } from "./install-access";

describe("install-first service access", () => {
  it("does not show services in a regular browser", () => {
    expect(canViewServices(false)).toBe(false);
  });
  it("shows services when launched as a home-screen app", () => {
    expect(canViewServices(true)).toBe(true);
  });
});