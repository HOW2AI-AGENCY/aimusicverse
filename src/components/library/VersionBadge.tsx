import { Badge } from '@/components/ui/badge';
import { Star, Layers } from 'lucide-react';
import { TooltipWrapper } from '@/components/tooltips';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  versionNumber: number;
  versionCount: number;
  isMaster: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  compact?: boolean;
  showTooltip?: boolean;
}

export function VersionBadge({
  versionNumber,
  versionCount,
  isMaster,
  onClick,
  compact = false,
  showTooltip = false
}: VersionBadgeProps) {
  // Convert version number to A/B format
  const versionLabel = versionNumber <= 26 
    ? String.fromCharCode(64 + versionNumber) // A, B, C...
    : `V${versionNumber}`;

  const badgeContent = compact ? (
    <Badge
      variant="outline"
      className={cn(
        "text-xs px-2 py-1 min-h-[32px] font-medium cursor-pointer touch-manipulation",
        isMaster && "border-primary/50 bg-primary/10 text-primary"
      )}
      onClick={onClick}
    >
      <Layers className="h-3 w-3 mr-1" />
      {versionLabel}/{versionCount}
    </Badge>
  ) : (
    <Badge
      variant={isMaster ? 'default' : 'secondary'}
      className="text-xs cursor-pointer touch-manipulation min-h-[44px] px-3 gap-1"
      onClick={onClick}
    >
      {isMaster && <Star className="h-3 w-3 fill-current" />}
      v{versionNumber}
      {versionCount > 1 && ` (${versionCount})`}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipWrapper tooltipId="version-switch">
        {badgeContent}
      </TooltipWrapper>
    );
  }

  return badgeContent;
}
