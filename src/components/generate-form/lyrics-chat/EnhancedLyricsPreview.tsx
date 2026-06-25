import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  MessageSquarePlus,
  Edit3,
  Wand2,
  Music2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StructuredLyricsDisplay } from "@/components/lyrics/StructuredLyricsDisplay";
import { buttonVariants } from "@/lib/lyrics/constants";
interface EnhancedLyricsPreviewProps {
  lyrics: string;
  title?: string | null;
  style?: string | null;
  copied: boolean;
  saved: boolean;
  isSaving: boolean;
  isLoading: boolean;
  onCopy: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  onApply: () => void;
  onContinue: () => void;
  onRequestEdit?: (instruction: string) => void;
  onTitleChange?: (title: string) => void;
  onStyleChange?: (style: string) => void;
  /** Enable full height mode for mobile */
  fullHeight?: boolean;
  /** Show apply button in UI (false when MainButton is used) */
  showApplyButton?: boolean;
}

const QUICK_EDIT_SUGGESTIONS = [
  { label: "🎸 Энергичнее", prompt: "Сделай текст более энергичным и драйвовым" },
  { label: "💔 Эмоциональнее", prompt: "Добавь больше эмоций и глубины" },
  { label: "🏷️ Больше тегов", prompt: "Добавь больше профессиональных тегов Suno V5" },
  { label: "✨ Лучше рифмы", prompt: "Улучши рифмы и ритмику текста" },
  { label: "📝 Короче", prompt: "Сократи текст, оставив самое важное" },
  { label: "🌊 Атмосфернее", prompt: "Добавь больше атмосферы и образности" },
];

export function EnhancedLyricsPreview({
  lyrics,
  title,
  style,
  copied,
  saved,
  isSaving,
  isLoading,
  onCopy,
  onSave,
  onRegenerate,
  onApply,
  onContinue,
  onRequestEdit,
  onTitleChange,
  onStyleChange,
  fullHeight = false,
  showApplyButton = true,
}: EnhancedLyricsPreviewProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || "");
  const [editedStyle, setEditedStyle] = useState(style || "");
  const [showQuickEdits, setShowQuickEdits] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");

  const handleQuickEdit = useCallback(
    (prompt: string) => {
      onRequestEdit?.(prompt);
      setShowQuickEdits(false);
    },
    [onRequestEdit],
  );

  const handleCustomEdit = useCallback(() => {
    if (customInstruction.trim()) {
      onRequestEdit?.(customInstruction);
      setCustomInstruction("");
      setShowQuickEdits(false);
    }
  }, [customInstruction, onRequestEdit]);

  const handleSaveMetadata = useCallback(() => {
    if (editedTitle !== title) onTitleChange?.(editedTitle);
    if (editedStyle !== style) onStyleChange?.(editedStyle);
    setEditMode(false);
  }, [editedTitle, editedStyle, title, style, onTitleChange, onStyleChange]);

  // Update edited values when props change
  useEffect(() => {
    setEditedTitle(title || "");
    setEditedStyle(style || "");
  }, [title, style]);

  return (
    <motion.div
      className="mt-3 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Title & Style Section */}
      <motion.div
        className={cn("rounded-xl overflow-hidden", glass.card)}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header with title */}
        <div className={cn("px-3 py-2.5 border-b border-border/30", glass.subtle)}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Music2 className="h-4 w-4 text-primary shrink-0" />
              {editMode ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Название трека..."
                  className="h-7 text-sm font-medium bg-background/50"
                />
              ) : (
                <span className="text-sm font-semibold truncate">{title || "Без названия"}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => (editMode ? handleSaveMetadata() : setEditMode(true))}
            >
              {editMode ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Style prompt */}
        {(style || editMode) && (
          <div className="px-3 py-2 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary/70 mt-0.5 shrink-0" />
              {editMode ? (
                <Textarea
                  value={editedStyle}
                  onChange={(e) => setEditedStyle(e.target.value)}
                  placeholder="Стиль (жанр, настроение, инструменты)..."
                  className="min-h-[60px] text-xs bg-background/50 resize-none"
                />
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">{style || "Стиль не задан"}</p>
              )}
            </div>
          </div>
        )}

        {/* Lyrics display - expanded height for mobile, flex-grow to fill space */}
        <ScrollArea className={cn("flex-1", fullHeight ? "min-h-[250px]" : "max-h-[200px] sm:max-h-[320px]")}>
          <div className="p-3 pb-6">
            <StructuredLyricsDisplay
              lyrics={lyrics}
              showMetadata={false}
              className="border-0 shadow-none bg-transparent p-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
            />
          </div>
        </ScrollArea>
      </motion.div>

      {/* Quick Edit Suggestions */}
      <AnimatePresence>
        {showQuickEdits && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EDIT_SUGGESTIONS.map((suggestion, idx) => (
                <motion.button
                  key={suggestion.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-2.5 py-1.5 text-xs bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  onClick={() => handleQuickEdit(suggestion.prompt)}
                  disabled={isLoading}
                >
                  {suggestion.label}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Своя инструкция для редактирования..."
                className="flex-1 h-8 text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleCustomEdit()}
                disabled={isLoading}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-3"
                onClick={handleCustomEdit}
                disabled={!customInstruction.trim() || isLoading}
              >
                <Wand2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons - responsive grid */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-medium transition-colors"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Скопировано" : "Копировать"}
        </motion.button>

        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50",
            saved ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-secondary/50 hover:bg-secondary",
          )}
          onClick={onSave}
          disabled={isSaving || saved}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <BookmarkCheck className="h-3.5 w-3.5" />
          ) : (
            <Bookmark className="h-3.5 w-3.5" />
          )}
          {saved ? "Сохранено" : "Сохранить"}
        </motion.button>

        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-medium transition-colors"
          onClick={() => setShowQuickEdits(!showQuickEdits)}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Изменить
          {showQuickEdits ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </motion.button>

        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          onClick={onRegenerate}
          disabled={isLoading}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Заново
        </motion.button>

        {/* Apply button - only show if MainButton is not being used */}
        {showApplyButton && (
          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium shadow-lg"
            onClick={onApply}
          >
            <Check className="h-3.5 w-3.5" />
            Применить
          </motion.button>
        )}
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-muted-foreground text-center">
        💡 Используйте "Изменить" для быстрых правок или напишите в чат
      </p>
    </motion.div>
  );
}
