import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoteType } from "@/types/studio-entities";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "@/lib/icons";
import { NOTE_TYPES } from "./types";

interface AddNoteFormProps {
  content: string;
  noteType: NoteType;
  isCreating: boolean;
  onContentChange: (value: string) => void;
  onTypeChange: (value: NoteType) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const AddNoteForm = ({
  content,
  noteType,
  isCreating,
  onContentChange,
  onTypeChange,
  onSubmit,
  onCancel,
}: AddNoteFormProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
  >
    <Textarea
      value={content}
      onChange={(e) => onContentChange(e.target.value)}
      placeholder="Напишите заметку..."
      className="min-h-[120px] resize-none"
      autoFocus
    />
    <div className="flex items-center justify-between gap-3">
      <Select value={noteType} onValueChange={(v) => onTypeChange(v as NoteType)}>
        <SelectTrigger className="h-11 w-full max-w-[200px]">
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
        <Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="default"
          size="icon"
          className="h-11 w-11"
          onClick={onSubmit}
          disabled={!content.trim() || isCreating}
        >
          {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  </motion.div>
);
