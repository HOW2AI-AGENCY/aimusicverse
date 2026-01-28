/**
 * Campaign Performance Component
 * 
 * Shows performance metrics for marketing campaigns
 * tracked via UTM parameters
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Target, 
  TrendingUp, 
  Users, 
  MousePointerClick,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  name: string;
  source: string;
  medium: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  trend: number; // percentage change vs previous period
}

interface CampaignPerformanceProps {
  campaigns: Campaign[];
  isLoading?: boolean;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function CampaignPerformance({ campaigns, isLoading }: CampaignPerformanceProps) {
  // Sort campaigns by conversions
  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => b.conversions - a.conversions);
  }, [campaigns]);

  // Top 5 for chart
  const chartData = useMemo(() => {
    return sortedCampaigns.slice(0, 5).map(c => ({
      name: c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name,
      fullName: c.name,
      visits: c.visits,
      conversions: c.conversions,
      rate: c.conversionRate,
    }));
  }, [sortedCampaigns]);

  // Summary stats
  const summary = useMemo(() => {
    const totalVisits = campaigns.reduce((sum, c) => sum + c.visits, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const avgConversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;
    
    return {
      totalCampaigns: campaigns.length,
      totalVisits,
      totalConversions,
      avgConversionRate: avgConversionRate.toFixed(1),
    };
  }, [campaigns]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Эффективность кампаний</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Загрузка...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Кампаний</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.totalCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Визитов</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.totalVisits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Конверсий</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.totalConversions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ср. конверсия</span>
            </div>
            <div className="text-2xl font-bold mt-1">{summary.avgConversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Топ кампаний</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Нет данных
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 11 }} 
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          conversions: 'Конверсии',
                          visits: 'Визиты',
                        };
                        return [value, labels[name] || name];
                      }}
                    />
                    <Bar dataKey="conversions" radius={[0, 4, 4, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Детали кампаний</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {sortedCampaigns.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Нет данных
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCampaigns.map((campaign, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {campaign.name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {campaign.source}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-medium">{campaign.conversionRate.toFixed(1)}%</span>
                          {campaign.trend !== 0 && (
                            <span className={cn(
                              'flex items-center text-xs',
                              campaign.trend > 0 ? 'text-green-500' : 'text-red-500'
                            )}>
                              {campaign.trend > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {Math.abs(campaign.trend)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={campaign.conversionRate} 
                        className="h-1.5"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{campaign.visits} визитов</span>
                        <span>{campaign.conversions} конверсий</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
