/**
 * StructuredLyricsDisplay - Read-only structured lyrics view like editor sections
 * For displaying AI-generated lyrics in chat with section cards
 */

import { useState, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Copy, Check, ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface ParsedSection {
  type: string;
  content: string;
  tags: string[];
  lineCount: number;
}

interface StructuredLyricsDisplayProps {
  lyrics: string;
  onApply?: () => void;
  onInsert?: (lyrics: string) => void;
  showApplyButton?: boolean;
  className?: string;
}

// Section type to color mapping
const SECTION_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  verse: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', badge: 'bg-blue-500 text-white' },
  chorus: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', badge: 'bg-purple-500 text-white' },
  bridge: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500 text-white' },
  intro: { bg: 'bg-green-500/5', border: 'border-green-500/20', badge: 'bg-green-500 text-white' },
  outro: { bg: 'bg-red-500/5', border: 'border-red-500/20', badge: 'bg-red-500 text-white' },
  hook: { bg: 'bg-pink-500/5', border: 'border-pink-500/20', badge: 'bg-pink-500 text-white' },
  prechorus: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', badge: 'bg-cyan-500 text-white' },
  'pre-chorus': { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', badge: 'bg-cyan-500 text-white' },
  breakdown: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', badge: 'bg-orange-500 text-white' },
  end: { bg: 'bg-gray-500/5', border: 'border-gray-500/20', badge: 'bg-gray-500 text-white' },
  instrumental: { bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', badge: 'bg-indigo-500 text-white' },
  drop: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', badge: 'bg-rose-500 text-white' },
};

const DEFAULT_STYLE = { bg: 'bg-muted/50', border: 'border-border/30', badge: 'bg-muted text-foreground' };

// Tag icons for common production tags
const TAG_EMOJIS: Record<string, string> = {
  powerful: '💥', soft: '🎵', build: '📈', drop: '📉', whisper: '🤫',
  scream: '🔥', harmony: '🎶', 'ad-libs': '🎤', 'guitar solo': '🎸',
  synth: '🎹', drums: '🥁', bass: '🎸', 'male vocal': '🎤',
  'female vocal': '🎤', falsetto: '🎵', belting: '🔊', emotional: '💫',
  gentle: '🌸', intense: '⚡', climax: '🎆', 'fade out': '📉',
  atmospheric: '🌌', acoustic: '🪕', 'full band': '🎸',
};

function parseLyrics(lyrics: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = lyrics.split('\n');
  
  let currentSection: ParsedSection | null = null;
  let contentLines: string[] = [];
  
  // Match section header at start of line, possibly followed by content
  // e.g., [Verse], [Chorus 1], [Bridge, Powerful], [Intro]Hello
  const sectionStartRegex = /^\[([^\]]+)\]/i;
  const structureKeywords = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'hook', 'prechorus', 'pre-chorus', 'breakdown', 'end', 'instrumental', 'drop', 'interlude', 'solo', 'build'];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const sectionMatch = trimmedLine.match(sectionStartRegex);
    if (sectionMatch) {
      const fullHeader = sectionMatch[1];
      const lowerHeader = fullHeader.toLowerCase();
      const isStructureTag = structureKeywords.some(k => lowerHeader.startsWith(k));
      
      if (isStructureTag) {
        // Save previous section
        if (currentSection) {
          currentSection.content = contentLines.join('\n').trim();
          currentSection.lineCount = contentLines.filter(l => l.trim()).length;
          if (currentSection.content || currentSection.tags.length > 0) {
            sections.push(currentSection);
          }
        }
        
        const parts = fullHeader.split(',').map(p => p.trim());
        const sectionType = parts[0].toLowerCase().replace(/\s*\d+$/, '');
        const tags = parts.slice(1);
        
        currentSection = { type: sectionType, content: '', tags, lineCount: 0 };
        contentLines = [];
        
        // Check for content immediately after tag (e.g., [Verse]Hello world)
        const afterTag = trimmedLine.slice(sectionMatch[0].length).trim();
        if (afterTag) {
          // Extract inline tags from afterTag
          const inlineTagRegex = /\[([^\]]+)\]/g;
          let match: RegExpExecArray | null;
          while ((match = inlineTagRegex.exec(afterTag)) !== null) {
            const tag = match[1];
            if (!currentSection.tags.includes(tag) && !structureKeywords.some(k => tag.toLowerCase().startsWith(k))) {
              currentSection.tags.push(tag);
            }
          }
          contentLines.push(afterTag);
        }
      } else {
        // This is an inline tag line like [Powerful] or [Male Vocal]
        if (currentSection && !currentSection.tags.includes(fullHeader)) {
          currentSection.tags.push(fullHeader);
        }
        // Check for content after the inline tag
        const afterTag = trimmedLine.slice(sectionMatch[0].length).trim();
        if (afterTag && currentSection) {
          contentLines.push(afterTag);
        }
      }
    } else if (currentSection) {
      // Regular content line - extract any inline tags
      const inlineTagRegex = /\[([^\]]+)\]/g;
      let match: RegExpExecArray | null;
      while ((match = inlineTagRegex.exec(trimmedLine)) !== null) {
        const tag = match[1];
        if (!currentSection.tags.includes(tag) && !structureKeywords.some(k => tag.toLowerCase().startsWith(k))) {
          currentSection.tags.push(tag);
        }
      }
      contentLines.push(trimmedLine);
    } else if (trimmedLine) {
      // Content before any section - create default verse
      currentSection = { type: 'verse', content: '', tags: [], lineCount: 0 };
      contentLines.push(trimmedLine);
    }
  }
  
  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    currentSection.lineCount = contentLines.filter(l => l.trim()).length;
    if (currentSection.content || currentSection.tags.length > 0) {
      sections.push(currentSection);
    }
  }
  
  return sections;
}

