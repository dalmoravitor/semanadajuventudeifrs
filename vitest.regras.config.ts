import { defineConfig } from "vitest/config";

// Testes das regras do Firestore: rodam em Node, dentro do Emulator (npm run test:regras).
export default defineConfig({
  test: {
    include: ["tests/regras.test.ts"],
    environment: "node",
    testTimeout: 15000,
  },
});
