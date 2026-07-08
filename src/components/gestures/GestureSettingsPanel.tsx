import { memo, useState, useEffect } from "react";
import { SlidersHorizontal, ToggleLeft, ToggleRight, RefreshCw } from "@/lib/icons";
import type { GestureSettings } from "@/types/gestures";
import { cn } from "@/lib/utils";
import { typographyClass } from "@/lib/design-tokens";

// ponytail: inlined from deleted @/lib/gestureSettings (single caller)
const STORAGE_KEY = "musicverse-gestures";
const DEFAULT_GESTURE_SETTINGS: GestureSettings = {
  doubleTapSeek: { enabled: true, seekAmount: 10, leftSideEnabled: true, rightSideEnabled: true },
  horizontalSwipe: { enabled: true, threshold: 80, velocityThreshold: 400 },
  hintOverlay: { shown: false, dismissed: false },
  keyboard: { enabled: true, seekAmount: 10 },
  version: 1,
  lastUpdated: Date.now(),
};
function loadGestureSettings(): GestureSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GESTURE_SETTINGS, lastUpdated: Date.now() };
    return { ...DEFAULT_GESTURE_SETTINGS, ...JSON.parse(raw), lastUpdated: Date.now() };
  } catch {
    return { ...DEFAULT_GESTURE_SETTINGS, lastUpdated: Date.now() };
  }
}
function saveGestureSettings(settings: GestureSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, lastUpdated: Date.now() }));
  } catch {
    /* full */
  }
}

interface GestureSettingsPanelProps {
  className?: string;
}

export const GestureSettingsPanel = memo(function GestureSettingsPanel({ className }: GestureSettingsPanelProps) {
  const [settings, setSettings] = useState<GestureSettings>(DEFAULT_GESTURE_SETTINGS);

  useEffect(() => {
    setSettings(loadGestureSettings());
  }, []);

  const update = (patch: Partial<GestureSettings>) => {
    const next = { ...settings, ...patch, lastUpdated: Date.now() };
    setSettings(next);
    saveGestureSettings(next);
  };

  const reset = () => {
    const defaults = { ...DEFAULT_GESTURE_SETTINGS, lastUpdated: Date.now() };
    setSettings(defaults);
    saveGestureSettings(defaults);
  };

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center justify-between">
        <p className={cn("font-semibold text-foreground", typographyClass.label)}>Жесты в плеере</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Сбросить
        </button>
      </div>

      <div className="space-y-4">
        {/* Double-tap seek */}
        <div className="rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Двойной тап</span>
            </div>
            <button
              onClick={() =>
                update({
                  doubleTapSeek: { ...settings.doubleTapSeek, enabled: !settings.doubleTapSeek.enabled },
                })
              }
              className="touch-target"
            >
              {settings.doubleTapSeek.enabled ? (
                <ToggleRight className="w-8 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-8 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          {settings.doubleTapSeek.enabled && (
            <div className="space-y-2 pl-10.5">
              <SettingRow
                label="Перемотка (сек)"
                value={settings.doubleTapSeek.seekAmount}
                onChange={(v) => update({ doubleTapSeek: { ...settings.doubleTapSeek, seekAmount: v } })}
                min={5}
                max={30}
              />
              <ToggleRow
                label="Левая сторона"
                checked={settings.doubleTapSeek.leftSideEnabled}
                onChange={(v) => update({ doubleTapSeek: { ...settings.doubleTapSeek, leftSideEnabled: v } })}
              />
              <ToggleRow
                label="Правая сторона"
                checked={settings.doubleTapSeek.rightSideEnabled}
                onChange={(v) => update({ doubleTapSeek: { ...settings.doubleTapSeek, rightSideEnabled: v } })}
              />
            </div>
          )}
        </div>

        {/* Horizontal swipe */}
        <div className="rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ChevronLeftRightIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Свайп</span>
            </div>
            <button
              onClick={() =>
                update({
                  horizontalSwipe: { ...settings.horizontalSwipe, enabled: !settings.horizontalSwipe.enabled },
                })
              }
              className="touch-target"
            >
              {settings.horizontalSwipe.enabled ? (
                <ToggleRight className="w-8 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-8 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          {settings.horizontalSwipe.enabled && (
            <div className="space-y-2 pl-10.5">
              <SettingRow
                label="Порог (px)"
                value={settings.horizontalSwipe.threshold}
                onChange={(v) => update({ horizontalSwipe: { ...settings.horizontalSwipe, threshold: v } })}
                min={50}
                max={150}
              />
              <SettingRow
                label="Скорость (px/s)"
                value={settings.horizontalSwipe.velocityThreshold}
                onChange={(v) => update({ horizontalSwipe: { ...settings.horizontalSwipe, velocityThreshold: v } })}
                min={200}
                max={800}
                step={50}
              />
            </div>
          )}
        </div>

        {/* Hint overlay */}
        <div className="rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Подсказки</span>
            </div>
            <button
              onClick={() =>
                update({
                  hintOverlay: { ...settings.hintOverlay, shown: false, dismissed: false },
                })
              }
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg",
                "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
                "touch-target",
              )}
            >
              Показать снова
            </button>
          </div>
          <p className="text-xs text-muted-foreground pl-10.5">
            Подсказки по жестам показываются при первом открытии плеера и исчезают после ознакомления
          </p>
        </div>
      </div>
    </div>
  );
});

function ChevronLeftRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button onClick={() => onChange(!checked)} className="touch-target">
        {checked ? (
          <ToggleRight className="w-7 h-4 text-primary/70" />
        ) : (
          <ToggleLeft className="w-7 h-4 text-muted-foreground/50" />
        )}
      </button>
    </div>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => value > min && onChange(value - step)}
          className="w-7 h-7 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center text-xs font-medium touch-target"
        >
          −
        </button>
        <span className="text-sm font-medium text-foreground w-8 text-center tabular-nums">{value}</span>
        <button
          onClick={() => value < max && onChange(value + step)}
          className="w-7 h-7 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center text-xs font-medium touch-target"
        >
          +
        </button>
      </div>
    </div>
  );
}
