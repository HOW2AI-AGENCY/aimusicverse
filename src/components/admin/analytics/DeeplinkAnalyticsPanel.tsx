/**
 * Deeplink Analytics Panel
 * Aggregated view of all deeplink/UTM analytics components
 */

import { useMemo } from 'react';
import { useDeeplinkStats, useDeeplinkEvents } from '@/hooks/useDeeplinkAnalytics';
import { DeeplinkTrendsChart } from './DeeplinkTrendsChart';
import { SourcesHeatmap } from './SourcesHeatmap';
import { CampaignPerformance } from './CampaignPerformance';
import { ConversionFunnelStages } from './ConversionFunnelStages';
import { Card, CardContent } from '@/components/ui/card';
import { Link2, Users, Target, Percent } from 'lucide-react';

interface DeeplinkAnalyticsPanelProps {
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export function DeeplinkAnalyticsPanel({ timeRange = '7d' }: DeeplinkAnalyticsPanelProps) {
  const { data: stats, isLoading: statsLoading } = useDeeplinkStats(timeRange);
  const { data: events, isLoading: eventsLoading } = useDeeplinkEvents({ limit: 500 });

  const isLoading = statsLoading || eventsLoading;

  // Transform stats for trend chart
  const trendData = useMemo(() => {
    if (!events) return [];
    
    // Group events by date
    const grouped = events.reduce((acc: Record<string, { visits: number; conversions: number; unique_users: Set<string> }>, event) => {
      const date = event.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { visits: 0, conversions: 0, unique_users: new Set() };
      }
      acc[date].visits++;
      if (event.converted) acc[date].conversions++;
      if (event.user_id) acc[date].unique_users.add(event.user_id);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        visits: data.visits,
        conversions: data.conversions,
        unique_users: data.unique_users.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  // Transform for heatmap (sources by hour)
  const heatmapData = useMemo(() => {
    if (!events) return [];
    
    const sourceHours: Record<string, number[]> = {};
    
    events.forEach(event => {
      const source = event.source || 'direct';
      const hour = new Date(event.created_at).getHours();
      
      if (!sourceHours[source]) {
        sourceHours[source] = Array(24).fill(0);
      }
      sourceHours[source][hour]++;
    });

    return Object.entries(sourceHours)
      .map(([source, hourlyData]) => ({ source, hourlyData }))
      .sort((a, b) => b.hourlyData.reduce((s, v) => s + v, 0) - a.hourlyData.reduce((s, v) => s + v, 0))
      .slice(0, 8);
  }, [events]);

  // Transform for campaigns
  const campaignData = useMemo(() => {
    if (!events) return [];
    
    const campaigns: Record<string, { visits: number; conversions: number; source: string }> = {};
    
    events.forEach(event => {
      const campaign = event.campaign || 'organic';
      if (!campaigns[campaign]) {
        campaigns[campaign] = { visits: 0, conversions: 0, source: event.source || 'direct' };
      }
      campaigns[campaign].visits++;
      if (event.converted) campaigns[campaign].conversions++;
    });

    return Object.entries(campaigns)
      .map(([name, data]) => ({
        name,
        source: data.source,
        medium: 'utm',
        visits: data.visits,
        conversions: data.conversions,
        conversionRate: data.visits > 0 ? (data.conversions / data.visits) * 100 : 0,
        trend: 0,
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10);
  }, [events]);

  // Transform for funnel
  const funnelData = useMemo(() => {
    if (!events) {
      return {
        visit: 0,
        engaged: 0,
        registered: 0,
        first_action: 0,
        generation: 0,
        completed: 0,
        payment: 0,
        retained: 0,
      };
    }

    const totalVisits = events.length;
    const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size;
    const conversions = events.filter(e => e.converted).length;

    // Estimate funnel stages
    return {
      visit: totalVisits,
      engaged: Math.round(totalVisits * 0.7),
      registered: uniqueUsers || Math.round(totalVisits * 0.35),
      first_action: Math.round(uniqueUsers * 0.6 || totalVisits * 0.21),
      generation: Math.round(uniqueUsers * 0.4 || totalVisits * 0.14),
      completed: Math.round(uniqueUsers * 0.25 || totalVisits * 0.09),
      payment: conversions || Math.round(totalVisits * 0.03),
      retained: Math.round(conversions * 0.5 || totalVisits * 0.015),
    };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          icon={Link2}
          label="Переходы"
          value={stats?.total_clicks || 0}
          iconColor="text-blue-500"
        />
        <QuickStatCard
          icon={Users}
          label="Уникальные"
          value={stats?.unique_users || 0}
          iconColor="text-green-500"
        />
        <QuickStatCard
          icon={Target}
          label="Конверсии"
          value={stats?.conversions || 0}
          iconColor="text-purple-500"
        />
        <QuickStatCard
          icon={Percent}
          label="CR"
          value={`${stats?.conversion_rate?.toFixed(2) || 0}%`}
          iconColor="text-orange-500"
        />
      </div>

      {/* Trends chart - full width */}
      <DeeplinkTrendsChart 
        data={trendData} 
        timeRange={timeRange}
        isLoading={isLoading} 
      />

      {/* Two column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        <SourcesHeatmap data={heatmapData} isLoading={isLoading} />
        <CampaignPerformance campaigns={campaignData} isLoading={isLoading} />
      </div>

      {/* Funnel - full width */}
      <ConversionFunnelStages data={funnelData} isLoading={isLoading} />
    </div>
  );
}

interface QuickStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  iconColor: string;
}

function QuickStatCard({ icon: Icon, label, value, iconColor }: QuickStatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
