/**
 * Stem State Indicator Component
 * 
 * Visual indicator for stem state (solo, muted, effects active)
 * Improves visual feedback and user experience
 */

import { memo } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StemStateIndicatorProps {
  isMuted: boolean;
  isSolo: boolean;
  hasActiveEffects: boolean;
  compressorReduction?: number;
}

export const StemStateIndicator = memo(({
  isMuted,
  isSolo,
  hasActiveEffects,
  compressorReduction = 0,
}: StemStateIndicatorProps) => {
  const showCompression = compressorReduction > 1; // Show if reducing by more than 1dB

  return (
    <div className="flex items-center gap-1.5">
      {/* Solo Badge */}
      {isSolo && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Badge 
            variant="default" 
            className={cn(
              "h-6 px-2 text-[10px] font-bold bg-primary text-primary-foreground",
              "shadow-sm shadow-primary/20"
            )}
          >
            SOLO
          </Badge>
        </motion.div>
      )}

      {/* Muted Badge */}
      {isMuted && !isSolo && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Badge 
            variant="destructive" 
            className="h-6 px-2 text-[10px] font-bold gap-1"
          >
            <VolumeX className="w-3 h-3" />
            MUTE
          </Badge>
        </motion.div>
      )}

      {/* Effects Active Badge */}
      {hasActiveEffects && !isMuted && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Badge 
            variant="secondary" 
            className={cn(
              "h-6 px-2 text-[10px] font-medium gap-1",
              "bg-gradient-to-r from-purple-500/10 to-blue-500/10",
              "border-purple-500/20"
            )}
          >
            <Sparkles className="w-3 h-3 text-purple-500" />
            FX
          </Badge>
        </motion.div>
      )}

      {/* Compression Indicator */}
      {showCompression && !isMuted && (
        <Badge 
          variant="outline" 
          className="h-6 px-2 text-[10px] font-mono tabular-nums"
          title={`Компрессия: -${compressorReduction.toFixed(1)}dB`}
        >
          <span className="text-amber-500">-{Math.round(compressorReduction)}dB</span>
        </Badge>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isMuted === nextProps.isMuted &&
    prevProps.isSolo === nextProps.isSolo &&
    prevProps.hasActiveEffects === nextProps.hasActiveEffects &&
    Math.abs((prevProps.compressorReduction || 0) - (nextProps.compressorReduction || 0)) < 0.5
  );
});

StemStateIndicator.displayName = 'StemStateIndicator';
