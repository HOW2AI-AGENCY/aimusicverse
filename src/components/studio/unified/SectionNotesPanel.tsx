/**
 * SectionNotesPanel Component
 *
 * Panel component for managing section-specific notes in the Unified Studio.
 * Provides comprehensive note management with create, edit, delete, and resolve
 * functionality, with filtering and mobile-optimized touch targets.
 *
 * Features:
 * - Display all notes for a section grouped by type (general, production, lyric, arrangement)
 * - Add new notes with type selection
 * - Edit existing notes with inline editing
 * - Delete notes with confirmation
 * - Resolve/unresolve notes for tracking completion
 * - Filter notes by type and resolved status
 * - Telegram haptic feedback on all interactions
 * - Optimistic updates via TanStack Query
 * - Loading states and error handling
 * - Mobile-first responsive design with 44-56px touch targets
 *
 * @module src/components/studio/unified/SectionNotesPanel
 * @see src/hooks/useSectionNotes.ts for data management
 * @see src/types/studio-entities.ts for NoteType enum
 * @see src/api/lyrics.api.ts for API layer
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSectionNotes } from '@/hooks/useSectionNotes';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/contexts/AuthContext';
import { NoteType } from '@/types/studio-entities';
import { formatRelative } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Music,
  FileText,
  Layers,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Filter options for notes
 */
export interface NoteFilters {
  type: NoteType | 'all';
  resolved: 'all' | 'resolved' | 'unresolved';
}

/**
 * Props for SectionNotesPanel component
 */
export interface SectionNotesPanelProps {
  /** Section ID to fetch notes for */
  sectionId: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional height constraint (for mobile panels) */
  maxHeight?: string | number;
}

/**
 * Note type configuration with icon and label
 */
