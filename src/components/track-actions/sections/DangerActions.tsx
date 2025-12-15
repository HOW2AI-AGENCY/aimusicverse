import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Trash2, Flag } from 'lucide-react';
import { ActionId } from '@/config/trackActionsConfig';
import { Track } from '@/hooks/useTracksOptimized';
import { useAuth } from '@/contexts/AuthContext';

interface DangerActionsProps {
  track?: Track;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
}

export function DangerActions({ track, onAction, variant }: DangerActionsProps) {
  const { user } = useAuth();
  const isOwnTrack = track?.user_id === user?.id;

  if (variant === 'dropdown') {
    return (
      <>
        {/* Report - only for other users' tracks */}
        {!isOwnTrack && (
          <>
            <DropdownMenuItem 
              onClick={() => onAction('report')}
              className="text-muted-foreground"
            >
              <Flag className="w-4 h-4 mr-2" />
              Пожаловаться
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={() => onAction('delete')}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Удалить
        </DropdownMenuItem>
      </>
    );
  }

  // Sheet variant
  return (
    <div className="space-y-2">
      {!isOwnTrack && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-muted-foreground"
          onClick={() => onAction('report')}
        >
          <Flag className="w-5 h-5" />
          <span>Пожаловаться</span>
        </Button>
      )}
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onAction('delete')}
      >
        <Trash2 className="w-5 h-5" />
        <span>Удалить</span>
      </Button>
    </div>
  );
}
