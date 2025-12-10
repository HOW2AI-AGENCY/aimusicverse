/**
 * Prompt and lyrics input for section replacement
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { FileText, ChevronDown, Tag } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SectionPromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  lyrics: string;
  onLyricsChange: (value: string) => void;
  originalLyrics?: string;
  compact?: boolean;
}

export function SectionPromptInput({
  prompt,
  onPromptChange,
  tags,
  onTagsChange,
  lyrics,
  onLyricsChange,
  originalLyrics,
  compact = false,
}: SectionPromptInputProps) {
  const [showLyrics, setShowLyrics] = useState(false);
  const lyricsChanged = lyrics && originalLyrics && lyrics !== originalLyrics;

  return (
    <div className="space-y-3">
      {/* Prompt */}
      <div className="space-y-1.5">
        <Label htmlFor="section-prompt" className="text-xs text-muted-foreground">
          Описание новой секции
        </Label>
        <Textarea
          id="section-prompt"
          placeholder="Опишите стиль... Например: более энергичный, с электро-гитарой..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className={cn(
            "resize-none text-sm transition-shadow focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]",
            compact ? "min-h-[50px]" : "min-h-[60px]"
          )}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label htmlFor="section-tags" className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Tag className="w-3 h-3" />
          Стиль музыки
        </Label>
        <Input
          id="section-tags"
          placeholder="rock, guitar, energetic..."
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Collapsible Lyrics */}
      <Collapsible open={showLyrics} onOpenChange={setShowLyrics}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-between h-8 text-xs hover:bg-muted/50"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Изменить текст секции
              {lyricsChanged && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </span>
            <motion.span
              animate={{ rotate: showLyrics ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Textarea
              placeholder="Новый текст для секции..."
              value={lyrics}
              onChange={(e) => onLyricsChange(e.target.value)}
              className="min-h-[80px] resize-none text-sm font-mono"
            />
            {lyricsChanged && (
              <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                Текст изменён от оригинала
              </p>
            )}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
