import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Trash2 } from 'lucide-react';
import { ActionId } from '@/config/trackActionsConfig';

interface DangerActionsProps {
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
}

export function DangerActions({ onAction, variant }: DangerActionsProps) {
  if (variant === 'dropdown') {
    return (
      <DropdownMenuItem 
        onClick={() => onAction('delete')}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Удалить
      </DropdownMenuItem>
    );
  }

  // Sheet variant
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => onAction('delete')}
    >
      <Trash2 className="w-5 h-5" />
      <span>Удалить</span>
    </Button>
  );
}
