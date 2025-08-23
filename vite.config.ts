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
  let expressApp: any = null;

  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Initialize Express app
      createServer().then((app) => {
        expressApp = app;
        console.log('✓ Express server initialized and integrated with Vite');
      }).catch((error) => {
        console.error('Failed to create Express server:', error);
      });

      // Add middleware that waits for Express app to be ready
      server.middlewares.use('/api', (req, res, next) => {
        if (expressApp) {
          expressApp(req, res, next);
        } else {
          res.status(503).json({ error: 'Server starting up, please try again' });
        }
      });
    },
  };
}
