/**
 * User Journey Analytics Hook
 * 
 * Fetches page transition data for Sankey visualization.
 * Tracks user flow between pages to identify drop-off points.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageTransition {
  source: string;
  target: string;
  value: number;
}

export interface JourneyNode {
  id: string;
  label: string;
  count: number;
}

export interface UserJourneyData {
  nodes: JourneyNode[];
  links: PageTransition[];
  topPaths: { path: string[]; count: number }[];
  avgSessionDepth: number;
  bounceRate: number;
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Главная',
  '/library': 'Библиотека',
  '/generate': 'Генерация',
  '/explore': 'Обзор',
  '/profile': 'Профиль',
  '/studio': 'Студия',
  '/projects': 'Проекты',
  '/settings': 'Настройки',
  '/admin': 'Админ',
  '/track': 'Трек',
  '/playlist': 'Плейлист',
  '/onboarding': 'Онбординг',
};

function normalizePagePath(path: string): string {
  // Normalize dynamic routes
  if (path.startsWith('/track/')) return '/track';
  if (path.startsWith('/playlist/')) return '/playlist';
  if (path.startsWith('/profile/')) return '/profile';
  if (path.startsWith('/project/')) return '/projects';
  if (path.startsWith('/studio/')) return '/studio';
  if (path.startsWith('/admin/')) return '/admin';
  return path;
}

function getPageLabel(path: string): string {
  const normalized = normalizePagePath(path);
  return PAGE_LABELS[normalized] || normalized;
}

export function useUserJourneyAnalytics(timePeriod: string) {
  return useQuery({
    queryKey: ['user-journey-analytics', timePeriod],
    queryFn: async (): Promise<UserJourneyData> => {
      // Calculate time range
      const now = new Date();
      let hoursAgo = 24;
      if (timePeriod === '7 days') hoursAgo = 24 * 7;
      else if (timePeriod === '30 days') hoursAgo = 24 * 30;
      else if (timePeriod === '90 days') hoursAgo = 24 * 90;
      
      const startDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      // Fetch page_view events with session grouping
      const { data: events, error } = await supabase
        .from('user_analytics_events')
        .select('session_id, page_path, created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })
        .limit(10000);

      if (error) throw error;

      // Group events by session
      const sessionEvents = new Map<string, { page: string; time: Date }[]>();
      
      for (const event of events || []) {
        if (!event.session_id || !event.page_path) continue;
        
        const normalized = normalizePagePath(event.page_path);
        const existing = sessionEvents.get(event.session_id) || [];
        existing.push({ page: normalized, time: new Date(event.created_at as string) });
        sessionEvents.set(event.session_id, existing);
      }

      // Calculate transitions
      const transitionCounts = new Map<string, number>();
      const pageCounts = new Map<string, number>();
      const paths: { path: string[]; count: number }[] = [];
      let totalDepth = 0;
      let bounces = 0;

      for (const [, pages] of sessionEvents) {
        // Sort by time
        pages.sort((a, b) => a.time.getTime() - b.time.getTime());
        
        // Remove consecutive duplicates
        const uniquePages = pages.filter((p, i) => 
          i === 0 || p.page !== pages[i - 1].page
        );
        
        if (uniquePages.length === 0) continue;
        
        // Track session depth
        totalDepth += uniquePages.length;
        
        // Track bounces (single page sessions)
        if (uniquePages.length === 1) {
          bounces++;
        }
        
      // Count page visits
      for (const { page } of uniquePages) {
        if (page) {
          pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
        }
      }
        
        // Count transitions
        for (let i = 0; i < uniquePages.length - 1; i++) {
          const source = uniquePages[i].page;
          const target = uniquePages[i + 1].page;
          const key = `${source}|${target}`;
          transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
        }

        // Track top paths (first 3 pages)
        if (uniquePages.length >= 2) {
          const pathKey = uniquePages.slice(0, 3).map(p => p.page).join(' → ');
          const existing = paths.find(p => p.path.join(' → ') === pathKey);
          if (existing) {
            existing.count++;
          } else {
            paths.push({ 
              path: uniquePages.slice(0, 3).map(p => p.page), 
              count: 1 
            });
          }
        }
      }

      // Build nodes
      const nodes: JourneyNode[] = Array.from(pageCounts.entries())
        .map(([id, count]) => ({
          id,
          label: getPageLabel(id),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // Top 15 pages

      const nodeIds = new Set(nodes.map(n => n.id));

      // Build links (only between existing nodes)
      const links: PageTransition[] = Array.from(transitionCounts.entries())
        .map(([key, value]) => {
          const [source, target] = key.split('|');
          return { source, target, value };
        })
        .filter(link => nodeIds.has(link.source) && nodeIds.has(link.target))
        .sort((a, b) => b.value - a.value)
        .slice(0, 30); // Top 30 transitions

      // Top paths
      const topPaths = paths
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const totalSessions = sessionEvents.size;
      
      return {
        nodes,
        links,
        topPaths,
        avgSessionDepth: totalSessions > 0 ? totalDepth / totalSessions : 0,
        bounceRate: totalSessions > 0 ? (bounces / totalSessions) * 100 : 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
