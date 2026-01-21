/**
 * RevenueAnalytics - Revenue and payment visualization component
 * Phase 10.4: Revenue Analytics Dashboard
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Star, Users, CreditCard, Package, RefreshCw } from 'lucide-react';
import { usePaymentAnalytics, useGamificationAnalytics } from '@/hooks/usePaymentAnalytics';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

type TimePeriod = '7 days' | '30 days' | '90 days';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function RevenueAnalytics() {
  const [period, setPeriod] = useState<TimePeriod>('30 days');

  const { data: paymentData, isLoading: paymentLoading, refetch: refetchPayment } = usePaymentAnalytics(period);
  const { data: gamificationData, isLoading: gamificationLoading } = useGamificationAnalytics(period);

  const isLoading = paymentLoading || gamificationLoading;

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format large numbers
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  // Calculate stars to USD (approx 0.02 USD per star)
  const starsToUsd = (stars: number) => stars * 0.02;

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Revenue Analytics
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetchPayment()} 
            className="p-2 hover:bg-accent rounded-md transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7 days">7 дней</SelectItem>
              <SelectItem value="30 days">30 дней</SelectItem>
              <SelectItem value="90 days">90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              title="Доход (USD)"
              value={formatCurrency(paymentData?.total_revenue_usd || 0)}
              icon={<DollarSign className="h-4 w-4" />}
              color="green"
              trend={paymentData?.conversion_rate ? `${paymentData.conversion_rate.toFixed(1)}% конверсия` : undefined}
            />
            <MetricCard
              title="Stars собрано"
              value={formatNumber(paymentData?.total_stars_collected || 0)}
              icon={<Star className="h-4 w-4" />}
              color="yellow"
              subtitle={`≈ ${formatCurrency(starsToUsd(paymentData?.total_stars_collected || 0))}`}
            />
            <MetricCard
              title="Транзакций"
              value={paymentData?.completed_transactions || 0}
              icon={<CreditCard className="h-4 w-4" />}
              color="blue"
              subtitle={`из ${paymentData?.total_transactions || 0} всего`}
            />
            <MetricCard
              title="Покупателей"
              value={paymentData?.unique_buyers || 0}
              icon={<Users className="h-4 w-4" />}
              color="purple"
              trend={paymentData?.repeat_buyer_rate ? `${paymentData.repeat_buyer_rate.toFixed(1)}% повторных` : undefined}
            />
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Динамика доходов
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {paymentData?.revenue_by_day && paymentData.revenue_by_day.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={paymentData.revenue_by_day}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorStars" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'usd' ? formatCurrency(value) : `${formatNumber(value)} ⭐`,
                        name === 'usd' ? 'USD' : 'Stars',
                      ]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
                    />
                    <Area
                      type="monotone"
                      dataKey="usd"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorUsd)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="stars"
                      stroke="#facc15"
                      fillOpacity={1}
                      fill="url(#colorStars)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  Нет данных за выбранный период
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Products */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Топ продуктов
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {paymentData?.top_products && paymentData.top_products.length > 0 ? (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {paymentData.top_products.map((product, idx) => (
                        <div
                          key={product.product_code}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-8 rounded-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium text-sm">{product.product_code}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.sales} продаж
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                              <Star className="h-3 w-3 fill-current" />
                              {formatNumber(product.total_stars)}
                            </div>
                            {product.total_credits > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {formatNumber(product.total_credits)} кр.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Breakdown */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Подписки
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {paymentData?.subscription_breakdown && paymentData.subscription_breakdown.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie
                          data={paymentData.subscription_breakdown}
                          dataKey="active_count"
                          nameKey="product_code"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={2}
                        >
                          {paymentData.subscription_breakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <ScrollArea className="flex-1 h-[120px]">
                      <div className="space-y-2">
                        {paymentData.subscription_breakdown.map((sub, idx) => (
                          <div
                            key={sub.product_code}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              />
                              <span className="text-xs">{sub.product_code}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {sub.active_count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
                    Нет активных подписок
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gamification Stats */}
          {gamificationData && (
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Гамификация
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {formatNumber(gamificationData.total_credits_earned)}
                    </p>
                    <p className="text-xs text-muted-foreground">Кредитов заработано</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-destructive">
                      {formatNumber(gamificationData.total_credits_spent)}
                    </p>
                    <p className="text-xs text-muted-foreground">Кредитов потрачено</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold">
                      {gamificationData.avg_level.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Средний уровень</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-bold text-yellow-500">
                      {gamificationData.max_level}
                    </p>
                    <p className="text-xs text-muted-foreground">Макс. уровень</p>
                  </div>
                </div>

                {/* Checkin Stats */}
                {gamificationData.checkin_stats && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/20">
                    <p className="text-xs font-medium mb-2">Чекины</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{gamificationData.checkin_stats.total_checkins}</p>
                        <p className="text-[10px] text-muted-foreground">Всего</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{gamificationData.checkin_stats.unique_users}</p>
                        <p className="text-[10px] text-muted-foreground">Уникальных</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{gamificationData.checkin_stats.avg_streak.toFixed(1)}</p>
                        <p className="text-[10px] text-muted-foreground">Ср. серия</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-500">{gamificationData.checkin_stats.max_streak}</p>
                        <p className="text-[10px] text-muted-foreground">Макс. серия</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  trend,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'yellow' | 'blue' | 'purple';
  trend?: string;
  subtitle?: string;
}) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className={`p-1.5 rounded-md ${colorClasses[color]}`}>
            {icon}
          </div>
          {trend && (
            <Badge variant="outline" className="text-[10px] px-1.5">
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
