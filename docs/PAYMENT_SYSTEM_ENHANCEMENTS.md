# Payment System Enhancement Specification

**Дата:** 2025-12-16  
**Приоритет:** P1 (Высокий)  
**Story Points:** 15 SP  
**Срок:** 2 недели

---

## 📋 Текущее состояние

### ✅ Что уже реализовано

**Payment Flow** (отлично):
- ✅ Invoice creation
- ✅ Pre-checkout validation
- ✅ Payment processing with idempotency
- ✅ Credit allocation
- ✅ Subscription management
- ✅ Telegram notifications
- ✅ Payment history
- ✅ Admin panel (stats, refunds)

**Architecture**:
```
Database:
├── stars_products (catalog)
├── stars_transactions (history)
└── subscription_history (subscriptions)

Edge Functions:
├── create-stars-invoice ✅
├── stars-webhook ✅
├── stars-subscription-check ✅
└── stars-admin-* ✅

Client:
├── starsPaymentService.ts ✅
├── useStarsPayment hook ✅
└── UI components ✅
```

### ⚠️ Что нужно улучшить

1. **Промо-коды** - нет системы скидок
2. **Bundled offers** - нет комплексных предложений
3. **Smart recommendations** - простые рекомендации
4. **Gift system** - не интегрированы Telegram Gifts
5. **A/B testing** - нет инструментов для тестирования цен
6. **Analytics** - ограниченная аналитика конверсий

---

## 🎯 Фаза 1: Promo Codes System (6 SP)

### Database Schema

```sql
-- =====================================================
-- Promo Codes System
-- =====================================================

-- Promo code types
CREATE TYPE promo_discount_type AS ENUM ('percentage', 'fixed_stars', 'fixed_credits');

-- Promo code status
CREATE TYPE promo_code_status AS ENUM ('active', 'expired', 'disabled', 'depleted');

-- Promo codes table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code
  code TEXT UNIQUE NOT NULL,
  
  -- Discount configuration
  discount_type promo_discount_type NOT NULL,
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  
  -- Applicability
  applicable_products UUID[], -- NULL = all products
  min_purchase_amount INTEGER, -- Minimum Stars required
  
  -- Limits
  max_uses INTEGER, -- NULL = unlimited
  max_uses_per_user INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Status
  status promo_code_status DEFAULT 'active',
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (discount_type = 'percentage' AND discount_value <= 100) OR
    (discount_type != 'percentage' AND discount_value > 0)
  )
);

-- Promo code usage tracking
CREATE TABLE promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES stars_transactions(id),
  
  -- Applied discount
  original_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL,
  final_amount INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(promo_code_id, user_id, transaction_id)
);

-- Indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_status ON promo_codes(status) WHERE status = 'active';
CREATE INDEX idx_promo_code_uses_user ON promo_code_uses(user_id);
CREATE INDEX idx_promo_code_uses_promo ON promo_code_uses(promo_code_id);

-- RLS Policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promo codes (for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (status = 'active');

-- Admins can manage promo codes
CREATE POLICY "Admins can manage promo codes"
  ON promo_codes FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE is_admin = true
    )
  );

-- Users can view their own usage
CREATE POLICY "Users can view own promo usage"
  ON promo_code_uses FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert usage
CREATE POLICY "Service role can insert promo usage"
  ON promo_code_uses FOR INSERT
  WITH CHECK (true);

-- Function to validate promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_product_id UUID,
  p_amount INTEGER
) RETURNS TABLE (
  valid BOOLEAN,
  promo_code_id UUID,
  discount_type TEXT,
  discount_value INTEGER,
  final_amount INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_uses_by_user INTEGER;
  v_discount INTEGER;
BEGIN
  -- Get promo code
  SELECT * INTO v_promo FROM promo_codes WHERE code = p_code;
  
  -- Check if code exists
  IF v_promo.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 'Промо-код не найден';
    RETURN;
  END IF;
  
  -- Check status
  IF v_promo.status != 'active' THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 'Промо-код неактивен';
    RETURN;
  END IF;
  
  -- Check validity period
  IF v_promo.valid_from > NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 'Промо-код еще не действует';
    RETURN;
  END IF;
  
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 'Промо-код истёк';
    RETURN;
  END IF;
  
  -- Check total uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 'Промо-код исчерпан';
    RETURN;
  END IF;
  
  -- Check uses per user
  SELECT COUNT(*) INTO v_uses_by_user
  FROM promo_code_uses
  WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
  
  IF v_promo.max_uses_per_user IS NOT NULL AND v_uses_by_user >= v_promo.max_uses_per_user THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 'Вы уже использовали этот промо-код';
    RETURN;
  END IF;
  
  -- Check product applicability
  IF v_promo.applicable_products IS NOT NULL AND NOT (p_product_id = ANY(v_promo.applicable_products)) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 'Промо-код не применим к этому товару';
    RETURN;
  END IF;
  
  -- Check minimum purchase
  IF v_promo.min_purchase_amount IS NOT NULL AND p_amount < v_promo.min_purchase_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, p_amount, 
      'Минимальная сумма покупки: ' || v_promo.min_purchase_amount || ' Stars';
    RETURN;
  END IF;
  
  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := (p_amount * v_promo.discount_value) / 100;
  ELSIF v_promo.discount_type = 'fixed_stars' THEN
    v_discount := v_promo.discount_value;
  ELSE
    v_discount := 0; -- For fixed_credits, discount applied post-purchase
  END IF;
  
  -- Ensure discount doesn't exceed amount
  IF v_discount > p_amount THEN
    v_discount := p_amount;
  END IF;
  
  -- Return success
  RETURN QUERY SELECT 
    true,
    v_promo.id,
    v_promo.discount_type::TEXT,
    v_promo.discount_value,
    p_amount - v_discount,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply promo code (called after successful payment)
CREATE OR REPLACE FUNCTION apply_promo_code(
  p_promo_code_id UUID,
  p_user_id UUID,
  p_transaction_id UUID,
  p_original_amount INTEGER,
  p_discount_amount INTEGER,
  p_final_amount INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  -- Insert usage record
  INSERT INTO promo_code_uses (
    promo_code_id,
    user_id,
    transaction_id,
    original_amount,
    discount_amount,
    final_amount
  ) VALUES (
    p_promo_code_id,
    p_user_id,
    p_transaction_id,
    p_original_amount,
    p_discount_amount,
    p_final_amount
  );
  
  -- Increment uses count
  UPDATE promo_codes
  SET 
    uses_count = uses_count + 1,
    updated_at = NOW()
  WHERE id = p_promo_code_id;
  
  -- Check if depleted
  UPDATE promo_codes
  SET status = 'depleted'
  WHERE id = p_promo_code_id
    AND max_uses IS NOT NULL
    AND uses_count >= max_uses
    AND status = 'active';
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Edge Function: validate-promo-code

```typescript
// supabase/functions/validate-promo-code/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('validate-promo-code');

