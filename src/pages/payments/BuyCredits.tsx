/**
 * BuyCredits Page
 * Displays credit packages for purchase with Telegram Stars
 * Note: Admins are redirected to home as they don't need to purchase credits
 */

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useStarsPayment } from '@/hooks/useStarsPayment';
import { useGroupedProducts } from '@/hooks/useStarsProducts';
import { CreditPackageCard } from '@/components/payments/CreditPackageCard';
import { StarsPaymentButton } from '@/components/payments/StarsPaymentButton';
import { PaymentSuccessModal } from '@/components/payments/PaymentSuccessModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { StarsProduct } from '@/services/starsPaymentService';

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
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedProduct, setSelectedProduct] = useState<StarsProduct | null>(null);
  
  const { data: groupedProducts, isLoading, error } = useGroupedProducts();
  const { initiatePayment, isCreatingInvoice, flowState, resetFlow } = useStarsPayment();

  // Admin users don't need to purchase credits - redirect to home
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

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
    <div className="container mx-auto px-4 py-8 max-w-7xl pb-32">
      {/* Header */}
      <div className="mb-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Купить кредиты</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Приобретайте кредиты за Telegram Stars для генерации AI-музыки
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Не удалось загрузить пакеты. Попробуйте позже.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Все пакеты
          </Button>
          <Button
            variant={filter === 'featured' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('featured')}
          >
            Популярные
          </Button>
        </div>

        {displayProducts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {displayProducts.length} {displayProducts.length === 1 ? 'пакет' : 'пакетов'}
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
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayProducts.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-muted-foreground">
            Пакеты кредитов недоступны.
          </p>
        </div>
      )}

      {/* Purchase Button */}
      {selectedProduct && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t z-50">
          <div className="container mx-auto max-w-md">
            <div className="bg-card p-4 rounded-lg border shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Выбранный пакет</p>
                  <p className="font-semibold">
                    {selectedProduct.credits_amount} кредитов
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-yellow-500" aria-hidden="true" />
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
                Купить за {selectedProduct.price_stars} Stars
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
      />
    </div>
  );
}
