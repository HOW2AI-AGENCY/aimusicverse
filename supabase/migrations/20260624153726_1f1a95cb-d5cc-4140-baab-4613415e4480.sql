REVOKE SELECT (card_pan, card_exp_date) ON public.tinkoff_subscriptions FROM anon;
REVOKE SELECT (card_pan, card_exp_date) ON public.tinkoff_subscriptions FROM authenticated;
GRANT SELECT (card_pan, card_exp_date) ON public.tinkoff_subscriptions TO service_role;