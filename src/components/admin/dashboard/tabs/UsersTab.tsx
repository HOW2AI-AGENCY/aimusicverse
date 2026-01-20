/**
 * Admin Users Tab Component
 * 
 * User list with search, filtering, and bulk actions.
 * 
 * @module components/admin/dashboard/tabs/UsersTab
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MessageSquare } from 'lucide-react';
import { AdminUserCard } from '@/components/admin/AdminUserCard';
import type { AdminUserWithRoles, UserFilterType } from '@/hooks/admin/useAdminDashboard';

interface UsersTabProps {
  /** Filtered list of users */
  users: AdminUserWithRoles[] | undefined;
  /** Currently selected users */
  selectedUsers: AdminUserWithRoles[];
  /** Search query */
  searchQuery: string;
  /** Current filter */
  filter: UserFilterType;
  /** Callbacks */
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: UserFilterType) => void;
  onSelectUser: (user: AdminUserWithRoles) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenCredits: (user: AdminUserWithRoles) => void;
  onOpenSubscription: (user: AdminUserWithRoles) => void;
  onOpenMessage: () => void;
  onToggleAdmin: (userId: string, action: 'add' | 'remove') => void;
}

/**
 * Users tab with list and bulk actions
 */
export function UsersTab({
  users,
  selectedUsers,
  searchQuery,
  filter,
  onSearchChange,
  onFilterChange,
  onSelectUser,
  onSelectAll,
  onClearSelection,
  onOpenCredits,
  onOpenSubscription,
  onOpenMessage,
  onToggleAdmin,
}: UsersTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg">
              Пользователи ({users?.length || 0})
            </CardTitle>
            
            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedUsers.length}</Badge>
                <Button
                  size="sm"
                  variant="default"
                  onClick={onOpenMessage}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Написать
                </Button>
                <Button size="sm" variant="ghost" onClick={onClearSelection}>
                  Сбросить
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => onFilterChange(v as UserFilterType)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Фильтр" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="admin">Админы</SelectItem>
              <SelectItem value="premium">Премиум</SelectItem>
              <SelectItem value="free">Бесплатные</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onSelectAll} 
            className="hidden sm:flex"
          >
            Все
          </Button>
        </div>

        {/* User List */}
        <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
          <div className="space-y-2 pr-2">
            {users?.map((user) => (
              <AdminUserCard
                key={user.id}
                user={user}
                isSelected={selectedUsers.some((u) => u.user_id === user.user_id)}
                onSelect={() => onSelectUser(user)}
                onCredits={() => onOpenCredits(user)}
                onSubscription={() => onOpenSubscription(user)}
                onMessage={() => {
                  onSelectUser(user);
                  onOpenMessage();
                }}
                onToggleAdmin={(action) => onToggleAdmin(user.user_id, action)}
              />
            ))}
            {users?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Пользователи не найдены
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
