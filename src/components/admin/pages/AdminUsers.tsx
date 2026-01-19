/**
 * Admin Users Page
 * 
 * User management dashboard with:
 * - User search and filtering
 * - Balance management
 * - Subscription management
 * - User activity logs
 * 
 * TODO: Add bulk actions (ban multiple, grant credits to multiple)
 * TODO: Add user export functionality
 * TODO: Add user impersonation for debugging
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from 'use-debounce';
import { 
  Search, 
  Users, 
  UserPlus, 
  Filter,
  ChevronRight,
  Crown,
  Coins,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// Lazy load heavy components
const UserBalancesPanel = lazy(() => 
  import('../UserBalancesPanel').then(m => ({ default: m.UserBalancesPanel }))
);

// ============================================================
// Types
// ============================================================
interface UserProfile {
  user_id: string;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  created_at: string;
  subscription_tier: string | null;
  telegram_id: number | null;
}

// ============================================================
// Data Fetching
// ============================================================
function useUsers(search: string) {
  const [debouncedSearch] = useDebounce(search, 300);

  return useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: async (): Promise<UserProfile[]> => {
      let query = supabase
        .from('profiles')
        .select('user_id, username, first_name, photo_url, created_at, subscription_tier, telegram_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (debouncedSearch) {
        query = query.or(`username.ilike.%${debouncedSearch}%,first_name.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });
}

function useUserStats() {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const [totalResult, newTodayResult, premiumResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .neq('subscription_tier', 'free'),
      ]);

      return {
        total: totalResult.count || 0,
        newToday: newTodayResult.count || 0,
        premium: premiumResult.count || 0,
      };
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================
// User Card Component
// ============================================================
interface UserCardProps {
  user: UserProfile;
  onSelect: (userId: string) => void;
}

const UserCard = ({ user, onSelect }: UserCardProps) => {
  const displayName = user.first_name || user.username || 'Без имени';
  const isPremium = user.subscription_tier && user.subscription_tier !== 'free';

  return (
    <button
      onClick={() => onSelect(user.user_id)}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
        {user.photo_url ? (
          <img src={user.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Users className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{displayName}</p>
          {isPremium && (
            <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {user.username ? `@${user.username}` : 'ID: ' + user.user_id.slice(0, 8)}
        </p>
      </div>

      {/* Meta */}
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(user.created_at), { 
            addSuffix: true, 
            locale: ru 
          })}
        </p>
        {user.subscription_tier && user.subscription_tier !== 'free' && (
          <Badge variant="secondary" className="text-xs mt-1">
            {user.subscription_tier}
          </Badge>
        )}
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
};

// ============================================================
// Main Component
// ============================================================
export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const { data: users, isLoading } = useUsers(search);
  const { data: stats } = useUserStats();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Управление пользователями и балансами
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.total.toLocaleString() || '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Всего</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">+{stats?.newToday || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Сегодня</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats?.premium || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или username..."
          className="pl-9"
        />
      </div>

      {/* User List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Пользователи
            {users && (
              <Badge variant="secondary" className="ml-auto">
                {users.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                ))
              ) : users?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {search ? 'Ничего не найдено' : 'Нет пользователей'}
                </div>
              ) : (
                users?.map((user) => (
                  <UserCard 
                    key={user.user_id} 
                    user={user} 
                    onSelect={setSelectedUserId}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Balances Panel (Lazy Loaded) */}
      <Suspense fallback={<Skeleton className="h-64" />}>
        <UserBalancesPanel />
      </Suspense>

      {/* TODO: Add user detail drawer/dialog when selectedUserId is set */}
      {/* TODO: Add bulk actions toolbar */}
    </div>
  );
}

export default AdminUsers;
