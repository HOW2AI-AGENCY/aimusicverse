# Sprint 012: Monetization & Premium Features (High-Level Outline)

**Period**: 2026-02-09 - 2026-02-23 (2 недели)  
**Focus**: Credit system, subscription tiers, payment integration, premium features  
**Estimated Tasks**: 24-28 задач

---

## User Stories

### User Story 9: Credit System & Subscriptions (P1)
**Goal**: Implement monetization through credits and subscription tiers

**Key Features**:
- Credit-based generation system
- Multiple subscription tiers (Free, Pro, Premium, Enterprise)
- One-time credit purchases
- Credit packages with discounts
- Usage dashboard and history
- Auto-renewal management
- Payment method management

**Key Tasks** (14 tasks):
- [ ] T001 [P] Create credits table with balance and transaction history
- [ ] T002 [P] Create subscription_tiers table with features and pricing
- [ ] T003 [P] Create user_subscriptions table
- [ ] T004 [P] Create CreditsBalance component in src/components/billing/CreditsBalance.tsx
- [ ] T005 [P] Create SubscriptionPlans component with tier comparison
- [ ] T006 [P] Create PaymentDialog component
- [ ] T007 Database migration for billing system
- [ ] T008 [P] Integrate Stripe or Telegram Payments API
- [ ] T009 [P] Implement useCredits hook for balance and transactions
- [ ] T010 [P] Implement useSubscription hook for tier management
- [ ] T011 [P] Create webhook handlers for payment events
- [ ] T012 [P] Implement credit deduction logic in generation workflow
- [ ] T013 [P] Add usage limits enforcement (generations per day/month)
- [ ] T014 Add billing page to user settings

---

### User Story 10: Premium Feature Unlocks (P2)
**Goal**: Provide value-added features for paying users

**Key Features**:
- Advanced generation options (longer tracks, higher quality)
- Stem separation for premium users
- Priority generation queue
- Extended storage (more tracks)
- Commercial usage rights
- API access for automation
- Bulk generation capabilities
- Advanced analytics

**Key Tasks** (12 tasks):
- [ ] T015 [P] Create FeatureGate component for premium feature checks
- [ ] T016 [P] Implement PriorityQueue logic for generation
- [ ] T017 [P] Add premium options to GenerateWizard (extended duration, quality)
- [ ] T018 [P] Create CommercialLicense component for track downloads
- [ ] T019 [P] Create UsageAnalytics dashboard
- [ ] T020 [P] Implement API key generation for premium users
- [ ] T021 [P] Create APIDocumentation page
- [ ] T022 [P] Add storage quota enforcement
- [ ] T023 [P] Implement bulk generation UI
- [ ] T024 [P] Create premium badge/indicator throughout UI
- [ ] T025 Add subscription upsell prompts at feature gates
- [ ] T026 Implement trial period logic (7-day free trial)

---

## Subscription Tiers

| Feature | Free | Pro | Premium | Enterprise |
|---------|------|-----|---------|------------|
| Generations/month | 10 | 100 | 500 | Unlimited |
| Track duration | 2 min | 5 min | 10 min | Unlimited |
| Quality | Standard | High | Ultra | Ultra |
| Stem separation | ❌ | ✅ | ✅ | ✅ |
| Commercial use | ❌ | ✅ | ✅ | ✅ |
| Priority queue | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| Storage | 50 tracks | 500 tracks | 5000 tracks | Unlimited |
| Price/month | $0 | $19 | $49 | Custom |

---

## Database Schema Requirements

```sql
-- Credits
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'earned', 'spent', 'refund'
  description TEXT,
  reference_id TEXT, -- payment ID, generation ID, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tier TEXT NOT NULL, -- 'free', 'pro', 'premium', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'generation', 'stem_separation', 'api_call'
  credits_cost DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Payment Integration

### Stripe Integration
```typescript
// Payment flow
1. User selects subscription tier or credit package
2. Frontend creates checkout session via Supabase Edge Function
3. User completes payment on Stripe hosted page
4. Webhook receives payment confirmation
5. System updates user subscription/credits
6. User receives confirmation email
```

### Telegram Payments Integration
```typescript
// Alternative for Telegram Mini App users
1. User initiates payment in app
2. Telegram payment dialog opens
3. User completes payment via Telegram
4. Bot receives payment confirmation webhook
5. System updates user subscription/credits via API
```

---

## Technical Considerations

### Security
- Idempotent payment processing (prevent duplicate charges)
- Secure webhook signature verification
- PCI compliance (handled by Stripe/Telegram)
- Audit trail for all transactions

### Performance
- Cache subscription status for frequent checks
- Optimize credit balance queries
- Batch usage tracking inserts

### Compliance
- GDPR compliance for payment data
- Clear refund policy
- Terms of service for commercial use
- Invoice generation for business users

---

## Success Metrics

- Conversion rate (free → paid): > 5%
- Monthly Recurring Revenue (MRR): Track growth
- Average Revenue Per User (ARPU): Monitor trends
- Churn rate: < 5% monthly
- Trial-to-paid conversion: > 25%
- Credit purchase frequency: Track patterns

---

## Dependencies
- Stripe account or Telegram Payments approval
- Legal: Terms of Service, Refund Policy updates
- Email service for receipts and confirmations
- Tax calculation service (optional)

---

*Outline created: 2025-12-02*
