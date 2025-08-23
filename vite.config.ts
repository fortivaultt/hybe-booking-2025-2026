import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Handle async createServer properly and add middleware earlier in the chain
      createServer().then((app) => {
        // Use return from configureServer to add pre middleware
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api')) {
            app(req, res, next);
          } else {
            next();
          }
        });
      }).catch((error) => {
        console.error('Failed to create Express server:', error);
      });
    },
  };
}
