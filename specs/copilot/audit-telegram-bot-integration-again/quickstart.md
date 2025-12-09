# Quickstart Guide: Telegram Stars Payment Integration

**Audience**: Developers implementing or testing the Telegram Stars payment system  
**Estimated Time**: 30 minutes for basic testing  
**Prerequisites**: Node.js 18+, Telegram account, Bot created via @BotFather

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Local Development](#local-development)
3. [Testing Payments](#testing-payments)
4. [Debugging Common Issues](#debugging-common-issues)
5. [Deployment](#deployment)
6. [Admin Panel Access](#admin-panel-access)

---

## Environment Setup

### Step 1: Configure Telegram Bot for Payments

1. **Open @BotFather** in Telegram
2. Send `/mybots` → Select your bot → **Payments**
3. **Choose payment provider**:
   - Select "Use Telegram Stars" (recommended)
   - Token will be empty string `""` for Stars
4. **Copy bot token** (you'll need it for `.env`)

### Step 2: Set Environment Variables

Create `.env.local` in project root:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_PAYMENT_PROVIDER_TOKEN=""  # Empty for Stars
TELEGRAM_BOT_USERNAME=your_bot_username

# Supabase (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Feature flag (default: true)
ENABLE_STARS_PAYMENTS=true
```

**Security Note**: NEVER commit `.env.local` to Git!

### Step 3: Run Database Migrations

```bash
# Apply Stars payment schema
cd /home/runner/work/aimusicverse/aimusicverse
npx supabase db push

# Verify migrations applied
npx supabase db status
```

Expected output:
```
✅ stars_products table created
✅ stars_transactions table created
✅ subscription_history table created
✅ RLS policies enabled
```

### Step 4: Seed Initial Products

```bash
# Seed products (credit packages + subscriptions)
npx supabase db seed
```

Verify products in Supabase Studio:
```sql
SELECT sku, name, price_stars, is_active FROM stars_products;
```

Expected rows:
- `credits_50` (200 Stars)
- `credits_100` (500 Stars)
- `credits_300` (1200 Stars)
- `credits_1000` (3500 Stars)
- `sub_pro` (2000 Stars)
- `sub_premium` (6000 Stars)

---

## Local Development

### Step 5: Start Local Supabase

```bash
# Start Supabase containers
npx supabase start

# Output will show local URLs:
# API URL: http://localhost:54321
# Studio URL: http://localhost:54323
```

### Step 6: Deploy Edge Functions Locally

```bash
# Deploy all Edge Functions to local Supabase
npx supabase functions deploy stars-create-invoice --local
npx supabase functions deploy stars-webhook --local
npx supabase functions deploy stars-subscription-status --local
npx supabase functions deploy stars-admin-stats --local

# Verify deployment
npx supabase functions list
```

### Step 7: Start Frontend Dev Server

```bash
# Install dependencies (if not done)
npm install

# Start Vite dev server
npm run dev
```

Open browser: `http://localhost:5173`

---

## Testing Payments

### Test Environment Setup

Telegram provides a **test environment** for safe payment testing without real money.

#### Option 1: Use Telegram Test Bot

1. Create test bot via @BotFather (prefix name with "test_")
2. Set `TELEGRAM_BOT_TOKEN` to test bot token
3. Use test API endpoint: `https://api.telegram.org/bot<TEST_TOKEN>/`

#### Option 2: Manual Testing (Recommended)

**Prerequisites**:
- Telegram account
- Test payment cards (provided by Telegram)

### Test Case 1: Credit Package Purchase

1. **Open Mini App** in Telegram
2. Navigate to **"Buy Credits"** page
3. Select **"100 Credits Package"** (500 Stars)
4. Tap **"Buy Now"** button
5. **Invoice opens** in Telegram payment sheet
6. **Enter test card**: `4242 4242 4242 4242` (always succeeds)
7. **Confirm payment**
8. **Expected result**:
   - Payment successful notification
   - 100 credits added to balance
   - Transaction logged in database

**Verify in database**:
```sql
SELECT * FROM stars_transactions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC LIMIT 1;

-- Check credits allocated
SELECT balance FROM profiles WHERE user_id = 'YOUR_USER_ID';
```

### Test Case 2: Subscription Purchase

1. Navigate to **"Subscription"** page
2. Select **"Pro" tier** (2000 Stars)
3. Tap **"Subscribe"**
4. Complete payment with test card
5. **Expected result**:
   - Subscription activated
   - Tier changed to "pro"
   - Expiry date set to +30 days

**Verify**:
```sql
SELECT subscription_tier, subscription_expires_at 
FROM profiles 
WHERE user_id = 'YOUR_USER_ID';

-- Check subscription history
SELECT * FROM subscription_history 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Test Case 3: Failed Payment

1. Select any product
2. Use test card: `4000 0000 0000 0002` (always declines)
3. **Expected result**:
   - Payment declined error
   - NO credits allocated
   - Transaction marked as "failed" in database

### Test Case 4: Idempotency (Duplicate Webhook)

**Purpose**: Verify duplicate payment prevention

```bash
# Simulate duplicate webhook (requires curl)
curl -X POST http://localhost:54321/functions/v1/stars-webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: YOUR_SECRET" \
  -d '{
    "update_id": 123456,
    "message": {
      "successful_payment": {
        "telegram_payment_charge_id": "DUPLICATE_TEST_123",
        "currency": "XTR",
        "total_amount": 500,
        "invoice_payload": "{\"userId\":\"test-user\",\"productId\":\"credits_100\"}"
      }
    }
  }'

# Send SAME payload again
curl -X POST http://localhost:54321/functions/v1/stars-webhook \
  ... (same payload)

# Verify: Only 1 transaction in database, credits NOT doubled
```

### Test Case 5: Bot Command Testing

1. Open your bot in Telegram
2. Send `/buy` command
3. **Expected**: Multi-level menu with credit packages
4. Select "100 Credits"
5. **Expected**: Invoice sent to chat
6. Complete payment
7. **Expected**: Confirmation message with new balance

---

## Debugging Common Issues

### Issue 1: Invoice Not Opening

**Symptom**: "Buy Now" button does nothing

**Debug steps**:
```typescript
// Check console for errors
console.log(Telegram.WebApp.platform); // Should be "telegram"

// Test invoice creation API
const response = await fetch('/functions/v1/stars-create-invoice', {
  method: 'POST',
  body: JSON.stringify({ productId: 'credits_100', userId: 'YOUR_ID' })
});
console.log(await response.json()); // Check for errors
```

**Common causes**:
- Missing `TELEGRAM_PAYMENT_PROVIDER_TOKEN` (should be `""` for Stars)
- Bot not configured for payments in @BotFather
- Network timeout (check Supabase logs)

---

### Issue 2: Webhook Not Receiving Payments

**Symptom**: Payment completes in Telegram, but credits not allocated

**Debug steps**:
```bash
# Check webhook URL is set
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Expected output:
{
  "ok": true,
  "result": {
    "url": "https://your-project.supabase.co/functions/v1/stars-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}

# Check Edge Function logs
npx supabase functions logs stars-webhook --tail
```

**Common causes**:
- Webhook URL not set (run `telegram-webhook-setup` function)
- Edge Function not deployed (`npx supabase functions deploy`)
- Timeout (webhook must respond <30s)

---

### Issue 3: Credits Not Allocated

**Symptom**: Payment successful, but balance unchanged

**Debug steps**:
```sql
-- Check transaction status
SELECT * FROM stars_transactions 
WHERE telegram_charge_id = 'YOUR_CHARGE_ID';

-- Check credit_transactions log
SELECT * FROM credit_transactions 
WHERE stars_transaction_id = 'TRANSACTION_ID';

-- Check for database errors
SELECT * FROM stars_transactions 
WHERE status = 'failed'
ORDER BY created_at DESC LIMIT 10;
```

**Common causes**:
- Database transaction rolled back (check `failure_reason`)
- RLS policy preventing insert (check service role key)
- Product inactive (`is_active = false`)

---

### Issue 4: Duplicate Credit Allocation

**Symptom**: User receives credits twice for same payment

**Debug**:
```sql
-- Check for duplicate charge IDs
SELECT telegram_charge_id, COUNT(*) 
FROM stars_transactions 
GROUP BY telegram_charge_id 
HAVING COUNT(*) > 1;

-- Expected: 0 rows (UNIQUE constraint prevents duplicates)
```

**If duplicates found**:
- Check `process_stars_payment` function logic
- Verify UNIQUE index on `telegram_charge_id`
- Review Edge Function error handling

---

## Deployment

### Deploy to Production

1. **Set production environment variables** in Supabase Dashboard:
   ```
   Settings → Edge Functions → Secrets
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_PAYMENT_PROVIDER_TOKEN (empty for Stars)
   ```

2. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy stars-create-invoice --project-ref YOUR_PROJECT
   npx supabase functions deploy stars-webhook --project-ref YOUR_PROJECT
   npx supabase functions deploy stars-subscription-status --project-ref YOUR_PROJECT
   npx supabase functions deploy stars-admin-stats --project-ref YOUR_PROJECT
   ```

3. **Set Telegram webhook** to production URL:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://YOUR_PROJECT.supabase.co/functions/v1/stars-webhook" \
     -d "allowed_updates=[\"message\",\"pre_checkout_query\"]"
   ```

4. **Deploy frontend**:
   ```bash
   npm run build
   # Deploy dist/ to Vercel/Netlify/etc.
   ```

5. **Smoke test**:
   - Make 1 small purchase (credits_50)
   - Verify credits allocated
   - Check admin dashboard shows transaction

---

## Admin Panel Access

### Access Admin Dashboard

1. **Login as admin** in Mini App
2. Navigate to **Settings → Admin Panel → Payments**
3. **View**:
   - Total revenue (Stars + USD)
   - Transaction list (filterable)
   - Top-selling products
   - Active subscriptions count
   - Failed payment reasons

### Admin API Endpoints

**Get payment statistics**:
```bash
curl -X GET "https://YOUR_PROJECT.supabase.co/functions/v1/stars-admin-stats?from=2024-12-01&to=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get transaction list**:
```bash
curl -X GET "https://YOUR_PROJECT.supabase.co/functions/v1/stars-admin-transactions?page=1&perPage=50&status=completed" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Refund payment**:
```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/stars-admin-refund" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "123e4567-e89b-12d3-a456-426614174001",
    "reason": "User requested refund within 24 hours"
  }'
```

---

## Testing Checklist

Before deploying to production, verify:

- [ ] Invoice creation works in Mini App
- [ ] Invoice creation works in Bot
- [ ] Payment completes successfully (test card)
- [ ] Credits allocated correctly
- [ ] Transaction logged in database
- [ ] Subscription activated (for sub products)
- [ ] Failed payment handled gracefully
- [ ] Duplicate webhook prevented (idempotency)
- [ ] Admin dashboard shows transactions
- [ ] Refund works (admin only)
- [ ] Rate limiting active (10 purchases/hour)
- [ ] Error logging to Sentry

---

## Next Steps

✅ **Phase 1 Complete**: Data model, contracts, and quickstart ready  
🔄 **Phase 2**: Generate implementation tasks (run `/speckit.tasks`)  
🚀 **Phase 3**: Implement Edge Functions, React components, Bot handlers  
🧪 **Phase 4**: Integration testing and QA  
📦 **Phase 5**: Production deployment and monitoring  

---

## Support

**Questions?** Contact:
- Developer team: #payments-dev Slack channel
- Documentation: [TELEGRAM_PAYMENTS.md](../../../docs/TELEGRAM_PAYMENTS.md)
- Telegram Bot API docs: https://core.telegram.org/bots/payments
