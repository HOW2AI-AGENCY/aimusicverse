/**
 * RecordingTypeSelector - Select recording mode (vocal/guitar/instrument)
 */

import React, { memo } from "react";
import { Mic2, Guitar, Music } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { RecordingMode } from "@/hooks/audio/useUnifiedRecording";

interface RecordingTypeSelectorProps {
  value: RecordingMode;
  onChange: (mode: RecordingMode) => void;
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
}

interface ModeOption {
  value: RecordingMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const modes: ModeOption[] = [
  {
    value: "vocal",
    label: "Вокал",
    icon: <Mic2 className="h-4 w-4" />,
    description: "Шумоподавление включено",
  },
  {
    value: "guitar",
    label: "Гитара",
    icon: <Guitar className="h-4 w-4" />,
    description: "Чистый звук, 48kHz",
  },
  {
    value: "instrument",
    label: "Инструмент",
    icon: <Music className="h-4 w-4" />,
    description: "Без обработки",
  },
];

export const RecordingTypeSelector = memo(function RecordingTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
  showLabels = true,
  size = "md",
}: RecordingTypeSelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 rounded-lg border transition-all",
            size === "sm" ? "px-3 py-1.5" : "px-4 py-2",
            value === mode.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background hover:bg-muted",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          title={mode.description}
        >
          {mode.icon}
          {showLabels && <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>{mode.label}</span>}
        </button>
      ))}
    </div>
  );
});

export default RecordingTypeSelector;
