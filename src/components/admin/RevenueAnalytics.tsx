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
    <div className="space-y-3 sm:space-y-4">
      {/* Header with period selector */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm sm:text-lg font-semibold flex items-center gap-1.5 sm:gap-2">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          <span className="hidden sm:inline">Revenue Analytics</span>
          <span className="sm:hidden">Доходы</span>
        </h3>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            onClick={() => refetchPayment()} 
            className="p-1.5 sm:p-2 hover:bg-accent rounded-md transition-colors touch-manipulation"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[90px] sm:w-[120px] h-7 sm:h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              <SelectItem value="7 days">7 дней</SelectItem>
              <SelectItem value="30 days">30 дней</SelectItem>
              <SelectItem value="90 days">90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <MetricCard
              title="Доход (USD)"
              value={formatCurrency(paymentData?.total_revenue_usd || 0)}
              icon={<DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              color="green"
              trend={paymentData?.conversion_rate ? `${paymentData.conversion_rate.toFixed(1)}%` : undefined}
            />
            <MetricCard
              title="Stars"
              value={formatNumber(paymentData?.total_stars_collected || 0)}
              icon={<Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              color="yellow"
              subtitle={`≈ ${formatCurrency(starsToUsd(paymentData?.total_stars_collected || 0))}`}
            />
            <MetricCard
              title="Транзакций"
              value={paymentData?.completed_transactions || 0}
              icon={<CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              color="blue"
              subtitle={`из ${paymentData?.total_transactions || 0}`}
            />
            <MetricCard
              title="Покупателей"
              value={paymentData?.unique_buyers || 0}
              icon={<Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              color="purple"
              trend={paymentData?.repeat_buyer_rate ? `${paymentData.repeat_buyer_rate.toFixed(0)}% повт.` : undefined}
            />
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                Динамика доходов
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 sm:px-4 sm:pb-4">
              {paymentData?.revenue_by_day && paymentData.revenue_by_day.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart
                    data={paymentData.revenue_by_day}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
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
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => formatNumber(value)}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
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
                <div className="flex items-center justify-center h-[160px] text-muted-foreground text-xs sm:text-sm">
                  Нет данных за выбранный период
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Top Products */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  Топ продуктов
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                {paymentData?.top_products && paymentData.top_products.length > 0 ? (
                  <ScrollArea className="h-[140px] sm:h-[200px]">
                    <div className="space-y-2 sm:space-y-3">
                      {paymentData.top_products.map((product, idx) => (
                        <div
                          key={product.product_code}
                          className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                            <div
                              className="w-1.5 h-6 sm:w-2 sm:h-8 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{product.product_code}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {product.sales} продаж
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-500 text-xs sm:text-sm font-medium">
                              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                              {formatNumber(product.total_stars)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-[140px] sm:h-[200px] text-muted-foreground text-xs sm:text-sm">
                    Нет данных
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Breakdown */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  Подписки
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                {paymentData?.subscription_breakdown && paymentData.subscription_breakdown.length > 0 ? (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <ResponsiveContainer width={80} height={80} className="shrink-0 sm:!w-[120px] sm:!h-[120px]">
                      <PieChart>
                        <Pie
                          data={paymentData.subscription_breakdown}
                          dataKey="active_count"
                          nameKey="product_code"
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={35}
                          paddingAngle={2}
                        >
                          {paymentData.subscription_breakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <ScrollArea className="flex-1 h-[80px] sm:h-[120px]">
                      <div className="space-y-1.5 sm:space-y-2">
                        {paymentData.subscription_breakdown.map((sub, idx) => (
                          <div
                            key={sub.product_code}
                            className="flex items-center justify-between text-xs sm:text-sm"
                          >
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <div
                                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              />
                              <span className="text-[10px] sm:text-xs truncate">{sub.product_code}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] sm:text-xs h-4 sm:h-5 px-1">
                              {sub.active_count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[80px] sm:h-[120px] text-muted-foreground text-xs sm:text-sm">
                    Нет подписок
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gamification Stats */}
          {gamificationData && (
            <Card>
              <CardHeader className="pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                  Гамификация
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-primary">
                      {formatNumber(gamificationData.total_credits_earned)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Заработано</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-destructive">
                      {formatNumber(gamificationData.total_credits_spent)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Потрачено</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg sm:text-2xl font-bold">
                      {gamificationData.avg_level.toFixed(1)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Ср. уровень</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-yellow-500">
                      {gamificationData.max_level}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Макс. уровень</p>
                  </div>
                </div>

                {/* Checkin Stats - simplified for mobile */}
                {gamificationData.checkin_stats && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-muted/20">
                    <p className="text-[10px] sm:text-xs font-medium mb-1.5 sm:mb-2">Чекины</p>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
                      <div>
                        <p className="text-sm sm:text-lg font-bold">{gamificationData.checkin_stats.total_checkins}</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Всего</p>
                      </div>
                      <div>
                        <p className="text-sm sm:text-lg font-bold">{gamificationData.checkin_stats.unique_users}</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Уник.</p>
                      </div>
                      <div>
                        <p className="text-sm sm:text-lg font-bold">{gamificationData.checkin_stats.avg_streak.toFixed(1)}</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Ср.</p>
                      </div>
                      <div>
                        <p className="text-sm sm:text-lg font-bold text-yellow-500">{gamificationData.checkin_stats.max_streak}</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Макс.</p>
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
      <CardContent className="p-2 sm:p-3">
        <div className="flex items-start justify-between gap-1">
          <div className={`p-1 sm:p-1.5 rounded-md ${colorClasses[color]}`}>
            {icon}
          </div>
          {trend && (
            <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 h-4 sm:h-5">
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-1.5 sm:mt-2">
          <p className="text-base sm:text-xl font-bold truncate">{value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{title}</p>
          {subtitle && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
