/**
 * Feature announcement banner for new subscription feature
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Users, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'feature_announcement_subscriptions_v1';

export function SubscriptionFeatureAnnouncement() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Check if user has already dismissed this announcement
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Show after a small delay
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-xl backdrop-blur-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-semibold text-sm mb-1">
                    🎉 Новое: Подписки на авторов!
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Теперь вы можете подписываться на любимых создателей музыки 
                    и видеть их новые треки в своей ленте. Также вы увидите 
                    треки от авторов, которым ставили лайки!
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      className="h-7 text-xs"
                      asChild
                    >
                      <Link to="/community">
                        <Users className="w-3 h-3 mr-1" />
                        Найти авторов
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleDismiss}
                    >
                      Понятно
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>Подписки</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Лайки → Рекомендации</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SubscriptionFeatureAnnouncement;
