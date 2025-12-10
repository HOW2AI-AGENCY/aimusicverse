-- Stars Products table for Telegram Stars payments
CREATE TABLE public.stars_products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_code text NOT NULL UNIQUE,
    product_type text NOT NULL DEFAULT 'credit_package',
    name text NOT NULL,
    description text,
    stars_price integer NOT NULL,
    credits_amount integer,
    subscription_days integer,
    features jsonb DEFAULT '[]'::jsonb,
    is_popular boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Stars Transactions table for payment history
CREATE TABLE public.stars_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    telegram_user_id bigint NOT NULL,
    product_code text NOT NULL,
    stars_amount integer NOT NULL,
    credits_granted integer,
    subscription_granted text,
    status text NOT NULL DEFAULT 'pending',
    telegram_payment_charge_id text,
    telegram_provider_charge_id text,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.stars_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stars_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stars_products (anyone can view active products)
CREATE POLICY "Anyone can view active products"
ON public.stars_products
FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can manage products"
ON public.stars_products
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for stars_transactions
CREATE POLICY "Users can view own transactions"
ON public.stars_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.stars_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.stars_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Stats function for admin dashboard
CREATE OR REPLACE FUNCTION public.get_stars_payment_stats()
RETURNS TABLE(
    total_transactions bigint,
    completed_transactions bigint,
    total_stars_collected bigint,
    total_credits_granted bigint,
    active_subscriptions bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COUNT(*)::bigint as total_transactions,
        COUNT(*) FILTER (WHERE status = 'completed')::bigint as completed_transactions,
        COALESCE(SUM(stars_amount) FILTER (WHERE status = 'completed'), 0)::bigint as total_stars_collected,
        COALESCE(SUM(credits_granted) FILTER (WHERE status = 'completed'), 0)::bigint as total_credits_granted,
        COUNT(*) FILTER (WHERE subscription_granted IS NOT NULL AND status = 'completed')::bigint as active_subscriptions
    FROM public.stars_transactions;
$$;

-- Create indexes
CREATE INDEX idx_stars_products_status ON public.stars_products(status);
CREATE INDEX idx_stars_products_sort_order ON public.stars_products(sort_order);
CREATE INDEX idx_stars_transactions_user_id ON public.stars_transactions(user_id);
CREATE INDEX idx_stars_transactions_status ON public.stars_transactions(status);
CREATE INDEX idx_stars_transactions_created_at ON public.stars_transactions(created_at DESC);