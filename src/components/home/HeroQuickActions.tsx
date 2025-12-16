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
    <div className="space-y-4">
      {/* Primary CTA - Generate - Enhanced with premium gradient */}
      <TooltipWrapper tooltipId="generate-button">
        <motion.button
          onClick={() => handleAction(onGenerateClick)}
          className="group relative w-full overflow-hidden rounded-2xl p-5 sm:p-6 touch-manipulation shadow-2xl shadow-primary/25 fab touch-scale-sm"
          initial={{ opacity: 0, y: 20 }}
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
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "linear"
            }}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/40"
                initial={{ 
                  x: `${20 + i * 15}%`, 
                  y: '100%',
                  opacity: 0 
                }}
                animate={{ 
                  y: '-20%',
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative flex items-center justify-center gap-3">
            <motion.div
              className="relative"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Wand2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </motion.div>
            </motion.div>
            <div className="flex flex-col items-start">
              <span className="text-xl sm:text-2xl font-bold text-primary-foreground tracking-tight">
                Создать музыку
              </span>
              <span className="text-xs text-primary-foreground/70 font-medium">
                AI генерация за секунды
              </span>
            </div>
          </div>
        </motion.button>
      </TooltipWrapper>

      {/* Quick Navigation - Enhanced cards with gradients */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        {quickActions.map((action) => (
          <motion.button
            key={action.path}
            onClick={() => handleAction(() => navigate(action.path))}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl",
              "border-2 backdrop-blur-sm transition-all duration-300 touch-manipulation min-h-[80px]",
              `bg-gradient-to-br ${action.bgColor}`,
              action.borderColor,
              "hover:shadow-lg hover:shadow-primary/10",
              "touch-scale-sm card-pressable"
            )}
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.9 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <motion.div
              className="relative"
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <action.icon className={cn("w-6 h-6 sm:w-7 sm:h-7 shrink-0", action.color)} />
            </motion.div>
            <span className="text-xs sm:text-sm font-semibold text-center leading-tight">
              {action.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tools Row - Both mobile and desktop */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.03, delayChildren: 0.15 } }
        }}
      >
        {/* Guitar Record Button */}
        <motion.button
          onClick={() => handleAction(() => setGuitarDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2.5 px-4 py-3 rounded-xl",
            "bg-gradient-to-br from-orange-500/15 to-amber-500/10",
            "border border-orange-500/25 hover:border-orange-500/40",
            "hover:shadow-lg hover:shadow-orange-500/10",
            "touch-scale-sm transition-all duration-300 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Guitar className="w-5 h-5 text-orange-400 shrink-0" />
          </motion.div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-orange-400">Гитара</span>
            <span className="text-[10px] text-muted-foreground">Запись аккордов</span>
          </div>
          <motion.span 
            className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            NEW
          </motion.span>
        </motion.button>

        {/* Music Recognition Button */}
        <motion.button
          onClick={() => handleAction(() => setRecognitionDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2.5 px-4 py-3 rounded-xl",
            "bg-gradient-to-br from-purple-500/15 to-violet-500/10",
            "border border-purple-500/25 hover:border-purple-500/40",
            "hover:shadow-lg hover:shadow-purple-500/10",
            "touch-scale-sm transition-all duration-300 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Music2 className="w-5 h-5 text-purple-400 shrink-0" />
          </motion.div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-purple-400">Shazam</span>
            <span className="text-[10px] text-muted-foreground">Найти песню</span>
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
