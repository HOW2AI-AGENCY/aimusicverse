/**
 * BuyCredits Page
 * Enhanced with glassmorphism, animations and improved UX
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Zap, LayoutGrid, List, CreditCard, Loader2, Sparkles, Music, ArrowRight, Shield } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useTinkoffPayment } from "@/hooks/useTinkoffPayment";
import { useGroupedProducts } from "@/hooks/useStarsProducts";
import { CreditPackageCard } from "@/components/payments/CreditPackageCard";
import { PackageComparisonTable } from "@/components/payments/PackageComparisonTable";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { glass, gradientGlass } from "@/lib/glass";
import type { StarsProduct } from "@/services/starsPaymentService";
import { formatRubles } from "@/types/payment";
import { useTelegram } from "@/contexts/TelegramContext";

type ViewMode = "grid" | "list";

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="space-y-4"
        >
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </motion.div>
      ))}
    </div>
  );
}

// Animated credit info item
function CreditInfoItem({
  icon,
  credits,
  label,
  delay,
}: {
  icon: React.ReactNode;
  credits: number;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: "spring", stiffness: 300 }}
      className="flex items-center gap-2 text-sm"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <span className="font-semibold text-primary">{credits}</span>
        <span className="text-muted-foreground ml-1">= {label}</span>
      </div>
    </motion.div>
  );
}

export default function BuyCredits() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { hapticFeedback } = useTelegram();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedProduct, setSelectedProduct] = useState<StarsProduct | null>(null);
  const [showPurchasePanel, setShowPurchasePanel] = useState(false);

  const { data: groupedProducts, isLoading, error } = useGroupedProducts();
  const { pay: payWithTinkoff, isLoading: isTinkoffLoading } = useTinkoffPayment();

  // Animate purchase panel when product selected
  useEffect(() => {
    if (selectedProduct) {
      setShowPurchasePanel(true);
    }
  }, [selectedProduct]);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  const displayProducts = groupedProducts?.credits || [];

  const handleProductClick = (product: StarsProduct) => {
    hapticFeedback("light");
    setSelectedProduct(product);
  };

  const handlePurchase = () => {
    if (!selectedProduct || !user?.id) return;
    hapticFeedback("medium");
    payWithTinkoff(selectedProduct.product_code);
  };

  const isProcessing = isTinkoffLoading;

  const tracksCount = selectedProduct ? Math.floor((selectedProduct.credits_amount ?? 0) / 12) : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-40">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="mb-6 text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <CreditCard className="h-6 w-6 text-primary" aria-hidden="true" />
          </motion.div>
          <h1 className="text-2xl font-bold">Купить кредиты</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">Приобретайте кредиты для создания AI-музыки</p>
      </motion.div>

      {/* How Credits Work - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn("mb-6 p-4 rounded-xl", gradientGlass.primary)}
      >
        <div className="flex items-start gap-3">
          <motion.div
            className="p-2.5 rounded-xl bg-primary/20 shrink-0"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-5 h-5 text-primary" />
          </motion.div>
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <p className="font-semibold text-sm">Как работают кредиты?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <CreditInfoItem
                icon={<Music className="w-4 h-4 text-primary" />}
                credits={12}
                label="1 AI-трек"
                delay={0.2}
              />
              <CreditInfoItem
                icon={<Sparkles className="w-4 h-4 text-primary" />}
                credits={10}
                label="stem-разделение"
                delay={0.3}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Не удалось загрузить пакеты. Попробуйте позже.</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-4"
      >
        <p className="text-sm text-muted-foreground">
          {displayProducts.length} {displayProducts.length === 1 ? "пакет" : "пакетов"}
        </p>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="grid w-auto grid-cols-2 h-9">
            <TabsTrigger value="list" className="px-3 h-7">
              <List className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="grid" className="px-3 h-7">
              <LayoutGrid className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Products - List View */}
      <AnimatePresence mode="wait">
        {!isLoading && displayProducts.length > 0 && viewMode === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PackageComparisonTable
              products={displayProducts}
              selectedProduct={selectedProduct}
              onSelect={handleProductClick}
            />
          </motion.div>
        )}

        {/* Products - Grid View */}
        {!isLoading && displayProducts.length > 0 && viewMode === "grid" && (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {displayProducts.map((product, index) => {
              // Calculate best value
              const tracksCount = Math.floor((product.credits_amount ?? 0) / 12);
              const pricePerTrack =
                product.price_rub_cents && tracksCount > 0 ? product.price_rub_cents / 100 / tracksCount : Infinity;

              const isBestValue = displayProducts.every((p) => {
                const pTracks = Math.floor((p.credits_amount ?? 0) / 12);
                const pPrice = p.price_rub_cents && pTracks > 0 ? p.price_rub_cents / 100 / pTracks : Infinity;
                return pricePerTrack <= pPrice;
              });

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CreditPackageCard
                    product={product}
                    isSelected={selectedProduct?.id === product.id}
                    onClick={handleProductClick}
                    isBestValue={isBestValue && !product.is_featured}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && displayProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-muted-foreground">Пакеты кредитов недоступны.</p>
        </motion.div>
      )}

      {/* Purchase Panel - Improved with animations */}
      <AnimatePresence>
        {showPurchasePanel && selectedProduct && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              paddingBottom:
                "calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 4.5rem)",
            }}
          >
            <div className={cn("mx-auto max-w-lg px-4")}>
              <div className={cn("p-4 rounded-t-2xl border-t border-x", glass.overlay, "shadow-2xl")}>
                {/* Selected Product Summary */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center"
                    >
                      <Zap className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-lg">{selectedProduct.credits_amount} кредитов</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Music className="w-3.5 h-3.5" />
                        <span>≈ {tracksCount} треков</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {selectedProduct.price_rub_cents ? formatRubles(selectedProduct.price_rub_cents) : "—"}
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <PaymentMethodSelector priceRubCents={selectedProduct.price_rub_cents ?? undefined} />

                {/* Pay Button */}
                <motion.div whileTap={{ scale: 0.98 }} className="mt-4">
                  <Button
                    onClick={handlePurchase}
                    disabled={isProcessing || !selectedProduct.price_rub_cents}
                    size="lg"
                    className={cn(
                      "w-full gap-2 h-12 text-base font-semibold",
                      "bg-gradient-to-r from-primary via-primary to-primary/90",
                      "hover:from-primary/90 hover:via-primary hover:to-primary",
                      "shadow-lg shadow-primary/25",
                      "transition-all duration-300",
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Обработка...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>
                          Оплатить{" "}
                          {selectedProduct.price_rub_cents ? formatRubles(selectedProduct.price_rub_cents) : ""}
                        </span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Security Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Безопасная оплата через Tinkoff</span>
                </motion.div>

                {!selectedProduct.price_rub_cents && (
                  <p className="text-xs text-center text-destructive mt-2">Цена не указана для этого пакета</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
