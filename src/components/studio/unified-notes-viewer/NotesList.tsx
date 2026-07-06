import { memo } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime } from "@/lib/formatters";
import type { ProcessedNote, NotesStats } from "./types";

interface NotesListProps {
  processedNotes: ProcessedNote[];
  stats: NotesStats | null;
  duration: number;
  selectedNoteIndex: number | null;
  onNoteSelect: (index: number) => void;
  height: number;
}

export const NotesList = memo(function NotesList({
  processedNotes,
  stats,
  duration,
  selectedNoteIndex,
  onNoteSelect,
  height,
}: NotesListProps) {
  return (
    <ScrollArea style={{ height }}>
      <div className="p-2 space-y-1">
        {/* Summary header */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded-lg mb-2">
          <div className="flex-1 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div>
              <p className="text-muted-foreground">Всего нот</p>
              <p className="font-semibold text-foreground">{processedNotes.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Диапазон</p>
              <p className="font-semibold text-foreground">
                {stats?.minNote} - {stats?.maxNote}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Длительность</p>
              <p className="font-semibold text-foreground">{formatTime(duration)}</p>
            </div>
          </div>
        </div>

        {/* Notes list with velocity bars */}
        <div className="space-y-0.5">
          {processedNotes.slice(0, 150).map((note, i) => {
            const velocityPercent = (note.velocity / 127) * 100;
            const isLoud = note.velocity > 100;
            const isSoft = note.velocity < 50;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.5) }}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-muted/50 active:bg-muted/70 cursor-pointer group",
                  selectedNoteIndex === note.index && "bg-primary/10 ring-1 ring-primary/30",
                )}
                onClick={() => onNoteSelect(note.index)}
              >
                {/* Note badge */}
                <div
                  className={cn(
                    "w-10 h-8 rounded-md flex items-center justify-center font-mono text-[11px] font-bold transition-colors",
                    isLoud && "bg-orange-500/20 text-orange-600",
                    isSoft && "bg-blue-500/20 text-blue-600",
                    !isLoud && !isSoft && "bg-primary/15 text-primary",
                  )}
                >
                  {note.noteName}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs">{note.noteNameRu}</span>
                    <span className="text-[9px] text-muted-foreground">октава {Math.floor(note.pitch / 12) - 1}</span>
                  </div>

                  {/* Velocity bar */}
                  <div className="mt-0.5 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isLoud && "bg-orange-500",
                        isSoft && "bg-blue-500",
                        !isLoud && !isSoft && "bg-primary",
                      )}
                      style={{ width: `${velocityPercent}%` }}
                    />
                  </div>
                </div>

                {/* Time & duration */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-mono text-foreground">{formatTime(note.startTime)}</p>
                  <p className="text-[9px] text-muted-foreground">{(note.duration * 1000).toFixed(0)}ms</p>
                </div>
              </motion.div>
            );
          })}

          {processedNotes.length > 150 && (
            <div className="text-center py-2">
              <Badge variant="secondary" className="text-[10px]">
                +{processedNotes.length - 150} ещё нот
              </Badge>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
});