interface ValidateRequest {
  code: string;
  productId: string;
  amount: number;
}

interface ValidateResponse {
  success: boolean;
  data?: {
    promoCodeId: string;
    discountType: string;
    discountValue: number;
    finalAmount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code, productId, amount }: ValidateRequest = await req.json();

    // Validate input
    if (!code || !productId || !amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Missing required fields' },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Validating promo code', { code, userId: user.id, productId, amount });

    // Call validation function
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code.toUpperCase(),
      p_user_id: user.id,
      p_product_id: productId,
      p_amount: amount,
    });

    if (error) {
      logger.error('Validation error', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.message },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = data[0];

    if (!result.valid) {
      logger.info('Invalid promo code', { code, reason: result.error_message });
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_PROMO', message: result.error_message },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Promo code validated', {
      code,
      discount: amount - result.final_amount,
      finalAmount: result.final_amount,
    });

    const response: ValidateResponse = {
      success: true,
      data: {
        promoCodeId: result.promo_code_id,
        discountType: result.discount_type,
        discountValue: result.discount_value,
        finalAmount: result.final_amount,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error('Unexpected error', { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Client Integration

```typescript
// src/services/promoCodeService.ts

import { supabase } from '@/integrations/supabase/client';

export interface PromoCodeValidation {
  promoCodeId: string;
  discountType: string;
  discountValue: number;
  finalAmount: number;
}

export async function validatePromoCode(
  code: string,
  productId: string,
  amount: number
): Promise<PromoCodeValidation> {
  const { data, error } = await supabase.functions.invoke('validate-promo-code', {
    body: { code, productId, amount },
  });

  if (error) {
    throw new Error(error.message || 'Failed to validate promo code');
  }

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data;
}
```

```typescript
// src/components/payments/PromoCodeInput.tsx

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validatePromoCode, PromoCodeValidation } from '@/services/promoCodeService';
import { cn } from '@/lib/utils';

interface PromoCodeInputProps {
  productId: string;
  originalAmount: number;
  onApply: (validation: PromoCodeValidation) => void;
  onRemove: () => void;
}

export function PromoCodeInput({
  productId,
  originalAmount,
  onApply,
  onRemove,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<PromoCodeValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const result = await validatePromoCode(code.toUpperCase(), productId, originalAmount);
      setValidation(result);
      onApply(result);
    } catch (err: any) {
      setError(err.message);
      setValidation(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setValidation(null);
    setError(null);
    onRemove();
  };

  const discount = validation ? originalAmount - validation.finalAmount : 0;

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Промо-код"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isValidating || !!validation}
            className={cn(
              validation && 'border-green-500',
              error && 'border-red-500'
            )}
          />
          {validation && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
          {error && (
            <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        
        {validation ? (
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={isValidating}
          >
            Удалить
          </Button>
        ) : (
          <Button
            onClick={handleApply}
            disabled={!code.trim() || isValidating}
          >
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Применить
          </Button>
        )}
      </div>

      {/* Validation Message */}
      {validation && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span>
            Промо-код применён! Скидка: {discount} ⭐
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <X className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🎁 Фаза 2: Product Bundles (4 SP)

### Database Schema

```sql
-- Product bundles
CREATE TABLE product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Bundle info
  name JSONB NOT NULL, -- { "en": "Starter Pack", "ru": "Стартовый набор" }
  description JSONB,
  
  -- Products in bundle
  product_ids UUID[] NOT NULL,
  
  -- Pricing
  bundle_price INTEGER NOT NULL CHECK (bundle_price > 0),
  regular_price INTEGER NOT NULL CHECK (regular_price > bundle_price),
  savings_percentage INTEGER GENERATED ALWAYS AS (
    ((regular_price - bundle_price) * 100) / regular_price
  ) STORED,
  
  -- Display
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  icon_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_bundles_status ON product_bundles(status) WHERE status = 'active';
CREATE INDEX idx_product_bundles_featured ON product_bundles(is_featured) WHERE is_featured = true;

-- RLS
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bundles"
  ON product_bundles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage bundles"
  ON product_bundles FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE is_admin = true)
  );

-- Function to get bundle details with products
CREATE OR REPLACE FUNCTION get_bundle_with_products(p_bundle_id UUID)
RETURNS TABLE (
  id UUID,
  name JSONB,
  description JSONB,
  bundle_price INTEGER,
  regular_price INTEGER,
  savings_percentage INTEGER,
  is_featured BOOLEAN,
  products JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.bundle_price,
    b.regular_price,
    b.savings_percentage,
    b.is_featured,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'product_code', p.product_code,
          'name', p.name,
          'stars_price', p.stars_price,
          'credits_amount', p.credits_amount
        )
      )
      FROM stars_products p
      WHERE p.id = ANY(b.product_ids)
    ) as products
  FROM product_bundles b
  WHERE b.id = p_bundle_id;
END;
$$ LANGUAGE plpgsql;
```

### UI Component

```typescript
// src/components/payments/BundleCard.tsx

import { StarsProduct } from '@/services/starsPaymentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface Bundle {
  id: string;
  name: string;
  description: string;
  bundlePrice: number;
  regularPrice: number;
  savingsPercentage: number;
  products: StarsProduct[];
  isFeatured: boolean;
}

