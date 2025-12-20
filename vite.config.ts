import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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
      // Parse HTML and extract modulepreload links
      const modulePreloadRegex = /<link\s+rel="modulepreload"\s+crossorigin\s+href="[^"]+"\s*\/?>/g;
      const matches = html.match(modulePreloadRegex) || [];
      
      if (matches.length === 0) return html;

      // Separate React preload from others
      const reactPreload = matches.filter(link => link.includes('vendor-react'));
      const otherPreloads = matches.filter(link => !link.includes('vendor-react'));

      // Remove all modulepreload links from HTML (with surrounding whitespace)
      let modifiedHtml = html;
      matches.forEach(link => {
        modifiedHtml = modifiedHtml.replace(new RegExp(`\\s*${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'), '\n');
      });

      // Clean up multiple consecutive newlines
      modifiedHtml = modifiedHtml.replace(/\n{3,}/g, '\n');

      // Insert React preload first, then others, right before </head>
      const allPreloads = [...reactPreload, ...otherPreloads].join('\n  ');
      modifiedHtml = modifiedHtml.replace('</head>', `  ${allPreloads}\n</head>`);

      return modifiedHtml;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && reactPriorityPlugin(),
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
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true,
        pure_funcs: mode === "production" ? ["console.log", "console.info", "console.debug"] : [],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      treeshake: {
        // Use 'no-external' instead of false to prevent breaking module initialization
        moduleSideEffects: 'no-external',
        preset: "recommended",
      },
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes("node_modules")) {
            // CRITICAL: React MUST be checked first and kept separate
            // This ensures React loads before any libraries that depend on it
            if (id.includes("/react/") || id.includes("/react-dom/") || 
                id.includes("/react-is/") || id.includes("/scheduler/")) {
              return "vendor-react";
            }
            // React Router - depends on React
            if (id.includes("react-router")) {
              return "vendor-react";
            }
            // State management libraries that use React hooks during initialization
            // MUST be in vendor-react to prevent "Cannot read properties of undefined" errors
            // use-sync-external-store is a React 18 shim that MUST be with React
            if (id.includes("react-redux") || id.includes("zustand") || 
                id.includes("use-sync-external-store")) {
              return "vendor-react";
            }
            // Framer Motion (large animation library)
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            // Audio/Media libraries - keep Tone.js with other audio libs to prevent circular dep errors
            // "Cannot access 't' before initialization" occurs when Tone.js is in separate async chunk
            if (id.includes("wavesurfer") || id.includes("audiomotion") || id.includes("tone")) {
              return "vendor-audio";
            }
            // TanStack Query - MUST include both react-query AND query-core
            // query-core utilities must be with react-query to prevent circular dependencies
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) {
              return "vendor-query";
            }
            // UI libraries (shadcn dependencies) - all Radix UI components depend on React
            // CRITICAL: Include react-remove-scroll and related libraries that use hooks at module level
            if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul") || 
                id.includes("sonner") || id.includes("next-themes") ||
                id.includes("react-remove-scroll") || id.includes("use-callback-ref") || 
                id.includes("use-sidecar") || id.includes("detect-node-es")) {
              return "vendor-radix";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Date utilities - import only needed functions
            if (id.includes("date-fns")) {
              // Split date-fns by locale vs core
              if (id.includes("date-fns/locale")) {
                return "vendor-date-locale";
              }
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
            // Other React-dependent libraries
            if (id.includes("react-virtuoso") || id.includes("embla-carousel-react") || 
                id.includes("react-day-picker") || id.includes("react-resizable-panels")) {
              return "vendor-react-ui";
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
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
    ],
    // Exclude audio libraries from pre-bundling to allow lazy loading
    // This prevents "Cannot access 't' before initialization" errors
    exclude: [
      "tone",
      "wavesurfer.js",
    ],
  },
}));
