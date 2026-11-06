import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { defaultAppearance, validateAppearance } from "./site-appearance";

describe("appearance validation", () => {
  it("accepts a configured appearance", () => {
    expect(validateAppearance(defaultAppearance)).toBeNull();
  });
  it("rejects empty title", () => {
    expect(validateAppearance({ ...defaultAppearance, title: " " })).not.toBeNull();
  });
  it("rejects an unsupported theme", () => {
    expect(validateAppearance({ ...defaultAppearance, theme: "invalid" })).not.toBeNull();
  });
});