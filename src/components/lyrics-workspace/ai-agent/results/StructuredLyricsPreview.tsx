/**
 * StructuredLyricsPreview - Display lyrics in structured format like editor (readonly)
 */

import { useState, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Copy, Check, ChevronDown, ChevronUp, RefreshCw, PenLine } from 'lucide-react';
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
}

interface StructuredLyricsPreviewProps {
  lyrics: string;
  onInsert?: (lyrics: string) => void;
  onReplace?: (lyrics: string) => void;
  showReplace?: boolean;
}

const SECTION_COLORS: Record<string, string> = {
  verse: 'bg-blue-500',
  chorus: 'bg-purple-500',
  bridge: 'bg-amber-500',
  intro: 'bg-green-500',
  outro: 'bg-red-500',
  hook: 'bg-pink-500',
  prechorus: 'bg-cyan-500',
  'pre-chorus': 'bg-cyan-500',
  breakdown: 'bg-orange-500',
};

const TAG_ICONS: Record<string, string> = {
  powerful: '💥',
  soft: '🎵',
  build: '📈',
  drop: '📉',
  whisper: '🤫',
  scream: '🔥',
  harmony: '🎶',
  'ad-libs': '🎤',
  'guitar solo': '🎸',
  synth: '🎹',
  drums: '🥁',
  bass: '🎸',
};

function parseLyrics(lyrics: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = lyrics.split('\n');
  
  let currentSection: ParsedSection | null = null;
  let contentLines: string[] = [];
  
  const sectionRegex = /^\[([^\]]+)\]$/i;
  const inlineTagRegex = /\[([^\]]+)\]/g;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for section header like [Verse] or [Chorus]
    const sectionMatch = trimmedLine.match(sectionRegex);
    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        if (currentSection.content || currentSection.tags.length > 0) {
          sections.push(currentSection);
        }
      }
      
      const fullHeader = sectionMatch[1];
      const parts = fullHeader.split(',').map(p => p.trim());
      const sectionType = parts[0].toLowerCase().replace(/\s*\d+$/, ''); // Remove numbers like "Verse 1"
      const tags = parts.slice(1);
      
      currentSection = {
        type: sectionType,
        content: '',
        tags,
      };
      contentLines = [];
    } else if (currentSection) {
      // Extract inline tags from the line
      const inlineTags: string[] = [];
      
      let tagMatch: RegExpExecArray | null;
      while ((tagMatch = inlineTagRegex.exec(trimmedLine)) !== null) {
        // Don't treat section markers as inline tags
        if (!['verse', 'chorus', 'bridge', 'intro', 'outro', 'hook', 'prechorus', 'pre-chorus', 'breakdown'].some(
          s => tagMatch![1].toLowerCase().startsWith(s)
        )) {
          inlineTags.push(tagMatch[1]);
        }
      }
      
      // Keep inline tags in content for display
      contentLines.push(trimmedLine);
      
      // Add unique inline tags to section tags
      for (const tag of inlineTags) {
        if (!currentSection.tags.includes(tag)) {
          currentSection.tags.push(tag);
        }
      }
    } else if (trimmedLine) {
      // Content before any section - create default section
      currentSection = {
        type: 'verse',
        content: '',
        tags: [],
      };
      contentLines.push(trimmedLine);
    }
  }
  
  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    if (currentSection.content || currentSection.tags.length > 0) {
      sections.push(currentSection);
    }
  }
  
  return sections;
}

function getSectionColor(type: string): string {
  const normalizedType = type.toLowerCase().replace(/\s+/g, '').replace(/\d+/g, '');
  return SECTION_COLORS[normalizedType] || 'bg-gray-500';
}

function getTagIcon(tag: string): string | null {
  const lowerTag = tag.toLowerCase();
  for (const [key, icon] of Object.entries(TAG_ICONS)) {
    if (lowerTag.includes(key)) return icon;
  }
  return null;
}

export function StructuredLyricsPreview({ 
  lyrics, 
  onInsert, 
  onReplace, 
  showReplace = false 
}: StructuredLyricsPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  
  const sections = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const isLong = sections.length > 4;

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
      className="mt-2 rounded-xl border border-border/50 bg-background/80 overflow-hidden"
    >
      {/* Sections display */}
      <div className="divide-y divide-border/30">
        {displaySections.map((section, index) => (
          <div key={index} className="p-3">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge 
                className={cn("text-xs text-white border-0 capitalize", getSectionColor(section.type))}
              >
                {section.type}
              </Badge>
              
              {/* Tags */}
              {section.tags.slice(0, 3).map((tag, i) => {
                const icon = getTagIcon(tag);
                return (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="text-[10px] gap-1"
                  >
                    {icon && <span>{icon}</span>}
                    {tag}
                  </Badge>
                );
              })}
              {section.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{section.tags.length - 3}
                </Badge>
              )}
            </div>
            
            {/* Content */}
            <div className="text-sm whitespace-pre-wrap break-words text-foreground/90 leading-relaxed pl-1">
              {section.content}
            </div>
          </div>
        ))}
      </div>
      
      {/* Expand/collapse for long lyrics */}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-primary flex items-center justify-center gap-1 py-2 border-t border-border/30 hover:bg-muted/30 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Свернуть' : `Ещё ${sections.length - 3} секций`}
        </button>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 flex-wrap p-3 border-t border-border/30 bg-muted/30">
        <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={handleCopy}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          Копировать
        </Button>
        {onInsert && (
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { onInsert(lyrics); hapticImpact('medium'); }}>
            <PenLine className="w-3 h-3" />
            Добавить
          </Button>
        )}
        {showReplace && onReplace && (
          <Button size="sm" variant="default" className="h-7 text-xs gap-1 bg-primary" onClick={() => { onReplace(lyrics); hapticImpact('medium'); }}>
            <RefreshCw className="w-3 h-3" />
            Заменить
          </Button>
        )}
      </div>
    </motion.div>
  );
}
