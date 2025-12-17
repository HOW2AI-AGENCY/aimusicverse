import { useState, useEffect } from 'react';
import { X, Zap, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'early-listening-announcement-dismissed';

export function EarlyListeningAnnouncement() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/30 p-4 mb-4"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_50%)]" />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Новое: Раннее прослушивание
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  Быстрее!
                </span>
              </h3>
              
              <p className="text-sm text-muted-foreground mt-1">
                Теперь вы можете слушать треки уже через <strong className="text-foreground">30-60 секунд</strong> после 
                начала генерации! Ищите статус <span className="inline-flex items-center gap-1 text-primary">
                  <Headphones className="h-3 w-3" /> "Можно слушать"
                </span> в индикаторе генерации.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
