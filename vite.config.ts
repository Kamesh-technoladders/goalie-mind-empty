
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (.env, .env.development, .env.production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::", // Allows all IPv6/IPv4 connections
      port: 8080, // Set port to 8080 as required
      strictPort: true,
      hmr: {
        protocol: "ws",
        timeout: 30000, // 30 seconds timeout
      },
      allowedHosts: [
        "c8ebe282-7be1-4798-8db8-bb546c17d9c3.lovableproject.com", // Add your host here
      ],
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
      // Add this for import.meta.env access in TypeScript
      "import.meta.env": JSON.stringify({
        ...env,
        // Hardcoded values for development (these would come from .env in production)
        VITE_SUPABASE_URL: "https://kbpeyfietrwlhwcwqhjw.supabase.co",
        VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImticGV5ZmlldHJ3bGh3Y3dxaGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NDA5NjEsImV4cCI6MjA1NDQxNjk2MX0.A-K4DO6D2qQZ66qIXY4BlmoHxc-W5B0itV-HAAM84YA"
      }),
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development", // Enable sourcemaps in dev mode
    },
  };
});
