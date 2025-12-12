/**
 * Subscription Page
 * Displays subscription tiers with features and manages user subscriptions
 */

import { useState } from 'react';
import { Crown, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStarsPayment } from '@/hooks/useStarsPayment';
import { useProductsByType } from '@/hooks/useStarsProducts';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { SubscriptionCard } from '@/components/payments/SubscriptionCard';
import { PaymentSuccessModal } from '@/components/payments/PaymentSuccessModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { StarsProduct } from '@/types/starsPayment';

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[600px] w-full" />
      ))}
    </div>
  );
}

export default function Subscription() {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<StarsProduct | null>(null);

  const {
    data: subscriptionProducts,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useProductsByType('subscription');

  const {
    subscription,
    isLoading: isLoadingStatus,
    isActive,
    tier,
    expiresAt,
    daysRemaining,
  } = useSubscriptionStatus({
    userId: user?.id || '',
    enabled: !!user?.id,
  });

  const { initiatePayment, flowState, resetFlow } = useStarsPayment();

  const handleSubscribe = (product: StarsProduct) => {
    setSelectedProduct(product);
    if (user?.id) {
      initiatePayment(product, user.id);
    }
  };

  const isCurrentTier = (productTier: string | null | undefined) => {
    return productTier === tier && isActive;
  };

  // Show expiration warning if < 7 days
  const showExpirationWarning =
    isActive && daysRemaining !== null && daysRemaining < 7;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock unlimited music generation and advanced features with a subscription plan.
        </p>
      </div>

      {/* Current Subscription Status */}
      {!isLoadingStatus && subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold capitalize">{tier}</p>
                  {isActive ? (
                    <Badge variant="default" className="bg-success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>

              {expiresAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="text-lg font-semibold mt-1">
                    {new Date(expiresAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {daysRemaining !== null && (
                    <p className="text-sm text-muted-foreground">
                      {daysRemaining} days remaining
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Expiration Warning */}
            {showExpirationWarning && (
              <>
                <Separator />
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Subscription Expiring Soon</AlertTitle>
                  <AlertDescription>
                    Your subscription will expire in {daysRemaining} days. Renew now to continue
                    enjoying premium features.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {productsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Failed to load subscription plans. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoadingProducts && <LoadingState />}

      {/* Subscription Plans Grid */}
      {!isLoadingProducts && subscriptionProducts && subscriptionProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {subscriptionProducts.map((product) => (
            <SubscriptionCard
              key={product.id}
              product={product}
              isCurrentTier={isCurrentTier(product.subscription_tier)}
              onSubscribe={handleSubscribe}
              language="en"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingProducts && subscriptionProducts?.length === 0 && (
        <div className="text-center py-12">
          <Crown className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-muted-foreground">
            No subscription plans available at the moment.
          </p>
        </div>
      )}

      {/* FAQ or Additional Info Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Subscription Benefits</CardTitle>
          <CardDescription>What you get with a paid subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
            <li>Unlimited music track generation</li>
            <li>High-definition audio quality (320kbps)</li>
            <li>Priority processing queue</li>
            <li>Extended stem separation (up to 8 tracks)</li>
            <li>Advanced AI music tags and metadata</li>
            <li>No watermarks on generated tracks</li>
            <li>Commercial licensing options (Premium+)</li>
            <li>API access for integrations (Premium+)</li>
            <li>Dedicated customer support</li>
          </ul>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <PaymentSuccessModal
        isOpen={flowState.step === 'success'}
        onClose={resetFlow}
        product={selectedProduct || undefined}
        language="en"
      />
    </div>
  );
}
