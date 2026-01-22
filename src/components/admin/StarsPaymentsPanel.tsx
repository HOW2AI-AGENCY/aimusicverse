import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Download, TrendingUp, Users, DollarSign, Star } from 'lucide-react';
import { format, ru } from '@/lib/date-utils';

interface Transaction {
  id: string;
  user_id: string;
  telegram_user_id: number;
  product_code: string;
  stars_amount: number;
  credits_granted: number | null;
  subscription_granted: string | null;
  status: string;
  created_at: string | null;
  processed_at: string | null;
  telegram_payment_charge_id: string | null;
}

interface Stats {
  total_transactions: number;
  completed_transactions: number;
  total_stars_collected: number;
  total_credits_granted: number;
  active_subscriptions: number;
}

export function StarsPaymentsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stars-payment-stats'],
    queryFn: async (): Promise<Stats> => {
      const { data, error } = await supabase.rpc('get_stars_payment_stats');

      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      return result || {
        total_transactions: 0,
        completed_transactions: 0,
        total_stars_collected: 0,
        total_credits_granted: 0,
        active_subscriptions: 0,
      };
    },
    refetchInterval: 30000,
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['stars-transactions', statusFilter],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from('stars_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Transaction[];
    },
    refetchInterval: 10000,
  });

  // Filter transactions by search query
  const filteredTransactions = transactions?.filter((tx) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      tx.telegram_payment_charge_id?.toLowerCase().includes(query) ||
      tx.product_code.toLowerCase().includes(query) ||
      tx.user_id.toLowerCase().includes(query)
    );
  });

  const handleExportCSV = () => {
    if (!filteredTransactions) return;

    const headers = [
      'ID',
      'Telegram User ID',
      'Product Code',
      'Stars Amount',
      'Credits Granted',
      'Status',
      'Created At',
      'Processed At',
      'Payment ID',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.telegram_user_id,
      tx.product_code,
      tx.stars_amount,
      tx.credits_granted || '',
      tx.status,
      tx.created_at || '',
      tx.processed_at || '',
      tx.telegram_payment_charge_id || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stars-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершён';
      case 'processing':
        return 'Обработка';
      case 'pending':
        return 'Ожидание';
      case 'failed':
        return 'Ошибка';
      case 'cancelled':
        return 'Отменён';
      case 'refunded':
        return 'Возврат';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего транзакций
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{stats?.total_transactions || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Успешных
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold">{stats?.completed_transactions || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Собрано Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold">{stats?.total_stars_collected || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Выдано кредитов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-bold">{stats?.total_credits_granted || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активных подписок
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-2xl font-bold">{stats?.active_subscriptions || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Транзакции Stars</CardTitle>
          <CardDescription>
            История платежей через Telegram Stars
          </CardDescription>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Input
              placeholder="Поиск по ID, продукту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="completed">Завершённые</SelectItem>
                <SelectItem value="processing">В обработке</SelectItem>
                <SelectItem value="pending">Ожидание</SelectItem>
                <SelectItem value="failed">Ошибки</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Экспорт CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет транзакций
            </p>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{tx.product_code}</span>
                          <Badge variant={getStatusBadgeVariant(tx.status)}>
                            {getStatusLabel(tx.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Telegram ID: {tx.telegram_user_id}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                          <Star className="w-4 h-4 fill-current" />
                          <span>{tx.stars_amount}</span>
                        </div>
                        {tx.credits_granted && (
                          <p className="text-sm text-muted-foreground">
                            {tx.credits_granted} кредитов
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {tx.created_at && format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </span>
                      {tx.telegram_payment_charge_id && (
                        <span className="font-mono truncate max-w-[200px]">
                          {tx.telegram_payment_charge_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}