interface NoteTypeConfig {
  value: NoteType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Note type configurations for badges and UI
 */
const NOTE_TYPES: NoteTypeConfig[] = [
  {
    value: NoteType.GENERAL,
    label: 'Общие',
    icon: MessageSquare,
    color: 'text-blue-500',
    description: 'Общие заметки и комментарии',
  },
  {
    value: NoteType.PRODUCTION,
    label: 'Продакшн',
    icon: Music,
    color: 'text-purple-500',
    description: 'Заметки по продакшну и сведению',
  },
  {
    value: NoteType.LYRIC,
    label: 'Текст',
    icon: FileText,
    color: 'text-emerald-500',
    description: 'Заметки по тексту песни',
  },
  {
    value: NoteType.ARRANGEMENT,
    label: 'Аранжировка',
    icon: Layers,
    color: 'text-orange-500',
    description: 'Заметки по аранжировке',
  },
];

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * NoteTypeBadge - Display note type with icon and color
 */
interface NoteTypeBadgeProps {
  noteType: NoteType;
  className?: string;
}

const NoteTypeBadge = ({ noteType, className }: NoteTypeBadgeProps) => {
  const config = NOTE_TYPES.find((t) => t.value === noteType) || NOTE_TYPES[0];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 border-current/20 bg-current/5',
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

/**
 * NoteCard - Individual note display card
 */
interface NoteCardProps {
  id: string;
  content: string;
  noteType: NoteType;
  author: { username: string };
  createdAt: string;
  isResolved: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onResolve: () => void;
  onUnresolve: () => void;
  onSaveEdit: (content: string, noteType: NoteType) => void;
  onCancelEdit: () => void;
}

const NoteCard = memo(function NoteCard({
  id,
  content,
  noteType,
  author,
  createdAt,
  isResolved,
  isEditing,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
  onSaveEdit,
  onCancelEdit,
}: NoteCardProps) {
  const [editContent, setEditContent] = useState(content);
  const [editType, setEditType] = useState<NoteType>(noteType);
  const haptic = useHapticFeedback();

  const handleSaveEdit = useCallback(() => {
    if (editContent.trim() && editContent !== content) {
      haptic.success();
      onSaveEdit(editContent, editType);
    } else {
      haptic.tap();
      onCancelEdit();
    }
  }, [editContent, content, editType, haptic, onSaveEdit, onCancelEdit]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative rounded-xl border p-4 transition-all',
        isResolved
          ? 'border-border/40 bg-muted/30 opacity-60'
          : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-md'
      )}
    >
      {/* Note Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <NoteTypeBadge noteType={noteType} />
          {isResolved && (
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              Решено
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!isEditing && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  haptic.tap();
                  onEdit();
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => {
                  haptic.warning();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Note Content */}
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Редактировать заметку..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between gap-3">
            <Select value={editType} onValueChange={(v) => setEditType(v as NoteType)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className={cn('flex items-center gap-2', type.color)}>
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  haptic.tap();
                  onCancelEdit();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="default"
                size="icon"
                className="h-9 w-9"
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
          {content}
        </p>
      )}

      {/* Note Footer */}
      {!isEditing && (
        <div className="flex items-center justify-between border-t border-border/40 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{author.username}</span>
            <span>•</span>
            <time dateTime={createdAt}>{formatRelative(createdAt)}</time>
          </div>

          {/* Resolve Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 gap-1.5 text-xs',
              isResolved
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-success hover:text-success/80'
            )}
            onClick={() => {
              haptic.select();
              if (isResolved) {
                onUnresolve();
              } else {
                onResolve();
              }
            }}
          >
            {isResolved ? (
              <>
                <X className="h-3.5 w-3.5" />
                Вернуть
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Решить
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * SectionNotesPanel - Main panel component for managing section notes
 *
 * Provides a comprehensive interface for viewing, creating, editing, and managing
 * notes associated with a specific track section. Features include filtering by
 * type and resolved status, inline editing, and optimistic updates.
 *
 * @example
 * ```tsx
 * <SectionNotesPanel
 *   sectionId="section-uuid"
 *   maxHeight="600px"
 * />
 * ```
 */
export const SectionNotesPanel = memo(function SectionNotesPanel({
  sectionId,
  className,
  maxHeight,
}: SectionNotesPanelProps) {
  const { user } = useAuth();
  const { hapticFeedback: haptic } = useTelegram();
  const useHaptic = useHapticFeedback();

  // Filter states
  const [filters, setFilters] = useState<NoteFilters>({
    type: 'all',
    resolved: 'all',
  });

  // UI states
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>(NoteType.GENERAL);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch notes with mutations
  const {
    data: notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    resolveNote,
    isCreating,
    isUpdating,
    isDeleting,
    isResolving,
  } = useSectionNotes(sectionId);

  // --------------------------------------------------------------------------
  // FILTER LOGIC
  // --------------------------------------------------------------------------

  /**
   * Filter notes based on current filter state
   */
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Type filter
      if (filters.type !== 'all' && note.noteType !== filters.type) {
        return false;
      }

      // Resolved filter
      if (filters.resolved === 'resolved' && !note.isResolved) {
        return false;
      }
      if (filters.resolved === 'unresolved' && note.isResolved) {
        return false;
      }

      return true;
    });
  }, [notes, filters]);

  /**
   * Group notes by type for display
   */
  const groupedNotes = useMemo(() => {
    const groups: Record<NoteType | 'resolved', typeof filteredNotes> = {
      [NoteType.GENERAL]: [],
      [NoteType.PRODUCTION]: [],
      [NoteType.LYRIC]: [],
      [NoteType.ARRANGEMENT]: [],
      resolved: [],
    };

    filteredNotes.forEach((note) => {
      if (note.isResolved) {
        groups.resolved.push(note);
      } else {
        groups[note.noteType].push(note);
      }
    });

    return groups;
  }, [filteredNotes]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Handle creating a new note
   */
  const handleCreateNote = useCallback(async () => {
    if (!newNoteContent.trim() || !user?.id) return;

    try {
      haptic.success();
      await createNote({
        sectionId,
        userId: user.id,
        content: newNoteContent.trim(),
        noteType: newNoteType,
      });

      // Reset form
      setNewNoteContent('');
      setNewNoteType(NoteType.GENERAL);
      setIsAddingNote(false);
    } catch (err) {
      logger.error('Failed to create note', err, { sectionId });
      haptic.error();
    }
  }, [
    newNoteContent,
    newNoteType,
    sectionId,
    user?.id,
    createNote,
    haptic,
  ]);

  /**
   * Handle updating an existing note
   */
  const handleUpdateNote = useCallback(
    async (noteId: string, content: string, noteType: NoteType) => {
      try {
        haptic.success();
        await updateNote({
          noteId,
          content,
          noteType,
        });
        setEditingNoteId(null);
      } catch (err) {
        logger.error('Failed to update note', err, { noteId });
        haptic.error();
      }
    },
    [updateNote, haptic]
  );

  /**
   * Handle deleting a note with confirmation
   */
  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      // Show confirmation dialog
      const confirmed = await new Promise<boolean>((resolve) => {
        toast('Удалить заметку?', {
          description: 'Это действие нельзя отменить',
          action: {
            label: 'Удалить',
            onClick: () => resolve(true),
          },
          cancel: {
            label: 'Отмена',
            onClick: () => resolve(false),
          },
        });
      });

      if (!confirmed) {
        haptic.tap();
        return;
      }

      try {
        haptic.warning();
        await deleteNote(noteId);
      } catch (err) {
        logger.error('Failed to delete note', err, { noteId });
        haptic.error();
      }
    },
    [deleteNote, haptic]
  );

  /**
   * Handle resolving/unresolving a note
   */
  const handleToggleResolve = useCallback(
    async (noteId: string, isResolved: boolean) => {
      try {
        haptic.select();
        await resolveNote({
          noteId,
          isResolved,
        });
      } catch (err) {
        logger.error('Failed to resolve note', err, { noteId });
        haptic.error();
      }
    },
    [resolveNote, haptic]
  );

  /**
   * Reset filters to default
   */
  const handleResetFilters = useCallback(() => {
    haptic.tap();
    setFilters({ type: 'all', resolved: 'all' });
  }, [haptic]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden',
        maxHeight && 'max-h-[--max-height]',
        className
      )}
      style={
        maxHeight
          ? ({ '--max-height': typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } as React.CSSProperties)
          : undefined
      }
    >
      {/* Card Header */}
      <CardHeader className="shrink-0 space-y-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">Заметки секции</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{filteredNotes.length} заметок</span>
              <span>•</span>
              <span>
                {notes.filter((n) => !n.isResolved).length} нерешённых
              </span>
            </CardDescription>
          </div>

