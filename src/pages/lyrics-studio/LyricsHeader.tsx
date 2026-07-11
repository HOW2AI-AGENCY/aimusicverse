/**
 * LyricsHeader — верхняя панель LyricsStudio в двух режимах:
 * - project-track mode: компактная шапка с обложкой/инфо/AI+Save
 * - standalone mode: AppHeader с EditableTitle + dropdown menu
 *
 * Извлечено из pages/LyricsStudio.tsx в Sprint 042 (god-page декомпозиция).
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { ChevronLeft, Save, Loader2, Bot, PenLine, Music2, FolderOpen, Tag, Plus, MoreVertical } from "@/lib/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppHeader } from "@/components/layout/AppHeader";
import { EditableTitle } from "@/components/ui/editable-title";

interface ProjectTrackForHeader {
  position: number;
}

interface ProjectDataForHeader {
  title: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
}

interface LyricsHeaderProps {
  /** Если true и projectData передан — рендерим компактную шапку проекта. */
  isProjectTrackMode: boolean;
  /** Данные проекта (только в project-mode). */
  projectData: ProjectDataForHeader | null;
  /** Позиция трека в проекте (только в project-mode). */
  projectTrack: ProjectTrackForHeader | null;
  /** Мобильный viewport (компактный header). */
  isMobile: boolean;
  /** Заголовок документа (для standalone AppHeader). */
  title: string;
  /** Состояние сохранения. */
  isSavingLyrics: boolean;
  /** Документ модифицирован (для подсветки Save). */
  isDirty: boolean;
  /** Глобальные теги документа (для chips в project-mode). */
  globalTags: string[];
  /** Enrichment-теги (только для счётчика в dropdown). */
  enrichedTags: string[];
  /** Колбэки. */
  onBack: () => void;
  onSave: () => void;
  onNewDocument: () => void;
  onOpenTemplates: () => void;
  onOpenAi: () => void;
  onOpenTags: () => void;
  onChangeTitle: (newTitle: string) => void;
  onHaptic?: () => void;
}

export function LyricsHeader({
  isProjectTrackMode,
  projectData,
  projectTrack,
  isMobile,
  title,
  isSavingLyrics,
  isDirty,
  globalTags,
  enrichedTags,
  onBack,
  onSave,
  onNewDocument,
  onOpenTemplates,
  onOpenAi,
  onOpenTags,
  onChangeTitle,
  onHaptic,
}: LyricsHeaderProps) {
  const haptic = onHaptic ?? (() => {});

  // Project Header для project mode
  if (isProjectTrackMode && projectData) {
    return (
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-md">
        {/* Compact header row */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Cover + info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 shadow-sm">
              {projectData.cover_url ? (
                <LazyImage src={projectData.cover_url} alt={projectData.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Music2 className="w-5 h-5 text-primary/50" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">
                {projectData.title} • #{(projectTrack?.position ?? 0) + 1}
              </p>
              <p className="text-sm font-semibold truncate">{title}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              onClick={() => {
                onOpenAi();
                haptic();
              }}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <Bot className="w-4 h-4" />
            </Button>
            <Button
              onClick={onSave}
              disabled={isSavingLyrics || !isDirty}
              size="icon"
              variant={isDirty ? "default" : "ghost"}
              className="h-8 w-8"
            >
              {isSavingLyrics ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Tags row - only if present */}
        {(projectData.genre || projectData.mood || globalTags.length > 0) && (
          <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide cursor-pointer" onClick={onOpenTags}>
            {projectData.genre && (
              <Badge variant="secondary" className="text-[10px] h-5 px-2 shrink-0 bg-primary/10 text-primary border-0">
                {projectData.genre}
              </Badge>
            )}
            {projectData.mood && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 shrink-0">
                {projectData.mood}
              </Badge>
            )}
            {globalTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-2 shrink-0">
                {tag}
              </Badge>
            ))}
            {globalTags.length > 3 && (
              <Badge variant="outline" className="text-[10px] h-5 px-2 shrink-0">
                +{globalTags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  // Standalone mode — стандартный AppHeader
  return (
    <AppHeader
      showLogo={isMobile}
      title={title}
      titleElement={
        <EditableTitle
          value={title}
          onChange={(newTitle) => {
            onChangeTitle(newTitle);
          }}
          placeholder="Название текста"
          size="md"
        />
      }
      icon={<PenLine className="w-4 h-4 text-primary" />}
      navSlot={
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ChevronLeft className="w-5 h-5" />
        </Button>
      }
      rightAction={
        <div className="flex items-center gap-1">
          <Button
            onClick={onSave}
            disabled={isSavingLyrics || !isDirty}
            size="icon"
            variant={isDirty ? "default" : "ghost"}
            className="h-8 w-8"
          >
            {isSavingLyrics ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuItem onClick={onOpenTemplates}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Мои тексты
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onOpenAi();
                  haptic();
                }}
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Ассистент
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onOpenTags();
                  haptic();
                }}
              >
                <Tag className="w-4 h-4 mr-2" />
                Теги ({globalTags.length + enrichedTags.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewDocument}>
                <Plus className="w-4 h-4 mr-2" />
                Новый текст
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  );
}
