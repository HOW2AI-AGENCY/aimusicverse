/**
 * Track Name Builder
 * Constructs proper track names based on context (artist, project, reference, mode)
 */

import {
  sanitizeAndCleanTitle,
  extractTitleFromFileName,
  sanitizeForFilename,
  sanitizeForTelegram,
  generateFallbackTitle,
  capitalizeTitle,
} from './track-naming.ts';

export type GenerationMode = 'generate' | 'cover' | 'extend' | 'stems' | 'remix';

export interface TrackNameContext {
  // User input
  userTitle?: string;
  
  // Artist context
  artistName?: string;
  artistId?: string;
  
  // Project context
  projectName?: string;
  projectId?: string;
  
  // Reference audio context
  referenceFileName?: string;
  referenceTitle?: string;
  
  // Creator context
  creatorDisplayName?: string;
  creatorUsername?: string;
  
  // Generation context
  mode: GenerationMode;
  style?: string;
  hasVocals?: boolean;
  
  // Stem-specific
  stemType?: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other';
}

export interface TrackNameResult {
  title: string;           // Clean title for database
  displayTitle: string;    // Title for UI display
  fileNameTitle: string;   // Title for file naming
  telegramTitle: string;   // Title for Telegram display
  performer: string;       // Performer name for metadata
}

/**
 * Templates for different generation modes
 */
const TEMPLATES: Record<GenerationMode, string> = {
  generate: '{title}',
  cover: '{title}',
  extend: '{title} (Extended)',
  stems: '{title} - {stemType}',
  remix: '{title} (Remix)',
};

/**
 * Stem type display names
 */
const STEM_NAMES: Record<string, string> = {
  vocals: 'Вокал',
  instrumental: 'Инструментал',
  drums: 'Ударные',
  bass: 'Бас',
  other: 'Другое',
};

/**
 * App name for metadata
 */
export const APP_NAME = 'MusicVerse AI';
export const APP_HANDLE = '@AIMusicVerseBot';

/**
 * Build track names from context
 */
export class TrackNameBuilder {
  /**
   * Build all track name variations from context
   */
  static build(context: TrackNameContext): TrackNameResult {
    const baseTitle = this.extractBaseTitle(context);
    const performer = this.extractPerformer(context);
    
    // Apply template based on mode
    const templatedTitle = this.applyTemplate(baseTitle, context);
    
    // Build different formats
    const title = templatedTitle;
    const displayTitle = this.buildDisplayTitle(templatedTitle, performer, context);
    const fileNameTitle = this.buildFileName(templatedTitle, performer);
    const telegramTitle = sanitizeForTelegram(templatedTitle);
    
    return {
      title,
      displayTitle,
      fileNameTitle,
      telegramTitle,
      performer,
    };
  }
  
  /**
   * Extract the base title from available sources
   * Priority: userTitle > referenceTitle > referenceFileName > fallback
   */
  private static extractBaseTitle(context: TrackNameContext): string {
    const { userTitle, referenceTitle, referenceFileName, mode, style, hasVocals } = context;
    
    // 1. Try user title
    if (userTitle) {
      const cleaned = sanitizeAndCleanTitle(userTitle);
      if (cleaned) return capitalizeTitle(cleaned);
    }
    
    // 2. Try reference title
    if (referenceTitle) {
      const cleaned = sanitizeAndCleanTitle(referenceTitle);
      if (cleaned) return capitalizeTitle(cleaned);
    }
    
    // 3. Try to extract from reference filename
    if (referenceFileName) {
      const extracted = extractTitleFromFileName(referenceFileName);
      if (extracted) return extracted;
    }
    
    // 4. Generate fallback
    return generateFallbackTitle({ mode, style, hasVocals });
  }
  
  /**
   * Extract performer name
   * Priority: artistName > creatorDisplayName > creatorUsername > APP_NAME
   */
  private static extractPerformer(context: TrackNameContext): string {
    const { artistName, creatorDisplayName, creatorUsername } = context;
    
    if (artistName) return artistName;
    if (creatorDisplayName) return creatorDisplayName;
    if (creatorUsername) return `@${creatorUsername}`;
    
    return APP_NAME;
  }
  
  /**
   * Apply template based on generation mode
   */
  private static applyTemplate(baseTitle: string, context: TrackNameContext): string {
    const { mode, stemType } = context;
    
    let template = TEMPLATES[mode] || '{title}';
    
    // Replace placeholders
    let result = template
      .replace('{title}', baseTitle)
      .replace('{stemType}', stemType ? STEM_NAMES[stemType] || stemType : '');
    
    // Clean up empty placeholders and double spaces
    result = result.replace(/\s*-\s*$/g, '').replace(/\s+/g, ' ').trim();
    
    return result;
  }
  
  /**
   * Build display title for UI
   */
  private static buildDisplayTitle(
    title: string, 
    performer: string, 
    context: TrackNameContext
  ): string {
    // For covers and remixes, show artist attribution
    if (context.mode === 'cover' && context.artistName) {
      return `${title} (Cover by ${context.artistName})`;
    }
    
    if (context.mode === 'remix' && context.artistName) {
      return `${title} (Remix by ${context.artistName})`;
    }
    
    // For project tracks, could include project name
    // For now, just return the title
    return title;
  }
  
  /**
   * Build filename for file downloads/exports
   */
  private static buildFileName(title: string, performer: string): string {
    const safeTitle = sanitizeForFilename(title);
    const safePerformer = sanitizeForFilename(performer);
    
    return `${safeTitle} - ${safePerformer}.mp3`;
  }
  
  /**
   * Build title with artist prefix
   */
  static buildWithArtist(title: string, artistName?: string): string {
    if (!artistName) return title;
    return `${artistName} - ${title}`;
  }
  
  /**
   * Build version-specific title (A, B, C, etc.)
   */
  static buildVersionTitle(baseTitle: string, versionLabel: string): string {
    return `${baseTitle} — ${versionLabel}`;
  }
  
  /**
   * Build stem-specific title
   */
  static buildStemTitle(baseTitle: string, stemType: string): string {
    const stemName = STEM_NAMES[stemType] || stemType;
    return `${baseTitle} - ${stemName}`;
  }
}

/**
 * Quick helper to build a simple track name
 */
export function buildTrackName(context: Partial<TrackNameContext>): TrackNameResult {
  return TrackNameBuilder.build({
    mode: context.mode || 'generate',
    ...context,
  });
}

/**
 * Get performer name from context
 */
export function getPerformerName(context: {
  artistName?: string;
  creatorDisplayName?: string;
  creatorUsername?: string;
}): string {
  if (context.artistName) return context.artistName;
  if (context.creatorDisplayName) return context.creatorDisplayName;
  if (context.creatorUsername) return `@${context.creatorUsername}`;
  return APP_NAME;
}
