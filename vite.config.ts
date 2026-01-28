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
        pure_funcs: mode === "production" ? ["console.log", "console.info", "console.debug", "console.trace"] : [],
        passes: 3, // Increased from 2 to 3 for better compression
        unsafe: false, // Keep safe for production
        unsafe_comps: false,
        unsafe_math: false,
        // Additional aggressive optimizations
        arguments: true,
        booleans_as_integers: false, // Keep false for compatibility
        computed_props: true,
        conditionals: true,
        dead_code: true,
        directives: true,
        evaluate: true,
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: false, // Keep false to avoid var hoisting issues
        if_return: true,
        join_vars: true,
        keep_fargs: false, // Remove unused function arguments
        keep_infinity: false, // Convert Infinity to 1/0
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
        toplevel: false, // Don't mangle top-level names
        properties: false, // Don't mangle properties (can break things)
      },
      format: {
        comments: false, // Remove all comments
        ecma: 2020,
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
            // Audio/Media libraries
            // IMPORTANT: keep these in SEPARATE chunks to avoid circular init/TDZ errors.
            if (id.includes("tone")) {
              return "vendor-tone";
            }
            if (id.includes("wavesurfer")) {
              return "vendor-wavesurfer";
            }
            if (id.includes("audiomotion")) {
              return "vendor-audiomotion";
            }
            // Sheet music display - very heavy, always lazy loaded
            if (id.includes("opensheetmusicdisplay")) {
              return "vendor-osmd";
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
            // Icons - separate chunk for tree-shaking optimization
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Date utilities - dayjs is much smaller than date-fns
            if (id.includes("dayjs")) {
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
          // Pages - separate chunks for each major page
          if (id.includes("/pages/StemStudio")) {
            return "page-stem-studio";
          }
          if (id.includes("/pages/AdminDashboard")) {
            return "page-admin";
          }
          if (id.includes("/pages/MusicGraph")) {
            return "page-music-graph";
          }
          if (id.includes("/pages/Studio")) {
            return "page-studio";
          }
          if (id.includes("/pages/LyricsStudio") || id.includes("/pages/LyricsWorkspace")) {
            return "page-lyrics-studio";
          }
          if (id.includes("/pages/Projects")) {
            return "page-projects";
          }
          if (id.includes("/pages/Analytics")) {
            return "page-analytics";
          }
          
          // Feature components - split heavy feature sets
          if (id.includes("/components/stem-studio/") || id.includes("/components/audio-reference/")) {
            return "feature-stem-studio";
          }
          if (id.includes("/components/lyrics/") || id.includes("/components/lyrics-workspace/")) {
            return "feature-lyrics-wizard";
          }
          if (id.includes("/components/generate-form/")) {
            return "feature-generation-form";
          }
          // Studio components - split more granularly
          if (id.includes("/components/studio/unified/")) {
            return "feature-studio-unified";
          }
          if (id.includes("/components/studio/timeline/")) {
            return "feature-studio-timeline";
          }
          if (id.includes("/components/studio/editor/")) {
            return "feature-studio-editor";
          }
          if (id.includes("/components/studio/mixer/")) {
            return "feature-studio-mixer";
          }
          if (id.includes("/components/studio/")) {
            return "feature-studio";
          }
          if (id.includes("/components/analytics/")) {
            return "feature-analytics";
          }
          // Split studio stores
          if (id.includes("/stores/studio/")) {
            return "store-studio";
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
    // Note: Audio libraries (tone, wavesurfer.js) are NOT excluded.
    // They must be pre-bundled together to avoid TDZ errors.
    // The manualChunks above separates them into different chunks for production.
  },
}));
