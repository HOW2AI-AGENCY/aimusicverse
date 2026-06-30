import { Badge } from "@/components/ui/badge";
import { NoteType } from "@/types/studio-entities";
import { cn } from "@/lib/utils";
import { NOTE_TYPES } from "./types";

interface NoteTypeBadgeProps {
  noteType: NoteType;
  className?: string;
}

export const NoteTypeBadge = ({ noteType, className }: NoteTypeBadgeProps) => {
  const config = NOTE_TYPES.find((t) => t.value === noteType) || NOTE_TYPES[0];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border-current/20 bg-current/5", config.color, className)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
};
