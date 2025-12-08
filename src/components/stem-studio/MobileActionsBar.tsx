/**
 * Mobile Actions Bar
 * 
 * Organized action buttons with icons and labels
 */

import { 
  Scissors, Save, Music, Wand2, Download, Share2, 
  MoreHorizontal, Sliders 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ActionItem {
  icon: typeof Scissors;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success';
  disabled?: boolean;
}

interface MobileActionsBarProps {
  primaryActions: ActionItem[];
  secondaryActions?: ActionItem[];
}

export function MobileActionsBar({
  primaryActions,
  secondaryActions = [],
}: MobileActionsBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 overflow-x-auto scrollbar-hide">
      {/* Primary actions */}
      {primaryActions.map((action, idx) => (
        <Button
          key={idx}
          variant={action.variant === 'primary' ? 'default' : 'outline'}
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "h-9 gap-1.5 flex-shrink-0",
            action.variant === 'success' && "border-success/50 text-success hover:bg-success/10"
          )}
        >
          <action.icon className="w-4 h-4" />
          <span className="text-xs">{action.label}</span>
        </Button>
      ))}

      {/* More actions dropdown */}
      {secondaryActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 flex-shrink-0 px-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {secondaryActions.map((action, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={action.onClick}
                disabled={action.disabled}
                className="gap-2"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
