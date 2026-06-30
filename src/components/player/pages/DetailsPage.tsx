/**
 * DetailsPage — track metadata panel for fullscreen player.
 *
 * Minimal, symmetric stack of sections separated by hairline dividers.
 * Frontend-only: derives metadata from existing Track fields.
 */

import { useMemo } from "react";
import { Calendar, Clock3, Music2, Sparkles, Play, Pause } from "@/lib/icons";
import type { Track } from "@/types/track";
import { VersionSwitcher } from "../VersionSwitcher";
import { PlayerActionsBar } from "../PlayerActionsBar";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { hapticImpact } from "@/lib/haptic";
import { cn } from "@/lib/utils";

interface DetailsPageProps {
  track: Track;
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(value),
    );
  } catch {
    return "—";
  }
}

interface Row {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function DetailsPage({ track }: DetailsPageProps) {
  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [];
    list.push({ label: "Длительность", value: formatDuration(track.duration_seconds), icon: Clock3 });
    list.push({ label: "Создан", value: formatDate(track.created_at), icon: Calendar });
    if (track.style) list.push({ label: "Стиль", value: track.style, icon: Sparkles });
    if (track.model_name) list.push({ label: "Модель", value: String(track.model_name), icon: Music2 });
    return list;
  }, [track]);

  return (
    <div className="h-full overflow-y-auto px-4 py-4" style={{ overscrollBehavior: "contain" }}>
      <div className="mx-auto flex max-w-[28rem] flex-col gap-4 pb-24">
        {/* Title block */}
        <section className="rounded-2xl bg-card/60 p-4 ring-1 ring-border/40 backdrop-blur">
          <h2 className="font-display text-[17px] font-semibold leading-tight text-foreground">
            {track.title || "Без названия"}
          </h2>
          {track.style && (
            <p className="mt-1 text-[12px] text-muted-foreground/80">{track.style}</p>
          )}
          <div className="mt-3">
            <VersionSwitcher track={track} size="compact" />
          </div>
        </section>

        {/* Metadata grid */}
        <section className="rounded-2xl bg-card/60 p-2 ring-1 ring-border/40 backdrop-blur">
          <ul className="divide-y divide-border/40">
            {rows.map(({ label, value, icon: Icon }) => (
              <li
                key={label}
                className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 px-2 py-2.5"
              >
                {Icon ? (
                  <Icon className="h-4 w-4 text-muted-foreground/70" aria-hidden />
                ) : (
                  <span className="h-4 w-4" aria-hidden />
                )}
                <span className="text-[12px] uppercase tracking-wider text-muted-foreground/70">
                  {label}
                </span>
                <span className="text-right text-[13px] font-medium text-foreground/90">{value}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Actions */}
        <section className="rounded-2xl bg-card/60 p-3 ring-1 ring-border/40 backdrop-blur">
          <PlayerActionsBar track={track} variant="horizontal" size="sm" showStudioButton />
        </section>
      </div>
    </div>
  );
}
