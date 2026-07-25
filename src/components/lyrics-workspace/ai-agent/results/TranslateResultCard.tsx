/**
 * TranslateResultCard - Display adaptive translation results
 */

import { motion } from "@/lib/motion";
import { Languages, Copy, Check, ArrowRight, AlertCircle, Sparkles } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { hapticImpact } from "@/lib/haptic";

interface TranslateResultCardProps {
  originalText?: string;
  translatedLyrics: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  adaptationNotes?: string[];
  syllablePreserved?: boolean;
  onApply?: (text: string) => void;
}

export function TranslateResultCard({
  originalText,
  translatedLyrics,
  sourceLanguage = "RU",
  targetLanguage = "EN",
  adaptationNotes,
  syllablePreserved,
  onApply,
}: TranslateResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedLyrics);
      setCopied(true);
      hapticImpact("light");
      toast.success("Перевод скопирован!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const handleApply = () => {
    setApplied(true);
    hapticImpact("medium");
    onApply?.(translatedLyrics);
    toast.success("Перевод применён!");
  };

  const getLanguageFlag = (lang: string) => {
    const lowerLang = lang.toLowerCase();
    if (lowerLang.includes("ru") || lowerLang.includes("рус")) return "🇷🇺";
    if (lowerLang.includes("en") || lowerLang.includes("англ")) return "🇺🇸";
    if (lowerLang.includes("es") || lowerLang.includes("исп")) return "🇪🇸";
    if (lowerLang.includes("fr") || lowerLang.includes("фран")) return "🇫🇷";
    if (lowerLang.includes("de") || lowerLang.includes("нем")) return "🇩🇪";
    return "🌐";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 bg-background/80 rounded-xl border border-border/50 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Languages className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Адаптивный перевод</h4>
            <div className="flex items-center gap-1 text-[0.625rem] text-muted-foreground">
              <span>
                {getLanguageFlag(sourceLanguage)} {sourceLanguage}
              </span>
              <ArrowRight className="w-2.5 h-2.5" />
              <span>
                {getLanguageFlag(targetLanguage)} {targetLanguage}
              </span>
            </div>
          </div>
        </div>

        {syllablePreserved && (
          <Badge variant="secondary" className="text-[0.5625rem] bg-green-500/20 text-green-300">
            ✓ Ритм сохранён
          </Badge>
        )}
      </div>

      {/* Translation Comparison */}
      <div className="grid grid-cols-1 gap-2">
        {/* Original (if provided) */}
        {originalText && (
          <div className="p-2.5 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{getLanguageFlag(sourceLanguage)}</span>
              <span className="text-[0.625rem] text-muted-foreground font-medium">Оригинал</span>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {originalText}
            </pre>
          </div>
        )}

        {/* Translated */}
        <div
          className={cn(
            "p-2.5 rounded-lg border transition-colors",
            applied ? "bg-indigo-500/20 border-indigo-500/50" : "bg-indigo-500/10 border-indigo-500/30",
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{getLanguageFlag(targetLanguage)}</span>
              <span className="text-[0.625rem] text-indigo-300 font-medium">Перевод</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
          <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {translatedLyrics}
          </pre>
        </div>
      </div>

      {/* Adaptation Notes */}
      {adaptationNotes && adaptationNotes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[0.625rem] font-medium text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Примечания по адаптации:
          </p>
          <div className="space-y-1">
            {adaptationNotes.map((note, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 text-[0.625rem] text-muted-foreground bg-muted/20 p-1.5 rounded"
              >
                <Sparkles className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Button */}
      {onApply && (
        <Button
          size="sm"
          onClick={handleApply}
          disabled={applied}
          className={cn("w-full gap-2 text-xs", applied && "bg-green-500/20 text-green-300")}
        >
          {applied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Перевод применён
            </>
          ) : (
            <>
              <ArrowRight className="w-3.5 h-3.5" />
              Применить перевод
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
}
