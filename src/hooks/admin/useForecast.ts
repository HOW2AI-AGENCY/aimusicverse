/**
 * useForecast — TanStack Query wrapper for the admin
 * analytics/ForecastPanel. Re-exports the ForecastData type so consumers
 * don't need to reach into the service directly.
 */
import { useQuery } from "@tanstack/react-query";
import { getForecastData, forecastDaysFromTimePeriod } from "@/services/analytics/forecast.service";
import type { ForecastData } from "@/services/analytics/forecast.service";

export type { ForecastData };

export function useForecast(timePeriod: string) {
  const days = forecastDaysFromTimePeriod(timePeriod);
  return useQuery<ForecastData>({
    queryKey: ["forecast-data", days],
    queryFn: () => getForecastData(timePeriod),
    staleTime: 10 * 60 * 1000,
  });
}
