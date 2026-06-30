/**
 * SectionNotesPanel — manage section-specific notes in the Unified Studio.
 *
 * @see src/hooks/useSectionNotes.ts for data management
 * @see src/types/studio-entities.ts for NoteType enum
 */

import { memo, useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "@/lib/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSectionNotes } from "@/hooks/useSectionNotes";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { NoteType } from "@/types/studio-entities";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { Plus, Filter, Check, Loader2, MessageSquare } from "@/lib/icons";
import { toast } from "sonner";

import { NoteFilters, SectionNotesPanelProps, NOTE_TYPES } from "./SectionNotesPanel/types";
import { NoteCard } from "./SectionNotesPanel/NoteCard";
import { NoteFilterPanel } from "./SectionNotesPanel/NoteFilterPanel";
import { AddNoteForm } from "./SectionNotesPanel/AddNoteForm";

export type { SectionNotesPanelProps, NoteFilters } from "./SectionNotesPanel/types";

export const SectionNotesPanel = memo(function SectionNotesPanel({
  sectionId,
  className,
  maxHeight,
}: SectionNotesPanelProps) {
  const { user } = useAuth();
  const haptic = useHapticFeedback();

  const [filters, setFilters] = useState<NoteFilters>({ type: "all", resolved: "all" });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<NoteType>(NoteType.GENERAL);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    resolveNote,
    isCreating,
  } = useSectionNotes(sectionId);

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        if (filters.type !== "all" && note.noteType !== filters.type) return false;
        if (filters.resolved === "resolved" && !note.isResolved) return false;
        if (filters.resolved === "unresolved" && note.isResolved) return false;
        return true;
      }),
    [notes, filters],
  );

  const groupedNotes = useMemo(() => {
    const groups: Record<NoteType | "resolved", typeof filteredNotes> = {
      [NoteType.GENERAL]: [],
      [NoteType.PRODUCTION]: [],
      [NoteType.LYRIC]: [],
      [NoteType.ARRANGEMENT]: [],
      resolved: [],
    };
    filteredNotes.forEach((note) => {
      if (note.isResolved) groups.resolved.push(note);
      else groups[note.noteType as NoteType].push(note);
    });
    return groups;
  }, [filteredNotes]);

  const handleCreateNote = useCallback(async () => {
    if (!newNoteContent.trim() || !user?.id) return;
    try {
      haptic.success();
      await createNote({ sectionId, userId: user.id, content: newNoteContent.trim(), noteType: newNoteType });
      setNewNoteContent("");
      setNewNoteType(NoteType.GENERAL);
      setIsAddingNote(false);
    } catch (err) {
      logger.error("Failed to create note", err, { sectionId });
      haptic.error();
    }
  }, [newNoteContent, newNoteType, sectionId, user?.id, createNote, haptic]);

  const handleUpdateNote = useCallback(
    async (noteId: string, content: string, noteType: NoteType) => {
      try {
        haptic.success();
        await updateNote({ noteId, content, noteType });
        setEditingNoteId(null);
      } catch (err) {
        logger.error("Failed to update note", err, { noteId });
        haptic.error();
      }
    },
    [updateNote, haptic],
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      const confirmed = await new Promise<boolean>((resolve) => {
        toast("Удалить заметку?", {
          description: "Это действие нельзя отменить",
          action: { label: "Удалить", onClick: () => resolve(true) },
          cancel: { label: "Отмена", onClick: () => resolve(false) },
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
        logger.error("Failed to delete note", err, { noteId });
        haptic.error();
      }
    },
    [deleteNote, haptic],
  );

  const handleToggleResolve = useCallback(
    async (noteId: string, isResolved: boolean) => {
      try {
        haptic.select();
        await resolveNote({ noteId, isResolved });
      } catch (err) {
        logger.error("Failed to resolve note", err, { noteId });
        haptic.error();
      }
    },
    [resolveNote, haptic],
  );

  const handleResetFilters = useCallback(() => {
    haptic.tap();
    setFilters({ type: "all", resolved: "all" });
  }, [haptic]);

  const noteCardProps = useCallback(
    (noteId: string) => ({
      isEditing: editingNoteId === noteId,
      onEdit: () => {
        haptic.tap();
        setEditingNoteId(noteId);
      },
      onDelete: () => handleDeleteNote(noteId),
      onResolve: () => handleToggleResolve(noteId, true),
      onUnresolve: () => handleToggleResolve(noteId, false),
      onSaveEdit: (content: string, noteType: NoteType) => handleUpdateNote(noteId, content, noteType),
      onCancelEdit: () => {
        haptic.tap();
        setEditingNoteId(null);
      },
    }),
    [editingNoteId, haptic, handleDeleteNote, handleToggleResolve, handleUpdateNote],
  );

  return (
    <Card
      className={cn("flex flex-col overflow-hidden", maxHeight && "max-h-[--max-height]", className)}
      style={
        maxHeight
          ? ({ "--max-height": typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight } as React.CSSProperties)
          : undefined
      }
    >
      <CardHeader className="shrink-0 space-y-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg">Заметки секции</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{filteredNotes.length} заметок</span>
              <span>•</span>
              <span>{notes.filter((n) => !n.isResolved).length} нерешённых</span>
            </CardDescription>
          </div>
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

        {showFilters && <NoteFilterPanel filters={filters} onFilterChange={setFilters} onReset={handleResetFilters} />}

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
          <AddNoteForm
            content={newNoteContent}
            noteType={newNoteType}
            isCreating={isCreating}
            onContentChange={setNewNoteContent}
            onTypeChange={setNewNoteType}
            onSubmit={handleCreateNote}
            onCancel={() => {
              haptic.tap();
              setIsAddingNote(false);
              setNewNoteContent("");
              setNewNoteType(NoteType.GENERAL);
            }}
          />
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">Ошибка загрузки заметок</p>
            <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
              Попробовать снова
            </Button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Нет заметок</p>
              <p className="text-xs text-muted-foreground">
                {filters.type !== "all" || filters.resolved !== "all"
                  ? "Попробуйте изменить фильтры"
                  : "Добавьте первую заметку к этой секции"}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedNotes)
              .filter(([key]) => key !== "resolved")
              .map(([type, typeNotes]) => {
                if (typeNotes.length === 0) return null;
                const typeConfig = NOTE_TYPES.find((t) => t.value === type);
                const TypeIcon = typeConfig?.icon;
                return (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {TypeIcon && (
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md",
                            typeConfig.color,
                            "bg-current/10",
                          )}
                        >
                          <TypeIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="text-sm font-medium">{typeConfig?.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {typeNotes.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {typeNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          id={note.id}
                          content={note.content}
                          noteType={note.noteType as NoteType}
                          author={note.author}
                          createdAt={note.createdAt}
                          isResolved={note.isResolved}
                          {...noteCardProps(note.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

            {groupedNotes.resolved.length > 0 && (
              <div className="space-y-3">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50">
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" />
                      Решённые ({groupedNotes.resolved.length})
                    </span>
                    <span className="transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <div className="mt-3 space-y-2 pl-1">
                    {groupedNotes.resolved.map((note) => (
                      <NoteCard
                        key={note.id}
                        id={note.id}
                        content={note.content}
                        noteType={note.noteType as NoteType}
                        author={note.author}
                        createdAt={note.createdAt}
                        isResolved={note.isResolved}
                        {...noteCardProps(note.id)}
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
