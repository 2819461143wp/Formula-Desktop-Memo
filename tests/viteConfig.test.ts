import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("vite production asset paths", () => {
  it("uses relative asset URLs so Electron can load packaged files from file://", () => {
    const config = fs.readFileSync(path.join(process.cwd(), "vite.config.ts"), "utf8");

    expect(config).toMatch(/base:\s*["']\.\/["']/);
  });
});
