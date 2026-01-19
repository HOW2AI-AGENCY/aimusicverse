/**
 * AdminAlerts - Alerts management tab
 */
import { AlertAnalyticsPanel } from "@/components/admin/AlertAnalyticsPanel";
import { AlertHistoryPanel } from "@/components/admin/AlertHistoryPanel";

export default function AdminAlerts() {
  return (
    <div className="space-y-6">
      <AlertAnalyticsPanel />
      <AlertHistoryPanel />
    </div>
  );
}
