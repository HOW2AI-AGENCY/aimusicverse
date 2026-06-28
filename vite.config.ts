import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import type { Plugin } from "vite";

/**
 * Custom plugin to ensure React vendor chunk loads before other chunks
 * This prevents "Cannot read properties of undefined (reading 'createContext')" errors
 * that occur when libraries in vendor-other try to use React before it's loaded.
 */
function reactPriorityPlugin(): Plugin {
  return {
    name: "react-priority-plugin",
    enforce: "post",
    transformIndexHtml(html) {
      const modulePreloadRegex = /<link\s+rel="modulepreload"\s+crossorigin\s+href="[^"]+"\s*\/?>/g;
      const matches = html.match(modulePreloadRegex) || [];
      if (matches.length === 0) return html;
      const reactPreload = matches.filter((link) => link.includes("vendor-react"));
      const otherPreloads = matches.filter((link) => !link.includes("vendor-react"));
      let modifiedHtml = html;
      matches.forEach((link) => {
        modifiedHtml = modifiedHtml.replace(
          new RegExp(`\\s*${link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "g"),
          "\n",
        );
      });
      modifiedHtml = modifiedHtml.replace(/\n{3,}/g, "\n");
      const allPreloads = [...reactPreload, ...otherPreloads].join("\n  ");
      modifiedHtml = modifiedHtml.replace("</head>", `  ${allPreloads}\n</head>`);
      return modifiedHtml;
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && reactPriorityPlugin(),
    mode === "production" &&
      visualizer({
        filename: "./dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    mode === "production" &&
      viteCompression({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 10240,
      }),
    mode === "production" &&
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        threshold: 10240,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true,
        pure_funcs: mode === "production" ? ["console.log", "console.info", "console.debug", "console.trace"] : [],
        passes: 3,
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        arguments: true,
        booleans_as_integers: false,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        directives: true,
        evaluate: true,
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: false,
        if_return: true,
        join_vars: true,
        keep_fargs: false,
        keep_infinity: false,
        loops: true,
        negate_iife: true,
        properties: true,
        reduce_funcs: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        typeofs: true,
        unused: true,
      },
      mangle: {
        safari10: true,
        toplevel: false,
        properties: false,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: "no-external",
        preset: "recommended",
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // React MUST be first for proper loading order
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-is/") ||
              id.includes("/scheduler/")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("react-router") ||
              id.includes("zustand") ||
              id.includes("use-sync-external-store") ||
              id.includes("react-redux")
            ) {
              return "vendor-react";
            }
            // opensheetmusicdisplay - ENORMOUS (1.2MB), always lazy loaded
            if (id.includes("opensheetmusicdisplay")) {
              return "vendor-osmd";
            }
            // Framer Motion
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            // Audio/Media
            if (id.includes("tone")) {
              return "vendor-tone";
            }
            if (id.includes("wavesurfer")) {
              return "vendor-wavesurfer";
            }
            if (id.includes("audiomotion")) {
              return "vendor-audiomotion";
            }
            // TanStack Query
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) {
              return "vendor-query";
            }
            // Radix UI + ecosystem
            if (
              id.includes("@radix-ui") ||
              id.includes("cmdk") ||
              id.includes("vaul") ||
              id.includes("sonner") ||
              id.includes("next-themes") ||
              id.includes("react-remove-scroll") ||
              id.includes("use-callback-ref") ||
              id.includes("use-sidecar") ||
              id.includes("detect-node-es")
            ) {
              return "vendor-radix";
            }
            // Icons
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Date
            if (id.includes("dayjs")) {
              return "vendor-date";
            }
            // Supabase
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // DnD
            if (id.includes("@dnd-kit") || id.includes("@hello-pangea/dnd")) {
              return "vendor-dnd";
            }
            // Forms
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "vendor-forms";
            }
            // React UI (must be in same chunk to avoid circular deps)
            if (
              id.includes("react-virtuoso") ||
              id.includes("embla-carousel-react") ||
              id.includes("react-day-picker") ||
              id.includes("react-resizable-panels")
            ) {
              return "vendor-react-ui";
            }
            // Charts - always lazy, keep together
            if (id.includes("recharts") || id.includes("d3") || id.includes("victory")) {
              return "vendor-charts";
            }
            // Other utilities
            if (id.includes("lodash") || id.includes("immer")) {
              return "vendor-utils";
            }
            // Everything else - but Sentry + large libs go to vendor-other
            if (
              id.includes("@sentry") ||
              id.includes("canvas-confetti") ||
              id.includes("qrcode") ||
              id.includes("dompurify") ||
              id.includes("use-debounce") ||
              id.includes("@use-gesture") ||
              id.includes("class-variance-authority") ||
              id.includes("tailwind-merge") ||
              id.includes("clsx") ||
              id.includes("input-otp") ||
              id.includes("lovable-tagger") ||
              id.includes("@tonejs") ||
              id.includes("fast-check") ||
              id.includes("jszip") ||
              id.includes("lamejs") ||
              id.includes("web-audio-beat-detector")
            ) {
              return "vendor-other";
            }
            // Catch-all for any missed node_modules
            return "vendor-other";
          }

          // Feature-based code splitting - avoid circular dependencies
          // by ensuring shared imports stay in same chunk

          // Pages
          if (id.includes("/pages/StemStudio")) return "page-stem-studio";
          if (id.includes("/pages/AdminDashboard")) return "page-admin";
          if (id.includes("/pages/MusicGraph")) return "page-music-graph";
          if (id.includes("/pages/Studio") && !id.includes("/pages/StudioHub")) return "page-studio";
          if (id.includes("/pages/StudioHub")) return "page-studio-hub";
          if (id.includes("/pages/LyricsStudio") || id.includes("/pages/LyricsWorkspace")) return "page-lyrics-studio";
          // Note: /pages/Projects is intentionally NOT chunked here.
          // Manual chunking caused a TDZ crash ("Cannot access 'p' before init")
          // due to circular deps via content-hub components.
          // Feature components - grouped to avoid circular deps
          if (id.includes("/components/stem-studio/") || id.includes("/components/audio-reference/")) {
            return "feature-stem-studio";
          }
          if (id.includes("/components/lyrics/") || id.includes("/components/lyrics-workspace/")) {
            return "feature-lyrics-wizard";
          }
          if (id.includes("/components/generate-form/")) {
            return "feature-generation-form";
          }
          // Studio - merged to avoid circular deps
          if (
            id.includes("/components/studio/mixer/") ||
            id.includes("/components/studio/editor/") ||
            id.includes("/components/studio/timeline/")
          ) {
            return "feature-studio";
          }
          if (id.includes("/components/studio/unified/")) {
            return "feature-studio-unified";
          }
          if (id.includes("/components/studio/")) {
            return "feature-studio";
          }
          // Note: /components/analytics/ is intentionally NOT chunked here.
          // Manual chunking caused a TDZ crash ("Cannot access 'w' before init")
          // due to circular deps via the @/hooks/analytics barrel.

          // Stores
          if (id.includes("/stores/studio/")) {
            return "store-studio";
          }
          // Default: let vite decide the chunk
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
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
    ],
  },
}));
