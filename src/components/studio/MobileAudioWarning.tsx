/**
 * Mobile Audio Warning Component
 * 
 * Displays a dismissible warning when stems are limited
 * due to mobile device audio constraints.
 */

import { memo } from 'react';
import { AlertTriangle, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from '@/lib/motion';
import { TrackStem } from '@/hooks/useTrackStems';

interface MobileAudioWarningProps {
  show: boolean;
  activeCount: number;
  limitedStems: TrackStem[];
  onDismiss: () => void;
}

export const MobileAudioWarning = memo(({ 
  show, 
  activeCount, 
  limitedStems, 
  onDismiss 
}: MobileAudioWarningProps) => {
  if (!show || limitedStems.length === 0) return null;
  
  const limitedTypes = limitedStems
    .map(s => s.stem_type)
    .slice(0, 3)
    .join(', ');
  
  const moreCount = limitedStems.length > 3 ? limitedStems.length - 3 : 0;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="px-4 pb-2"
        >
          <Alert variant="default" className="bg-amber-500/10 border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500 text-sm">
              Ограничение мобильного аудио
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground pr-8">
              <p>
                Воспроизводятся {activeCount} из {activeCount + limitedStems.length} стемов.
                {' '}Отключены: {limitedTypes}
                {moreCount > 0 && ` и ещё ${moreCount}`}.
              </p>
              <p className="mt-1 flex items-center gap-1 text-amber-500/80">
                <Volume2 className="w-3 h-3" />
                Используйте Solo для выбора нужных стемов
              </p>
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-amber-500/20"
            >
              <X className="w-3 h-3" />
            </Button>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

MobileAudioWarning.displayName = 'MobileAudioWarning';
