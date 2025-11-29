import { LyricSection, SectionType, UI_TRANSLATIONS } from './types';

// Parse tags from text
export const parseTags = (text: string): string[] => {
  const tagPattern = /\[(.*?)\]/g;
  const matches = text.match(tagPattern);
  return matches || [];
};

// Translate tags from English to Russian for display
export const translateTagsToRussian = (text: string): string => {
  let translated = text;
  Object.entries(UI_TRANSLATIONS).forEach(([ru, en]) => {
    translated = translated.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ru);
  });
  return translated;
};

// Translate tags from Russian to English for Suno
export const translateTagsToEnglish = (text: string): string => {
  let translated = text;
  Object.entries(UI_TRANSLATIONS).forEach(([ru, en]) => {
    translated = translated.replace(new RegExp(ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), en);
  });
  return translated;
};

// Count syllables (simple approximation)
export const countSyllables = (text: string): number => {
  // Count vowels (both cyrillic and latin)
  const cyrillicVowels = /[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/g;
  const latinVowels = /[aeiouAEIOU]/g;
  
  const cyrillicMatches = text.match(cyrillicVowels);
  const latinMatches = text.match(latinVowels);
  
  return (cyrillicMatches?.length || 0) + (latinMatches?.length || 0);
};

// Generate Suno prompt from sections
export const generateSunoPrompt = (
  sections: LyricSection[],
  stylePrompt?: string
): string => {
  let prompt = '';
  
  // Add style if provided
  if (stylePrompt) {
    prompt += `[Style: ${stylePrompt}]\n\n`;
  }
  
  // Add sections
  sections.forEach((section, index) => {
    prompt += `${section.header}\n`;
    prompt += `${translateTagsToEnglish(section.content)}\n`;
    if (index < sections.length - 1) {
      prompt += '\n';
    }
  });
  
  return prompt;
};

// Parse text into sections
export const parseTextToSections = (text: string): LyricSection[] => {
  const sections: LyricSection[] = [];
  const lines = text.split('\n');
  
  let currentSection: LyricSection | null = null;
  let sectionCounter: Record<SectionType, number> = {} as Record<SectionType, number>;
  
  lines.forEach((line) => {
    // Check if line is a section header
    const headerMatch = line.match(/^\[(Intro|Verse|Pre-Chorus|Chorus|Hook|Bridge|Interlude|Solo|Outro|Drop)\]/i);
    
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Create new section
      const typeStr = headerMatch[1].toLowerCase().replace('-', '_');
      const type = typeStr as SectionType;
      
      sectionCounter[type] = (sectionCounter[type] || 0) + 1;
      
      currentSection = {
        id: `${type}-${sectionCounter[type]}-${Date.now()}`,
        type,
        header: line,
        content: '',
      };
    } else if (currentSection && line.trim()) {
      // Add content to current section
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  });
  
  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
};

// Insert tag at cursor position
export const insertTagAtCursor = (
  text: string,
  tag: string,
  cursorPosition: number
): { newText: string; newCursorPosition: number } => {
  const before = text.substring(0, cursorPosition);
  const after = text.substring(cursorPosition);
  
  // Add line breaks if needed
  const needsNewlineBefore = before.length > 0 && !before.endsWith('\n');
  const needsNewlineAfter = after.length > 0 && !after.startsWith('\n');
  
  const tagWithSpacing = 
    (needsNewlineBefore ? '\n' : '') +
    tag +
    (needsNewlineAfter ? '\n' : '');
  
  const newText = before + tagWithSpacing + after;
  const newCursorPosition = cursorPosition + tagWithSpacing.length;
  
  return { newText, newCursorPosition };
};
