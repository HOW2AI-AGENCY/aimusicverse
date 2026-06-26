/**
 * LyricsEditorMetricsOverlay — dev-only floating panel showing live render
 * metrics for LyricsVisualEditorCompact:
 *   - live counters (renders / externalSyncs)
 *   - sparkline history of last ~5 minutes (per-second samples)
 *   - before/after snapshots captured around each externalSync
 *   - export to JSON / CSV
 *
 * Reads from `window.__lyricsEditorMetrics`, which the editor writes on every
 * render. Mounted only when `import.meta.env.DEV` is true.
 *
 * Hotkey: Ctrl/Cmd + Shift + M toggles visibility.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/constants/z-index";
import type {
  LyricsEditorMetrics,
  SyncSnapshot,
} from "@/components/generate-form/LyricsVisualEditorCompact";

const VISIBLE_KEY = "lv:metrics:visible";
const COLLAPSED_KEY = "lv:metrics:collapsed";
const FLASH_MS = 400;

// History config: 5 min @ 1s = 300 samples.
const HISTORY_MAX = 300;
const HISTORY_INTERVAL_MS = 1000;

interface HistoryPoint {
  ts: number;
  renders: number;
  syncs: number;
  dRenders: number;
  dSyncs: number;
}

function readMetrics(): LyricsEditorMetrics | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { __lyricsEditorMetrics?: LyricsEditorMetrics }).__lyricsEditorMetrics ?? null
  );
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(history: HistoryPoint[]): string {
  const head = "ts_iso,ts_ms,renders,syncs,d_renders,d_syncs";
  const rows = history.map(
    (p) =>
      `${new Date(p.ts).toISOString()},${p.ts},${p.renders},${p.syncs},${p.dRenders},${p.dSyncs}`,
  );
  return [head, ...rows].join("\n");
}

function Sparkline({
  data,
  accessor,
  color,
  width = 220,
  height = 36,
  label,
}: {
  data: HistoryPoint[];
  accessor: (p: HistoryPoint) => number;
  color: string;
  width?: number;
  height?: number;
  label: string;
}) {
  const { path, max } = useMemo(() => {
    if (data.length === 0) return { path: "", max: 0 };
    const vals = data.map(accessor);
    const max = Math.max(1, ...vals);
    const stepX = data.length > 1 ? width / (data.length - 1) : 0;
    const d = vals
      .map((v, i) => {
        const x = i * stepX;
        const y = height - (v / max) * (height - 2) - 1;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    return { path: d, max };
  }, [data, accessor, width, height]);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between text-[9px] text-muted-foreground">
        <span className="uppercase tracking-wider">{label}</span>
        <span className="tabular-nums">peak {max}/s</span>
      </div>
      <svg
        width={width}
        height={height}
        className="block rounded bg-muted/30"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {path && (
          <path d={path} fill="none" stroke={color} strokeWidth={1.25} strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

/**
 * Detect "mobile-ish" environments where the dev-overlay must never appear:
 *  - narrow viewport (<768px) — covers phones in portrait
 *  - coarse pointer (touch-only) — covers phones/tablets without a mouse
 *  - no physical keyboard → the Ctrl/Cmd+Shift+M hotkey is unreachable anyway
 * On SSR (no window) we default to "mobile" to stay safe.
 */
function useIsMobileDevice(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    return narrow || coarse;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqlNarrow = window.matchMedia("(max-width: 767px)");
    const mqlCoarse = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(mqlNarrow.matches || mqlCoarse.matches);
    mqlNarrow.addEventListener("change", update);
    mqlCoarse.addEventListener("change", update);
    return () => {
      mqlNarrow.removeEventListener("change", update);
      mqlCoarse.removeEventListener("change", update);
    };
  }, []);
  return isMobile;
}

