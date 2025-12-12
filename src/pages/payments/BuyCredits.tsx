/**
 * BuyCredits Page
 * Displays credit packages for purchase with Telegram Stars
 */

import { useState } from 'react';
import { Sparkles, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStarsPayment } from '@/hooks/useStarsPayment';
import { useGroupedProducts } from '@/hooks/useStarsProducts';
import { CreditPackageCard } from '@/components/payments/CreditPackageCard';
import { StarsPaymentButton } from '@/components/payments/StarsPaymentButton';
import { PaymentSuccessModal } from '@/components/payments/PaymentSuccessModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StarsProduct } from '@/types/starsPayment';

type FilterType = 'all' | 'featured';

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-[280px] w-full" />
        </div>
      ))}
    </div>
  );
}

export default function BuyCredits() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedProduct, setSelectedProduct] = useState<StarsProduct | null>(null);
  
  const { data: groupedProducts, isLoading, error } = useGroupedProducts();
  const { initiatePayment, isCreatingInvoice, flowState, resetFlow } = useStarsPayment();

  // Determine which products to display
  const displayProducts =
    filter === 'featured'
      ? groupedProducts?.featured || []
      : groupedProducts?.credits || [];

  const handleProductClick = (product: StarsProduct) => {
    setSelectedProduct(product);
  };

  const handlePurchase = () => {
    if (selectedProduct && user?.id) {
      initiatePayment(selectedProduct, user.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Buy Credits</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Purchase credits with Telegram Stars to generate AI music. Choose the package that fits your needs.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Failed to load credit packages. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Packages
          </Button>
          <Button
            variant={filter === 'featured' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('featured')}
          >
            Featured
          </Button>
        </div>

        {displayProducts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {displayProducts.length} {displayProducts.length === 1 ? 'package' : 'packages'} available
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Products Grid */}
      {!isLoading && displayProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayProducts.map((product) => (
            <CreditPackageCard
              key={product.id}
              product={product}
              isSelected={selectedProduct?.id === product.id}
              onClick={handleProductClick}
              language="en"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayProducts.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-muted-foreground">
            No credit packages available at the moment.
          </p>
        </div>
      )}

      {/* Purchase Button */}
      {selectedProduct && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t md:relative md:bottom-auto md:border-0 md:bg-transparent md:backdrop-blur-none">
          <div className="container mx-auto max-w-md">
            <div className="bg-card p-4 rounded-lg border shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Package</p>
                  <p className="font-semibold">
                    {selectedProduct.credits_amount} Credits
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-2xl font-bold">{selectedProduct.price_stars}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Stars</p>
                </div>
              </div>
              <StarsPaymentButton
                onClick={handlePurchase}
                isLoading={isCreatingInvoice}
                size="lg"
                className="w-full"
              >
                Pay with Telegram Stars
              </StarsPaymentButton>
            </div>
          </div>
        </div>
      )}

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
