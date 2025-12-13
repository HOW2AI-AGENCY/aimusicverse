import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import { toast } from 'sonner';
import { Ban, Loader2 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface BlockUserButtonProps {
  userId: string;
  username?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function BlockUserButton({
  userId,
  username,
  variant = 'ghost',
  size = 'sm',
  className,
}: BlockUserButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Check if user is already blocked
  const { data: isBlocked, isLoading: isCheckingBlock } = useQuery({
    queryKey: ['is-blocked', user?.id, userId],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && userId !== user?.id,
  });

  // Block user mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (userId === user.id) throw new Error('Cannot block yourself');

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      triggerHapticFeedback('success');
      toast.success(`${username || 'User'} blocked successfully`);
      queryClient.invalidateQueries({ queryKey: ['is-blocked', user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
    onError: (error: any) => {
      triggerHapticFeedback('error');
      toast.error('Failed to block user');
      console.error('Block user error:', error);
    },
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      triggerHapticFeedback('success');
      toast.success(`${username || 'User'} unblocked`);
      queryClient.invalidateQueries({ queryKey: ['is-blocked', user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
    onError: (error: any) => {
      triggerHapticFeedback('error');
      toast.error('Failed to unblock user');
      console.error('Unblock user error:', error);
    },
  });

  const handleBlockClick = () => {
    if (isBlocked) {
      // Unblock without confirmation
      unblockMutation.mutate();
    } else {
      // Show confirmation for blocking
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmBlock = () => {
    blockMutation.mutate();
    setShowConfirmDialog(false);
  };

  // Don't show button for own profile
  if (!user || userId === user.id) {
    return null;
  }

  const isPending = blockMutation.isPending || unblockMutation.isPending;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleBlockClick}
        disabled={isPending || isCheckingBlock}
        className={className}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Ban className="h-4 w-4 mr-2" />
            {isBlocked ? 'Unblock' : 'Block'}
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {username || 'this user'}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Blocking this user will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Prevent them from seeing your profile and tracks</li>
                <li>Prevent them from commenting on your tracks</li>
                <li>Prevent them from following you</li>
                <li>Remove them from your followers</li>
              </ul>
              <p className="mt-2">You can unblock them anytime from your settings.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBlock} className="bg-destructive hover:bg-destructive/90">
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
