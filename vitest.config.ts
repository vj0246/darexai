import { defineConfig } from "vitest/config";
import { resolve } from "path";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: { environment: "node" },
});
