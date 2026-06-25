/**
 * Style Convert Tool Panel
 * Convert lyrics to different artist/genre style
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shuffle, Music2, User, Sparkles } from "@/lib/icons";
import { ToolPanelProps } from "../types";
import { cn } from "@/lib/utils";

const STYLE_PRESETS = [
  { id: "rap", label: "Рэп/Хип-хоп", icon: "🎤" },
  { id: "rock", label: "Рок", icon: "🎸" },
  { id: "pop", label: "Поп", icon: "🎵" },
  { id: "indie", label: "Инди", icon: "🌙" },
  { id: "electronic", label: "Электроника", icon: "🎹" },
  { id: "folk", label: "Фолк", icon: "🪕" },
  { id: "jazz", label: "Джаз", icon: "🎷" },
  { id: "rnb", label: "R&B/Soul", icon: "💜" },
];

const ARTIST_PRESETS = [
  { id: "morgenshtern", label: "Моргенштерн" },
  { id: "face", label: "Face" },
  { id: "zemfira", label: "Земфира" },
  { id: "lsp", label: "ЛСП" },
  { id: "monetochka", label: "Монеточка" },
  { id: "billie", label: "Billie Eilish" },
  { id: "weeknd", label: "The Weeknd" },
  { id: "drake", label: "Drake" },
];

export const StyleConvertToolPanel: React.FC<ToolPanelProps> = ({ context, onExecute, onClose, isLoading }) => {
  const [mode, setMode] = useState<"genre" | "artist" | "custom">("genre");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customStyle, setCustomStyle] = useState("");

  const hasLyrics = !!context.existingLyrics?.trim();

  const handleExecute = () => {
    let targetStyle = customStyle;

    if (mode === "genre" && selectedPreset) {
      const preset = STYLE_PRESETS.find((p) => p.id === selectedPreset);
      targetStyle = preset?.label || selectedPreset;
    } else if (mode === "artist" && selectedPreset) {
      const preset = ARTIST_PRESETS.find((p) => p.id === selectedPreset);
      targetStyle = `в стиле ${preset?.label || selectedPreset}`;
    }

    if (!targetStyle) return;

    onExecute({
      targetStyle,
      lyrics: context.existingLyrics,
      genre: context.genre,
      mood: context.mood,
    });
  };

  if (!hasLyrics) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Shuffle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Сначала напишите текст для конвертации</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shuffle className="w-4 h-4" />
        <span>Перепишет текст в выбранном стиле</span>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === "genre" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("genre");
            setSelectedPreset("");
          }}
          className="flex-1"
        >
          <Music2 className="w-4 h-4 mr-1" />
          Жанр
        </Button>
        <Button
          variant={mode === "artist" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("artist");
            setSelectedPreset("");
          }}
          className="flex-1"
        >
          <User className="w-4 h-4 mr-1" />
          Артист
        </Button>
        <Button
          variant={mode === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("custom");
            setSelectedPreset("");
          }}
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Своё
        </Button>
      </div>

      {/* Genre presets */}
      {mode === "genre" && (
        <div className="grid grid-cols-4 gap-2">
          {STYLE_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPreset === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPreset(preset.id)}
              className="flex flex-col h-auto py-2"
            >
              <span className="text-lg">{preset.icon}</span>
              <span className="text-xs">{preset.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Artist presets */}
      {mode === "artist" && (
        <div className="grid grid-cols-2 gap-2">
          {ARTIST_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPreset === preset.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPreset(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      {/* Custom input */}
      {mode === "custom" && (
        <div className="space-y-2">
          <Label>Опишите стиль</Label>
          <Input
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            placeholder="Например: дерзкий трэп с автотюном"
          />
        </div>
      )}

      <Button onClick={handleExecute} disabled={isLoading || (!selectedPreset && !customStyle)} className="w-full">
        {isLoading ? "Конвертирую..." : "Конвертировать стиль"}
      </Button>
    </div>
  );
};
