/**
 * ContinueDraftCard - Shows saved draft on homepage
 * Prompts user to continue where they left off
 */

import { memo, useEffect, useState } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface DraftData {
  mode: string;
  description: string;
  title: string;
  style: string;
  savedAt: number;
}

const DRAFT_KEY = 'generate-music-draft';
const DRAFT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface ContinueDraftCardProps {
  onContinue: () => void;
  className?: string;
}

export const ContinueDraftCard = memo(function ContinueDraftCard({
  onContinue,
  className,
}: ContinueDraftCardProps) {
  const { hapticFeedback } = useTelegram();
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DraftData;
        // Check if not expired and has content
        if (
          Date.now() - parsed.savedAt < DRAFT_EXPIRY_MS &&
          (parsed.description || parsed.title || parsed.style)
        ) {
          setDraft(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  if (!draft || dismissed) return null;

  const timeAgo = Math.round((Date.now() - draft.savedAt) / 60000);
  const preview = draft.description || draft.title || draft.style || '';
  const truncatedPreview = preview.length > 50 ? preview.slice(0, 50) + '...' : preview;

  const handleContinue = () => {
    hapticFeedback('medium');
    onContinue();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    setDismissed(true);
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
        "border border-primary/20",
        "p-2.5 sm:p-3",
        className
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full hover:bg-muted/50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label="Закрыть"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-2 sm:gap-3 pr-8">
        {/* Icon */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Продолжить создание?
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {truncatedPreview}
            <span className="opacity-60"> • {timeAgo}м</span>
          </p>
        </div>

        {/* Action */}
        <Button
          onClick={handleContinue}
          size="sm"
          className="h-8 sm:h-9 px-2.5 sm:px-3 gap-1 text-xs sm:text-sm bg-primary/90 hover:bg-primary shadow-sm flex-shrink-0"
        >
          <span className="hidden xs:inline">Продолжить</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.section>
  );
});
