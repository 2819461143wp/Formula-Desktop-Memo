import { describe, expect, it } from "vitest";
import { createMemoWindowOptions } from "../src/lib/windowOptions";
import type { Settings } from "../src/lib/types";

describe("createMemoWindowOptions", () => {
  it("does not combine transparent windows with resizing on Windows", () => {
    const options = createMemoWindowOptions(makeSettings());

    expect(options).toMatchObject({
      frame: false,
      transparent: false,
      resizable: true,
      backgroundColor: "#1f232b",
    });
  });
});

function makeSettings(): Settings {
  return {
    notesDir: "notes",
    windowMode: "desktop",
    opacity: 0.82,
    autoRotate: true,
    rotateIntervalSeconds: 60,
    rotateMode: "sequential",
    theme: "dark",
    alwaysOnTop: false,
    clickThrough: false,
    launchAtStartup: false,
    position: { x: 80, y: 80 },
    size: { width: 420, height: 260 },
  };
}
