import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    mode === "production" && viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240, // Only compress files larger than 10kb
    }),
    mode === "production" && viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true,
        pure_funcs: mode === "production" ? ["console.log", "console.info", "console.debug"] : [],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes("node_modules")) {
            // React ecosystem
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            // Framer Motion (large animation library)
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            // Audio/Media libraries
            if (id.includes("wavesurfer") || id.includes("tone") || id.includes("audiomotion")) {
              return "vendor-audio";
            }
            // TanStack Query
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }
            // UI libraries (shadcn dependencies)
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Date utilities
            if (id.includes("date-fns")) {
              return "vendor-date";
            }
            // Supabase
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // DnD libraries
            if (id.includes("@dnd-kit") || id.includes("@hello-pangea/dnd")) {
              return "vendor-dnd";
            }
            // Form libraries
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "vendor-forms";
            }
            // Charts and visualization
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-charts";
            }
            // All other node_modules - split by size
            if (id.includes("lodash") || id.includes("immer")) {
              return "vendor-utils";
            }
            // All other node_modules
            return "vendor-other";
          }
          
          // Feature-based code splitting
          if (id.includes("/pages/StemStudio")) {
            return "page-stem-studio";
          }
          if (id.includes("/pages/AdminDashboard")) {
            return "page-admin";
          }
          if (id.includes("/pages/MusicGraph")) {
            return "page-music-graph";
          }
          if (id.includes("/components/stem-studio/")) {
            return "feature-stem-studio";
          }
          if (id.includes("/components/lyrics/")) {
            return "feature-lyrics";
          }
          if (id.includes("/components/generate-form/")) {
            return "feature-generate";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: mode === "development",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
  },
}));
