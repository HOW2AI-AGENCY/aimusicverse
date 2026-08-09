import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";

// @lovable.dev/mcp-js resolves to Lovable's private registry
// (europe-west1-npm.pkg.dev) and is only installable inside the Lovable build
// pipeline — a static import breaks `vite build` everywhere else (CI, local).
let mcpPlugin: (() => Plugin) | undefined;
let visualizer: ((opts: Record<string, unknown>) => Plugin) | undefined;
let viteCompression: ((opts: Record<string, unknown>) => Plugin) | undefined;
let hasTerser = false;

try {
  // @ts-ignore — types only exist inside the Lovable pipeline
  mcpPlugin = (await import("@lovable.dev/mcp-js/stacks/supabase/vite")).mcpPlugin;
} catch {
  /* optional dependency, Lovable sandbox only */
}
try {
  const mod = (await import("rollup-plugin-visualizer")) as {
    visualizer: (opts: Record<string, unknown>) => Plugin;
  };
  visualizer = mod.visualizer;
} catch {
  /* optional dependency */
}

try {
  viteCompression = (await import("vite-plugin-compression")).default;
} catch {
  /* optional dependency */
}
try {
  await import("terser");
  hasTerser = true;
} catch {
  /* falls back to esbuild */
}
try {
  // @ts-ignore — @lovable.dev/mcp-js is an optional plugin auto-generated inside the Lovable build pipeline.
  mcpPlugin = (await import("@lovable.dev/mcp-js/stacks/supabase/vite")).mcpPlugin;
} catch {
  /* optional Lovable dev dependency */
}

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
    mcpPlugin?.(),
    mode === "development" && componentTagger(),
    mode === "production" && reactPriorityPlugin(),
    mode === "production" &&
      process.env.ANALYZE === "1" &&
      visualizer?.({
        filename: "./dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    mode === "production" &&
      viteCompression?.({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 10240,
      }),
    mode === "production" &&
      viteCompression?.({
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
    // A handful of large vendor/feature chunks (admin+studio+lyrics, charts,
    // forms, confetti) end up as hard dependencies of the main entry chunk —
    // Rollup's manualChunks-driven shared-chunk splitting pulls them in for
    // small shared helpers even though most pages never execute admin/studio/
    // chart code. Excluding them here doesn't change chunk boundaries or
    // execution order (unlike manualChunks, which has a documented TDZ-crash
    // history below) — it only stops the browser from treating them as
    // equally high-priority to fetch as the chunks every page actually needs
    // (vendor-react, vendor-supabase, etc.), so those get network priority.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !/feature-studio|vendor-charts|vendor-dnd|vendor-forms|vendor-confetti/.test(dep)),
    },
    target: "esnext",
    minify: hasTerser ? "terser" : "esbuild",
    terserOptions: hasTerser
      ? {
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
        }
      : undefined,
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
            // Audio/Media — tone + @tonejs/* MUST live in the SAME chunk.
            // Splitting them caused a TDZ crash ("Cannot access 'vt' before
            // initialization") in Tone.js's AudioContext setup, because
            // @tonejs/midi re-imports from `tone` and Rollup produces
            // chunk-level circular references when they're separated.
            if (id.includes("tone")) {
              return "vendor-tone";
            }
            // wavesurfer + audiomotion are independent of Tone.js — safe to
            // keep in their own chunks (each is loaded only from audio code).
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
            if (id.includes("@dnd-kit")) {
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
            // Charts are kept together and merged into feature-studio.
            //
            // Audit 2026-07-17 found 14 components in /components/admin/,
            // /components/analytics/, and /pages/admin/ that STATICALLY import
            // recharts (e.g. admin/analytics/ForecastPanel.tsx:11,
            // admin/RevenueForecast.tsx:24). Because those components are part of
            // the feature-studio chunk (via the /components/admin/ rule below),
            // a static recharts edge forces vendor-charts <-> feature-studio, and
            // Rollup reports "Circular chunk: vendor-charts -> feature-studio ->
            // vendor-charts" — which the CI gate hard-fails on.
            //
            // To split charts into a lazy vendor-charts chunk, FIRST migrate all
            // 14 static `from "recharts"` imports in admin/analytics components to
            // the existing `@/lib/recharts-lazy` useRecharts() hook (which uses
            // dynamic import("recharts")). Until then, keep charts in feature-studio.
            //
            // NOTE: `@/lib/recharts-lazy` already implements the dynamic-import
            // pattern correctly and is used by PerformanceChart.tsx — it is the
            // migration target. Also: the dead shadcn-generated
            // `src/components/ui/chart.tsx` was removed in this audit (0 importers,
            // static recharts import); do NOT reintroduce static recharts in shared UI.
            if (id.includes("recharts") || id.includes("d3") || id.includes("victory")) {
              return "feature-studio";
            }
            // Other utilities
            if (id.includes("lodash") || id.includes("immer")) {
              return "vendor-utils";
            }
            // Heavy libs that must stay in isolated chunks so that
            // dynamic imports actually split them out of the initial bundle.
            // (When manualChunks assigns them to a shared "vendor-other",
            // Rollup pulls that whole shared chunk into the initial graph.)
            if (id.includes("@sentry")) return "vendor-sentry";
            if (id.includes("canvas-confetti")) return "vendor-confetti";
            if (id.includes("qrcode")) return "vendor-qrcode";
            if (id.includes("jszip")) return "vendor-jszip";
            if (id.includes("lamejs")) return "vendor-lamejs";
            if (id.includes("web-audio-beat-detector") || id.includes("music-tempo")) {
              return "vendor-bpm";
            }
            // Note: @tonejs/* intentionally NOT chunked separately.
            // Manual chunking caused a TDZ crash in Tone.js's AudioContext
            // setup because @tonejs/midi re-imports from `tone`. The unified
            // `tone` rule above merges them into vendor-tone.
            if (id.includes("dompurify")) return "vendor-dompurify";
            if (id.includes("fast-check")) return "vendor-fastcheck";
            // i18next — every-page dep, better cached separately
            if (id.includes("i18next")) return "vendor-i18n";
            // @twa-dev/sdk — Telegram SDK
            if (id.includes("@twa-dev")) return "vendor-telegram";
            // Small shared utilities — let Rollup auto-chunk them.
            // Forcing them into "vendor-other" causes circular chunk
            // "vendor-other -> vendor-react -> vendor-other" when a
            // react-related package ends up in vendor-other.
            // Rollup's auto-split handles these without cycles.
          }

          // Feature-based code splitting - avoid circular dependencies
          // by ensuring shared imports stay in same chunk

          // Pages
          if (id.includes("/pages/StemStudio")) return "page-stem-studio";
          // Note: /pages/AdminDashboard and /pages/admin/ are intentionally NOT chunked here.
          // Manual chunking caused a TDZ crash ("Cannot access 'ft' before init")
          // due to circular deps via admin components shared across chunks.
          if (id.includes("/pages/MusicGraph")) return "page-music-graph";
          if (id.includes("/pages/Studio") && !id.includes("/pages/StudioHub")) return "page-studio";
          if (id.includes("/pages/StudioHub")) return "page-studio-hub";
          // Note: /pages/Projects, /pages/LyricsStudio, /pages/LyricsWorkspace,
          // and /pages/AdminDashboard are intentionally NOT chunked separately —
          // they are shared across studio/admin/audio code paths and were
          // historically part of the merged feature-studio chunk.

          // MEGA-CHUNK: studio + generate-form + lyrics + admin + audio
          //
          // Audit 2026-07-17 (madge --circular over 2220 src files) confirmed
          // there is NO source-level (TypeScript import) cycle between generate/
          // lyrics and studio/admin. HOWEVER a Rollup chunk-graph cycle STILL
          // appears when generate-form is split into its own feature-generation
          // chunk, caused by cross-feature module edges (NOT source cycles):
          //   - generate-form/GuitarModeRecorder.tsx imports BOTH
          //     /components/guitar/ChordDiagram AND /hooks/studio/useStudioAudio
          //     (both land in feature-studio) → edge feature-generation → feature-studio
          //   - shared hook /hooks/useRealtimeChordDetection is imported by both
          //     chunks; Rollup must place it in one of them, creating the reverse
          //     edge feature-studio → feature-generation.
          //   Result: "Circular chunk: feature-studio -> feature-generation ->
          //   feature-studio", which the CI gate (ci.yml) hard-fails on.
          //
          // To split feature-generation out, FIRST break these edges:
          //   1. Move /components/guitar/ChordDiagram to /components/ui/ (zero
          //      feature deps) so it lands in a neutral shared chunk.
          //   2. Relocate generate-form/GuitarModeRecorder.tsx + GuitarRecordDialog.tsx
          //      into /components/guitar/ (they are guitar-recording UI, not
          //      generation-form), OR decouple them from useStudioAudio.
          //   3. Assign /hooks/useRealtimeChordDetection + /lib/chord-detection to
          //      a neutral chunk so neither feature pulls the other.
          // Until that refactor lands, keep generate-form/lyrics in feature-studio.
          if (
            id.includes("/pages/AdminDashboard") ||
            id.includes("/pages/admin/") ||
            id.includes("/pages/LyricsStudio") ||
            id.includes("/pages/LyricsWorkspace") ||
            id.includes("/pages/Studio") ||
            id.includes("/pages/StudioHub") ||
            id.includes("/pages/ProjectDetail") ||
            id.includes("/pages/StemStudio") ||
            id.includes("/pages/MusicGraph") ||
            id.includes("/stores/studio/") ||
            id.includes("/components/admin/") ||
            id.includes("/components/stem-studio/") ||
            id.includes("/components/studio/mixer/") ||
            id.includes("/components/studio/editor/") ||
            id.includes("/components/studio/timeline/") ||
            id.includes("/components/studio/unified/") ||
            id.includes("/components/studio/") ||
            id.includes("/components/generate-form/") ||
            id.includes("/components/lyrics/") ||
            id.includes("/components/lyrics-workspace/") ||
            id.includes("/components/guitar/") ||
            id.includes("/components/drum-machine/") ||
            id.includes("/components/audio-record/") ||
            id.includes("/components/audio-reference/") ||
            id.includes("/components/audio/")
          ) {
            return "feature-studio";
          }
          // Note: /components/analytics/ is intentionally NOT chunked here.
          // Manual chunking caused a TDZ crash ("Cannot access 'w' before init")
          // due to circular deps via the @/hooks/analytics barrel.
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
      "react-router",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
    ],
  },
}));
