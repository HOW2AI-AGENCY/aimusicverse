/**
 * User Activity Heatmap Service
 *
 * Buckets analytics events into a 7x24 (weekday x hour) matrix and
 * surfaces the peak (day, hour) plus average events-per-hour.
 *
 * Used by the admin analytics/UserActivityHeatmap panel.
 */

import * as adminApi from "@/api/admin.api";

export interface HeatmapData {
  /** 7 weekday rows × 24 hour columns (Mon=0, Sun=6). */
  hourlyActivity: number[][];
  peakHour: number;
  peakDay: number;
  totalEvents: number;
  avgEventsPerHour: number;
}

export function timePeriodToStartDate(timePeriod: string): Date {
  const periodDays = timePeriod === "24 hours" ? 1 : timePeriod === "7 days" ? 7 : timePeriod === "30 days" ? 30 : 90;
  return new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
}

/**
 * Build the heatmap data from raw event rows. Pure function — easy to unit-test.
 */
export function buildHeatmapData(events: adminApi.AnalyticsEventCreatedRow[]): HeatmapData {
  const hourlyActivity: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

  let peakValue = 0;
  let peakHour = 0;
  let peakDay = 0;

  events.forEach((event) => {
    const date = new Date(event.created_at || Date.now());
    // getDay returns 0 for Sunday; we want Monday = 0.
    const dayOfWeek = (date.getDay() + 6) % 7;
    const hour = date.getHours();

    hourlyActivity[dayOfWeek][hour]++;

    if (hourlyActivity[dayOfWeek][hour] > peakValue) {
      peakValue = hourlyActivity[dayOfWeek][hour];
      peakHour = hour;
      peakDay = dayOfWeek;
    }
  });

  const totalEvents = events.length;
  const avgEventsPerHour = totalEvents / (7 * 24);

  return {
    hourlyActivity,
    peakHour,
    peakDay,
    totalEvents,
    avgEventsPerHour,
  };
}

/**
 * Fetch the heatmap data for a given admin analytics time period.
 */
export async function getUserActivityHeatmap(timePeriod: string): Promise<HeatmapData> {
  const startDate = timePeriodToStartDate(timePeriod);
  const events = await adminApi.fetchAnalyticsEventsForHeatmap({ startDate });
  return buildHeatmapData(events);
}
