/**
 * Studio Actions Sheet
 * Bottom sheet with studio actions for mobile
 * Contains: Download, Transcription, Export, Save, Settings
 * Uses design system tokens (Spec 032)
 *
 * Unified interface - MusicLab and Lyrics open as sheets, not tabs
 */

import { memo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Download,
  Save,
  FileMusic,
  Music2,
  Settings,
  Share2,
  Plus,
  Sparkles,
  Upload,
  ArrowLeft,
  FileText,
  FlaskConical,
  Layers,
  SlidersHorizontal,
  BarChart3,
} from "@/lib/icons";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { glass } from "@/lib/glass";

interface StudioActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onExport: () => void;
  onOpenDownload: () => void;
  onOpenTranscription: () => void;
  onAddTrack: () => void;
  onGenerate: () => void;
  onImport: () => void;
  onBack: () => void;
  /** Open MusicLab (unified interface) */
  onOpenMusicLab?: () => void;
  /** Open Lyrics editor (unified interface) */
  onOpenLyrics?: () => void;
  /** Open Presets library (apply/save mixer & effects presets) */
  onOpenPresets?: () => void;
  /** Open studio statistics dashboard */
  onOpenDashboard?: () => void;
  /** Open Batch Processing panel */
  onOpenBatchProcessing?: () => void;
}

interface ActionItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "primary" | "destructive";
  disabled?: boolean;
}

const ActionItem = memo(function ActionItem({
  icon,
  label,
  description,
  onClick,
  variant = "default",
  disabled,
}: ActionItemProps) {
  const haptic = useHapticFeedback();

  const handleClick = () => {
    haptic.select();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl transition-all touch-manipulation",
        glass.subtle,
        "hover:ring-1 hover:ring-primary/20 active:scale-[0.97]",
        variant === "primary" && "ring-1 ring-primary/30",
        variant === "destructive" && "text-destructive",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          variant === "default" && glass.subtle,
          variant === "primary" && "bg-primary text-primary-foreground",
          variant === "destructive" && "bg-destructive/10 text-destructive",
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-xs text-muted-foreground truncate">{description}</span>}
      </div>
    </button>
  );
});

export const StudioActionsSheet = memo(function StudioActionsSheet({
  open,
  onOpenChange,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onExport,
  onOpenDownload,
  onOpenTranscription,
  onAddTrack,
  onGenerate,
  onImport,
  onBack,
  onOpenMusicLab,
  onOpenLyrics,
  onOpenPresets,
  onOpenDashboard,
  onOpenBatchProcessing,
}: StudioActionsSheetProps) {
  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn("px-4 pb-8", glass.overlay)}>
        <SheetHeader className="pb-2">
          <SheetTitle>Действия</SheetTitle>
        </SheetHeader>

        <div className="space-y-1">
          {/* Creative tools - MusicLab and Lyrics (unified interface) */}
          {(onOpenMusicLab || onOpenLyrics || onOpenPresets || onOpenDashboard) && (
            <div className="space-y-1 pb-3 border-b border-border/50">
              {onOpenMusicLab && (
                <ActionItem
                  icon={<FlaskConical className="w-5 h-5" />}
                  label="Лаборатория"
                  description="Запись, аккорды, PromptDJ"
                  onClick={() => handleAction(onOpenMusicLab)}
                  variant="primary"
                />
              )}
              {onOpenLyrics && (
                <ActionItem
                  icon={<FileText className="w-5 h-5" />}
                  label="Редактор текста"
                  description="AI помощник, версии"
                  onClick={() => handleAction(onOpenLyrics)}
                />
              )}
              {onOpenPresets && (
                <ActionItem
                  icon={<SlidersHorizontal className="w-5 h-5" />}
                  label="Пресеты"
                  description="Применить или сохранить настройки"
                  onClick={() => handleAction(onOpenPresets)}
                />
              )}
              {onOpenDashboard && (
                <ActionItem
                  icon={<BarChart3 className="w-5 h-5" />}
                  label="Статистика"
                  description="Метрики и активность студии"
                  onClick={() => handleAction(onOpenDashboard)}
                />
              )}
            </div>
          )}

          {/* Primary actions */}
          <div className="space-y-1 pb-3 border-b border-border/50">
            <ActionItem
              icon={<Sparkles className="w-5 h-5" />}
              label="Создать"
              description="AI генерация нового трека"
              onClick={() => handleAction(onGenerate)}
              variant="primary"
            />
            <ActionItem
              icon={<Plus className="w-5 h-5" />}
              label="Добавить дорожку"
              description="Новая пустая дорожка"
              onClick={() => handleAction(onAddTrack)}
            />
            <ActionItem
              icon={<Upload className="w-5 h-5" />}
              label="Импорт аудио"
              description="Загрузить аудиофайл"
              onClick={() => handleAction(onImport)}
            />
          </div>

          {/* Tools */}
          <div className="space-y-1 py-3 border-b border-border/50">
            <ActionItem
              icon={<Download className="w-5 h-5" />}
              label="Скачать стемы"
              description="MP3, WAV, ZIP"
              onClick={() => handleAction(onOpenDownload)}
            />
            <ActionItem
              icon={<Music2 className="w-5 h-5" />}
              label="Транскрипция"
              description="MIDI, ноты, табулатура"
              onClick={() => handleAction(onOpenTranscription)}
            />
            {onOpenBatchProcessing && (
              <ActionItem
                icon={<Layers className="w-5 h-5" />}
                label="Пакетная обработка"
                description="Массовая транскрипция и разделение"
                onClick={() => handleAction(onOpenBatchProcessing)}
              />
            )}
            <ActionItem
              icon={<Share2 className="w-5 h-5" />}
              label="Экспорт микса"
              description="Объединить все дорожки"
              onClick={() => handleAction(onExport)}
            />
          </div>

          {/* Project actions */}
          <div className="space-y-1 pt-3">
            <ActionItem
              icon={<Save className="w-5 h-5" />}
              label={isSaving ? "Сохранение..." : "Сохранить проект"}
              description={hasUnsavedChanges ? "Есть несохранённые изменения" : "Все изменения сохранены"}
              onClick={() => handleAction(onSave)}
              disabled={isSaving || !hasUnsavedChanges}
            />
            <ActionItem
              icon={<ArrowLeft className="w-5 h-5" />}
              label="Назад"
              description="Вернуться к проектам"
              onClick={() => handleAction(onBack)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
