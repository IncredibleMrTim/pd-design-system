import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/components/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "es2022",
  outDir: "dist",
  // Every component is a client component, and esbuild drops the per-file
  // directives when it bundles, so the whole bundle is marked instead.
  banner: { js: '"use client";' },
  // The @/ alias used by shadcn files is resolved from tsconfig and bundled in.
  // Peer dependencies stay external so the using app owns them.
});
