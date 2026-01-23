/**
 * LyricsPreview - Compact preview of track lyrics with section badges
 * Shows colored section badges with expand to view full lyrics
 */

import { useState, useMemo, memo } from 'react';
import { Music, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';
import { LyricsParser, type LyricsSection } from '@/lib/lyrics/LyricsParser';
import { sectionColors, getSectionColor } from '@/lib/design-colors';

interface LyricsPreviewProps {
  lyrics: string | null | undefined;
  maxSections?: number;
  className?: string;
}

// Section type to color mapping using design tokens
const SECTION_COLORS: Record<LyricsSection['type'], string> = {
  intro: `${sectionColors.intro.bg} ${sectionColors.intro.text}`,
  verse: `${sectionColors.verse.bg} ${sectionColors.verse.text}`,
  'pre-chorus': `${sectionColors['pre-chorus'].bg} ${sectionColors['pre-chorus'].text}`,
  chorus: `${sectionColors.chorus.bg} ${sectionColors.chorus.text}`,
  bridge: `${sectionColors.bridge.bg} ${sectionColors.bridge.text}`,
  outro: `${sectionColors.outro.bg} ${sectionColors.outro.text}`,
  instrumental: `${sectionColors.instrumental.bg} ${sectionColors.instrumental.text}`,
  solo: `${sectionColors.solo.bg} ${sectionColors.solo.text}`,
  other: `${sectionColors.other.bg} ${sectionColors.other.text}`,
};

export const LyricsPreview = memo(function LyricsPreview({
  lyrics,
  maxSections = 4,
  className,
}: LyricsPreviewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse lyrics
  const parsed = useMemo(() => {
    if (!lyrics) return null;
    return LyricsParser.parse(lyrics);
  }, [lyrics]);

  if (!lyrics || !parsed || parsed.sections.length === 0) return null;

  const visibleSections = parsed.sections.slice(0, maxSections);
  const hiddenCount = Math.max(0, parsed.sections.length - maxSections);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    
    try {
      await navigator.clipboard.writeText(lyrics);
      setCopied(true);
      toast.success('Текст скопирован');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const openFullLyrics = () => {
    hapticImpact('light');
    setSheetOpen(true);
  };

  return (
    <>
      <div className={cn(
        "rounded-lg bg-muted/30 border border-border/50 overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Music className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Текст ({parsed.sections.length} секций)
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Section badges */}
        <div 
          className="px-3 py-2 cursor-pointer"
          onClick={openFullLyrics}
        >
          <div className="flex flex-wrap gap-1.5">
            {visibleSections.map((section, index) => (
              <Badge
                key={section.id || index}
                variant="secondary"
                className={cn(
                  "text-[10px] px-2 py-0.5 font-medium",
                  SECTION_COLORS[section.type]
                )}
              >
                {section.name}
              </Badge>
            ))}
            {hiddenCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 text-muted-foreground"
              >
                +{hiddenCount}
              </Badge>
            )}
          </div>
          
          <button
            onClick={openFullLyrics}
            className="flex items-center gap-1 mt-2 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
            Показать текст
          </button>
        </div>
      </div>

      {/* Full lyrics sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] max-h-[70vh] rounded-t-2xl flex flex-col pb-0 px-0"
        >
          <SheetHeader className="px-4 pb-2 border-b border-border/50">
            <SheetTitle className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Текст песни
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4 pb-safe space-y-4">
              {parsed.sections.map((section, index) => (
                <div key={section.id || index} className="space-y-1.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs px-2 py-0.5 font-medium",
                      SECTION_COLORS[section.type]
                    )}
                  >
                    {section.name}
                  </Badge>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap pl-0.5">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Copy button */}
          <div className="px-4 py-3 border-t border-border/50 bg-background">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано' : 'Копировать текст'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});
