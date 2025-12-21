/**
 * LyricsResultCard - Display generated lyrics with actions
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Copy, Check, PenLine, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';

interface LyricsResultCardProps {
  lyrics: string;
  onInsert?: (lyrics: string) => void;
  onReplace?: (lyrics: string) => void;
  onRegenerate?: () => void;
  showReplace?: boolean;
}

export function LyricsResultCard({ 
  lyrics, 
  onInsert, 
  onReplace, 
  onRegenerate,
  showReplace = false 
}: LyricsResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const isLong = lyrics.length > 300;
  const displayLyrics = isLong && !expanded ? lyrics.slice(0, 300) + '...' : lyrics;

  const handleCopy = () => {
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    toast.success('Скопировано');
    hapticImpact('light');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 bg-background/80 rounded-xl border border-border/50 space-y-2"
    >
      <pre className={cn(
        "text-xs font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed",
        !expanded && isLong && "max-h-[150px] overflow-hidden"
      )}>
        {displayLyrics}
      </pre>
      
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary flex items-center gap-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Свернуть' : 'Показать полностью'}
        </button>
      )}
      
      <div className="flex gap-2 flex-wrap pt-1">
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
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { onReplace(lyrics); hapticImpact('medium'); }}>
            <RefreshCw className="w-3 h-3" />
            Заменить
          </Button>
        )}
      </div>
    </motion.div>
  );
}