          {/* Filter Toggle */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => {
              haptic.tap();
              setShowFilters(!showFilters);
            }}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-3"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Тип
                </label>
                <Select
                  value={filters.type}
                  onValueChange={(v) => {
                    haptic.tap();
                    setFilters((prev) => ({ ...prev, type: v as NoteType | 'all' }));
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    {NOTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className={cn('flex items-center gap-2', type.color)}>
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolved Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Статус
                </label>
                <Select
                  value={filters.resolved}
                  onValueChange={(v) => {
                    haptic.tap();
                    setFilters((prev) => ({ ...prev, resolved: v as NoteFilters['resolved'] }));
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="unresolved">Нерешённые</SelectItem>
                    <SelectItem value="resolved">Решённые</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleResetFilters}
            >
              Сбросить фильтры
            </Button>
          </motion.div>
        )}

        {/* Add Note Button */}
        {!isAddingNote ? (
          <Button
            type="button"
            variant="default"
            className="w-full gap-2"
            onClick={() => {
              haptic.tap();
              setIsAddingNote(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Добавить заметку
          </Button>
        ) : (
          /* New Note Form */
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
          >
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Напишите заметку..."
              className="min-h-[120px] resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between gap-3">
              <Select value={newNoteType} onValueChange={(v) => setNewNoteType(v as NoteType)}>
                <SelectTrigger className="h-11 w-full max-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className={cn('flex items-center gap-2', type.color)}>
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => {
                    haptic.tap();
                    setIsAddingNote(false);
                    setNewNoteContent('');
                    setNewNoteType(NoteType.GENERAL);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="h-11 w-11"
                  onClick={handleCreateNote}
                  disabled={!newNoteContent.trim() || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </CardHeader>

      {/* Notes List */}
      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Ошибка загрузки заметок
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Попробовать снова
            </Button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Нет заметок</p>
              <p className="text-xs text-muted-foreground">
                {filters.type !== 'all' || filters.resolved !== 'all'
                  ? 'Попробуйте изменить фильтры'
                  : 'Добавьте первую заметку к этой секции'}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {/* Unresolved Notes by Type */}
            {Object.entries(groupedNotes)
              .filter(([key]) => key !== 'resolved')
              .map(([type, typeNotes]) =>
                typeNotes.length > 0 ? (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {NOTE_TYPES.find((t) => t.value === type)?.icon && (
                        <span
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-md',
                            NOTE_TYPES.find((t) => t.value === type)!.color,
                            'bg-current/10'
                          )}
                        >
                          {React.createElement(
                            NOTE_TYPES.find((t) => t.value === type)!.icon,
                            { className: 'h-3.5 w-3.5' }
                          )}
                        </span>
                      )}
                      <span className="text-sm font-medium">
                        {NOTE_TYPES.find((t) => t.value === type)?.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {typeNotes.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {typeNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          {...note}
                          isEditing={editingNoteId === note.id}
                          onEdit={() => {
                            haptic.tap();
                            setEditingNoteId(note.id);
                          }}
                          onDelete={() => handleDeleteNote(note.id)}
                          onResolve={() =>
                            handleToggleResolve(note.id, true)
                          }
                          onUnresolve={() =>
                            handleToggleResolve(note.id, false)
                          }
                          onSaveEdit={(content, noteType) =>
                            handleUpdateNote(note.id, content, noteType)
                          }
                          onCancelEdit={() => {
                            haptic.tap();
                            setEditingNoteId(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )}

            {/* Resolved Notes */}
            {groupedNotes.resolved.length > 0 && (
              <div className="space-y-3">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      Решённые ({groupedNotes.resolved.length})
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 space-y-2 pl-1">
                    {groupedNotes.resolved.map((note) => (
                      <NoteCard
                        key={note.id}
                        {...note}
                        isEditing={editingNoteId === note.id}
                        onEdit={() => {
                          haptic.tap();
                          setEditingNoteId(note.id);
                        }}
                        onDelete={() => handleDeleteNote(note.id)}
                        onResolve={() =>
                          handleToggleResolve(note.id, true)
                        }
                        onUnresolve={() =>
                          handleToggleResolve(note.id, false)
                        }
                        onSaveEdit={(content, noteType) =>
                          handleUpdateNote(note.id, content, noteType)
                        }
                        onCancelEdit={() => {
                          haptic.tap();
                          setEditingNoteId(null);
                        }}
                      />
                    ))}
                  </div>
                </details>
              </div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
});

// Import React for memo
import React, { memo } from 'react';
