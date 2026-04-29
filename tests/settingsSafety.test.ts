import { describe, expect, it } from "vitest";
import { CLICK_THROUGH_MODE } from "../src/lib/settingsSafety";

describe("interactive settings safety", () => {
  it("limits click-through behavior to the memo content region", () => {
    expect(CLICK_THROUGH_MODE).toBe("content-only");
  });
});
