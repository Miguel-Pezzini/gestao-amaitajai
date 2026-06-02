import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/integration/**/*.test.ts",
      "tests/unit/**/*.test.ts",
    ],
    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    globals: true,
    // Integração compartilha um Postgres; arquivos em paralelo causam reset concorrente.
    fileParallelism: false,
    maxWorkers: 1,
  },
});
