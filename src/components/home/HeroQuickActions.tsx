import { Button } from '@/components/ui/button';
import { Sparkles, Library, FolderOpen, Users, ListMusic, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from 'framer-motion';

interface HeroQuickActionsProps {
  onGenerateClick: () => void;
}

export function HeroQuickActions({ onGenerateClick }: HeroQuickActionsProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const handleAction = (action: () => void) => {
    hapticFeedback?.('light');
    action();
  };

  return (
    <div className="space-y-4">
      {/* Primary CTA - Generate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          onClick={() => handleAction(onGenerateClick)}
          className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold bg-gradient-telegram hover:opacity-90 shadow-lg shadow-primary/30 rounded-2xl touch-manipulation active:scale-[0.98] transition-transform"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          Создать музыку
        </Button>
      </motion.div>

      {/* Secondary Actions - 2x3 Grid */}
      <motion.div
        className="grid grid-cols-3 gap-2 sm:gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="outline"
          onClick={() => handleAction(() => navigate('/library'))}
          className="h-12 sm:h-14 flex-col gap-1 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/5 touch-manipulation active:scale-[0.98] transition-all"
        >
          <Library className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs">Библиотека</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleAction(() => navigate('/projects'))}
          className="h-12 sm:h-14 flex-col gap-1 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/5 touch-manipulation active:scale-[0.98] transition-all"
        >
          <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs">Проекты</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleAction(() => navigate('/playlists'))}
          className="h-12 sm:h-14 flex-col gap-1 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/5 touch-manipulation active:scale-[0.98] transition-all"
        >
          <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs">Плейлисты</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleAction(() => navigate('/actors'))}
          className="h-12 sm:h-14 flex-col gap-1 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/5 touch-manipulation active:scale-[0.98] transition-all"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs">Артисты</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleAction(() => navigate('/community'))}
          className="h-12 sm:h-14 flex-col gap-1 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/5 touch-manipulation active:scale-[0.98] transition-all"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs">Сообщество</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleAction(() => navigate('/blog'))}
          className="h-12 sm:h-14 flex-col gap-1 rounded-xl glass border-border/50 hover:border-primary/50 hover:bg-primary/5 touch-manipulation active:scale-[0.98] transition-all relative"
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-xs">Блог</span>
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-primary text-primary-foreground">
            NEW
          </span>
        </Button>
      </motion.div>
    </div>
  );
}
