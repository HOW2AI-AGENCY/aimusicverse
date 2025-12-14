export interface ProjectContext {
  projectId: string;
  projectTitle: string;
  genre?: string;
  mood?: string;
  language?: 'ru' | 'en';
  concept?: string;
  targetAudience?: string;
  referenceArtists?: string[];
  existingTracks?: TrackContext[];
  projectType?: string;
}

export interface TrackContext {
  position: number;
  title: string;
  stylePrompt?: string;
  draftLyrics?: string;
  generatedLyrics?: string;
  recommendedTags?: string[];
  recommendedStructure?: string;
  // Enhanced context for AI lyrics assistant
  notes?: string; // AI hints, theme suggestions, emotional arc
  lyrics?: string; // Actual lyrics text (separate from notes)
  lyricsStatus?: 'draft' | 'prompt' | 'generated' | 'approved';
}

export interface LyricsChatAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLyricsGenerated: (lyrics: string) => void;
  onStyleGenerated?: (style: string) => void;
  initialGenre?: string;
  initialMood?: string[];
  initialLanguage?: 'ru' | 'en';
  // NEW: Context support
  projectContext?: ProjectContext;
  trackContext?: TrackContext;
  initialMode?: 'new' | 'edit' | 'improve' | 'freeform';
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  options?: QuickOption[];
  component?: 'genre' | 'mood' | 'language' | 'structure' | 'lyrics-preview';
  data?: Record<string, unknown>;
}

export interface QuickOption {
  label: string;
  value: string;
  action?: 'setTheme' | 'selectGenre' | 'askMore' | 'useContext' | 'editDraft' | 'freeform' | 'retry';
  icon?: string;
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
