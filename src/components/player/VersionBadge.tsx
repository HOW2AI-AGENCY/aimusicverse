/**
 * VersionBadge - Shows track version (A/B) indicator
 * Used in players to show which version is playing
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  versionLabel?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export const VersionBadge = memo(function VersionBadge({ 
  versionLabel, 
  className,
  size = 'sm'
}: VersionBadgeProps) {
  // Don't show if no version or it's the default "A"
  if (!versionLabel || versionLabel === 'A') return null;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-mono font-medium border-primary/30 bg-primary/10 text-primary",
        size === 'sm' ? "text-[10px] h-4 px-1.5" : "text-xs h-5 px-2",
        className
      )}
    >
      {versionLabel}
    </Badge>
  );
});