/**
 * StatusIcons - Track status indicators
 * 
 * Shows icons for: vocals, instrumental, stems, MIDI, PDF, cover, extend
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Mic2,
  Guitar,
  Layers,
  Music2,
  FileText,
  Copy,
  ArrowRightFromLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrackData, MidiStatus } from '../types';

interface StatusIconProps {
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'cyan' | 'amber' | 'orange' | 'primary';
  label: string;
}

const colorClasses = {
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-500 ring-blue-500/20',
  green: 'from-green-500/20 to-green-500/5 text-green-500 ring-green-500/20',
  purple: 'from-purple-500/20 to-purple-500/5 text-purple-500 ring-purple-500/20',
  cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-500 ring-cyan-500/20',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-500 ring-amber-500/20',
  orange: 'from-orange-500/20 to-orange-500/5 text-orange-500 ring-orange-500/20',
  primary: 'from-primary/20 to-primary/5 text-primary ring-primary/20',
};

export const StatusIcon = memo(function StatusIcon({
  icon: Icon,
  color,
  label,
}: StatusIconProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'w-5 h-5 rounded-md bg-gradient-to-br flex items-center justify-center ring-1',
        colorClasses[color]
      )}
      title={label}
    >
      <Icon className="w-3 h-3" />
    </motion.div>
  );
});

interface StatusIconsProps {
  track: TrackData;
  stemCount?: number;
  midiStatus?: MidiStatus;
  compact?: boolean;
}

export const StatusIcons = memo(function StatusIcons({
  track,
  stemCount = 0,
  midiStatus,
  compact = false,
}: StatusIconsProps) {
  const trackAny = track as any;
  
  const hasVocals = track.has_vocals === true;
  const isInstrumental = track.is_instrumental === true ||
    (track.is_instrumental == null && track.has_vocals === false);
  const hasStems = track.has_stems === true || stemCount > 0;
  const isCover = ['remix', 'cover', 'upload_cover'].includes(trackAny.generation_mode || '');
  const isExtend = ['extend', 'upload_extend'].includes(trackAny.generation_mode || '');

  const icons = [];

  if (isCover) {
    icons.push({ icon: Copy, color: 'purple' as const, label: 'Кавер' });
  }
  if (isExtend) {
    icons.push({ icon: ArrowRightFromLine, color: 'cyan' as const, label: 'Расширение' });
  }
  if (hasVocals) {
    icons.push({ icon: Mic2, color: 'blue' as const, label: 'Вокал' });
  }
  if (isInstrumental) {
    icons.push({ icon: Guitar, color: 'green' as const, label: 'Инструментал' });
  }
  if (hasStems) {
    icons.push({ icon: Layers, color: 'purple' as const, label: 'Стемы' });
  }
  if (midiStatus?.hasMidi) {
    icons.push({ icon: Music2, color: 'primary' as const, label: 'MIDI' });
  }
  if (midiStatus?.hasPdf) {
    icons.push({ icon: FileText, color: 'amber' as const, label: 'Ноты' });
  }

  if (icons.length === 0) return null;

  return (
    <div className={cn('flex items-center', compact ? 'gap-0.5' : 'gap-1')}>
      <AnimatePresence>
        {icons.map(({ icon, color, label }) => (
          <StatusIcon key={label} icon={icon} color={color} label={label} />
        ))}
      </AnimatePresence>
    </div>
  );
});
