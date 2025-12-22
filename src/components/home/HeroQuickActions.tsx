import { Sparkles, Music2, Guitar, Wand2, Mic } from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from '@/lib/motion';
import { useState } from 'react';
import { MusicRecognitionDialog } from '@/components/music-recognition/MusicRecognitionDialog';
import { GuitarRecordDialog } from '@/components/generate-form/GuitarRecordDialog';
import { AudioRecordDialog } from '@/components/audio-record/AudioRecordDialog';
import { TooltipWrapper } from '@/components/tooltips';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface HeroQuickActionsProps {
  onGenerateClick: () => void;
}

export function HeroQuickActions({ onGenerateClick }: HeroQuickActionsProps) {
  const { hapticFeedback } = useTelegram();
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [guitarDialogOpen, setGuitarDialogOpen] = useState(false);
  const [audioRecordOpen, setAudioRecordOpen] = useState(false);

  const handleAction = (action: () => void) => {
    hapticFeedback?.('light');
    action();
  };

  const handleGuitarComplete = (result: Record<string, unknown>) => {
    logger.info('Guitar analysis complete', { result });
  };

  return (
    <div className="space-y-3">
      {/* Primary CTA - Generate */}
      <TooltipWrapper tooltipId="generate-button">
        <motion.button
          onClick={() => handleAction(onGenerateClick)}
          className="group relative w-full overflow-hidden rounded-xl p-4 touch-manipulation shadow-lg shadow-primary/20 fab touch-scale-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          transition={{ delay: 0.1 }}
        >
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-generate" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
          
          {/* Animated shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          />

          <div className="relative flex items-center justify-center gap-3">
            <motion.div
              className="relative"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wand2 className="w-6 h-6 text-primary-foreground" />
              <motion.div
                className="absolute -top-0.5 -right-0.5"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              </motion.div>
            </motion.div>
            <div className="flex flex-col items-start">
              <span className="text-lg font-bold text-primary-foreground tracking-tight">
                Создать музыку
              </span>
              <span className="text-xs text-primary-foreground/70 font-medium">
                AI генерация за секунды
              </span>
            </div>
          </div>
        </motion.button>
      </TooltipWrapper>

      {/* Section header */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          🛠 Инструменты
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Tools Row - Only essential tools */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } } }}
      >
        {/* Audio Record Button - NEW */}
        <motion.button
          onClick={() => handleAction(() => setAudioRecordOpen(true))}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg",
            "bg-gradient-to-br from-rose-500/15 to-pink-500/10",
            "border border-rose-500/25 hover:border-rose-500/40",
            "touch-scale-sm transition-all duration-300 touch-manipulation min-h-[44px]"
          )}
          variants={{
            hidden: { opacity: 0, y: 10, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Mic className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-rose-400">Запись</span>
            <span className="text-[9px] text-muted-foreground">Вокал</span>
          </div>
          <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-bold rounded bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            NEW
          </span>
        </motion.button>

        {/* Guitar Record Button */}
        <motion.button
          onClick={() => handleAction(() => setGuitarDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg",
            "bg-gradient-to-br from-orange-500/15 to-amber-500/10",
            "border border-orange-500/25 hover:border-orange-500/40",
            "touch-scale-sm transition-all duration-300 touch-manipulation min-h-[44px]"
          )}
          variants={{
            hidden: { opacity: 0, y: 10, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Guitar className="w-4 h-4 text-orange-400 shrink-0" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-orange-400">Гитара</span>
            <span className="text-[9px] text-muted-foreground">Аккорды</span>
          </div>
        </motion.button>

        {/* Music Recognition Button */}
        <motion.button
          onClick={() => handleAction(() => setRecognitionDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg",
            "bg-gradient-to-br from-purple-500/15 to-violet-500/10",
            "border border-purple-500/25 hover:border-purple-500/40",
            "touch-scale-sm transition-all duration-300 touch-manipulation min-h-[44px]"
          )}
          variants={{
            hidden: { opacity: 0, y: 10, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Music2 className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-purple-400">Shazam</span>
            <span className="text-[9px] text-muted-foreground">Найти</span>
          </div>
        </motion.button>
      </motion.div>

      <MusicRecognitionDialog
        open={recognitionDialogOpen}
        onOpenChange={setRecognitionDialogOpen}
      />

      <GuitarRecordDialog
        open={guitarDialogOpen}
        onOpenChange={setGuitarDialogOpen}
        onComplete={handleGuitarComplete}
      />

      <AudioRecordDialog
        open={audioRecordOpen}
        onOpenChange={setAudioRecordOpen}
      />
    </div>
  );
}
