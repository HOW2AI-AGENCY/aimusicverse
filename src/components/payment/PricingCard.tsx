import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StarsProduct {
  id: string;
  product_code: string;
  product_type: 'credit_package' | 'subscription';
  name: Record<string, string>;
  description: Record<string, string>;
  stars_price: number;
  credits_amount?: number;
  subscription_tier?: string;
  subscription_duration_days?: number;
  features: string[];
  is_featured: boolean;
  status: string;
}

interface PricingCardProps {
  product: StarsProduct;
  onPurchase: (productCode: string) => void;
  lang?: 'en' | 'ru';
  isPurchasing?: boolean;
  className?: string;
}

export function PricingCard({ 
  product, 
  onPurchase, 
  lang = 'ru',
  isPurchasing = false,
  className 
}: PricingCardProps) {
  const name = product.name[lang] || product.name['en'];
  const description = product.description[lang] || product.description['en'];
  
  const handlePurchase = () => {
    if (!isPurchasing) {
      onPurchase(product.product_code);
    }
  };

  const isSubscription = product.product_type === 'subscription';
  const isCreditPackage = product.product_type === 'credit_package';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={cn(
          "relative overflow-hidden transition-all",
          product.is_featured && "border-primary shadow-lg ring-2 ring-primary/20",
          className
        )}
      >
        {product.is_featured && (
          <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-xs font-semibold rounded-bl-lg">
            <Zap className="inline w-3 h-3 mr-1" />
            Популярно
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">{name}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{product.stars_price}</span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-lg font-semibold">Stars</span>
              </div>
            </div>
            {isSubscription && (
              <p className="text-sm text-muted-foreground mt-1">в месяц</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Product-specific info */}
          {isCreditPackage && product.credits_amount && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Кредитов</span>
                <span className="text-2xl font-bold text-primary">
                  {product.credits_amount}
                </span>
              </div>
            </div>
          )}

          {isSubscription && product.subscription_tier && (
            <div className="mb-4">
              <Badge variant="secondary" className="mb-2">
                {product.subscription_tier.toUpperCase()}
              </Badge>
              {product.subscription_duration_days && (
                <p className="text-sm text-muted-foreground">
                  {product.subscription_duration_days} дней
                </p>
              )}
            </div>
          )}

          {/* Features list */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-2 mt-4">
              {product.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handlePurchase}
            disabled={isPurchasing}
            className={cn(
              "w-full",
              product.is_featured && "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            )}
            size="lg"
          >
            {isPurchasing ? (
              <>
                <span className="animate-pulse">Обработка...</span>
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2 fill-current" />
                Купить за {product.stars_price} Stars
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
