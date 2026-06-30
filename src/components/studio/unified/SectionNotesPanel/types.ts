import { NoteType } from "@/types/studio-entities";
import { MessageSquare, Music, FileText, Layers } from "@/lib/icons";

export interface NoteFilters {
  type: NoteType | "all";
  resolved: "all" | "resolved" | "unresolved";
}

export interface SectionNotesPanelProps {
  sectionId: string;
  className?: string;
  maxHeight?: string | number;
}

export interface NoteTypeConfig {
  value: NoteType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

export const NOTE_TYPES: NoteTypeConfig[] = [
  {
    value: NoteType.GENERAL,
    label: "Общие",
    icon: MessageSquare,
    color: "text-blue-500",
    description: "Общие заметки и комментарии",
  },
  {
    value: NoteType.PRODUCTION,
    label: "Продакшн",
    icon: Music,
    color: "text-purple-500",
    description: "Заметки по продакшну и сведению",
  },
  {
    value: NoteType.LYRIC,
    label: "Текст",
    icon: FileText,
    color: "text-emerald-500",
    description: "Заметки по тексту песни",
  },
  {
    value: NoteType.ARRANGEMENT,
    label: "Аранжировка",
    icon: Layers,
    color: "text-orange-500",
    description: "Заметки по аранжировке",
  },
];
