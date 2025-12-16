import { Sparkles, Library, FolderOpen, ListMusic, Music2, Guitar, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from '@/lib/motion';
import { useState } from 'react';
import { MusicRecognitionDialog } from '@/components/music-recognition/MusicRecognitionDialog';
import { GuitarRecordDialog } from '@/components/generate-form/GuitarRecordDialog';
import { TooltipWrapper } from '@/components/tooltips';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface HeroQuickActionsProps {
  onGenerateClick: () => void;
}

const quickActions = [
  { icon: Library, label: 'Библиотека', path: '/library', color: 'text-cyan-400', bgColor: 'from-cyan-500/20 to-cyan-600/10', borderColor: 'border-cyan-500/30' },
  { icon: FolderOpen, label: 'Проекты', path: '/projects', color: 'text-emerald-400', bgColor: 'from-emerald-500/20 to-emerald-600/10', borderColor: 'border-emerald-500/30' },
  { icon: ListMusic, label: 'Плейлисты', path: '/playlists', color: 'text-violet-400', bgColor: 'from-violet-500/20 to-violet-600/10', borderColor: 'border-violet-500/30' },
] as const;

export function HeroQuickActions({ onGenerateClick }: HeroQuickActionsProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [guitarDialogOpen, setGuitarDialogOpen] = useState(false);

  const handleAction = (action: () => void) => {
    hapticFeedback?.('light');
    action();
  };

  const handleGuitarComplete = (result: Record<string, unknown>) => {
    logger.info('Guitar analysis complete', { result });
  };

  return (
    <div className="space-y-2.5">
      {/* Primary CTA - Generate - Compact */}
      <TooltipWrapper tooltipId="generate-button">
        <motion.button
          onClick={() => handleAction(onGenerateClick)}
          className="group relative w-full overflow-hidden rounded-xl p-3.5 touch-manipulation shadow-lg shadow-primary/20 fab touch-scale-sm"
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

          <div className="relative flex items-center justify-center gap-2.5">
            <motion.div
              className="relative"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wand2 className="w-5 h-5 text-primary-foreground" />
              <motion.div
                className="absolute -top-0.5 -right-0.5"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
              </motion.div>
            </motion.div>
            <div className="flex flex-col items-start">
              <span className="text-base font-bold text-primary-foreground tracking-tight">
                Создать музыку
              </span>
              <span className="text-[10px] text-primary-foreground/70 font-medium">
                AI генерация за секунды
              </span>
            </div>
          </div>
        </motion.button>
      </TooltipWrapper>

      {/* Quick Navigation - Compact cards */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {quickActions.map((action) => (
          <motion.button
            key={action.path}
            onClick={() => handleAction(() => navigate(action.path))}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl",
              "border backdrop-blur-sm transition-all duration-300 touch-manipulation min-h-[56px]",
              `bg-gradient-to-br ${action.bgColor}`,
              action.borderColor,
              "hover:shadow-md hover:shadow-primary/10",
              "touch-scale-sm card-pressable"
            )}
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
          >
            <action.icon className={cn("w-5 h-5 shrink-0", action.color)} />
            <span className="text-[11px] font-semibold text-center leading-tight">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tools Row - Compact */}
      <motion.div
        className="grid grid-cols-2 gap-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } } }}
      >
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
          <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-bold rounded bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            NEW
          </span>
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
    </div>
  );
}
