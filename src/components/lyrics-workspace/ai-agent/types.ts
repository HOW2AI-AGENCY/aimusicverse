/**
 * AI Agent Types and Interfaces
 */

import { LucideIcon } from 'lucide-react';

export type AIToolId = 
  | 'write' 
  | 'continue' 
  | 'hook' 
  | 'tags' 
  | 'structure' 
  | 'rhymes' 
  | 'rhythm' 
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
  | 'fit_structure';

export type OutputType = 'lyrics' | 'tags' | 'rhymes' | 'analysis' | 'suggestions' | 'text';

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
  };
  isLoading?: boolean;
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

export interface AnalysisIssue {
  type: 'warning' | 'error' | 'suggestion';
  message: string;
  line?: number;
  fix?: string;
}

export interface AIAgentContext {
  existingLyrics?: string;
  selectedSection?: {
    type: string;
    content: string;
  };
  globalTags?: string[];
  sectionTags?: string[];
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
