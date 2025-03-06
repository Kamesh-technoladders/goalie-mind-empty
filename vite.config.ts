export default defineConfig(({ mode }) => {
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
      allowedHosts: [
        "c8ebe282-7be1-4798-8db8-bb546c17d9c3.lovableproject.com" // Add your blocked host here
      ],
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env": JSON.stringify(env),
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
    },
  };
});
