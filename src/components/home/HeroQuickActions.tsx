import { Sparkles, Library, FolderOpen, ListMusic, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { UploadAudioDialog } from '@/components/UploadAudioDialog';
import { TooltipWrapper } from '@/components/tooltips';
import { cn } from '@/lib/utils';

interface HeroQuickActionsProps {
  onGenerateClick: () => void;
}

const quickActions = [
  { icon: Library, label: 'Библиотека', path: '/library', gradient: 'from-library/20 to-library/5' },
  { icon: FolderOpen, label: 'Проекты', path: '/projects', gradient: 'from-projects/20 to-projects/5' },
  { icon: ListMusic, label: 'Плейлисты', path: '/playlists', gradient: 'from-primary/20 to-primary/5' },
] as const;

export function HeroQuickActions({ onGenerateClick }: HeroQuickActionsProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleAction = (action: () => void) => {
    hapticFeedback?.('light');
    action();
  };

  return (
    <div className="space-y-4">
      {/* Primary CTA - Generate with enhanced design */}
      <TooltipWrapper tooltipId="generate-button">
        <motion.button
          onClick={() => handleAction(onGenerateClick)}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-generate p-4 shadow-glow touch-manipulation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, boxShadow: '0 0 40px hsl(207 90% 54% / 0.4)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.1 }}
        >
          {/* Animated background shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Content */}
          <div className="relative flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="text-lg font-bold text-primary-foreground">Создать музыку</span>
          </div>
          
          {/* Subtle glow orbs */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-generate/20 rounded-full blur-2xl" />
        </motion.button>
      </TooltipWrapper>

      {/* Secondary Actions Grid - simplified to 4 items */}
      <motion.div
        className="grid grid-cols-4 gap-2"
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
              "group relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl",
              "bg-card/40 backdrop-blur-sm border border-border/40",
              "hover:border-primary/40 hover:bg-gradient-to-b",
              action.gradient,
              "active:scale-[0.96] transition-all duration-200 touch-manipulation"
            )}
            variants={{
              hidden: { opacity: 0, y: 15, scale: 0.9 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            whileHover={{ y: -2 }}
          >
            <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}

        {/* Upload Audio Button with NEW badge */}
        <motion.button
          onClick={() => handleAction(() => setUploadDialogOpen(true))}
          className={cn(
            "group relative flex flex-col items-center justify-center gap-1 py-3 rounded-xl",
            "bg-gradient-to-b from-generate/10 to-generate/5 border border-generate/30",
            "hover:border-generate/50 hover:from-generate/15 hover:to-generate/10",
            "active:scale-[0.96] transition-all duration-200 touch-manipulation"
          )}
          variants={{
            hidden: { opacity: 0, y: 15, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ y: -2 }}
        >
          <Upload className="w-5 h-5 text-generate" />
          <span className="text-[10px] font-medium text-generate">Аудио</span>
          
          {/* NEW Badge */}
          <motion.span 
            className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-generate text-white shadow-sm"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            NEW
          </motion.span>
        </motion.button>
      </motion.div>

      <UploadAudioDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}