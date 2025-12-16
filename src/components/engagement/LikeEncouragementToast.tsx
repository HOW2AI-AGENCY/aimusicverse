/**
 * Like Encouragement Toast - Shows contextual hints to encourage engagement
 */

import { useEffect, useState, useCallback } from 'react';
import { Heart, Sparkles, ThumbsUp, Music2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface EncouragementMessage {
  id: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  delay: number; // ms after page load
}

const ENCOURAGEMENT_MESSAGES: EncouragementMessage[] = [
  {
    id: 'like-tracks',
    icon: <Heart className="w-5 h-5 text-red-400" />,
    title: 'Понравился трек?',
    message: 'Ставьте ❤️ лайк, чтобы поддержать создателя и сохранить в избранное',
    delay: 30000, // 30 seconds
  },
  {
    id: 'discover-creators',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    title: 'Открывайте новое',
    message: 'Нажмите на аватар автора, чтобы увидеть все его работы',
    delay: 60000, // 1 minute
  },
  {
    id: 'share-music',
    icon: <Music2 className="w-5 h-5 text-primary" />,
    title: 'Делитесь музыкой',
    message: 'Отправьте понравившийся трек друзьям через меню «Поделиться»',
    delay: 120000, // 2 minutes
  },
];

const STORAGE_KEY = 'mvai_encouragement_shown';
const COOLDOWN_HOURS = 24;

export function LikeEncouragementProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentMessage, setCurrentMessage] = useState<EncouragementMessage | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const canShowEncouragement = useCallback(() => {
    if (!user) return false;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { timestamp, shown } = JSON.parse(stored);
      const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
      if (hoursSince < COOLDOWN_HOURS) {
        return false;
      }
    }
    return true;
  }, [user]);

  const markAsShown = useCallback((id: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let shown: string[] = [];
    if (stored) {
      const data = JSON.parse(stored);
      shown = data.shown || [];
    }
    if (!shown.includes(id)) {
      shown.push(id);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      shown,
    }));
  }, []);

  useEffect(() => {
    if (!canShowEncouragement()) return;

    const timers: NodeJS.Timeout[] = [];

    ENCOURAGEMENT_MESSAGES.forEach((msg) => {
      if (dismissed.has(msg.id)) return;
      
      const timer = setTimeout(() => {
        if (!dismissed.has(msg.id)) {
          setCurrentMessage(msg);
          markAsShown(msg.id);
        }
      }, msg.delay);
      
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [canShowEncouragement, dismissed, markAsShown]);

  const handleDismiss = () => {
    if (currentMessage) {
      setDismissed(prev => new Set([...prev, currentMessage.id]));
    }
    setCurrentMessage(null);
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {currentMessage && (
          <EncouragementToast 
            message={currentMessage} 
            onDismiss={handleDismiss}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EncouragementToast({ 
  message, 
  onDismiss 
}: { 
  message: EncouragementMessage; 
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000); // Auto-dismiss after 8s
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      className="fixed bottom-24 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
    >
      <div className="relative p-4 rounded-xl bg-card/95 backdrop-blur-md border border-border/50 shadow-lg">
        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-start gap-3 pr-6">
          <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
            {message.icon}
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-0.5">{message.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {message.message}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-primary/50 rounded-b-xl"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 8, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

// Hook to manually trigger encouragement
export function useEncouragement() {
  const showLikeHint = useCallback(() => {
    // This could show a tooltip near a like button
  }, []);

  return { showLikeHint };
}
