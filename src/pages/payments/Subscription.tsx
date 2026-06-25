/**
 * Subscription Page
 * Premium subscription experience with glassmorphism and animations
 * Feature: professional-payment-flow
 */

import { useState, useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Crown,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
  Star,
  Shield,
  Clock,
  Zap,
  Gift,
  Infinity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useStarsPayment } from "@/hooks/useStarsPayment";
import { useProductsByType } from "@/hooks/useStarsProducts";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { SubscriptionCard } from "@/components/payments/SubscriptionCard";
import { PaymentSuccessModal } from "@/components/payments/PaymentSuccessModal";
import { TrialBanner } from "@/components/premium/TrialBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { gradientGlass, glass } from "@/lib/glass";
import type { StarsProduct } from "@/services/starsPaymentService";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </motion.div>
      ))}
    </div>
  );
}

// Benefit item component
function BenefitItem({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <motion.div variants={itemVariants} className={cn("flex items-start gap-4 p-4 rounded-xl", glass.card)}>
      <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

export default function Subscription() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [searchParams] = useSearchParams();
  const showTrialHighlight = searchParams.get("trial") === "true";
  const [selectedProduct, setSelectedProduct] = useState<StarsProduct | null>(null);

  const {
    data: subscriptionProducts,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useProductsByType("subscription");

  const {
    subscription,
    isLoading: isLoadingStatus,
    isActive,
    tier,
    expiresAt,
    daysRemaining,
  } = useSubscriptionStatus({
    userId: user?.id || "",
    enabled: !!user?.id,
  });

  const { initiatePayment, flowState, resetFlow } = useStarsPayment();

  // Find the best value subscription
  const bestValueProduct = useMemo(() => {
    if (!subscriptionProducts?.length) return null;

    return subscriptionProducts.reduce(
      (best, product) => {
        if (!product.subscription_days || !product.price_stars) return best;
        if (!best || !best.subscription_days || !best.price_stars) return product;

        const productValue = product.subscription_days / product.price_stars;
        const bestValue = best.subscription_days / best.price_stars;

        return productValue > bestValue ? product : best;
      },
      null as StarsProduct | null,
    );
  }, [subscriptionProducts]);

  // Admin users don't need subscriptions - redirect to home
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

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
  const showExpirationWarning = isActive && daysRemaining !== undefined && daysRemaining !== null && daysRemaining < 7;

  const benefits = [
    { icon: Infinity, title: "Безлимитная генерация", description: "Создавай музыку без ограничений по количеству" },
    { icon: Zap, title: "Приоритетная очередь", description: "Твои запросы обрабатываются первыми" },
    { icon: Star, title: "HD качество аудио", description: "Экспорт в максимальном качестве 320kbps" },
    { icon: Gift, title: "Эксклюзивные модели", description: "Доступ к премиальным AI-моделям" },
    { icon: Shield, title: "Коммерческие права", description: "Лицензия на коммерческое использование" },
    { icon: Clock, title: "Приоритетная поддержка", description: "Ответ в течение 24 часов" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-generate/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-8 max-w-7xl">
        {/* Trial Banner - shown at top for eligible users */}
        <TrialBanner className="mb-6" />

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-generate to-accent p-0.5"
          >
            <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
              <Crown className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-generate to-accent bg-clip-text text-transparent"
          >
            Premium подписка
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Раскрой весь потенциал AI-генерации музыки с безлимитным доступом и эксклюзивными возможностями
          </motion.p>
        </motion.header>

        {/* Current Subscription Status */}
        <AnimatePresence>
          {!isLoadingStatus && subscription && isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className={cn(gradientGlass.primary, "overflow-hidden")}>
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 to-transparent" />
                  <Sparkles className="absolute top-4 right-4 w-6 h-6 text-primary/50" />
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                    Текущая подписка
                  </CardTitle>
                  <CardDescription>Детали вашего активного плана</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Тарифный план</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold capitalize">{tier}</p>
                        <Badge
                          variant="default"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Активна
                        </Badge>
                      </div>
                    </div>

                    {expiresAt && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Действует до</p>
                        <p className="text-xl font-semibold mt-1">
                          {new Date(expiresAt).toLocaleDateString("ru-RU", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {daysRemaining != null && (
                          <p className="text-sm text-muted-foreground">
                            Осталось {daysRemaining}{" "}
                            {daysRemaining === 1 ? "день" : (daysRemaining ?? 0) < 5 ? "дня" : "дней"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expiration Warning */}
                  {showExpirationWarning && (
                    <>
                      <Separator />
                      <Alert className={cn(gradientGlass.warning, "border-amber-500/30")}>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <AlertTitle className="text-amber-700 dark:text-amber-300">
                          Подписка скоро закончится
                        </AlertTitle>
                        <AlertDescription className="text-amber-600 dark:text-amber-400">
                          Ваша подписка истечёт через {daysRemaining}{" "}
                          {daysRemaining === 1 ? "день" : (daysRemaining ?? 0) < 5 ? "дня" : "дней"}. Продлите сейчас,
                          чтобы не потерять доступ к премиум-функциям.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {productsError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Не удалось загрузить тарифные планы. Пожалуйста, попробуйте позже.</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoadingProducts && <LoadingState />}

        {/* Subscription Plans Grid */}
        {!isLoadingProducts && subscriptionProducts && subscriptionProducts.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {subscriptionProducts.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <SubscriptionCard
                  product={product}
                  isCurrentTier={isCurrentTier(product.subscription_tier)}
                  onSubscribe={handleSubscribe}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoadingProducts && subscriptionProducts?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Crown className="mx-auto h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
            <p className="mt-4 text-lg text-muted-foreground">Тарифные планы временно недоступны</p>
          </motion.div>
        )}

        {/* Benefits Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Что входит в подписку?</h2>
            <p className="text-muted-foreground">Все преимущества для профессионального создания музыки</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <BenefitItem key={benefit.title} {...benefit} />
            ))}
          </div>
        </motion.section>

        {/* Trust indicators */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className={cn("inline-flex items-center gap-6 px-8 py-4 rounded-2xl", glass.card)}>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm">Безопасная оплата</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm">Мгновенная активация</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm">Отмена в любой момент</span>
            </div>
          </div>
        </motion.section>

        {/* Success Modal */}
        <PaymentSuccessModal
          isOpen={flowState.step === "success"}
          onClose={resetFlow}
          product={selectedProduct || undefined}
          language="ru"
        />
      </div>
    </div>
  );
}
