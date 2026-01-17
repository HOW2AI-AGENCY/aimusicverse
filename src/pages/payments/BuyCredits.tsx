/**
 * BuyCredits Page
 * Displays credit packages for purchase with Tinkoff card payment
 */

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Zap, LayoutGrid, List, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTinkoffPayment } from '@/hooks/useTinkoffPayment';
import { useGroupedProducts } from '@/hooks/useStarsProducts';
import { CreditPackageCard } from '@/components/payments/CreditPackageCard';
import { PackageComparisonTable } from '@/components/payments/PackageComparisonTable';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { StarsProduct } from '@/services/starsPaymentService';
import { formatRubles } from '@/types/payment';

type ViewMode = 'grid' | 'list';

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<StarsProduct | null>(null);
  
  const { data: groupedProducts, isLoading, error } = useGroupedProducts();
  const { pay: payWithTinkoff, isLoading: isTinkoffLoading } = useTinkoffPayment();

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admins can now access this page for testing payments

  const displayProducts = groupedProducts?.credits || [];

  const handleProductClick = (product: StarsProduct) => {
    setSelectedProduct(product);
  };

  const handlePurchase = () => {
    if (!selectedProduct || !user?.id) return;
    payWithTinkoff(selectedProduct.product_code);
  };

  const isProcessing = isTinkoffLoading;

  // Get price display
  const getPriceDisplay = () => {
    if (!selectedProduct) return null;
    
    const priceRub = selectedProduct.price_rub_cents;
    return (
      <div className="text-right">
        <div className="flex items-center gap-1">
          <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-2xl font-bold">
            {priceRub ? formatRubles(priceRub) : '—'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Картой</p>
      </div>
    );
  };

  const getButtonText = () => {
    if (!selectedProduct) return 'Выберите пакет';
    
    const priceRub = selectedProduct.price_rub_cents;
    return `Оплатить ${priceRub ? formatRubles(priceRub) : '—'}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-32">
      {/* Header */}
      <div className="mb-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <CreditCard className="h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Купить кредиты</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Приобретайте кредиты для генерации AI-музыки
        </p>
      </div>

      {/* Conversion Rate Banner */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Как работают кредиты?</p>
            <p className="text-sm text-muted-foreground">
              <strong>3 кредита</strong> = 1 сгенерированный трек • 
              <strong> 1 кредит</strong> = разделение на стемы
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Не удалось загрузить пакеты. Попробуйте позже.
          </AlertDescription>
        </Alert>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {displayProducts.length} {displayProducts.length === 1 ? 'пакет' : 'пакетов'} доступно
        </p>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="list" className="px-3">
              <List className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="grid" className="px-3">
              <LayoutGrid className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Products - List View */}
      {!isLoading && displayProducts.length > 0 && viewMode === 'list' && (
        <PackageComparisonTable
          products={displayProducts}
          selectedProduct={selectedProduct}
          onSelect={handleProductClick}
        />
      )}

      {/* Products - Grid View */}
      {!isLoading && displayProducts.length > 0 && viewMode === 'grid' && (
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
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-muted-foreground">
            Пакеты кредитов недоступны.
          </p>
        </div>
      )}

      {/* Purchase Panel */}
      {selectedProduct && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t z-50">
          <div className="container mx-auto max-w-md">
            <div className="bg-card p-4 rounded-lg border shadow-lg space-y-4">
              {/* Selected Product Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Выбранный пакет</p>
                  <p className="font-semibold">
                    {selectedProduct.credits_amount ?? 0} кредитов
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ≈ {Math.floor((selectedProduct.credits_amount ?? 0) / 3)} треков
                  </p>
                </div>
                {getPriceDisplay()}
              </div>

              {/* Payment Method Info */}
              <PaymentMethodSelector
                priceRubCents={selectedProduct.price_rub_cents ?? undefined}
              />

              {/* Pay Button */}
              <Button
                onClick={handlePurchase}
                disabled={isProcessing || !selectedProduct.price_rub_cents}
                size="lg"
                className="w-full gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {getButtonText()}
              </Button>

              {!selectedProduct.price_rub_cents && (
                <p className="text-xs text-center text-destructive">
                  Цена в рублях не указана для этого пакета
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
