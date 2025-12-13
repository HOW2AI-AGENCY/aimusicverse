// BlockedUsersPage Component - Sprint 011 Task T096
// Manage blocked users list with unblock functionality

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Ban, UserX, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  blocked_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * Blocked users management page
 */
export default function BlockedUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();

  // Fetch blocked users
  const { data: blockedUsers, isLoading, isError } = useQuery<BlockedUser[]>({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blocked_users')
        .select(\`
          id,
          blocked_id,
          created_at,
          blocked_user:profiles!blocked_users_blocked_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        \`)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlockedUser[];
    },
    enabled: !!user,
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .match({ blocker_id: user.id, blocked_id: blockedId });

      if (error) throw error;
    },
    onSuccess: () => {
      hapticFeedback('success');
      toast.success('Пользователь разблокирован');
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
    onError: (error) => {
      console.error('Unblock error:', error);
      hapticFeedback('error');
      toast.error('Не удалось разблокировать');
    },
  });

  const handleUnblock = (blockedId: string) => {
    hapticFeedback('light');
    unblockMutation.mutate(blockedId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticFeedback('light');
              navigate(-1);
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Ban className="w-6 h-6 text-destructive" />
            <div>
              <h1 className="text-2xl font-bold">Заблокированные</h1>
              <p className="text-sm text-muted-foreground">
                {blockedUsers?.length || 0} пользователей
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Заблокированные пользователи не могут видеть ваш профиль, комментировать или
            подписываться на вас
          </AlertDescription>
        </Alert>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Не удалось загрузить список заблокированных</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && blockedUsers?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <UserX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Нет заблокированных пользователей</h3>
              <p className="text-sm text-muted-foreground">
                Вы можете заблокировать пользователей через их профиль
              </p>
            </CardContent>
          </Card>
        )}

        {/* Blocked Users List */}
        {!isLoading && blockedUsers && blockedUsers.length > 0 && (
          <div className="space-y-3">
            {blockedUsers.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <Avatar
                        className="w-12 h-12 cursor-pointer"
                        onClick={() => {
                          hapticFeedback('light');
                          navigate(\`/profile/\${item.blocked_id}\`);
                        }}
                      >
                        <AvatarImage src={item.blocked_user.avatar_url || undefined} />
                        <AvatarFallback>
                          {item.blocked_user.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          hapticFeedback('light');
                          navigate(\`/profile/\${item.blocked_id}\`);
                        }}
                      >
                        <div className="font-semibold">{item.blocked_user.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{item.blocked_user.username}
                        </div>
                      </div>

                      {/* Unblock Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(item.blocked_id)}
                        disabled={unblockMutation.isPending}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Разблокировать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
