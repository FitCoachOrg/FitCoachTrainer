import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'import.meta.env.VITE_YOUTUBE_API_KEY': JSON.stringify(env.VITE_YOUTUBE_API_KEY),
      'import.meta.env.VITE_YOUTUBE_API_KEY2': JSON.stringify(env.VITE_YOUTUBE_API_KEY2),
      'import.meta.env.VITE_YOUTUBE_API_KEY3': JSON.stringify(env.VITE_YOUTUBE_API_KEY3),
      'import.meta.env.VITE_YOUTUBE_API_KEY4': JSON.stringify(env.VITE_YOUTUBE_API_KEY4),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  plugins: [
    react(),
  ],
  server: {
    port: 8080,
    strictPort: true,
    proxy: {
      // Proxy any request beginning with /ollama to the local Ollama server
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
    },
  },
  clearScreen: false,
  envPrefix: ['VITE_'],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: 'esbuild',
    sourcemap: true,
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  };
});
