/**
 * AdminAlerts - Alerts management tab with anomaly detection
 */
import { AlertAnalyticsPanel } from "@/components/admin/AlertAnalyticsPanel";
import { AlertHistoryPanel } from "@/components/admin/AlertHistoryPanel";
import { SystemStatusCard } from "@/components/admin/SystemStatusCard";
import { AnomalyDetectionPanel } from "@/components/admin/AnomalyDetectionPanel";

export default function AdminAlerts() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top row: System status and Anomaly detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SystemStatusCard />
        <AnomalyDetectionPanel />
      </div>
      
      {/* Bottom row: History and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AlertHistoryPanel />
        <AlertAnalyticsPanel />
      </div>
    </div>
  );
}
