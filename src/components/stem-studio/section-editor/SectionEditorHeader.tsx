/**
 * Header for section editor with title and close button
 */

import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetectedSection } from '@/hooks/useSectionDetection';

interface SectionEditorHeaderProps {
  selectedSection: DetectedSection | null;
  startTime: number;
  endTime: number;
  onClose: () => void;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SectionEditorHeader({
  selectedSection,
  startTime,
  endTime,
  onClose,
}: SectionEditorHeaderProps) {
  const duration = endTime - startTime;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"
          animate={{ 
            boxShadow: [
              '0 0 0 0 hsl(var(--primary) / 0.3)', 
              '0 0 0 8px hsl(var(--primary) / 0)', 
              '0 0 0 0 hsl(var(--primary) / 0)'
            ] 
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </motion.div>
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            Заменить секцию
            {selectedSection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Badge variant="secondary" className="text-xs font-medium">
                  {selectedSection.label}
                </Badge>
              </motion.div>
            )}
          </h3>
          <p className="text-xs text-muted-foreground font-mono">
            {formatTime(startTime)} — {formatTime(endTime)} 
            <span className="ml-1.5 text-primary">({formatTime(duration)})</span>
          </p>
        </div>
      </div>
      
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}
