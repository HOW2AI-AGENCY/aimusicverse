// VerificationBadge Component - Sprint 011 Task T025
// Displays verified artist badge with tooltip

import { BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function VerificationBadge({
  className = '',
  size = 'md',
}: VerificationBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center ${className}`}>
            <BadgeCheck
              className={`${SIZES[size]} text-blue-500`}
              aria-label="Verified Artist"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Artist</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
