import { describe, expect, it } from "vitest";
import { canViewServices } from "./install-access";

describe("introduction service access", () => {
  it("does not show services to an unregistered browser visitor", () => {
    expect(canViewServices(false)).toBe(false);
  });
  it("does not show services in the installed app before registration", () => {
    expect(canViewServices(true, false)).toBe(false);
  });
  it("opens channels for a signed-in customer", () => {
    expect(canViewServices(false, true)).toBe(true);
    expect(canViewServices(true, true)).toBe(true);
  });
});
