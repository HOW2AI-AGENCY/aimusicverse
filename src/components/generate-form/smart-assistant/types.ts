/**
 * Smart Generation Assistant Types
 * Sprint 010 - Enhanced AI-powered generation assistant
 */

export interface UserGenerationContext {
  /** Recent generation history */
  recentPrompts: string[];
  /** Most used genres */
  favoriteGenres: string[];
  /** Most used moods */
  favoriteMoods: string[];
  /** Success rate by style */
  styleSuccessRates: Record<string, number>;
  /** Total generations count */
  totalGenerations: number;
  /** Average session duration */
  avgSessionDuration: number;
}

export interface ProjectGenerationContext {
  projectId: string;
  projectTitle: string;
  projectGenre?: string;
  projectMood?: string;
  projectLanguage?: 'ru' | 'en';
  projectConcept?: string;
  existingTracks: ProjectTrackInfo[];
  targetTrackCount?: number;
  referenceArtists?: string[];
}

export interface ProjectTrackInfo {
  id: string;
  position: number;
  title: string;
  style?: string;
  hasLyrics: boolean;
  status: 'draft' | 'generating' | 'completed' | 'approved';
}

export interface SmartSuggestion {
  id: string;
  type: 'prompt' | 'style' | 'mood' | 'continuation' | 'variation';
  title: string;
  description: string;
  prompt: string;
  confidence: number; // 0-1
  reasoning: string;
  tags: string[];
  metadata?: {
    basedOnTrack?: string;
    genre?: string;
    mood?: string;
    energy?: 'low' | 'medium' | 'high';
  };
}

export interface SmartAssistantState {
  isAnalyzing: boolean;
  suggestions: SmartSuggestion[];
  userContext: UserGenerationContext | null;
  projectContext: ProjectGenerationContext | null;
  lastAnalyzedAt: string | null;
  error: string | null;
}

export interface SmartAssistantActions {
  analyze: () => Promise<void>;
  applySuggestion: (suggestion: SmartSuggestion) => void;
  dismissSuggestion: (suggestionId: string) => void;
  refreshSuggestions: () => Promise<void>;
  setProjectContext: (context: ProjectGenerationContext | null) => void;
}

export type SmartAssistantMode = 'minimal' | 'inline' | 'panel' | 'dialog';
