import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { PricingCard, type StarsProduct } from '@/components/payment/PricingCard';
import { TierComparisonCard } from '@/components/premium/TierComparisonCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Coins, Crown } from 'lucide-react';
import { motion } from '@/lib/motion';
import { logger } from '@/lib/logger';
import { SEOHead } from '@/components/SEOHead';

interface DBProduct {
  id: string;
  product_code: string;
  product_type: string;
  name: string;
  description: string | null;
  stars_price: number;
  credits_amount: number | null;
  subscription_days: number | null;
  features: unknown;
  is_popular: boolean | null;
  sort_order: number | null;
  status: string | null;
}

function mapToStarsProduct(p: DBProduct): StarsProduct {
  return {
    id: p.id,
    product_code: p.product_code,
    product_type: p.product_type as 'credit_package' | 'subscription',
    name: { ru: p.name, en: p.name },
    description: { ru: p.description || '', en: p.description || '' },
    stars_price: p.stars_price,
    credits_amount: p.credits_amount ?? undefined,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    is_featured: p.is_popular ?? false,
    status: p.status || 'active',
  };
}

export default function Pricing() {
  const { webApp, showAlert } = useTelegram();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const [purchasingProduct, setPurchasingProduct] = useState<string | null>(null);

  // Telegram BackButton — must be declared BEFORE any conditional return
  // to keep hooks order stable (was the cause of blank /pricing on mobile).
  useEffect(() => {
    if (webApp) {
      webApp.BackButton.show();
      const handler = () => window.history.back();
      webApp.BackButton.onClick(handler);
      return () => {
        webApp.BackButton.hide();
      };
    }
  }, [webApp]);

  // Fetch products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['stars-products'],
    queryFn: async (): Promise<StarsProduct[]> => {
      const { data, error } = await supabase
        .from('stars_products')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return ((data || []) as DBProduct[]).map(mapToStarsProduct);
    },
  });

  // Admin users don't need to purchase - redirect to home (after hooks)
  if (roleLoading) {
    return (
      <>
        <SEOHead
          title="Тарифы и кредиты"
          description="Цены и пакеты кредитов MusicVerse AI. Оплата через Telegram Stars. Подберите тариф под ваши задачи генерации музыки."
          canonical="https://aimusicverse.lovable.app/pricing"
        />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }



  // Filter products by type
  const creditPackages = products?.filter(p => p.product_type === 'credit_package') || [];
  const subscriptions = products?.filter(p => p.product_type === 'subscription') || [];

  const handlePurchase = async (productCode: string) => {
    if (!userId) {
      showAlert?.('Необходима авторизация через Telegram');
      return;
    }

    setPurchasingProduct(productCode);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        throw new Error('Не удалось получить токен авторизации');
      }

      // Tinkoff payment - карты, СБП, Tinkoff Pay (only RUB)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tinkoff-create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ productCode }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Не удалось создать платёж');
      }

      // Redirect to Tinkoff payment page
      window.location.href = result.paymentUrl;

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Purchase error', err, { productCode, userId });
      toast.error('Ошибка при создании платежа', {
        description: err.message || 'Попробуйте позже',
      });
      setPurchasingProduct(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-destructive mb-4">Ошибка загрузки продуктов</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['stars-products'] })}
          className="text-primary underline"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-20 px-4"
      style={{
        paddingTop: 'max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))',
      }}
    >
      <SEOHead
        title="Тарифы и кредиты"
        description="Цены и пакеты кредитов MusicVerse AI. Оплата через Telegram Stars. Подберите тариф под ваши задачи генерации музыки."
        canonical="https://aimusicverse.lovable.app/pricing"
      />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-8 text-center"
      >
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Магазин MusicVerse
        </h1>
        <p className="text-muted-foreground">
          Выберите пакет кредитов или подписку
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="credits" className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="credits" className="gap-2">
            <Coins className="w-4 h-4" />
            Кредиты
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <Crown className="w-4 h-4" />
            Подписки
          </TabsTrigger>
        </TabsList>

        {/* Credit Packages Tab */}
        <TabsContent value="credits" className="space-y-4">
          {creditPackages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет доступных пакетов кредитов
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creditPackages.map((product) => (
                <PricingCard
                  key={product.id}
                  product={product}
                  onPurchase={handlePurchase}
                  isPurchasing={purchasingProduct === product.product_code}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          {subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет доступных подписок
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {subscriptions.map((product) => (
                <PricingCard
                  key={product.id}
                  product={product}
                  onPurchase={handlePurchase}
                  isPurchasing={purchasingProduct === product.product_code}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Section - Payment Methods */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 p-6 bg-card rounded-lg border max-w-2xl mx-auto"
      >
        <h3 className="font-semibold mb-3">💳 Способы оплаты</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Банковские карты (Visa, Mastercard, МИР)</li>
          <li>• СБП (Система быстрых платежей)</li>
          <li>• Tinkoff Pay</li>
          <li>• Моментальное зачисление кредитов</li>
        </ul>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Все платежи защищены шифрованием и обрабатываются через Tinkoff — 
            один из крупнейших банков России. Мы не храним данные ваших карт.
          </p>
        </div>
      </motion.div>

      {/* Tier Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-6 bg-card rounded-lg border max-w-4xl mx-auto"
      >
        <h3 className="font-semibold mb-4 text-center">📊 Сравнение тарифов</h3>
        <TierComparisonCard highlightTier="pro" />
      </motion.div>
    </div>
  );
}