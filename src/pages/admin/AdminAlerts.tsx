/**
 * AdminAlerts - Alerts management tab
 */
import { AlertAnalyticsPanel } from "@/components/admin/AlertAnalyticsPanel";
import { AlertHistoryPanel } from "@/components/admin/AlertHistoryPanel";
import { SystemStatusCard } from "@/components/admin/SystemStatusCard";

export default function AdminAlerts() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SystemStatusCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AlertHistoryPanel />
        <AlertAnalyticsPanel />
      </div>
    </div>
  );
}
