/**
 * AdminUsers - Users management tab
 */
import { useState } from "react";
import { useAdminUsers, useToggleUserRole } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, MessageSquare } from "lucide-react";
import { AdminUserCard } from "@/components/admin/AdminUserCard";
import { AdminUserCreditsDialog } from "@/components/admin/AdminUserCreditsDialog";
import { AdminUserSubscriptionDialog } from "@/components/admin/AdminUserSubscriptionDialog";
import { AdminSendMessageDialog } from "@/components/admin/AdminSendMessageDialog";

interface UserWithRoles {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  created_at: string;
  roles: string[];
  subscription_tier?: string;
  subscription_expires_at?: string | null;
  balance?: number;
  total_earned?: number;
  total_spent?: number;
  level?: number;
}

export default function AdminUsers() {
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<UserWithRoles[]>([]);
  const [creditsDialogUser, setCreditsDialogUser] = useState<UserWithRoles | null>(null);
  const [subscriptionDialogUser, setSubscriptionDialogUser] = useState<UserWithRoles | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const { data: users, refetch: refetchUsers } = useAdminUsers();
  const toggleRole = useToggleUserRole();

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = !userSearch || 
      user.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesFilter = userFilter === "all" ||
      (userFilter === "admin" && user.roles.includes("admin")) ||
      (userFilter === "premium" && user.subscription_tier && user.subscription_tier !== "free") ||
      (userFilter === "free" && (!user.subscription_tier || user.subscription_tier === "free"));
    
    return matchesSearch && matchesFilter;
  });

  const toggleUserSelection = (user: UserWithRoles) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.user_id === user.user_id);
      if (exists) {
        return prev.filter(u => u.user_id !== user.user_id);
      }
      return [...prev, user];
    });
  };

  const selectAllUsers = () => {
    if (filteredUsers) {
      setSelectedUsers(filteredUsers);
    }
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg">
                Пользователи ({filteredUsers?.length || 0})
              </CardTitle>
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedUsers.length}</Badge>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setMessageDialogOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Написать
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
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
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
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
            <Button size="sm" variant="outline" onClick={selectAllUsers} className="hidden sm:flex">
              Все
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
            <div className="space-y-2 pr-2">
              {filteredUsers?.map((user) => (
                <AdminUserCard
                  key={user.id}
                  user={user}
                  isSelected={selectedUsers.some(u => u.user_id === user.user_id)}
                  onSelect={() => toggleUserSelection(user)}
                  onCredits={() => setCreditsDialogUser(user)}
                  onSubscription={() => setSubscriptionDialogUser(user)}
                  onMessage={() => {
                    setSelectedUsers([user]);
                    setMessageDialogOpen(true);
                  }}
                  onToggleAdmin={(action) => toggleRole.mutate({
                    userId: user.user_id,
                    role: "admin",
                    action,
                  })}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AdminUserCreditsDialog
        open={!!creditsDialogUser}
        onOpenChange={(open) => !open && setCreditsDialogUser(null)}
        user={creditsDialogUser}
        onSuccess={() => refetchUsers()}
      />

      <AdminUserSubscriptionDialog
        open={!!subscriptionDialogUser}
        onOpenChange={(open) => !open && setSubscriptionDialogUser(null)}
        user={subscriptionDialogUser}
        currentTier={subscriptionDialogUser?.subscription_tier || "free"}
        currentExpires={subscriptionDialogUser?.subscription_expires_at}
        onSuccess={() => refetchUsers()}
      />

      <AdminSendMessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        selectedUsers={selectedUsers}
        onClearSelection={clearSelection}
      />
    </>
  );
}
