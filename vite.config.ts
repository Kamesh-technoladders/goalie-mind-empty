import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (.env, .env.development, .env.production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::", // Allows all IPv6/IPv4 connections
      port: 8080,
      strictPort: true,
      hmr: {
        protocol: "ws",
        timeout: 30000, // 30 seconds timeout
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // Shortens import paths
      },
    },
    define: {
      // Ensure Vite uses environment variables in client-side code
      "process.env": env,
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development", // Enable sourcemaps in dev mode
    },
  };
});
