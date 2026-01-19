/**
 * AdminEconomy - Economy management tab
 */
import { EconomyConfigEditor } from "@/components/admin/economy";
import { FeatureFlagsEditor } from "@/components/admin/features";

export default function AdminEconomy() {
  return (
    <div className="space-y-4">
      <EconomyConfigEditor />
      <FeatureFlagsEditor />
    </div>
  );
}
