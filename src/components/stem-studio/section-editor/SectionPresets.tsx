/**
 * Quick preset buttons for section replacement
 */

import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { SECTION_PRESETS } from '@/hooks/useSectionReplacement';

interface SectionPresetsProps {
  onSelect: (prompt: string) => void;
  compact?: boolean;
}

export function SectionPresets({ onSelect, compact = false }: SectionPresetsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SECTION_PRESETS.map((preset, idx) => (
        <motion.div
          key={preset.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.03, type: 'spring', stiffness: 400, damping: 20 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="sm"
            className={`transition-colors hover:bg-primary/10 hover:border-primary/50 ${
              compact ? 'h-7 text-xs px-2' : 'h-8 text-xs'
            }`}
            onClick={() => onSelect(preset.prompt)}
          >
            {preset.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
