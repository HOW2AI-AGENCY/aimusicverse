/**
 * AI Agent Types and Interfaces
 */

import { LucideIcon } from 'lucide-react';

export type AIToolId = 
  | 'write' 
  | 'analyze'
  | 'deep_analyze'
  | 'producer'
  | 'optimize'
  | 'rhyme'
  | 'tags'
  | 'continue'
  | 'structure'
  | 'rhythm'
  // Phase 2 tools
  | 'style_convert'
  | 'paraphrase'
  | 'hook_generator'
  | 'vocal_map'
  | 'translate'
  // Phase 3 V5 tools
  | 'drill_builder'
  | 'epic_builder'
  | 'validate_v5';

export type BackendAction = 
  | 'generate'
  | 'improve'
  | 'add_tags'
  | 'suggest_structure'
  | 'generate_section'
  | 'continue_line'
  | 'suggest_rhymes'
  | 'analyze_lyrics'
  | 'optimize_for_suno'
  | 'smart_generate'
  | 'chat'
  | 'context_recommendations'
  | 'generate_compound_tags'
  | 'analyze_rhythm'
  | 'fit_structure'
  | 'full_analysis'
  | 'deep_analysis'
  | 'producer_review'
  // Phase 2 actions
  | 'style_convert'
  | 'paraphrase'
  | 'hook_generator'
  | 'vocal_map'
  | 'translate_adapt'
  // Phase 3 V5 actions
  | 'drill_prompt_builder'
  | 'epic_prompt_builder'
  | 'validate_suno_v5';

export type OutputType = 
  | 'lyrics' 
  | 'tags' 
  | 'rhymes' 
  | 'analysis' 
  | 'suggestions' 
  | 'text' 
  | 'full_analysis' 
  | 'expanded_analysis' 
  | 'producer_review'
  // Phase 2 output types
  | 'hooks'
  | 'vocal_map'
  | 'paraphrase'
  | 'translation'
  // Phase 3 V5 output types
  | 'validation';

export interface AITool {
  id: AIToolId;
  name: string;
  icon: LucideIcon;
  action: BackendAction;
  description: string;
  color: string;
  bgColor: string;
  inputFields?: string[];
  outputType: OutputType;
  autoContext?: boolean;
  directApply?: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: OutputType;
  toolId?: AIToolId;
  timestamp?: Date;
  data?: {
    lyrics?: string;
    tags?: string[];
    rhymes?: RhymeData;
    analysis?: AnalysisData;
    suggestions?: string[];
    structure?: string;
    fullAnalysis?: FullAnalysisData;
    expandedAnalysis?: ExpandedAnalysisData;
    producerReview?: ProducerReviewData;
    quickActions?: QuickAction[];
    stylePrompt?: string;
    title?: string;
    changes?: string[];
    keyInsights?: string[];
    uniqueStrength?: string;
    // Phase 2 data
    hooks?: HooksData;
    vocalMap?: VocalMapSection[];
    paraphraseVariants?: ParaphraseVariant[];
    translation?: TranslationData;
  };
  isLoading?: boolean;
}

export interface QuickAction {
  label: string;
  action: string;
  icon?: string;
}

export interface RhymeData {
  word: string;
  exact: string[];
  assonance: string[];
  consonance?: string[];
}

export interface AnalysisData {
  overallScore?: number;
  structure?: {
    score: number;
    issues: AnalysisIssue[];
    suggestions: string[];
  };
  rhymes?: {
    score: number;
    issues: AnalysisIssue[];
    suggestions: string[];
  };
  rhythm?: {
    score: number;
    syllablePattern?: string;
    issues: AnalysisIssue[];
  };
  emotions?: string[];
  themes?: string[];
}

export interface FullAnalysisData {
  meaning: {
    theme: string;
    emotions: string[];
    issues: string[];
    score: number;
  };
  rhythm: {
    pattern: string;
    issues: string[];
    score: number;
  };
  rhymes: {
    scheme: string;
    weakRhymes: string[];
    score: number;
  };
  structure: {
    tags: string[];
    issues: string[];
    score: number;
  };
  overallScore: number;
  recommendations?: Array<{
    type: string;
    text: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  quickActions?: QuickAction[];
}

export interface ExpandedAnalysisData extends FullAnalysisData {
  metadata?: {
    genre?: string;
    tempo?: string;
    key?: string;
    duration?: string;
    context?: string;
  };
  composition?: {
    harmony?: string;
    rhythm?: string;
    instruments?: string[];
    production?: string;
  };
  narrative?: {
    start?: string;
    conflict?: string;
    climax?: string;
    resolution?: string;
  };
  cultural?: {
    influences?: string[];
    references?: string[];
    era?: string;
  };
  technicalLyrics?: {
    syllables?: string;
    phonetics?: string;
    metaphors?: string[];
  };
  keyInsights?: string[];
  uniqueStrength?: string;
}

export interface ProducerReviewData {
  overallScore?: number;
  commercialScore?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  productionNotes?: string;
  hooks?: {
    current: string;
    suggestions: string[];
  };
  vocalMap?: Array<{
    section: string;
    effects: string[];
    note: string;
  }>;
  arrangement?: {
    add: string[];
    remove: string[];
    dynamics: string[];
  };
  stylePrompt?: string;
  suggestedTags?: string[];
  genreTags?: string[];
  recommendations?: Array<{
    category?: string;
    priority: string | number;
    text: string;
  }>;
  topRecommendations?: Array<{
    priority: number;
    text: string;
  }>;
  quickActions?: QuickAction[];
}

export interface AnalysisIssue {
  type: 'warning' | 'error' | 'suggestion';
  message: string;
  line?: number;
  fix?: string;
}

export interface SectionNote {
  type: string;
  notes: string;
  tags?: string[];
}

// Phase 2 data types
export interface HooksData {
  currentHooks?: Array<{
    text: string;
    score: number;
    location?: string;
  }>;
  suggestedHooks?: string[];
  hookScore?: number;
  recommendations?: string[];
}

export interface VocalMapSection {
  section: string;
  vocalType?: string;
  effects?: string[];
  backingVocals?: string;
  dynamics?: string;
  emotionalNote?: string;
}

export interface ParaphraseVariant {
  text: string;
  tone?: string;
  style?: string;
}

export interface TranslationData {
  translatedLyrics: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  adaptationNotes?: string[];
  syllablePreserved?: boolean;
}

export interface AIAgentContext {
  existingLyrics?: string;
  selectedSection?: {
    type: string;
    content: string;
    notes?: string;
    tags?: string[];
  };
  globalTags?: string[];
  sectionTags?: string[];
  allSectionNotes?: SectionNote[];
  stylePrompt?: string;
  title?: string;
  genre?: string;
  mood?: string;
  language?: 'ru' | 'en';
  // Project context for enhanced AI assistance
  projectContext?: {
    projectId: string;
    projectTitle: string;
    projectType?: string;
    genre?: string;
    mood?: string;
    concept?: string;
    targetAudience?: string;
    referenceArtists?: string[];
    language?: string;
  };
  trackContext?: {
    position: number;
    title: string;
    notes?: string;
    recommendedTags?: string[];
    recommendedStructure?: string;
  };
  tracklist?: Array<{
    position: number;
    title: string;
    hasLyrics: boolean;
    status?: string;
  }>;
}

export interface ToolPanelProps {
  context: AIAgentContext;
  onExecute: (input: Record<string, any>) => void;
  onClose: () => void;
  isLoading?: boolean;
}
