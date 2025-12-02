import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface VersionBadgeProps {
  versionNumber: number;
  versionCount: number;
  isMaster: boolean;
  onClick?: () => void;
}

export function VersionBadge({
  versionNumber,
  versionCount,
  isMaster,
  onClick
}: VersionBadgeProps) {
  return (
    <Badge
      variant={isMaster ? 'default' : 'secondary'}
      className="text-xs cursor-pointer touch-manipulation min-h-[32px] px-3 gap-1"
      onClick={onClick}
    >
      {isMaster && <Star className="h-3 w-3 fill-current" />}
      v{versionNumber}
      {versionCount > 1 && ` (${versionCount})`}
    </Badge>
  );
}
