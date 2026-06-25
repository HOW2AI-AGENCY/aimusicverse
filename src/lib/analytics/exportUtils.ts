/**
 * Analytics Export Utilities
 * Functions for exporting analytics data in various formats
 */

import { logger } from "@/lib/logger";

export interface ExportOptions {
  format: "csv" | "json";
  filename: string;
  data: Record<string, unknown>[] | Record<string, unknown>;
}

/**
 * Export data as CSV
 */
function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Download data as a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export analytics data
 */
export function exportAnalytics({ format, filename, data }: ExportOptions): void {
  try {
    const dataArray = Array.isArray(data) ? data : [data];

    if (format === "csv") {
      const csv = toCSV(dataArray);
      downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${filename}.json`, "application/json");
    }

    logger.info("Analytics exported", { format, filename, rowCount: dataArray.length });
  } catch (error) {
    logger.error("Failed to export analytics", error);
    throw error;
  }
}

/**
 * Format telemetry data for export
 */
export function formatTelemetryForExport(data: Record<string, unknown>): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Summary row
  rows.push({
    metric: "Total Events",
    value: data.total_events,
    type: "summary",
  });
  rows.push({
    metric: "Unique Sessions",
    value: data.unique_sessions,
    type: "summary",
  });
  rows.push({
    metric: "Unique Users",
    value: data.unique_users,
    type: "summary",
  });

  // Events by type
  const eventsByType = (data.events_by_type as Record<string, number>) || {};
  Object.entries(eventsByType).forEach(([eventType, count]) => {
    rows.push({
      metric: `Event: ${eventType}`,
      value: count,
      type: "event_type",
    });
  });

  return rows;
}

/**
 * Format error data for export
 */
export function formatErrorsForExport(
  errors: Array<{
    error_fingerprint: string;
    error_type: string;
    error_message: string;
    occurrences: number;
    affected_users: number;
    last_seen: string;
  }>,
): Record<string, unknown>[] {
  return errors.map((error) => ({
    fingerprint: error.error_fingerprint,
    type: error.error_type,
    message: error.error_message,
    occurrences: error.occurrences,
    affected_users: error.affected_users,
    last_seen: error.last_seen,
  }));
}

/**
 * Format deeplink data for export
 */
export function formatDeeplinksForExport(
  events: Array<{
    id: string;
    deeplink_type: string;
    deeplink_value: string | null;
    source: string | null;
    campaign: string | null;
    created_at: string;
    converted: boolean;
    conversion_type: string | null;
  }>,
): Record<string, unknown>[] {
  return events.map((event) => ({
    id: event.id,
    type: event.deeplink_type,
    value: event.deeplink_value || "",
    source: event.source || "direct",
    campaign: event.campaign || "",
    date: event.created_at,
    converted: event.converted ? "Yes" : "No",
    conversion_type: event.conversion_type || "",
  }));
}
