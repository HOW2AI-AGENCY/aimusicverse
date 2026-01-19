/**
 * AdminTariffs - Subscription tiers management tab
 */
import { Card, CardContent } from "@/components/ui/card";
import { SubscriptionTiersManager } from "@/components/admin/SubscriptionTiersManager";

export default function AdminTariffs() {
  return (
    <Card>
      <CardContent className="pt-6">
        <SubscriptionTiersManager />
      </CardContent>
    </Card>
  );
}
