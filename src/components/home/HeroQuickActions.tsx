import { Sparkles, Library, FolderOpen, Users, ListMusic, BookOpen, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { UploadAudioDialog } from '@/components/UploadAudioDialog';
import { GlowButton } from '@/components/ui/glow-button';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

interface HeroQuickActionsProps {
  onGenerateClick: () => void;
}

const quickActions = [
  { icon: Library, label: 'Библиотека', path: '/library', color: 'library' },
  { icon: FolderOpen, label: 'Проекты', path: '/projects', color: 'projects' },
  { icon: ListMusic, label: 'Плейлисты', path: '/playlists', color: 'primary' },
  { icon: Users, label: 'Артисты', path: '/actors', color: 'community' },
  { icon: Users, label: 'Сообщество', path: '/community', color: 'generate' },
  { icon: BookOpen, label: 'Блог', path: '/blog', color: 'primary' },
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
      {/* Primary CTA - Generate with Glow Effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlowButton
          variant="generate"
          size="xl"
          glow="static"
          onClick={() => handleAction(onGenerateClick)}
          className="w-full touch-manipulation"
        >
          <Sparkles className="w-6 h-6" />
          Создать музыку
        </GlowButton>
      </motion.div>

      {/* Secondary Actions Grid */}
      <motion.div
        className="grid grid-cols-3 gap-2 sm:gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {quickActions.map((action, index) => (
          <motion.button
            key={action.path}
            onClick={() => handleAction(() => navigate(action.path))}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1.5 h-14 sm:h-16 rounded-xl",
              "bg-card/50 backdrop-blur-sm border border-border/50",
              "hover:border-primary/50 hover:bg-primary/5",
              "active:scale-[0.97] transition-all duration-200 touch-manipulation"
            )}
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.03 }}
          >
            <action.icon className={cn(
              "w-5 h-5 transition-colors duration-200",
              "text-muted-foreground group-hover:text-primary"
            )} />
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}

        {/* Upload Audio Button with NEW badge */}
        <motion.button
          onClick={() => handleAction(() => setUploadDialogOpen(true))}
          className={cn(
            "group relative flex flex-col items-center justify-center gap-1.5 h-14 sm:h-16 rounded-xl",
            "bg-card/50 backdrop-blur-sm border border-border/50",
            "hover:border-generate/50 hover:bg-generate/5",
            "active:scale-[0.97] transition-all duration-200 touch-manipulation"
          )}
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.43 }}
        >
          <Upload className="w-5 h-5 text-muted-foreground group-hover:text-generate transition-colors" />
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Аудио
          </span>
          {/* NEW Badge */}
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-generate text-white animate-pulse-glow">
            NEW
          </span>
        </motion.button>
      </motion.div>

      <UploadAudioDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}
