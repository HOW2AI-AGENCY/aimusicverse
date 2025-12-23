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
          className="group relative w-full overflow-hidden rounded-2xl p-4 touch-manipulation shadow-xl shadow-primary/25 fab touch-scale-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01, boxShadow: '0 20px 40px -10px hsl(207 90% 54% / 0.35)' }}
          transition={{ delay: 0.1 }}
        >
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-generate" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
          
          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Animated shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                style={{ left: `${15 + i * 18}%`, top: '50%' }}
                animate={{ 
                  y: [-20, 20, -20],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 2 + i * 0.3, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          <div className="relative flex items-center justify-center gap-3">
            <motion.div
              className="relative"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wand2 className="w-7 h-7 text-primary-foreground drop-shadow-lg" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-md" />
              </motion.div>
            </motion.div>
            <div className="flex flex-col items-start">
              <span className="text-lg font-bold text-primary-foreground tracking-tight drop-shadow-sm">
                Создать музыку
              </span>
              <span className="text-xs text-primary-foreground/80 font-medium">
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

      {/* Tools Row - With descriptions */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } }}
      >
        {/* Audio Record Button */}
        <motion.button
          onClick={() => handleAction(() => setAudioRecordOpen(true))}
          className={cn(
            "group relative flex flex-col items-start gap-1 px-3 py-3 rounded-xl",
            "bg-gradient-to-br from-rose-500/15 to-pink-500/10",
            "border border-rose-500/25 hover:border-rose-500/50",
            "touch-scale-sm transition-all duration-300 touch-manipulation min-h-[72px]",
            "hover:shadow-lg hover:shadow-rose-500/20"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Mic className="w-4 h-4 text-rose-400 shrink-0" />
            </motion.div>
            <span className="text-xs font-semibold text-rose-400">Запись</span>
          </div>
          <span className="text-[9px] text-muted-foreground leading-tight">
            Записать вокал или мелодию
          </span>
          <motion.span 
            className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            NEW
          </motion.span>
        </motion.button>

        {/* Guitar Record Button */}
        <motion.button
          onClick={() => handleAction(() => setGuitarDialogOpen(true))}
          className={cn(
            "group relative flex flex-col items-start gap-1 px-3 py-3 rounded-xl",
            "bg-gradient-to-br from-orange-500/15 to-amber-500/10",
            "border border-orange-500/25 hover:border-orange-500/50",
            "touch-scale-sm transition-all duration-300 touch-manipulation min-h-[72px]",
            "hover:shadow-lg hover:shadow-orange-500/20"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Guitar className="w-4 h-4 text-orange-400 shrink-0" />
            </motion.div>
            <span className="text-xs font-semibold text-orange-400">Гитара</span>
          </div>
          <span className="text-[9px] text-muted-foreground leading-tight">
            Распознать аккорды
          </span>
        </motion.button>

        {/* Music Recognition Button */}
        <motion.button
          onClick={() => handleAction(() => setRecognitionDialogOpen(true))}
          className={cn(
            "group relative flex flex-col items-start gap-1 px-3 py-3 rounded-xl",
            "bg-gradient-to-br from-purple-500/15 to-violet-500/10",
            "border border-purple-500/25 hover:border-purple-500/50",
            "touch-scale-sm transition-all duration-300 touch-manipulation min-h-[72px]",
            "hover:shadow-lg hover:shadow-purple-500/20"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Music2 className="w-4 h-4 text-purple-400 shrink-0" />
            </motion.div>
            <span className="text-xs font-semibold text-purple-400">Shazam</span>
          </div>
          <span className="text-[9px] text-muted-foreground leading-tight">
            Найти песню по звуку
          </span>
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
