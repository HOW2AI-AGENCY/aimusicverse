/**
 * HintRegistry - Single source of truth for in-app hints/tooltips.
 *
 * Goals:
 *  - Only ONE hint visible at a time across the whole app (no overlap/dupes).
 *  - Shared "seen" storage that also reads legacy keys, so users do not
 *    see the same tip again after migration.
 *  - Suppress hints while a modal / sheet / drawer is open.
 *
 * Public API (via `useHint`):
 *   - hasSeen(id)
 *   - markSeen(id)
 *   - resetAll()
 *   - request(id): boolean    // claim the single visible slot
 *   - release(id): void
 *   - isActive(id): boolean
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'mv:hints:v1';
const LEGACY_PREFIXES = ['hint_seen_', 'onboarding_tip_'];
const LEGACY_ARRAY_KEYS = ['mvai_hints_shown', 'mvai_spotlights'];

interface SeenPayload {
  version: 1;
  shown: string[];
}

function readSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SeenPayload;
      if (parsed && Array.isArray(parsed.shown)) return new Set(parsed.shown);
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function writeSeen(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: SeenPayload = { version: 1, shown: Array.from(set) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    logger.warn('hints: failed to persist seen set', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** One-time import of legacy hint keys into the unified storage. */
function migrateLegacy(into: Set<string>): Set<string> {
  if (typeof window === 'undefined') return into;
  let mutated = false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      for (const prefix of LEGACY_PREFIXES) {
        if (key.startsWith(prefix) && localStorage.getItem(key) === 'true') {
          const id = key.slice(prefix.length);
          if (!into.has(id)) {
            into.add(id);
            mutated = true;
          }
        }
        if (key.startsWith(prefix) && localStorage.getItem(key) === 'seen') {
          const id = key.slice(prefix.length);
          if (!into.has(id)) {
            into.add(id);
            mutated = true;
          }
        }
      }
    }
    for (const arrKey of LEGACY_ARRAY_KEYS) {
      const raw = localStorage.getItem(arrKey);
      if (!raw) continue;
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const id of arr) {
            if (typeof id === 'string' && !into.has(id)) {
              into.add(id);
              mutated = true;
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  if (mutated) writeSeen(into);
  return into;
}

/** Detect open modals/sheets so we don't stack hints on top of them. */
function useOverlayOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const check = () => {
      const hasDialog =
        document.querySelector(
          '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
        ) !== null;
      setOpen(hasDialog);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'role'],
      childList: true,
    });
    return () => observer.disconnect();
  }, []);
  return open;
}

interface HintContextValue {
  hasSeen: (id: string) => boolean;
  markSeen: (id: string) => void;
  resetAll: () => void;
  request: (id: string) => boolean;
  release: (id: string) => void;
  activeId: string | null;
  overlayOpen: boolean;
}

const HintContext = createContext<HintContextValue | null>(null);

/** Cooldown (ms) after a hint is shown/closed before it can be re-requested. */
export const REQUEST_COOLDOWN_MS = 1500;

export function HintRegistryProvider({ children }: { children: ReactNode }) {
  const seenRef = useRef<Set<string>>(new Set());
  const recentRef = useRef<Map<string, number>>(new Map());
  const activeIdRef = useRef<string | null>(null);
  const [, force] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const overlayOpen = useOverlayOpen();

  // Initialize + migrate once
  useEffect(() => {
    seenRef.current = migrateLegacy(readSeen());
    force((n) => n + 1);
  }, []);

  const hasSeen = useCallback((id: string) => seenRef.current.has(id), []);

  const markSeen = useCallback((id: string) => {
    if (seenRef.current.has(id)) return;
    seenRef.current.add(id);
    writeSeen(seenRef.current);
    // Also write legacy key so any not-yet-migrated checks agree.
    try {
      localStorage.setItem(`hint_seen_${id}`, 'true');
    } catch {
      /* ignore */
    }
    force((n) => n + 1);
  }, []);

  const resetAll = useCallback(() => {
    seenRef.current = new Set();
    recentRef.current = new Map();
    writeSeen(seenRef.current);
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (LEGACY_PREFIXES.some((p) => key.startsWith(p))) toRemove.push(key);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
      LEGACY_ARRAY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    activeIdRef.current = null;
    setActiveId(null);
    force((n) => n + 1);
  }, []);

  const request = useCallback(
    (id: string) => {
      // Hard dedup: no requests while an overlay is open.
      if (overlayOpen) return false;
      // Hard dedup: already-seen tips cannot reappear.
      if (seenRef.current.has(id)) return false;
      // Hard dedup: another tip currently owns the slot — even the same id.
      if (activeIdRef.current && activeIdRef.current !== id) return false;
      if (activeIdRef.current === id) return true;
      // Cooldown: prevent rapid re-show of the same id after release.
      const last = recentRef.current.get(id) ?? 0;
      if (Date.now() - last < REQUEST_COOLDOWN_MS) return false;

      activeIdRef.current = id;
      recentRef.current.set(id, Date.now());
      setActiveId(id);
      return true;
    },
    [overlayOpen]
  );

  const release = useCallback((id: string) => {
    if (activeIdRef.current !== id) return;
    activeIdRef.current = null;
    recentRef.current.set(id, Date.now());
    setActiveId(null);
  }, []);

  // If an overlay opens while a hint is showing, drop it. The card stays
  // unseen in storage, so ContextHints will re-surface it after release.
  useEffect(() => {
    if (overlayOpen && activeIdRef.current) {
      const id = activeIdRef.current;
      activeIdRef.current = null;
      recentRef.current.set(id, Date.now());
      setActiveId(null);
    }
  }, [overlayOpen]);

  const value = useMemo<HintContextValue>(
    () => ({
      hasSeen,
      markSeen,
      resetAll,
      request,
      release,
      activeId,
      overlayOpen,
    }),
    [hasSeen, markSeen, resetAll, request, release, activeId, overlayOpen]
  );

  // Dev-only test hook so Playwright can drive the registry directly.
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    (window as unknown as { __hintRegistry?: HintContextValue }).__hintRegistry =
      value;
  }, [value]);

  return <HintContext.Provider value={value}>{children}</HintContext.Provider>;
}

export function useHintRegistry(): HintContextValue {
  const ctx = useContext(HintContext);
  if (!ctx) {
    // Safe no-op fallback so components don't crash if provider isn't mounted.
    return {
      hasSeen: () => false,
      markSeen: () => undefined,
      resetAll: () => undefined,
      request: () => true,
      release: () => undefined,
      activeId: null,
      overlayOpen: false,
    };
  }
  return ctx;
}

/** Convenience hook for a single hint id. */
export function useHint(id: string) {
  const reg = useHintRegistry();
  return {
    hasSeen: reg.hasSeen(id),
    isActive: reg.activeId === id,
    request: () => reg.request(id),
    release: () => reg.release(id),
    markSeen: () => reg.markSeen(id),
    overlayOpen: reg.overlayOpen,
  };
}
