/**
 * AI Agent Types and Interfaces
 */

import { LucideIcon } from 'lucide-react';

export type AIToolId = 
  | 'write' 
  | 'analyze'
  | 'producer'
  | 'optimize';

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
  | 'producer_review';

export type OutputType = 'lyrics' | 'tags' | 'rhymes' | 'analysis' | 'suggestions' | 'text' | 'full_analysis' | 'producer_review';

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
    producerReview?: ProducerReviewData;
    quickActions?: QuickAction[];
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
  recommendations: Array<{
    type: 'tag' | 'text' | 'structure' | 'rhythm';
    text: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  quickActions: QuickAction[];
}

export interface ProducerReviewData {
  commercialScore: number;
  hooks: {
    current: string;
    suggestions: string[];
  };
  vocalMap: Array<{
    section: string;
    effects: string[];
    note: string;
  }>;
  arrangement: {
    add: string[];
    remove: string[];
    dynamics: string[];
  };
  stylePrompt: string;
  genreTags: string[];
  topRecommendations: Array<{
    priority: number;
    text: string;
  }>;
  quickActions: QuickAction[];
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
}

export interface ToolPanelProps {
  context: AIAgentContext;
  onExecute: (input: Record<string, any>) => void;
  onClose: () => void;
  isLoading?: boolean;
}
