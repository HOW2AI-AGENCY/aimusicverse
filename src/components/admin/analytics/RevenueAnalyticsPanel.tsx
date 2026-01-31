/**
 * Revenue Analytics Panel
 * Displays monetization metrics: Stars payments, subscriptions, revenue trends
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { DollarSign, TrendingUp, Star, CreditCard, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RevenueAnalyticsPanelProps {
  timePeriod: string;
}

interface RevenueStats {
  total_revenue_stars: number;
  total_transactions: number;
  unique_payers: number;
  avg_transaction_stars: number;
  revenue_trend: Array<{ date: string; stars: number; transactions: number }>;
  top_products: Array<{ product_type: string; total_stars: number; count: number }>;
  conversion_rate: number;
  arpu: number;
  previous_period_revenue: number;
}

export function RevenueAnalyticsPanel({ timePeriod }: RevenueAnalyticsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['revenue-analytics', timePeriod],
    queryFn: async (): Promise<RevenueStats> => {
      const now = new Date();
      const periodDays = timePeriod === '24 hours' ? 1 : 
                         timePeriod === '7 days' ? 7 : 
                         timePeriod === '30 days' ? 30 : 90;
      
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
      
      // Fetch Stars transactions
      const [transactionsResult, previousResult, usersResult] = await Promise.all([
        supabase
          .from('stars_transactions')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed'),
        supabase
          .from('stars_transactions')
          .select('stars_amount')
          .gte('created_at', previousStart.toISOString())
          .lt('created_at', startDate.toISOString())
          .eq('status', 'completed'),
        supabase
          .from('profiles')
          .select('user_id')
          .gte('created_at', startDate.toISOString()),
      ]);

      const transactions = transactionsResult.data || [];
      const previousTransactions = previousResult.data || [];
      const newUsers = usersResult.data?.length || 0;

      // Calculate metrics
      const totalStars = transactions.reduce((sum, t) => sum + (t.stars_amount || 0), 0);
      const previousStars = previousTransactions.reduce((sum, t) => sum + (t.stars_amount || 0), 0);
      const uniquePayers = new Set(transactions.map(t => t.user_id)).size;
      const avgTransaction = transactions.length > 0 ? totalStars / transactions.length : 0;

      // Group by date for trend
      const trendMap = new Map<string, { stars: number; transactions: number }>();
      transactions.forEach(t => {
        const date = new Date(t.created_at || Date.now()).toISOString().split('T')[0];
        const existing = trendMap.get(date) || { stars: 0, transactions: 0 };
        trendMap.set(date, {
          stars: existing.stars + (t.stars_amount || 0),
          transactions: existing.transactions + 1,
        });
      });

      // Fill missing dates
      const revenueTrend: Array<{ date: string; stars: number; transactions: number }> = [];
      for (let i = 0; i < periodDays; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const data = trendMap.get(date) || { stars: 0, transactions: 0 };
        revenueTrend.push({ date, ...data });
      }

      // Group by product type (product_code in schema)
      const productMap = new Map<string, { total: number; count: number }>();
      transactions.forEach(t => {
        const type = t.product_code || 'unknown';
        const existing = productMap.get(type) || { total: 0, count: 0 };
        productMap.set(type, {
          total: existing.total + (t.stars_amount || 0),
          count: existing.count + 1,
        });
      });

      const topProducts = Array.from(productMap.entries())
        .map(([product_type, { total, count }]) => ({ 
          product_type, 
          total_stars: total, 
          count 
        }))
        .sort((a, b) => b.total_stars - a.total_stars);

      return {
        total_revenue_stars: totalStars,
        total_transactions: transactions.length,
        unique_payers: uniquePayers,
        avg_transaction_stars: avgTransaction,
        revenue_trend: revenueTrend,
        top_products: topProducts,
        conversion_rate: newUsers > 0 ? (uniquePayers / newUsers) * 100 : 0,
        arpu: uniquePayers > 0 ? totalStars / uniquePayers : 0,
        previous_period_revenue: previousStars,
      };
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  if (isLoading) {
    return <RevenueAnalyticsSkeleton />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Нет данных о доходах
        </CardContent>
      </Card>
    );
  }

  const revenueChange = data.previous_period_revenue > 0 
    ? ((data.total_revenue_stars - data.previous_period_revenue) / data.previous_period_revenue) * 100 
    : 0;
  const isPositiveChange = revenueChange >= 0;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 87%, 65%)'];

  return (
    <div className="space-y-6">
      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RevenueStatCard
          icon={Star}
          label="Доход (Stars)"
          value={data.total_revenue_stars.toLocaleString()}
          change={revenueChange}
          isPositive={isPositiveChange}
          iconColor="text-yellow-500"
        />
        <RevenueStatCard
          icon={CreditCard}
          label="Транзакции"
          value={data.total_transactions.toLocaleString()}
          iconColor="text-blue-500"
        />
        <RevenueStatCard
          icon={Coins}
          label="Уникальных плательщиков"
          value={data.unique_payers.toLocaleString()}
          subtext={`${data.conversion_rate.toFixed(1)}% конверсия`}
          iconColor="text-green-500"
        />
        <RevenueStatCard
          icon={DollarSign}
          label="Средний чек"
          value={`${data.avg_transaction_stars.toFixed(0)} ⭐`}
          subtext={`ARPU: ${data.arpu.toFixed(0)} ⭐`}
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Динамика доходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      name === 'stars' ? 'Stars' : 'Транзакции'
                    ]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('ru')}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stars"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="Stars"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Продукты</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_products.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.top_products}
                      dataKey="total_stars"
                      nameKey="product_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => 
                        `${formatProductType(String(name || 'unknown'))} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.top_products.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString()} ⭐`, 'Stars']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Нет данных о продуктах
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions by product */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Доход по типам продуктов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="product_type" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatProductType}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} ⭐`, 'Stars']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="total_stars" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatProductType(type: string): string {
  const map: Record<string, string> = {
    credits: 'Кредиты',
    subscription: 'Подписка',
    generation: 'Генерация',
    stem_separation: 'Разделение',
    extend: 'Расширение',
    cover: 'Кавер',
    unknown: 'Другое',
  };
  return map[type] || type;
}

interface RevenueStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: number;
  isPositive?: boolean;
  subtext?: string;
  iconColor: string;
}

function RevenueStatCard({ icon: Icon, label, value, change, isPositive, subtext, iconColor }: RevenueStatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
