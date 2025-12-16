import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Download, 
  RefreshCw,
  Coins,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useUserBalanceSummary, useUsersWithBalances } from "@/hooks/useUserBalanceSummary";
import { useAdminBalance } from "@/hooks/useAdminBalance";

export function UserBalancesPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [orderBy, setOrderBy] = useState<'balance' | 'created_at'>('created_at');

  const { data: summary, isLoading: summaryLoading } = useUserBalanceSummary();
  const { data: users, isLoading: usersLoading, refetch } = useUsersWithBalances({ 
    limit: 200, 
    orderBy 
  });
  const { apiBalance } = useAdminBalance();

  const filteredUsers = users?.filter(user => {
    const search = searchQuery.toLowerCase();
    return searchQuery === "" ||
      user.username?.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search);
  }) || [];

  const exportUsers = () => {
    const csv = [
      ['User ID', 'Username', 'Name', 'Balance', 'Total Earned', 'Total Spent', 'Level', 'Subscription', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.user_id,
        user.username || '',
        `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        user.balance,
        user.total_earned,
        user.total_spent,
        user.level,
        user.subscription_tier || 'free',
        user.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-balances-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Calculate coverage ratio
  const totalUserBalance = summary?.total_balance || 0;
  const apiCredits = apiBalance || 0;
  const coverageRatio = totalUserBalance > 0 ? ((apiCredits * 10) / totalUserBalance) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold truncate">{summary?.total_users || 0}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Юзеров</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-amber-500/10">
                <Coins className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold truncate">{summary?.total_balance?.toLocaleString() || 0}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Баланс</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold truncate">{summary?.total_earned?.toLocaleString() || 0}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Получено</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold truncate">{summary?.total_spent?.toLocaleString() || 0}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Потрачено</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Coverage Alert */}
      {coverageRatio < 100 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <div className="font-medium text-destructive">Низкое покрытие API баланса</div>
              <div className="text-sm text-muted-foreground">
                API баланс ({apiCredits.toLocaleString()} кредитов = {(apiCredits * 10).toLocaleString()} генераций) 
                покрывает только {coverageRatio.toFixed(1)}% от пользовательских балансов ({totalUserBalance.toLocaleString()})
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg">Балансы</CardTitle>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={exportUsers}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => refetch()}>
                  <RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <CardDescription className="text-xs">
              {usersLoading ? "Загрузка..." : `${filteredUsers.length} юзеров`}
              {summary && ` • Среднее: ${summary.avg_balance?.toFixed(0) || 0}`}
            </CardDescription>
            <div className="flex gap-1.5">
              <Button 
                variant={orderBy === 'created_at' ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setOrderBy('created_at')}
              >
                Дата
              </Button>
              <Button 
                variant={orderBy === 'balance' ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setOrderBy('balance')}
              >
                Баланс
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Users List */}
          <ScrollArea className="h-[500px]">
            {usersLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Нет пользователей
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                      <AvatarImage src={user.photo_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="font-medium text-sm md:text-base truncate">
                          {user.first_name}
                        </span>
                        {user.username && (
                          <span className="text-xs md:text-sm text-muted-foreground truncate hidden sm:inline">
                            @{user.username}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
                        <span>Lvl {user.level}</span>
                        <span className="hidden xs:inline">•</span>
                        <span className="hidden xs:inline">🔥{user.current_streak}</span>
                        {user.subscription_tier && user.subscription_tier !== 'free' && (
                          <Badge variant="secondary" className="text-[10px] md:text-xs h-4 md:h-5 px-1">
                            {user.subscription_tier}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={`text-base md:text-lg font-bold ${user.balance === 0 ? 'text-muted-foreground' : user.balance < 10 ? 'text-amber-500' : 'text-primary'}`}>
                        {user.balance}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                        +{user.total_earned}/-{user.total_spent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
