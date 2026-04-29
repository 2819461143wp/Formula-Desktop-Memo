import { describe, expect, it } from "vitest";
import { ensureWindowBoundsVisible } from "../src/lib/windowBounds";

describe("ensureWindowBoundsVisible", () => {
  const workArea = { x: 0, y: 0, width: 1024, height: 768 };

  it("moves a window back inside the display when saved x is offscreen", () => {
    const bounds = ensureWindowBoundsVisible(
      { x: 1200, y: 80, width: 420, height: 260 },
      [workArea],
    );

    expect(bounds).toEqual({ x: 572, y: 80, width: 420, height: 260 });
  });

  it("keeps a valid saved position unchanged", () => {
    const bounds = ensureWindowBoundsVisible(
      { x: 60, y: 80, width: 420, height: 260 },
      [workArea],
    );

    expect(bounds).toEqual({ x: 60, y: 80, width: 420, height: 260 });
  });
});