function getSectionStyle(type: string) {
  const normalized = type.toLowerCase().replace(/\s+/g, '').replace(/\d+/g, '');
  return SECTION_STYLES[normalized] || DEFAULT_STYLE;
}

function getTagEmoji(tag: string): string | null {
  const lower = tag.toLowerCase();
  for (const [key, emoji] of Object.entries(TAG_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return null;
}

export function StructuredLyricsDisplay({ 
  lyrics, 
  onApply, 
  onInsert,
  showApplyButton = true,
  className,
}: StructuredLyricsDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  
  const sections = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const isLong = sections.length > 4;
  const totalLines = sections.reduce((acc, s) => acc + s.lineCount, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    toast.success('Скопировано');
    hapticImpact('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const displaySections = isLong && !expanded ? sections.slice(0, 3) : sections;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-3 rounded-xl border border-border/50 bg-background/90 overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            {sections.length} секций • {totalLines} строк
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Скопировано' : 'Копировать'}
        </Button>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border/20">
        {displaySections.map((section, index) => {
          const style = getSectionStyle(section.type);
          return (
            <Card 
              key={index} 
              className={cn(
                "rounded-none border-0 border-l-[3px]",
                style.bg,
                style.border
              )}
            >
              <div className="p-3">
                {/* Section header */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={cn("text-[10px] border-0 capitalize font-medium", style.badge)}>
                    {section.type.replace('-', ' ')}
                  </Badge>
                  
                  {/* Tags */}
                  {section.tags.slice(0, 3).map((tag, i) => {
                    const emoji = getTagEmoji(tag);
                    return (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-[9px] h-5 gap-0.5 bg-background/50"
                      >
                        {emoji && <span>{emoji}</span>}
                        {tag}
                      </Badge>
                    );
                  })}
                  {section.tags.length > 3 && (
                    <Badge variant="outline" className="text-[9px] h-5">
                      +{section.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                {/* Content */}
                <div className="text-sm whitespace-pre-wrap break-words text-foreground/90 leading-relaxed font-mono">
                  {section.content}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Expand/collapse for long lyrics */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-primary flex items-center justify-center gap-1 py-2.5 border-t border-border/30 hover:bg-muted/30 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Свернуть' : `Ещё ${sections.length - 3} секций`}
        </button>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 p-3 border-t border-border/30 bg-muted/20">
        {showApplyButton && onApply && (
          <Button 
            size="sm" 
            className="flex-1 h-9 text-xs gap-1.5"
            onClick={() => {
              onApply();
              hapticImpact('medium');
            }}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Применить лирику
          </Button>
        )}
        {onInsert && (
          <Button 
            size="sm" 
            variant="outline"
            className="h-9 text-xs gap-1"
            onClick={() => {
              onInsert(lyrics);
              hapticImpact('light');
            }}
          >
            Добавить
          </Button>
        )}
      </div>
    </motion.div>
  );
}
