/**
 * Forecast Service
 *
 * Pulls daily series from the api layer, aggregates them by day, computes
 * a 30-day linear-regression forecast and per-series growth rate.
 *
 * Used by the admin analytics/ForecastPanel.
 */

import * as adminApi from "@/api/admin.api";
import { format, startOfDay, subDays } from "@/lib/date-utils";

export interface DailyMetric {
  date: string;
  value: number;
}

export interface ForecastData {
  users: DailyMetric[];
  revenue: DailyMetric[];
  generations: DailyMetric[];
  tracks: DailyMetric[];
  predictions: {
    usersNext30: number;
    revenueNext30: number;
    generationsNext30: number;
    tracksNext30: number;
  };
  growth: {
    users: number;
    revenue: number;
    generations: number;
    tracks: number;
  };
}

/**
 * Resolve a `timePeriod` string (admin analytics tab) into the window length
 * in days the forecast should cover.
 */
export function forecastDaysFromTimePeriod(timePeriod: string): number {
  if (timePeriod === "24 hours") return 7;
  if (timePeriod === "7 days") return 14;
  if (timePeriod === "30 days") return 30;
  return 60;
}

// Simple linear regression
export function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

/**
 * Predict the total over the next `daysAhead` days, given a daily series.
 */
export function forecast(data: number[], daysAhead: number): number {
  const { slope, intercept } = linearRegression(data);
  const lastIndex = data.length - 1;
  const predictedDaily = intercept + slope * (lastIndex + daysAhead);
  return Math.max(0, predictedDaily * daysAhead);
}

/**
 * Growth rate comparing second half of the series to the first half.
 */
export function calcGrowth(daily: DailyMetric[]): number {
  const half = Math.floor(daily.length / 2);
  const firstHalf = daily.slice(0, half).reduce((s, d) => s + d.value, 0);
  const secondHalf = daily.slice(half).reduce((s, d) => s + d.value, 0);
  return firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
}

interface RawWithCreatedAt {
  created_at: string | null;
}

interface RawWithAmount extends RawWithCreatedAt {
  stars_amount?: number | null;
}

/**
 * Aggregate raw rows into a per-day series. `valueField` (optional) selects
 * the numeric column to sum per row; when omitted, each row counts as 1.
 */
export function aggregateByDay(
  items: RawWithCreatedAt[] | null,
  days: number,
  now: Date,
  valueField?: keyof RawWithAmount,
): DailyMetric[] {
  const byDay = new Map<string, number>();

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = format(subDays(now, days - 1 - i), "yyyy-MM-dd");
    byDay.set(date, 0);
  }

  items?.forEach((item) => {
    if (!item.created_at) return;
    const date = format(startOfDay(new Date(item.created_at)), "yyyy-MM-dd");
    const value = valueField ? Number((item as RawWithAmount)[valueField] ?? 0) || 0 : 1;
    byDay.set(date, (byDay.get(date) || 0) + value);
  });

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date: format(new Date(date), "dd.MM"),
      value,
    }));
}

/**
 * Build the complete ForecastData for the panel. Fetches four parallel
 * series and assembles them into the panel's UI shape.
 */
export async function getForecastData(timePeriod: string): Promise<ForecastData> {
  const days = forecastDaysFromTimePeriod(timePeriod);
  const now = new Date();
  const startDate = startOfDay(subDays(now, days));

  const [users, revenue, generations, tracks] = await Promise.all([
    adminApi.fetchProfileSignupsForForecast({ startDate }),
    adminApi.fetchCompletedStarsRevenueForForecast({ startDate }),
    adminApi.fetchGenerationTaskCreatedForForecast({ startDate }),
    adminApi.fetchTracksCreatedForForecast({ startDate }),
  ]);

  const usersDaily = aggregateByDay(users, days, now);
  const revenueDaily = aggregateByDay(revenue, days, now, "stars_amount");
  const generationsDaily = aggregateByDay(generations, days, now);
  const tracksDaily = aggregateByDay(tracks, days, now);

  const forecastDays = 30;

  return {
    users: usersDaily,
    revenue: revenueDaily,
    generations: generationsDaily,
    tracks: tracksDaily,
    predictions: {
      usersNext30: forecast(
        usersDaily.map((d) => d.value),
        forecastDays,
      ),
      revenueNext30: forecast(
        revenueDaily.map((d) => d.value),
        forecastDays,
      ),
      generationsNext30: forecast(
        generationsDaily.map((d) => d.value),
        forecastDays,
      ),
      tracksNext30: forecast(
        tracksDaily.map((d) => d.value),
        forecastDays,
      ),
    },
    growth: {
      users: calcGrowth(usersDaily),
      revenue: calcGrowth(revenueDaily),
      generations: calcGrowth(generationsDaily),
      tracks: calcGrowth(tracksDaily),
    },
  };
}
