/**
 * LyricsEditorMetricsOverlay — dev-only floating chip showing live render
 * metrics for LyricsVisualEditorCompact (renders + externalSyncs).
 *
 * Reads from `window.__lyricsEditorMetrics`, which the editor writes on every
 * render. Mounted only when `import.meta.env.DEV` is true — tree-shaken out
 * of production builds.
 *
 * Hotkey: Ctrl/Cmd + Shift + M toggles visibility. State persisted to
 * localStorage so it survives reloads.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/constants/z-index";

interface MetricsSnapshot {
  renders: number;
  externalSyncs: number;
  lastRenderAt: number;
  reset?: () => void;
}

const VISIBLE_KEY = "lv:metrics:visible";
const COLLAPSED_KEY = "lv:metrics:collapsed";
const FLASH_MS = 400;

function readMetrics(): MetricsSnapshot | null {
  return (
    (window as unknown as { __lyricsEditorMetrics?: MetricsSnapshot }).__lyricsEditorMetrics ?? null
  );
}

export function LyricsEditorMetricsOverlay() {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(VISIBLE_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [renders, setRenders] = useState(0);
  const [syncs, setSyncs] = useState(0);
  const [flashing, setFlashing] = useState(false);

  const lastSyncsRef = useRef(0);
  const flashTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Hotkey toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "M" || e.key === "m")) {
        e.preventDefault();
        setVisible((v) => {
          const next = !v;
          try {
            localStorage.setItem(VISIBLE_KEY, next ? "1" : "0");
          } catch {
            /* noop */
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Poll metrics — rAF while expanded, 1Hz interval while collapsed.
  useEffect(() => {
    if (!visible) return;

    const sample = () => {
      const m = readMetrics();
      if (m) {
        if (m.renders !== renders) setRenders(m.renders);
        if (m.externalSyncs !== syncs) setSyncs(m.externalSyncs);
        if (m.externalSyncs > lastSyncsRef.current) {
          lastSyncsRef.current = m.externalSyncs;
          setFlashing(true);
          if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
          flashTimerRef.current = window.setTimeout(() => setFlashing(false), FLASH_MS);
        } else {
          lastSyncsRef.current = m.externalSyncs;
        }
      }
    };

    if (collapsed) {
      sample();
      intervalRef.current = window.setInterval(sample, 1000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      };
    }

    const loop = () => {
      sample();
      rafRef.current = window.requestAnimationFrame(loop);
    };
    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [visible, collapsed, renders, syncs]);

  const handleReset = useCallback(() => {
    const m = readMetrics();
    m?.reset?.();
    lastSyncsRef.current = 0;
    setRenders(0);
    setSyncs(0);
    setFlashing(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(VISIBLE_KEY, "0");
    } catch {
      /* noop */
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Lyrics editor render metrics (dev)"
      className={cn(
        "fixed bottom-4 right-4 select-none pointer-events-auto",
        "rounded-lg border border-border/60 bg-background/80 backdrop-blur-md shadow-lg",
        "font-mono text-[11px] text-foreground",
        "transition-colors duration-200",
        flashing && "border-amber-500/70 bg-amber-500/15",
      )}
      style={{ zIndex: Z_INDEX.debug }}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand metrics" : "Collapse metrics"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▸" : "▾"}
        </button>
        <span className="text-muted-foreground uppercase tracking-wider text-[9px]">lyrics</span>
        {!collapsed && (
          <>
            <span className="text-muted-foreground">renders</span>
            <span className="tabular-nums font-semibold">{renders}</span>
            <span className="text-muted-foreground">syncs</span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                syncs > 0 ? "text-amber-500" : "text-emerald-500",
              )}
            >
              {syncs}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="ml-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Reset counters"
            >
              reset
            </button>
            <button
              type="button"
              onClick={hide}
              className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-destructive hover:bg-muted/60 transition-colors"
              title="Hide (Ctrl/Cmd+Shift+M to bring back)"
              aria-label="Hide overlay"
            >
              ×
            </button>
          </>
        )}
        {collapsed && (
          <span className="tabular-nums">
            r:{renders} s:
            <span className={syncs > 0 ? "text-amber-500" : "text-emerald-500"}>{syncs}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default LyricsEditorMetricsOverlay;