interface BundleCardProps {
  bundle: Bundle;
  onPurchase: () => void;
  isLoading?: boolean;
}

export function BundleCard({ bundle, onPurchase, isLoading }: BundleCardProps) {
  return (
    <div className="relative rounded-lg border-2 border-primary/20 bg-card p-6 shadow-lg">
      {/* Featured Badge */}
      {bundle.isFeatured && (
        <Badge className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500">
          <Sparkles className="mr-1 h-3 w-3" />
          Выгодно
        </Badge>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold">{bundle.name}</h3>
        <p className="text-sm text-muted-foreground">{bundle.description}</p>
      </div>

      {/* Products */}
      <div className="mb-4 space-y-2">
        {bundle.products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
          >
            <span className="text-sm">{product.name}</span>
            <span className="text-sm font-medium">
              {product.credits_amount} кредитов
            </span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mb-4 rounded-lg bg-primary/10 p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-muted-foreground line-through">
              {bundle.regularPrice} ⭐
            </p>
            <p className="text-2xl font-bold text-primary">
              {bundle.bundlePrice} ⭐
            </p>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            -{bundle.savingsPercentage}%
          </Badge>
        </div>
      </div>

      {/* CTA */}
      <Button
        className="w-full"
        size="lg"
        onClick={onPurchase}
        disabled={isLoading}
      >
        {isLoading ? 'Оформление...' : 'Купить набор'}
      </Button>
    </div>
  );
}
```

---

## 🤖 Фаза 3: Smart Recommendations (3 SP)

### Analytics & ML

```sql
-- User usage analytics
CREATE TABLE user_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage stats (updated daily)
  total_generations INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,
  avg_generations_per_day NUMERIC(10, 2),
  days_active INTEGER DEFAULT 0,
  
  -- Patterns
  preferred_generation_time TIME, -- Most active time
  most_used_style TEXT,
  generation_frequency TEXT, -- 'low', 'medium', 'high', 'power_user'
  
  -- Recommendations
  recommended_package_code TEXT,
  recommended_package_reason TEXT,
  
  -- Last updated
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Function to calculate recommended package
CREATE OR REPLACE FUNCTION calculate_recommended_package(p_user_id UUID)
RETURNS TABLE (
  package_code TEXT,
  reason TEXT
) AS $$
DECLARE
  v_avg_gens_per_day NUMERIC;
  v_frequency TEXT;
  v_credits_balance INTEGER;
BEGIN
  -- Get user stats
  SELECT 
    avg_generations_per_day,
    generation_frequency
  INTO v_avg_gens_per_day, v_frequency
  FROM user_usage_analytics
  WHERE user_id = p_user_id;
  
  -- Get current credits
  SELECT credits_balance INTO v_credits_balance
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- Low usage: Small package
  IF v_avg_gens_per_day < 2 THEN
    RETURN QUERY SELECT 
      'credits_100'::TEXT,
      'На основе вашей активности рекомендуем небольшой пакет'::TEXT;
  
  -- Medium usage: Medium package
  ELSIF v_avg_gens_per_day < 5 THEN
    RETURN QUERY SELECT 
      'credits_500'::TEXT,
      'Оптимальный выбор для вашей активности'::TEXT;
  
  -- High usage: Large package or subscription
  ELSIF v_avg_gens_per_day < 10 THEN
    RETURN QUERY SELECT 
      'credits_1000'::TEXT,
      'Выгодный пакет для активных пользователей'::TEXT;
  
  -- Power user: Subscription
  ELSE
    RETURN QUERY SELECT 
      'sub_pro'::TEXT,
      'Безлимитная подписка для профессионалов'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### UI Integration

```typescript
// src/components/payments/SmartRecommendation.tsx

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { StarsProduct } from '@/services/starsPaymentService';
import { CreditPackageCard } from './CreditPackageCard';

interface SmartRecommendationProps {
  userId: string;
  onSelect: (product: StarsProduct) => void;
}

export function SmartRecommendation({ userId, onSelect }: SmartRecommendationProps) {
  const { data: recommendation } = useQuery({
    queryKey: ['payment-recommendation', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_recommended_package', {
        p_user_id: userId,
      });
      
      if (error) throw error;
      return data[0];
    },
  });

  const { data: product } = useQuery({
    queryKey: ['recommended-product', recommendation?.package_code],
    queryFn: async () => {
      if (!recommendation?.package_code) return null;
      
      const { data, error } = await supabase
        .from('stars_products')
        .select('*')
        .eq('product_code', recommendation.package_code)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!recommendation?.package_code,
  });

  if (!recommendation || !product) return null;

  return (
    <div className="space-y-4">
      <Alert className="border-primary/50 bg-primary/5">
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>{recommendation.reason}</AlertDescription>
      </Alert>

      <div className="rounded-lg border-2 border-primary">
        <CreditPackageCard
          product={product}
          onSelect={() => onSelect(product)}
          highlighted
        />
      </div>
    </div>
  );
}
```

---

## 📊 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Promo code usage rate | 0% | 15% |
| Bundle purchase rate | 0% | 25% |
| Recommendation CTR | N/A | 35% |
| Average order value | ~500 ⭐ | ~700 ⭐ |
| Repeat purchase rate | ~20% | ~40% |

---

## 🚀 Implementation Timeline

### Week 1: Promo Codes
- [ ] Day 1-2: Database migration + functions
- [ ] Day 3-4: Edge function + client service
- [ ] Day 5: UI components + integration

### Week 2: Bundles & Recommendations
- [ ] Day 1-2: Bundles database + UI
- [ ] Day 3-4: Smart recommendations
- [ ] Day 5: Testing + deployment

---

**Next Steps**: См. [PROJECT_IMPROVEMENT_PLAN_2025-12-16.md](./PROJECT_IMPROVEMENT_PLAN_2025-12-16.md) для полного плана реализации.
