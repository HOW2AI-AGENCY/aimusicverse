import { Sparkles, Library, FolderOpen, ListMusic, Upload, Music2, Guitar, Disc, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from '@/lib/motion';
import { useState } from 'react';
import { AudioCoverDialog } from '@/components/AudioCoverDialog';
import { AudioExtendDialog } from '@/components/AudioExtendDialog';
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
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [guitarDialogOpen, setGuitarDialogOpen] = useState(false);

  const handleAction = (action: () => void) => {
    hapticFeedback?.('light');
    action();
  };

  const handleGuitarComplete = (result: Record<string, unknown>) => {
    logger.info('Guitar analysis complete', { result });
    // Could navigate to generation with pre-filled tags
  };

  return (
    <div className="space-y-3">
      {/* Primary CTA - Generate - Simplified for mobile */}
      <TooltipWrapper tooltipId="generate-button">
        <motion.button
          onClick={() => handleAction(onGenerateClick)}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-generate p-3.5 sm:p-4 touch-manipulation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.1 }}
        >
          {/* Content */}
          <div className="relative flex items-center justify-center gap-2.5">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            <span className="text-base sm:text-lg font-bold text-primary-foreground">Создать музыку</span>
          </div>
        </motion.button>
      </TooltipWrapper>

      {/* Quick Navigation - Simplified 3-column grid */}
      <motion.div
        className="grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.03 } }
        }}
      >
        {quickActions.map((action) => (
          <motion.button
            key={action.path}
            onClick={() => handleAction(() => navigate(action.path))}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl",
              "border transition-all duration-200 touch-manipulation min-h-[68px]",
              action.bgColor,
              "active:scale-[0.97]"
            )}
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.9 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            whileTap={{ scale: 0.97 }}
          >
            <action.icon className={cn("w-5 h-5 shrink-0", action.color)} />
            <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tools Row - Hidden on mobile, shown on desktop */}
      <motion.div
        className="hidden sm:grid grid-cols-3 gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.03, delayChildren: 0.1 } }
        }}
      >
        {/* Cover Audio Button */}
        <motion.button
          onClick={() => handleAction(() => setCoverDialogOpen(true))}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl",
            "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Disc className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium">Кавер</span>
        </motion.button>

        {/* Guitar Record Button with NEW badge */}
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
          
          {/* NEW Badge */}
          <span 
            className="absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-bold rounded bg-orange-500 text-white"
          >
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

      <AudioCoverDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
      />

      <AudioExtendDialog
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
      />

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