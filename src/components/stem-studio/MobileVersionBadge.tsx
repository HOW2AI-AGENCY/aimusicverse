/**
 * Mobile Version Badge
 * Compact version indicator for mobile studio header
 */

import { motion } from '@/lib/motion';
import { GitBranch, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { cn } from '@/lib/utils';

interface MobileVersionBadgeProps {
  trackId: string;
  onClick?: () => void;
  className?: string;
}

export function MobileVersionBadge({
  trackId,
  onClick,
  className,
}: MobileVersionBadgeProps) {
  const { data: versions } = useTrackVersions(trackId);
  const versionCount = versions?.length || 0;
  const activeVersion = versions?.find(v => v.is_primary);
  const activeIndex = versions?.findIndex(v => v.is_primary) ?? 0;

  if (versionCount <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className={cn(
          "h-8 gap-1.5 px-2.5 rounded-full",
          "bg-primary/10 border-primary/30 text-primary",
          "hover:bg-primary/20"
        )}
      >
        <GitBranch className="w-3.5 h-3.5" />
        <span className="font-mono font-bold text-xs">
          {String.fromCharCode(65 + activeIndex)}
        </span>
        <span className="text-xs opacity-70">/ {versionCount}</span>
        <ChevronRight className="w-3 h-3 opacity-50" />
      </Button>
    </motion.div>
  );
}
