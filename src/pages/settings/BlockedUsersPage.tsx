import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, Ban, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface BlockedUser {
  id: string;
  blocked_id: string;
  profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function BlockedUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();

  // Fetch blocked users
  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          profile:blocked_id (
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlockedUser[];
    },
    enabled: !!user?.id,
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      triggerHapticFeedback('success');
      toast.success('User unblocked');
      queryClient.invalidateQueries({ queryKey: ['blocked-users', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-blocked'] });
    },
    onError: (error: any) => {
      triggerHapticFeedback('error');
      toast.error('Failed to unblock user');
      console.error('Unblock user error:', error);
    },
  });

  const handleUnblock = (userId: string) => {
    unblockMutation.mutate(userId);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Blocked Users</h1>
          </div>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Blocked Users</h1>
            <p className="text-sm text-muted-foreground">
              {blockedUsers?.length || 0} blocked
            </p>
          </div>
        </div>

        {/* Blocked Users List */}
        {!blockedUsers || blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Ban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No blocked users</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              When you block someone, they won't be able to see your profile or interact with your content.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((blockedUser) => {
              const profile = blockedUser.profile;
              const displayName = profile?.display_name || profile?.username || 'Unknown User';
              const username = profile?.username;

              return (
                <div
                  key={blockedUser.id}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleProfileClick(blockedUser.blocked_id)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback>
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{displayName}</p>
                      {username && (
                        <p className="text-sm text-muted-foreground truncate">@{username}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(blockedUser.blocked_id)}
                    disabled={unblockMutation.isPending}
                  >
                    {unblockMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Unblock'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Blocked users cannot see your profile, follow you, or comment on your tracks.
            You can unblock them anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