export function LyricsEditorMetricsOverlay() {
  const isMobile = useIsMobileDevice();

  // Hidden by default to avoid covering mobile UI / intercepting clicks above
  // modals. Toggle with Ctrl/Cmd+Shift+M (desktop only); preference is persisted.
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(VISIBLE_KEY) === "1";
    } catch {
      return false;
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
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [snapshots, setSnapshots] = useState<SyncSnapshot[]>([]);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);

  const lastSyncsRef = useRef(0);
  const lastSampleRef = useRef<{ ts: number; renders: number; syncs: number } | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const historyIntervalRef = useRef<number | null>(null);

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

  // History sampler — always runs while visible, regardless of collapsed state.
  useEffect(() => {
    if (!visible) return;
    const tick = () => {
      const m = readMetrics();
      if (!m) return;
      const now = Date.now();
      const prev = lastSampleRef.current;
      const dR = prev ? Math.max(0, m.renders - prev.renders) : 0;
      const dS = prev ? Math.max(0, m.externalSyncs - prev.syncs) : 0;
      lastSampleRef.current = { ts: now, renders: m.renders, syncs: m.externalSyncs };
      setHistory((h) => {
        const next = h.length >= HISTORY_MAX ? h.slice(h.length - HISTORY_MAX + 1) : h.slice();
        next.push({ ts: now, renders: m.renders, syncs: m.externalSyncs, dRenders: dR, dSyncs: dS });
        return next;
      });
    };
    tick();
    historyIntervalRef.current = window.setInterval(tick, HISTORY_INTERVAL_MS);
    return () => {
      if (historyIntervalRef.current) window.clearInterval(historyIntervalRef.current);
      historyIntervalRef.current = null;
    };
  }, [visible]);

  // Live counter/snapshot polling — rAF while expanded, 1Hz while collapsed.
  useEffect(() => {
    if (!visible) return;

    const sample = () => {
      const m = readMetrics();
      if (!m) return;
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
      const snaps = m.snapshots ?? [];
      // Cheap length-based change check; snapshots is a ring buffer so length plateaus.
      setSnapshots((prev) =>
        prev.length === snaps.length && prev[prev.length - 1] === snaps[snaps.length - 1]
          ? prev
          : snaps.slice(-20),
      );
    };

    if (collapsed) {
      sample();
      const id = window.setInterval(sample, 1000);
      return () => window.clearInterval(id);
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
    lastSampleRef.current = null;
    setRenders(0);
    setSyncs(0);
    setFlashing(false);
    setHistory([]);
    setSnapshots([]);
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

  const exportJSON = useCallback(() => {
    const m = readMetrics();
    const payload = {
      exportedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      counters: { renders: m?.renders ?? renders, externalSyncs: m?.externalSyncs ?? syncs },
      history,
      snapshots: m?.snapshots ?? snapshots,
    };
    downloadBlob(
      JSON.stringify(payload, null, 2),
      `lyrics-metrics-${Date.now()}.json`,
      "application/json",
    );
  }, [history, snapshots, renders, syncs]);

  const exportCSV = useCallback(() => {
    downloadBlob(toCSV(history), `lyrics-metrics-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  }, [history]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Lyrics editor render metrics (dev)"
      className={cn(
        "fixed bottom-4 right-4 select-none pointer-events-auto",
        "rounded-lg border border-border/60 bg-background/85 backdrop-blur-md shadow-lg",
        "font-mono text-[11px] text-foreground",
        "transition-colors duration-200",
        flashing && "border-amber-500/70 bg-amber-500/15",
        collapsed ? "max-w-[260px]" : "w-[260px]",
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
        <span className="text-muted-foreground">r</span>
        <span className="tabular-nums font-semibold">{renders}</span>
        <span className="text-muted-foreground">s</span>
        <span
          className={cn(
            "tabular-nums font-semibold",
            syncs > 0 ? "text-amber-500" : "text-emerald-500",
          )}
        >
          {syncs}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={hide}
          className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-destructive hover:bg-muted/60 transition-colors"
          title="Hide (Ctrl/Cmd+Shift+M to bring back)"
          aria-label="Hide overlay"
        >
          ×
        </button>
      </div>

      {!collapsed && (
        <div className="px-2 pb-2 space-y-2 border-t border-border/40 pt-2">
          {/* Charts */}
          <Sparkline
            data={history}
            accessor={(p) => p.dRenders}
            color="hsl(var(--primary))"
            label="renders/s · 5min"
          />
          <Sparkline
            data={history}
            accessor={(p) => p.dSyncs}
            color="rgb(245 158 11)"
            label="syncs/s · 5min"
          />

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={handleReset}
              className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Reset counters + history"
            >
              reset
            </button>
            <button
              type="button"
              onClick={exportJSON}
              className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Export metrics + snapshots as JSON"
            >
              ⤓ json
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Export history as CSV"
            >
              ⤓ csv
            </button>
            <button
              type="button"
              onClick={() => setSnapshotsOpen((v) => !v)}
              className="ml-auto px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Toggle sync snapshots"
            >
              snaps ({snapshots.length}) {snapshotsOpen ? "▾" : "▸"}
            </button>
          </div>

          {snapshotsOpen && (
            <div className="max-h-[180px] overflow-y-auto rounded border border-border/40 bg-muted/20">
              {snapshots.length === 0 ? (
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
                  no external syncs captured yet
                </div>
              ) : (
                <ul className="divide-y divide-border/30">
                  {snapshots
                    .slice()
                    .reverse()
                    .map((s) => (
                      <li key={`${s.id}-${s.phase}`} className="px-2 py-1 text-[10px]">
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              "uppercase tracking-wider",
                              s.phase === "before" ? "text-muted-foreground" : "text-amber-500",
                            )}
                          >
                            #{s.syncIndex} {s.phase}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(s.ts).toLocaleTimeString()}
                          </span>
                          <span className="ml-auto text-muted-foreground">
                            {s.sections.length} sec
                          </span>
                        </div>
                        <div className="text-muted-foreground truncate">
                          focus: {s.focus.sectionId ? s.focus.sectionId.slice(0, 14) : "—"}
                          {s.focus.selectionStart != null &&
                            ` [${s.focus.selectionStart}:${s.focus.selectionEnd}]`}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LyricsEditorMetricsOverlay;
