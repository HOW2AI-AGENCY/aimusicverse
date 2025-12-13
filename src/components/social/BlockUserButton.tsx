// BlockUserButton Component - Sprint 011 Task T089
// Block/unblock user functionality with confirmation dialog

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Ban, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTelegram } from '@/contexts/TelegramContext';

interface BlockUserButtonProps {
  userId: string;
  username?: string;
  isBlocked?: boolean;
  className?: string;
  variant?: 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  onBlockChange?: (blocked: boolean) => void;
}

/**
 * Block/unblock user button with confirmation dialog
 */
export function BlockUserButton({
  userId,
  username = 'этого пользователя',
  isBlocked = false,
  className,
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  onBlockChange,
}: BlockUserButtonProps) {
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);

  // Block/unblock mutation
  const blockMutation = useMutation({
    mutationFn: async ({ block }: { block: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (block) {
        // Block user
        const { error } = await supabase.from('blocked_users').insert({
          blocker_id: user.id,
          blocked_id: userId,
        });
        if (error) throw error;
      } else {
        // Unblock user
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .match({ blocker_id: user.id, blocked_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      const { block } = variables;
      hapticFeedback('success');
      toast.success(block ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      
      // Call callback
      onBlockChange?.(block);
    },
    onError: (error) => {
      console.error('Block/unblock error:', error);
      hapticFeedback('error');
      toast.error('Не удалось выполнить действие');
    },
  });

  const handleClick = () => {
    hapticFeedback('light');
    if (isBlocked) {
      // Unblock directly without confirmation
      blockMutation.mutate({ block: false });
    } else {
      // Block with confirmation
      setShowDialog(true);
    }
  };

  const handleConfirmBlock = () => {
    blockMutation.mutate({ block: true });
    setShowDialog(false);
  };

  // Don't show button for self
  if (user?.id === userId) {
    return null;
  }

  const Icon = isBlocked ? UserX : Ban;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={blockMutation.isPending}
      >
        {showIcon && <Icon className="w-4 h-4 mr-2" />}
        {blockMutation.isPending
          ? 'Загрузка...'
          : isBlocked
            ? 'Разблокировать'
            : 'Заблокировать'}
      </Button>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заблокировать @{username}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Этот пользователь:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Не сможет видеть ваш профиль и треки</li>
                <li>Не сможет комментировать ваши треки</li>
                <li>Не сможет подписаться на вас</li>
                <li>Будет удален из ваших подписчиков</li>
              </ul>
              <p className="text-sm mt-2">Вы можете разблокировать позже.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => hapticFeedback('light')}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                hapticFeedback('light');
                handleConfirmBlock();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Заблокировать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
