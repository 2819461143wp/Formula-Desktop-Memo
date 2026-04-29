import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["electron/main.ts", "electron/preload.ts"],
  format: ["cjs"],
  outDir: "dist-electron",
  clean: true,
  sourcemap: false,
  splitting: false,
  external: ["electron"],
  outExtension: () => ({
    js: ".cjs",
  }),
});
