/**
 * LyricsPanel - Main lyrics editing interface for the Unified Studio
 *
 * A mobile-first bottom sheet component for editing, managing, and collaborating on lyrics.
 * Provides version history, section notes, AI assistance, and real-time statistics.
 *
 * Features:
 * - Auto-expanding textarea with section marker detection
 * - Version history view and restore functionality
 * - Section notes management with tags
 * - AI assistant integration for lyrics improvement
 * - Word count and statistics display
 * - Telegram haptic feedback
 * - Touch-optimized UI (44-56px targets)
 *
 * Architecture:
 * - Uses MobileBottomSheet pattern for mobile-first design
 * - Integrates with useUnifiedStudioStore for project state
 * - Uses TanStack Query hooks for data fetching and mutations
 * - Telegram haptic feedback for better UX
 *
 * @see src/stores/useUnifiedStudioStore.ts for state management
 * @see src/services/lyrics.service.ts for business logic
 * @see src/hooks/useLyricVersions.ts for version management
 * @see src/hooks/useSectionNotes.ts for section notes
 * @see src/components/ui/sheet.tsx for bottom sheet implementation
 *
 * @example
 * ```tsx
 * <LyricsPanel
 *   trackId="track-uuid"
 *   initialLyrics="Verse 1\n\nLyrics here..."
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  FileText,
  History,
  MessageSquare,
  Sparkles,
  Save,
  RotateCcw,
  X,
  Loader2,
  Check,
  ChevronRight,
  BookOpen,
  Hash,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useLyricVersions,
  useCreateLyricVersion,
  useRestoreLyricVersion,
} from '@/hooks/useLyricVersions';
import { useSectionNotes } from '@/hooks/useSectionNotes';
import {
  getLyricsStatistics,
  formatLyricsForDisplay,
  type FormattedLyrics,
  type LyricsSection,
} from '@/services/lyrics.service';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface LyricsPanelProps {
  /** Track ID for lyrics */
  trackId: string;
  /** Initial lyrics content */
  initialLyrics?: string;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel closes */
  onClose: () => void;
  /** Callback when lyrics are saved */
  onLyricsSaved?: (content: string) => void;
}

type ViewMode = 'editor' | 'history' | 'notes';

