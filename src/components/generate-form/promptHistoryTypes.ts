/**
 * Prompt history types and constants
 * Extracted from PromptHistory.tsx — Sprint 051 T056
 */

export type PromptMode = "simple" | "custom" | "wizard";

export interface PromptHistoryItem {
  id: string;
  timestamp: Date;
  lastUsed?: Date;
  usageCount: number;
  mode: PromptMode;
  description?: string;
  title?: string;
  style?: string;
  lyrics?: string;
  model: string;
  tags?: string[];
  isBookmarked?: boolean;
}

export interface SavedPrompt {
  id: string;
  name: string;
  mode: PromptMode;
  description?: string;
  title?: string;
  style?: string;
  lyrics?: string;
  model: string;
  createdAt: Date;
}

export const scrollbarStyles = `
  [data-prompt-scroll]::-webkit-scrollbar {
    width: 4px;
  }
  [data-prompt-scroll]::-webkit-scrollbar-track {
    background: transparent;
  }
  [data-prompt-scroll]::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 2px;
  }
  [data-prompt-scroll]::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }
  [data-prompt-scroll] {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
  }
`;
