import { memo, useState, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { NoteType } from "@/types/studio-entities";
import { formatRelative } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Edit2, Trash2, Check, X } from "@/lib/icons";
import { NoteTypeBadge } from "./NoteTypeBadge";
import { NOTE_TYPES } from "./types";

export interface NoteCardProps {
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

export const NoteCard = memo(function NoteCard({
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
        "group relative rounded-xl border p-4 transition-all",
        isResolved
          ? "border-border/40 bg-muted/30 opacity-60"
          : "border-border/60 bg-card hover:border-primary/40 hover:shadow-md",
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
                    <span className={cn("flex items-center gap-2", type.color)}>
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
        <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
      )}

      {/* Note Footer */}
      {!isEditing && (
        <div className="flex items-center justify-between border-t border-border/40 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{author.username}</span>
            <span>•</span>
            <time dateTime={createdAt}>{formatRelative(createdAt)}</time>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              isResolved ? "text-muted-foreground hover:text-foreground" : "text-success hover:text-success/80",
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
