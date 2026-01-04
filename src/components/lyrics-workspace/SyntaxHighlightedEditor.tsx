/**
 * SyntaxHighlightedEditor - Lyrics editor with live syntax highlighting
 * Highlights tags, backing vocals, dynamics markers
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SyntaxHighlightedEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSyllables?: boolean;
  readOnly?: boolean;
}

// Syntax highlighting patterns
const SYNTAX_PATTERNS = {
  structural: /\[(Verse|Chorus|Bridge|Intro|Outro|Hook|Pre-Chorus|End|Interlude|Break|Drop|Refrain)(\s*\d*)?\]/gi,
  compound: /\[([^\]]+\s*\|\s*[^\]]+)\]/g,
  dynamic: /\[!([\w_]+)\]/gi,
  vocal: /\[(Male|Female|Whisper|Shout|Falsetto|Belt|Grit|Smooth|Breathy)[^\]]*\]/gi,
  backing: /\(([^)]+)\)/g,
  transform: /\[([^\]]+)\s*->\s*([^\]]+)\]/g,
  instrument: /\[(Piano|Guitar|Drums|Bass|Synth|Strings|Brass|808|Hi-Hat)[^\]]*\]/gi,
  effects: /\[(Reverb|Delay|Echo|Distortion|Autotune|Vocoder)[^\]]*\]/gi,
};

// Color mapping for different tag types
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  structural: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  compound: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  dynamic: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  vocal: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  backing: { bg: 'bg-muted', text: 'text-muted-foreground italic', border: 'border-border/30' },
  transform: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  instrument: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  effects: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

// Count syllables (simplified for Cyrillic and Latin)
function countSyllables(text: string): number {
  // Remove tags and punctuation
  const cleanText = text.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim();
  if (!cleanText) return 0;
  
  // Count vowels as approximate syllable count
  const cyrillicVowels = cleanText.match(/[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/g) || [];
  const latinVowels = cleanText.match(/[aeiouyAEIOUY]/g) || [];
  
  return cyrillicVowels.length + latinVowels.length;
}

// Highlight text with colored spans
function highlightSyntax(text: string): React.ReactNode[] {
  if (!text) return [];

  const segments: { start: number; end: number; type: string; content: string }[] = [];

  // Find all matches for each pattern
  Object.entries(SYNTAX_PATTERNS).forEach(([type, pattern]) => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        content: match[0],
      });
    }
  });

  // Sort by position
  segments.sort((a, b) => a.start - b.start);

  // Build highlighted output
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  segments.forEach((segment, i) => {
    // Add plain text before this segment
    if (segment.start > lastIndex) {
      result.push(
        <span key={`text-${i}`}>{text.slice(lastIndex, segment.start)}</span>
      );
    }

    // Add highlighted segment
    const colors = TAG_COLORS[segment.type] || TAG_COLORS.structural;
    result.push(
      <span
        key={`tag-${i}`}
        className={cn(
          "rounded px-0.5 py-0.5 font-mono text-[0.9em]",
          colors.bg,
          colors.text
        )}
      >
        {segment.content}
      </span>
    );

    lastIndex = segment.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return result;
}

export function SyntaxHighlightedEditor({
  value,
  onChange,
  placeholder = 'Введите текст...',
  className,
  showSyllables = true,
  readOnly = false,
}: SyntaxHighlightedEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [cursorLine, setCursorLine] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Split into lines for line numbers and syllable counts
  const lines = useMemo(() => value.split('\n'), [value]);
  
  // Current line syllables
  const currentLineSyllables = useMemo(() => {
    if (cursorLine >= 0 && cursorLine < lines.length) {
      return countSyllables(lines[cursorLine]);
    }
    return 0;
  }, [lines, cursorLine]);

  // Syllable status color
  const syllableStatus = useMemo(() => {
    if (currentLineSyllables === 0) return 'text-muted-foreground';
    if (currentLineSyllables <= 12) return 'text-emerald-400';
    if (currentLineSyllables <= 16) return 'text-amber-400';
    return 'text-red-400';
  }, [currentLineSyllables]);

  // Sync scroll between textarea and highlight
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Track cursor position
  const handleSelect = useCallback(() => {
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart;
      const textBeforeCursor = value.slice(0, pos);
      const lineNumber = textBeforeCursor.split('\n').length - 1;
      setCursorLine(lineNumber);
    }
  }, [value]);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(100, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);

  if (readOnly) {
    return (
      <div className={cn("relative", className)}>
        <div className="text-sm whitespace-pre-wrap leading-relaxed p-3 rounded-lg bg-muted/30 border border-border/50">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              {showSyllables && (
                <span className={cn(
                  "w-6 text-right text-[10px] shrink-0 font-mono",
                  countSyllables(line) > 12 ? 'text-amber-400' : 'text-muted-foreground/50'
                )}>
                  {countSyllables(line) || ''}
                </span>
              )}
              <span className="flex-1">{highlightSyntax(line)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Syllable counter bar */}
      {showSyllables && isEditing && (
        <div className="absolute -top-6 right-0 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Строка {cursorLine + 1}:</span>
          <span className={cn("font-mono font-medium", syllableStatus)}>
            {currentLineSyllables} слогов
          </span>
          {currentLineSyllables > 12 && (
            <span className="text-[10px] text-amber-400">⚠️ много</span>
          )}
        </div>
      )}

      {/* Container */}
      <div className="relative rounded-lg border border-border/50 bg-background overflow-hidden">
        {/* Highlight layer (behind textarea) */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-3 text-sm whitespace-pre-wrap leading-relaxed overflow-hidden pointer-events-none"
          style={{ color: 'transparent' }}
          aria-hidden="true"
        >
          {lines.map((line, i) => (
            <div key={i}>{highlightSyntax(line) || '\u00A0'}</div>
          ))}
        </div>

        {/* Textarea (on top, transparent background) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onScroll={handleScroll}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onClick={handleSelect}
          placeholder={placeholder}
          className={cn(
            "relative w-full min-h-[100px] p-3 text-sm leading-relaxed resize-none",
            "bg-transparent outline-none focus:ring-0 border-0",
            "placeholder:text-muted-foreground",
            // Make the caret visible
            "caret-foreground"
          )}
          style={{ 
            WebkitTextFillColor: 'inherit',
            color: 'inherit',
          }}
        />

        {/* Line numbers (optional, on left side) */}
        {showSyllables && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-muted/30 border-r border-border/30 pointer-events-none">
            <div className="p-3 text-sm leading-relaxed">
              {lines.map((line, i) => {
                const syllables = countSyllables(line);
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "text-[10px] text-right pr-1 font-mono",
                      i === cursorLine && "bg-primary/10",
                      syllables > 12 ? 'text-amber-400' : 'text-muted-foreground/50'
                    )}
                  >
                    {syllables || ''}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
