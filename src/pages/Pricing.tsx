import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { PricingCard, type StarsProduct } from '@/components/payment/PricingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Star, Crown } from 'lucide-react';
import { motion } from '@/lib/motion';
import { logger } from '@/lib/logger';

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

  // Admin users don't need to purchase - redirect to home
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }
  useEffect(() => {
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        window.history.back();
      });

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
      // Call edge function to create invoice
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        throw new Error('Не удалось получить токен авторизации');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stars-invoice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            productCode,
            userId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Не удалось создать счёт');
      }

      const { invoiceLink } = result;

      // Open invoice using Telegram WebApp API
      if (webApp && 'openInvoice' in webApp) {
        (webApp as any).openInvoice(invoiceLink, (status: string) => {
          if (status === 'paid') {
            // Payment successful
            toast.success('Платёж успешно завершён!', {
              description: 'Кредиты начислены на ваш счёт',
              duration: 5000,
            });
            
            // Show celebration (you can add confetti here)
            if (webApp.HapticFeedback) {
              webApp.HapticFeedback.notificationOccurred('success');
            }
          } else if (status === 'failed') {
            toast.error('Платёж не прошёл', {
              description: 'Попробуйте ещё раз или выберите другой способ оплаты',
            });
            
            if (webApp.HapticFeedback) {
              webApp.HapticFeedback.notificationOccurred('error');
            }
          } else if (status === 'cancelled') {
            toast.info('Платёж отменён');
          }

          setPurchasingProduct(null);
        });
      } else {
        // Fallback: open link in external browser (shouldn't happen in Mini App)
        window.open(invoiceLink, '_blank');
        setPurchasingProduct(null);
      }
    } catch (error: any) {
      logger.error('Purchase error', error instanceof Error ? error : new Error(String(error)), {
        productCode,
        userId
      });
      toast.error('Ошибка при создании платежа', {
        description: error.message || 'Попробуйте позже',
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
    <div className="min-h-screen pb-20 px-4">
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
            <Star className="w-4 h-4" />
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

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 p-6 bg-card rounded-lg border max-w-2xl mx-auto"
      >
        <h3 className="font-semibold mb-3">💡 О Telegram Stars</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Telegram Stars - внутренняя валюта Telegram</li>
          <li>• Безопасные платежи без комиссий</li>
          <li>• Моментальное зачисление кредитов</li>
          <li>• Поддержка всех способов оплаты Telegram</li>
        </ul>
      </motion.div>
    </div>
  );
}