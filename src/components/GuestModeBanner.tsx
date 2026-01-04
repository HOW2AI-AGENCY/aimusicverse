import { LogIn, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { motion, AnimatePresence } from '@/lib/motion';

export const GuestModeBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const { disableGuestMode } = useGuestMode();

  if (!isVisible) return null;

  const handleSignIn = () => {
    disableGuestMode();
    navigate('/auth');
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-muted/95 backdrop-blur-md border-b border-border/50"
      >
        <div className="container mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground flex-1 truncate">
            Гостевой режим
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignIn}
              className="h-7 text-xs gap-1 px-2"
            >
              <LogIn className="w-3 h-3" />
              Войти
            </Button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-muted rounded touch-manipulation"
              aria-label="Закрыть"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
