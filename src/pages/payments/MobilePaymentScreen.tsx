/**
 * Mobile Payment Screen
 * Premium payment experience for MusicVerse AI
 */

import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, ArrowLeft, Shield, Clock, 
  Loader2, CheckCircle2, Info
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTinkoffPayment } from '@/hooks/useTinkoffPayment';
import { useGroupedProducts } from '@/hooks/useStarsProducts';
import { Card3D } from '@/components/payments/Card3D';
import { PaymentPackageSelector } from '@/components/payments/PaymentPackageSelector';
import { PaymentButton } from '@/components/payments/PaymentButton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { StarsProduct } from '@/services/starsPaymentService';
import { formatRubles } from '@/types/payment';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export default function MobilePaymentScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [selectedProduct, setSelectedProduct] = useState<StarsProduct | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { data: groupedProducts, isLoading, error } = useGroupedProducts();
  const { pay: payWithTinkoff, isLoading: isTinkoffLoading, isSuccess } = useTinkoffPayment({
    onSuccess: () => {
      setShowSuccess(true);
    },
  });

  // Handle deep link parameters
  useEffect(() => {
    const productCode = searchParams.get('product');
    const autoSelect = searchParams.get('select');
    
    if (productCode && groupedProducts?.credits) {
      const product = groupedProducts.credits.find(p => p.product_code === productCode);
      if (product) {
        setSelectedProduct(product);
        logger.info('Product pre-selected via deep link', { productCode });
      }
    } else if (autoSelect === 'popular' && groupedProducts?.credits) {
      // Auto-select featured/popular product
      const featured = groupedProducts.credits.find(p => p.is_featured);
      if (featured) setSelectedProduct(featured);
    }
  }, [searchParams, groupedProducts]);

  // Admin users don't need to purchase - redirect
  if (!roleLoading && isAdmin) {
    return <Navigate to="/" replace />;
  }

  const displayProducts = groupedProducts?.credits || [];

  const handleBack = () => {
    navigate(-1);
  };

  const handlePurchase = () => {
    if (!selectedProduct || !user?.id) return;
    payWithTinkoff(selectedProduct.product_code);
  };

  const isProcessing = isTinkoffLoading;

  // Calculate savings if not first package
  const getSavingsText = () => {
    if (!selectedProduct || displayProducts.length < 2) return null;
    
    const base = displayProducts[0];
    if (!base.price_rub_cents || !base.credits_amount || 
        !selectedProduct.price_rub_cents || !selectedProduct.credits_amount) {
      return null;
    }
    
    const baseRate = base.price_rub_cents / base.credits_amount;
    const selectedRate = selectedProduct.price_rub_cents / selectedProduct.credits_amount;
    
    if (selectedRate >= baseRate) return null;
    
    const savings = Math.round((baseRate - selectedRate) * selectedProduct.credits_amount);
    return savings > 100 ? `Экономия ${formatRubles(savings)}` : null;
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Пополнение кредитов</h1>
            <p className="text-xs text-muted-foreground">Безопасная оплата картой</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-success" />
            <span>SSL</span>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="p-4 pb-48 space-y-6">
        {/* 3D Card */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card3D isProcessing={isProcessing} />
        </motion.section>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20"
        >
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Как работают кредиты?</p>
            <p className="text-muted-foreground">
              <strong>3 кредита</strong> = 1 AI-трек • <strong>1 кредит</strong> = разделение на стемы
            </p>
          </div>
        </motion.div>

        {/* Package Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Выберите пакет</h2>
            {displayProducts.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {displayProducts.length} вариантов
              </span>
            )}
          </div>

          {roleLoading || isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="p-6 text-center rounded-2xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                Не удалось загрузить пакеты. Попробуйте позже.
              </p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-muted">
              <Zap className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Пакеты кредитов недоступны
              </p>
            </div>
          ) : (
            <PaymentPackageSelector
              products={displayProducts}
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
            />
          )}
        </motion.section>

        {/* Trust Indicators */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Shield, text: 'Безопасно', subtext: 'PCI DSS' },
            { icon: Clock, text: 'Мгновенно', subtext: 'Зачисление' },
            { icon: CheckCircle2, text: 'Гарантия', subtext: 'Возврата' },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50"
            >
              <item.icon className="w-5 h-5 text-primary mb-1" />
              <span className="text-xs font-medium">{item.text}</span>
              <span className="text-[10px] text-muted-foreground">{item.subtext}</span>
            </motion.div>
          ))}
        </motion.section>
      </main>

      {/* Fixed Bottom Panel */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background/95 backdrop-blur-xl border-t border-border/50 z-50"
          >
            <div className="max-w-md mx-auto space-y-3">
              {/* Selected product summary */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-semibold">
                      {selectedProduct.credits_amount ?? 0} кредитов
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ≈ {Math.floor((selectedProduct.credits_amount ?? 0) / 3)} треков
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {selectedProduct.price_rub_cents 
                      ? formatRubles(selectedProduct.price_rub_cents) 
                      : '—'}
                  </p>
                  {getSavingsText() && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-success font-medium"
                    >
                      {getSavingsText()}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Payment Button */}
              <PaymentButton
                onClick={handlePurchase}
                disabled={!selectedProduct.price_rub_cents || !user?.id}
                isLoading={isProcessing}
                isSuccess={showSuccess}
                price={selectedProduct.price_rub_cents 
                  ? formatRubles(selectedProduct.price_rub_cents) 
                  : '—'}
              />

              {/* Terms */}
              <p className="text-[10px] text-center text-muted-foreground">
                Нажимая «Оплатить», вы соглашаетесь с{' '}
                <a href="/terms" className="underline">условиями использования</a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-system flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center space-y-4"
            >
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Переход к оплате...</p>
              <p className="text-sm text-muted-foreground">Пожалуйста, подождите</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
