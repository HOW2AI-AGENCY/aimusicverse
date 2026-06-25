/**
 * Translate Tool Panel
 * Translate with rhythm preservation
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Languages, Music2 } from "@/lib/icons";
import { ToolPanelProps } from "../types";

const LANGUAGES = [
  { id: "en", label: "Английский", flag: "🇬🇧" },
  { id: "ru", label: "Русский", flag: "🇷🇺" },
];

export const TranslateToolPanel: React.FC<ToolPanelProps> = ({ context, onExecute, onClose, isLoading }) => {
  const [targetLanguage, setTargetLanguage] = useState<string>("en");
  const [preserveSyllables, setPreserveSyllables] = useState(true);

  const hasLyrics = !!context.existingLyrics?.trim();

  // Detect source language
  const sourceLanguage = context.language || (/[а-яё]/i.test(context.existingLyrics || "") ? "ru" : "en");

  const handleExecute = () => {
    onExecute({
      lyrics: context.existingLyrics,
      targetLanguage,
      preserveSyllables,
    });
  };

  if (!hasLyrics) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Сначала напишите текст для перевода</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Languages className="w-4 h-4" />
        <span>Адаптирует текст для пения на другом языке</span>
      </div>

      {/* Language direction */}
      <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted/50">
        <div className="text-center">
          <div className="text-2xl mb-1">{LANGUAGES.find((l) => l.id === sourceLanguage)?.flag || "📝"}</div>
          <div className="text-xs text-muted-foreground">
            {LANGUAGES.find((l) => l.id === sourceLanguage)?.label || "Исходный"}
          </div>
        </div>
        <div className="text-2xl text-muted-foreground">→</div>
        <div className="text-center">
          <div className="text-2xl mb-1">{LANGUAGES.find((l) => l.id === targetLanguage)?.flag}</div>
          <div className="text-xs text-muted-foreground">{LANGUAGES.find((l) => l.id === targetLanguage)?.label}</div>
        </div>
      </div>

      {/* Target language selector */}
      <div className="space-y-2">
        <Label>Язык перевода</Label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.filter((l) => l.id !== sourceLanguage).map((lang) => (
            <Button
              key={lang.id}
              variant={targetLanguage === lang.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTargetLanguage(lang.id)}
              className="gap-2"
            >
              <span className="text-lg">{lang.flag}</span>
              {lang.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Syllable preservation */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Сохранять слоги</div>
            <div className="text-xs text-muted-foreground">Строго совпадающее количество</div>
          </div>
        </div>
        <Switch checked={preserveSyllables} onCheckedChange={setPreserveSyllables} />
      </div>

      <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-sm">
        <p className="text-blue-400">💡 Это не дословный перевод, а адаптация для пения с сохранением рифм и ритма</p>
      </div>

      <Button onClick={handleExecute} disabled={isLoading} className="w-full">
        <Languages className="w-4 h-4 mr-2" />
        {isLoading ? "Перевожу..." : "Перевести и адаптировать"}
      </Button>
    </div>
  );
};