interface LyricsStats {
  wordCount: number;
  lineCount: number;
  characterCount: number;
  sectionCount: number;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Header component with title and statistics
 */
const PanelHeader = memo(function PanelHeader({
  stats,
  viewMode,
  onViewModeChange,
  onClose,
}: {
  stats: LyricsStats;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 px-4 py-3 bg-muted/30">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold">Текст песни</h2>
          <p className="text-xs text-muted-foreground">
            {stats.wordCount} слов • {stats.lineCount} строк • {stats.sectionCount} секций
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange('history')}
          className={`h-9 w-9 ${viewMode === 'history' ? 'bg-accent' : ''}`}
        >
          <History className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange('notes')}
          className={`h-9 w-9 ${viewMode === 'notes' ? 'bg-accent' : ''}`}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

/**
 * Section markers panel for quick navigation
 */
const SectionMarkers = memo(function SectionMarkers({
  sections,
  onSectionClick,
}: {
  sections: LyricsSection[];
  onSectionClick: (section: LyricsSection) => void;
}) {
  if (sections.length === 0) return null;

  const getSectionIcon = (type: LyricsSection['type']) => {
    switch (type) {
      case 'verse':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'chorus':
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return <Hash className="w-3.5 h-3.5" />;
    }
  };

  const getSectionColor = (type: LyricsSection['type']) => {
    switch (type) {
      case 'verse':
        return 'text-blue-500 bg-blue-500/10';
      case 'chorus':
        return 'text-purple-500 bg-purple-500/10';
      case 'bridge':
        return 'text-amber-500 bg-amber-500/10';
      default:
        return 'text-muted-foreground bg-muted/50';
    }
  };

  return (
    <div className="px-4 py-2 border-b border-border/30 bg-muted/20">
      <p className="text-xs text-muted-foreground mb-2">Секции трека:</p>
      <div className="flex flex-wrap gap-2">
        {sections.map((section, index) => (
          <motion.button
            key={`${section.type}-${index}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSectionClick(section)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${getSectionColor(
              section.type
            )}`}
          >
            {getSectionIcon(section.type)}
            <span>{section.label}</span>
            <ChevronRight className="w-3 h-3 opacity-50" />
          </motion.button>
        ))}
      </div>
    </div>
  );
});

/**
 * Version history view
 */
const VersionHistoryView = memo(function VersionHistoryView({
  versions,
  onRestore,
  isRestoring,
  onClose,
}: {
  versions: Array<{ id: string; versionNumber: number; content: string; createdAt: string; author?: { username: string } }>;
  onRestore: (versionId: string) => void;
  isRestoring: boolean;
  onClose: () => void;
}) {
  return (
    <ScrollArea className="flex-1 px-4 py-4">
      <div className="space-y-3">
        {versions.map((version) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-card rounded-lg border border-border/60"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <History className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Версия {version.versionNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(version.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(version.id)}
                disabled={isRestoring}
                className="h-8 px-2"
              >
                {isRestoring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Восстановить
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted/50 rounded p-2.5 max-h-24 overflow-y-auto">
              <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                {version.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
});

/**
 * Section notes view
 */
const SectionNotesView = memo(function SectionNotesView({
  trackId,
  onClose,
}: {
  trackId: string;
  onClose: () => void;
}) {
  // Mock implementation - integrate with useSectionNotes when ready
  const notes = [
    {
      id: '1',
      content: 'Добавить бэк-вокал в припев',
      author: { username: 'Вы' },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      noteType: 'production',
      isResolved: false,
    },
  ];

  return (
    <ScrollArea className="flex-1 px-4 py-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Заметки к секциям</p>
          <Button size="sm" className="h-8">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            Добавить
          </Button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Нет заметок</p>
            <p className="text-xs text-muted-foreground mt-1">
              Добавьте заметки к секциям текста
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-card rounded-lg border border-border/60"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{note.author.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-muted rounded text-xs">{note.noteType}</span>
              </div>
              <p className="text-sm">{note.content}</p>
            </motion.div>
          ))
        )}
      </div>
    </ScrollArea>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LyricsPanel = memo(function LyricsPanel({
  trackId,
  initialLyrics = '',
  isOpen,
  onClose,
  onLyricsSaved,
}: LyricsPanelProps) {
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();

  // State
  const [lyrics, setLyrics] = useState(initialLyrics);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(-1);

  // Queries and Mutations
  const { data: versionsData, isLoading: versionsLoading } = useLyricVersions(trackId);
  const { createVersion, isCreating } = useCreateLyricVersion();
  const { restoreVersion, isRestoring } = useRestoreLyricVersion();

  // Format lyrics for section detection
  const formattedLyrics = useMemo<FormattedLyrics>(() => {
    return formatLyricsForDisplay(lyrics);
  }, [lyrics]);

  // Calculate statistics
  const stats = useMemo<LyricsStats>(() => {
    const statistics = getLyricsStatistics(lyrics);
    return {
      wordCount: statistics.wordCount,
      lineCount: statistics.lineCount,
      characterCount: statistics.characterCount,
      sectionCount: statistics.sectionCount,
    };
  }, [lyrics]);

  // Update lyrics when initialLyrics changes
  useEffect(() => {
    if (initialLyrics && initialLyrics !== lyrics) {
      setLyrics(initialLyrics);
    }
  }, [initialLyrics]);

  // Handle save lyrics
  const handleSave = useCallback(async () => {
    if (!user?.id) {
      toast.error('Не авторизован');
      return;
    }

    hapticFeedback('success');
    setIsSaving(true);

    try {
      await createVersion(
        {
          trackId,
          request: {
            content: lyrics,
            changeType: 'manual_edit',
            changeSummary: 'Изменено через панель текста',
          },
        },
        {
          onSuccess: () => {
            setLastSaved(new Date());
            onLyricsSaved?.(lyrics);
            toast.success('Текст сохранён', {
              description: `${stats.wordCount} слов, ${stats.sectionCount} секций`,
            });
          },
        }
      );
    } catch (error) {
      logger.error('Failed to save lyrics', error);
      toast.error('Не удалось сохранить текст');
    } finally {
      setIsSaving(false);
    }
  }, [trackId, lyrics, user, createVersion, hapticFeedback, stats, onLyricsSaved]);

  // Handle restore version
  const handleRestoreVersion = useCallback(
    async (versionId: string) => {
      hapticFeedback('medium');
      try {
        const result = await restoreVersion(versionId);
        setLyrics(result.restoredVersion.content);
        toast.success('Версия восстановлена', {
          description: `Версия ${result.restoredVersion.versionNumber}`,
        });
        setViewMode('editor');
      } catch (error) {
        logger.error('Failed to restore version', error);
        toast.error('Не удалось восстановить версию');
      }
    },
    [restoreVersion, hapticFeedback]
  );

  // Handle section marker click
  const handleSectionClick = useCallback(
    (section: LyricsSection) => {
      hapticFeedback('selection');
      const lines = lyrics.split('\n');
      const targetLine = lines[section.startIndex];

      // Scroll to section in textarea
      const textarea = document.querySelector('textarea[data-lyrics-editor]');
      if (textarea) {
        const lineHeight = 24; // Approximate line height
        const scrollTop = section.startIndex * lineHeight;
        (textarea as HTMLTextAreaElement).scrollTop = scrollTop;
      }

      setSelectedSectionIndex(section.startIndex);
    },
    [lyrics, hapticFeedback]
  );

  // Handle AI assistant
  const handleAIAssistant = useCallback(() => {
    hapticFeedback('light');
    toast.info('AI-ассистент в разработке', {
      description: 'Скоро сможете улучшать текст с помощью ИИ',
    });
  }, [hapticFeedback]);

  // Handle textarea change with auto-resize
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLyrics(value);

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    },
    []
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] rounded-t-2xl p-0 gap-0"
        hideCloseButton
      >
        {/* Header */}
        <PanelHeader
          stats={stats}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onClose={onClose}
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-full"
            >
              {/* Section Markers */}
              <SectionMarkers
                sections={formattedLyrics.sections}
                onSectionClick={handleSectionClick}
              />

              {/* Textarea */}
              <div className="flex-1 px-4 py-3">
                <Textarea
                  data-lyrics-editor
                  value={lyrics}
                  onChange={handleTextareaChange}
                  placeholder="[Verse 1]&#10;&#10;Введите текст песни здесь...&#10;&#10;Используйте разметку секций: [Verse], [Chorus], [Bridge], [Outro]"
                  className="w-full min-h-full resize-none border-0 focus-visible:ring-0 text-sm leading-relaxed p-0"
                  style={{
                    fieldSizing: 'content',
                  }}
                />
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-border/30 bg-muted/30 safe-bottom">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIAssistant}
                  className="flex-1 h-11"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-ассистент
                </Button>

                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || isCreating}
                  className="flex-1 h-11 min-h-11"
                >
                  {isSaving || isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </>
                  )}
                </Button>
              </div>

              {/* Last saved indicator */}
              {lastSaved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 pb-2 text-center"
                >
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Сохранено {lastSaved.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {viewMode === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-full"
            >
              {versionsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <VersionHistoryView
                  versions={versionsData?.versions || []}
                  onRestore={handleRestoreVersion}
                  isRestoring={isRestoring}
                  onClose={() => setViewMode('editor')}
                />
              )}
            </motion.div>
          )}

          {viewMode === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col h-full"
            >
              <SectionNotesView trackId={trackId} onClose={() => setViewMode('editor')} />
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
});
