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
  optimizeDeps: {
    include: ["react/jsx-runtime", "react/jsx-dev-runtime"],
    esbuildOptions: {
      define: {
        "process.env.NODE_ENV": '"development"',
      },
    },
  },
  build: {
    outDir: "dist/spa",
  },
  test: {
    setupFiles: ["./tests/setup.ts"],
  },
  plugins: [react({ jsxRuntime: "automatic" }), expressPlugin()],
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
    async configureServer(server) {
      // Get the Express app
      const app = await createServer();
      console.log("✓ Express server initialized and integrated with Vite");

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
