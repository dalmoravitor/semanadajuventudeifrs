import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // O Firestore só usa o re2js em pipelines com regex, que o site não usa.
      re2js: fileURLToPath(new URL("./src/data/re2js-vazio.ts", import.meta.url)),
    },
  },
  build: {
    // Source maps ficam fora do deploy: o site antigo publicava o código-fonte inteiro.
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
