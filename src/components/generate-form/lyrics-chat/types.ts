export interface LyricsChatAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLyricsGenerated: (lyrics: string) => void;
  onStyleGenerated?: (style: string) => void;
  initialGenre?: string;
  initialMood?: string[];
  initialLanguage?: 'ru' | 'en';
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  options?: QuickOption[];
  component?: 'genre' | 'mood' | 'language' | 'structure' | 'lyrics-preview';
  data?: any;
}

export interface QuickOption {
  label: string;
  value: string;
}

export interface GenreOption {
  value: string;
  label: string;
  emoji: string;
}

export interface MoodOption {
  value: string;
  label: string;
  emoji: string;
}

export interface StructureOption {
  value: string;
  label: string;
  desc: string;
}
