// BlockedUsersPage - Sprint 011
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBlockedUsers, useBlockUser } from '@/hooks/social/useBlockUser';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from '@/lib/motion';

export default function BlockedUsersPage() {
  const navigate = useNavigate();
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const { toggleBlock, isLoading: isUnblocking } = useBlockUser();

  // Get profiles for blocked users
  const blockedUserIds = blockedUsers?.map(b => b.blocked_id) || [];
  const { data: profiles } = useQuery({
    queryKey: ['blocked-profiles', blockedUserIds],
    queryFn: async () => {
      if (blockedUserIds.length === 0) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, photo_url, first_name')
        .in('user_id', blockedUserIds);
      return data || [];
    },
    enabled: blockedUserIds.length > 0,
  });

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Заблокированные</h1>
            <p className="text-sm text-muted-foreground">
              Управление списком заблокированных пользователей
            </p>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Заблокированные пользователи
            </CardTitle>
            <CardDescription>
              Заблокированные пользователи не могут видеть ваши треки и отправлять комментарии
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : blockedUsers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Нет заблокированных пользователей</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers?.map((blocked) => {
                  const profile = profileMap.get(blocked.blocked_id);
                  return (
                    <motion.div
                      key={blocked.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={profile?.photo_url || undefined} />
                          <AvatarFallback>
                            {profile?.first_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {profile?.first_name || 'Пользователь'}
                          </p>
                          {profile?.username && (
                            <p className="text-sm text-muted-foreground">
                              @{profile.username}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBlock(blocked.blocked_id)}
                        disabled={isUnblocking}
                      >
                        Разблокировать
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
