import { Sparkles, Library, FolderOpen, ListMusic, Music2, Guitar } from 'lucide-react';
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
  { icon: Library, label: 'Библиотека', path: '/library', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
  { icon: FolderOpen, label: 'Проекты', path: '/projects', color: 'text-teal-400', bgColor: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20' },
  { icon: ListMusic, label: 'Плейлисты', path: '/playlists', color: 'text-violet-400', bgColor: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20' },
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
    <div className="space-y-3">
      {/* Primary CTA - Generate - Enhanced with premium gradient */}
      <TooltipWrapper tooltipId="generate-button">
        <motion.button
          onClick={() => handleAction(onGenerateClick)}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-generate p-4 sm:p-5 touch-manipulation shadow-lg shadow-primary/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          transition={{ delay: 0.1 }}
        >
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "linear"
            }}
          />
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center justify-center gap-2.5">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </motion.div>
            <span className="text-lg sm:text-xl font-bold text-primary-foreground tracking-tight">Создать музыку</span>
          </div>
        </motion.button>
      </TooltipWrapper>

      {/* Quick Navigation - Enhanced with better visual depth */}
      <motion.div
        className="grid grid-cols-3 gap-2.5"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.04 } }
        }}
      >
        {quickActions.map((action) => (
          <motion.button
            key={action.path}
            onClick={() => handleAction(() => navigate(action.path))}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl",
              "border-2 backdrop-blur-sm transition-all duration-200 touch-manipulation min-h-[72px]",
              action.bgColor,
              "active:scale-[0.96] hover:scale-[1.02]",
              "shadow-sm hover:shadow-md"
            )}
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.9 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <action.icon className={cn("w-6 h-6 shrink-0", action.color)} />
            </motion.div>
            <span className="text-[11px] font-semibold text-center leading-tight">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tools Row - Desktop only */}
      <motion.div
        className="hidden sm:grid grid-cols-2 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } }
        }}
      >
        {/* Guitar Record Button */}
        <motion.button
          onClick={() => handleAction(() => setGuitarDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl",
            "bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Guitar className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-xs font-medium text-orange-400">Гитара</span>
          <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-bold rounded bg-orange-500 text-white">
            NEW
          </span>
        </motion.button>

        {/* Music Recognition Button */}
        <motion.button
          onClick={() => handleAction(() => setRecognitionDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl",
            "bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Music2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-xs font-medium text-purple-400">Shazam</span>
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
