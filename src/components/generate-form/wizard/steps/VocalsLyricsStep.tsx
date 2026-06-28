/**
 * VocalsLyricsStep - Combined vocals settings + optional collapsible lyrics
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Mic, MicOff, FileText, Sparkles, Loader2, ArrowLeft, ArrowRight, ChevronDown } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGenerationWizardStore } from "@/stores/generationWizardStore";

const VOCAL_STYLES = [
  { id: "clean", label: "Чистый", description: "Без эффектов" },
  { id: "raspy", label: "Хриплый", description: "Рок-стиль" },
  { id: "smooth", label: "Мягкий", description: "R&B/Soul" },
  { id: "powerful", label: "Мощный", description: "Высокая подача" },
];

const LANGUAGE_OPTIONS = [
  { id: "ru", label: "Русский", flag: "🇷🇺" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "mix", label: "Микс", flag: "🌍" },
];

interface VocalsLyricsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function VocalsLyricsStep({ onNext, onBack }: VocalsLyricsStepProps) {
  const { data, updateData, isAiProcessing, setAiProcessing } = useGenerationWizardStore();
  const [hasVocals, setHasVocals] = useState(data.hasVocals);
  const [vocalGender, setVocalGender] = useState<"" | "m" | "f">(data.vocalGender);
  const [vocalStyle, setVocalStyle] = useState(data.vocalStyle);
  const [lyrics, setLyrics] = useState(data.lyrics);
  const [language, setLanguage] = useState(data.lyricsLanguage || "ru");
  const [lyricsExpanded, setLyricsExpanded] = useState(!!data.lyrics);

  const handleVocalsToggle = useCallback(
    (value: boolean) => {
      setHasVocals(value);
      updateData({ hasVocals: value });
      if (!value) {
        setVocalGender("");
        setVocalStyle("");
        setLyricsExpanded(false);
        updateData({ vocalGender: "", vocalStyle: "", lyrics: "" });
      }
    },
    [updateData],
  );

  const handleAiGenerate = useCallback(async () => {
    setAiProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    const generatedLyrics = `[Verse 1]\nСолнце встаёт над городом снова\nНовый день, новая дорога\nЯ иду навстречу мечтам\nИ ветер поёт мне о чудесах\n\n[Chorus]\nЭто моя история\nЭто мой путь\nЯ не боюсь начать всё сначала\nИ в небо взлететь`;
    setLyrics(generatedLyrics);
    updateData({ lyrics: generatedLyrics });
    setAiProcessing(false);
    setLyricsExpanded(true);
  }, [setAiProcessing, updateData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Вокал и текст</h3>
          <p className="text-sm text-muted-foreground">Настройте голос и добавьте текст</p>
        </div>
      </div>

      {/* Vocals toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleVocalsToggle(true)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all min-h-[44px]",
            hasVocals ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
          )}
        >
          <Mic className={cn("w-6 h-6", hasVocals && "text-primary")} />
          <span className="text-sm font-medium">С вокалом</span>
        </button>
        <button
          type="button"
          onClick={() => handleVocalsToggle(false)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all min-h-[44px]",
            !hasVocals ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
          )}
        >
          <MicOff className={cn("w-6 h-6", !hasVocals && "text-primary")} />
          <span className="text-sm font-medium">Инструментал</span>
        </button>
      </div>

      {/* Vocal options */}
      <AnimatePresence>
        {hasVocals && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Gender */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "", label: "Любой", icon: "🎭" },
                { id: "m", label: "Мужской", icon: "👨" },
                { id: "f", label: "Женский", icon: "👩" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setVocalGender(option.id as "" | "m" | "f");
                    updateData({ vocalGender: option.id as "" | "m" | "f" });
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all min-h-[44px]",
                    vocalGender === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <span>{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Vocal style */}
            <div className="grid grid-cols-2 gap-2">
              {VOCAL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    setVocalStyle(style.id);
                    updateData({ vocalStyle: style.id });
                  }}
                  className={cn(
                    "flex flex-col items-start gap-0.5 p-2.5 rounded-xl border transition-all text-left min-h-[44px]",
                    vocalStyle === style.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="text-sm font-medium">{style.label}</span>
                  <span className="text-[10px] text-muted-foreground">{style.description}</span>
                </button>
              ))}
            </div>

            {/* Collapsible lyrics section */}
            <div className="border border-border/50 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setLyricsExpanded(!lyricsExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Текст песни</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    опционально
                  </Badge>
                </div>
                <ChevronDown
                  className={cn("w-4 h-4 transition-transform", lyricsExpanded && "rotate-180")}
                />
              </button>

              <AnimatePresence>
                {lyricsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      <div className="flex gap-2">
                        {LANGUAGE_OPTIONS.map((option) => (
                          <Badge
                            key={option.id}
                            variant="outline"
                            className={cn(
                              "cursor-pointer transition-all px-2.5 py-1",
                              language === option.id ? "bg-primary/10 border-primary" : "hover:bg-muted",
                            )}
                            onClick={() => {
                              setLanguage(option.id);
                              updateData({ lyricsLanguage: option.id });
                            }}
                          >
                            <span className="mr-1">{option.flag}</span>
                            {option.label}
                          </Badge>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Введите текст или нажмите 'AI напишет'..."
                        value={lyrics}
                        onChange={(e) => {
                          setLyrics(e.target.value);
                          updateData({ lyrics: e.target.value });
                        }}
                        className="min-h-[120px] resize-none font-mono text-sm"
                        maxLength={3000}
                      />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{lyrics.length}/3000</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={handleAiGenerate}
                          disabled={isAiProcessing}
                        >
                          {isAiProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          AI напишет
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2 h-11" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <Button className="flex-1 gap-2 h-11" onClick={onNext}>
          Далее
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
