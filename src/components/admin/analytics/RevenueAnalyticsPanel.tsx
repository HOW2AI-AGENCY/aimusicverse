/**
 * Revenue Analytics Panel
 * Displays monetization metrics: Stars payments, subscriptions, revenue trends
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenueAnalyticsRaw } from "@/api/analytics.api";
import { useRecharts } from "@/lib/recharts-lazy";
import type { TooltipValueType } from "recharts";
import { DollarSign, TrendingUp, Star, CreditCard, Coins, ArrowUpRight, ArrowDownRight } from "@/lib/icons";

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
    queryKey: ["revenue-analytics", timePeriod],
    queryFn: async (): Promise<RevenueStats> => {
      const now = new Date();
      const periodDays =
        timePeriod === "24 hours" ? 1 : timePeriod === "7 days" ? 7 : timePeriod === "30 days" ? 30 : 90;

      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // Fetch Stars transactions via API layer
      const {
        current: transactions,
        previousSum: previousStars,
        newUsersInRange: newUsers,
      } = await fetchRevenueAnalyticsRaw({ startDate, previousStart });

      // Calculate metrics
      const totalStars = transactions.reduce((sum, t) => sum + (t.stars_amount || 0), 0);
      const uniquePayers = new Set(transactions.map((t) => t.user_id)).size;
      const avgTransaction = transactions.length > 0 ? totalStars / transactions.length : 0;

      // Group by date for trend
      const trendMap = new Map<string, { stars: number; transactions: number }>();
      transactions.forEach((t) => {
        const date = new Date(t.created_at || Date.now()).toISOString().split("T")[0];
        const existing = trendMap.get(date) || { stars: 0, transactions: 0 };
        trendMap.set(date, {
          stars: existing.stars + (t.stars_amount || 0),
          transactions: existing.transactions + 1,
        });
      });

      // Fill missing dates
      const revenueTrend: Array<{ date: string; stars: number; transactions: number }> = [];
      for (let i = 0; i < periodDays; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const data = trendMap.get(date) || { stars: 0, transactions: 0 };
        revenueTrend.push({ date, ...data });
      }

      // Group by product type (product_code in schema)
      const productMap = new Map<string, { total: number; count: number }>();
      transactions.forEach((t) => {
        const type = t.product_code || "unknown";
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
          count,
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

  const { recharts, isLoading: rechartsLoading } = useRecharts();

  if (isLoading || rechartsLoading || !recharts) {
    return <RevenueAnalyticsSkeleton />;
  }

  const {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
  } = recharts;

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Нет данных о доходах</CardContent>
      </Card>
    );
  }

  const revenueChange =
    data.previous_period_revenue > 0
      ? ((data.total_revenue_stars - data.previous_period_revenue) / data.previous_period_revenue) * 100
      : 0;
  const isPositiveChange = revenueChange >= 0;

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 87%, 65%)",
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
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
          label="Плательщиков"
          value={data.unique_payers.toLocaleString()}
          subtext={`${data.conversion_rate.toFixed(1)}% CR`}
          iconColor="text-green-500"
        />
        <RevenueStatCard
          icon={DollarSign}
          label="Средний чек"
          value={`${data.avg_transaction_stars.toFixed(0)} ⭐`}
          subtext={`ARPU: ${data.arpu.toFixed(0)}`}
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Динамика доходов
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => new Date(String(v ?? "")).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip
                    formatter={(value: TooltipValueType | undefined, name: number | string | undefined) => [
                      Number(value).toLocaleString(),
                      name === "stars" ? "Stars" : "Транзакции",
                    ]}
                    labelFormatter={(label) => {
                      const s = typeof label === "string" || typeof label === "number" ? label : String(label ?? "");
                      return new Date(s).toLocaleDateString("ru");
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
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
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Продукты</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {data.top_products.length > 0 ? (
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.top_products}
                      dataKey="total_stars"
                      nameKey="product_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, percent }) =>
                        `${formatProductType(String(name || "unknown"))} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.top_products.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: TooltipValueType | undefined) => [
                        `${Number(value).toLocaleString()} ⭐`,
                        "Stars",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Нет данных
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions by product - Horizontally scrollable on mobile */}
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base">Доход по типам продуктов</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[150px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="product_type"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatProductType}
                  width={70}
                />
                <Tooltip
                  formatter={(value: TooltipValueType | undefined) => [`${Number(value).toLocaleString()} ⭐`, "Stars"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
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
    credits: "Кредиты",
    subscription: "Подписка",
    generation: "Генерация",
    stem_separation: "Разделение",
    extend: "Расширение",
    cover: "Кавер",
    unknown: "Другое",
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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{value}</p>
            {change !== undefined && (
              <div
                className={`flex items-center gap-0.5 text-[0.625rem] sm:text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}
              >
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
            {subtext && <p className="text-[0.625rem] sm:text-xs text-muted-foreground truncate">{subtext}</p>}
          </div>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueAnalyticsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-16 sm:h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="h-[200px] sm:h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="h-[200px] sm:h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
