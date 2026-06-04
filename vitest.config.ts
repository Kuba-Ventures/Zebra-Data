import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Test runner for the supervised-factory safety net. Covers the pure/presentational
// low-risk surfaces only; anything touching Supabase, the DB, auth, crypto, or PII stays
// human-gated and out of scope.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" -> "./*" alias from tsconfig.json natively.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
  },
});
