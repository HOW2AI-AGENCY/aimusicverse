# Telegram Stars Payment System Integration - Specification

**Feature**: Telegram Stars (XTR) payment integration for MusicVerse AI  
**Branch**: `copilot/audit-telegram-bot-integration-again`  
**Status**: ✅ Phase 0-1 COMPLETE (Ready for Phase 2 implementation)  
**Date**: 2025-12-09

---

## 📋 Executive Summary

This specification documents the complete design for integrating Telegram Stars payment system into MusicVerse AI, enabling users to purchase credits and subscriptions through Telegram's native in-app currency.

**Key Features**:
- 💳 Credit package purchases (50, 100, 300, 1000 credits)
- 🔄 Recurring subscriptions (Pro, Premium tiers)
- 🤖 Multi-level bot menu for package selection
- 🔒 Idempotent payment processing (duplicate prevention)
- 📊 Admin dashboard for payment analytics
- 🧪 Comprehensive testing strategy (test environment, automated tests)

**Expected Impact**:
- **Revenue**: Enable direct monetization through zero-fee Telegram Stars
- **User Experience**: Seamless 1-click payments (no form fill)
- **Retention**: Subscription model for predictable revenue
- **Scale**: Support 1,000+ transactions/day with <500ms latency

---

## 📁 Specification Files

| File | Lines | Purpose |
|------|-------|---------|
| [plan.md](./plan.md) | 596 | Master implementation plan with technical context, Constitution Check, roadmap |
| [research.md](./research.md) | 445 | Telegram Stars API research, idempotency patterns, testing strategy |
| [data-model.md](./data-model.md) | 761 | Database schema (3 new tables, 2 extended), functions, RLS policies |
| [quickstart.md](./quickstart.md) | 356 | Developer testing guide (environment setup → first payment in 30 min) |
| [contracts/telegram-webhook.json](./contracts/telegram-webhook.json) | 196 | Webhook payload schemas (pre_checkout_query, successful_payment) |
| [contracts/stars-invoice-api.json](./contracts/stars-invoice-api.json) | 272 | Invoice creation API contract (OpenAPI-style) |
| [contracts/admin-payments-api.json](./contracts/admin-payments-api.json) | 372 | Admin monitoring API contract (stats, transactions, refunds) |

**Total**: 2,998 lines | 110,461 characters

---

## 🎯 What This Specification Delivers

### Phase 0: Research ✅
- [x] Telegram Stars API mechanics and payment flow
- [x] Idempotency and security best practices
- [x] Subscription management patterns (recurring vs. time-based)
- [x] Testing strategy (test environment, test cards, automated tests)
- [x] Admin monitoring requirements
- [x] Technology decisions (Stars vs. Stripe, architecture patterns)
- [x] Alternative payment methods evaluated and rejected

### Phase 1: Design & Contracts ✅
- [x] **Database schema**: 3 new tables, 2 extended tables, 3 functions
- [x] **API contracts**: 3 JSON Schema files with request/response examples
- [x] **RLS policies**: User-scoped access with admin override
- [x] **Indexes**: 15+ performance-optimized indexes
- [x] **Migrations**: 3 reversible SQL scripts
- [x] **Quickstart guide**: 30-minute setup → first payment
- [x] **Agent context update**: GitHub Copilot instructions updated

### Phase 2: Implementation Tasks (Next Step)
Run `/speckit.tasks` to generate `tasks.md` with:
- Backend: 4 Edge Functions, 3 database migrations
- Frontend: 6 React components, 4 custom hooks, 1 service
- Testing: 10+ unit tests, 5+ integration tests, 3 contract tests
- Deployment: CI/CD updates, environment setup

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                       Telegram Ecosystem                         │
│  ┌──────────────┐        ┌──────────────┐                      │
│  │   Mini App   │        │   Bot API    │                      │
│  │ (React UI)   │◄──────►│  (Commands)  │                      │
│  └──────────────┘        └──────────────┘                      │
└───────────────────────┬──────────────┬──────────────────────────┘
                        │              │
                        ▼              ▼
         ┌──────────────────────────────────────────┐
         │       Supabase Edge Functions            │
         │  ┌────────────────┐  ┌────────────────┐ │
         │  │ stars-webhook  │  │ stars-invoice  │ │
         │  │ (pre-checkout, │  │ (create link)  │ │
         │  │  successful)   │  │                │ │
         │  └────────────────┘  └────────────────┘ │
         └─────────────────┬────────────────────────┘
                           │
                           ▼
         ┌──────────────────────────────────────────┐
         │         PostgreSQL 16 + RLS              │
         │  ┌────────────────┐  ┌────────────────┐ │
         │  │ stars_products │  │stars_txns      │ │
         │  │ stars_txns     │  │subscription_   │ │
         │  │ subscription_  │  │  history       │ │
         │  │   history      │  │                │ │
         │  └────────────────┘  └────────────────┘ │
         └──────────────────────────────────────────┘
```

### Payment Flow (5 Steps)

```
User Action → Invoice Creation → Pre-checkout Validation → 
Payment → Webhook Processing → Credit Allocation
  (30ms)        (300ms)              (100ms)           
            (Telegram)         (200ms)          (100ms)
                                               
Total: ~730ms (target <500ms p95)
```

---

## 💾 Database Schema Summary

### New Tables

| Table | Purpose | Rows (1 year) |
|-------|---------|---------------|
| `stars_products` | Product catalog (credits + subscriptions) | 6-10 products |
| `stars_transactions` | Payment transaction log | 365,000+ (1k/day) |
| `subscription_history` | Subscription lifecycle audit | 50,000+ (renewals) |

### Extended Tables

| Table | New Columns | Purpose |
|-------|-------------|---------|
| `credit_transactions` | `stars_transaction_id` | Link to Stars payment |
| `profiles` | `subscription_tier`, `subscription_expires_at`, `stars_subscription_id`, `auto_renew` | Subscription management |

### Database Functions

1. **`process_stars_payment()`**: Idempotent credit allocation + subscription activation
2. **`get_subscription_status()`**: Check user subscription tier and expiry
3. **`get_stars_payment_stats()`**: Admin analytics (revenue, top products, success rate)

---

## 🔐 Security & Compliance

### Constitution Compliance ✅

| Principle | Status | Evidence |
|-----------|--------|----------|
| **Test-First Development** | ✅ PASS | TDD approach documented, test cases defined in quickstart.md |
| **Security & Privacy** | ✅ PASS | Secrets in env vars, webhook validation, RLS policies, idempotency |
| **Observability** | ✅ PASS | Structured logging (ERROR/WARN/INFO), metrics (success rate, revenue) |
| **Incremental Delivery** | ✅ PASS | 3 reversible migrations, feature flag, non-breaking changes |
| **Architectural Simplicity** | ✅ PASS | Explicit contracts (3 JSON schemas), separation of concerns |
| **Performance** | ✅ PASS | Targets defined (<500ms p95), indexes optimized |
| **Telegram-first UX** | ✅ PASS | Native Stars integration, deep linking, bot commands |

### Security Features

- ✅ **Idempotency**: UNIQUE constraint on `telegram_charge_id` prevents duplicates
- ✅ **Webhook Validation**: Signature verification (X-Telegram-Bot-Api-Secret-Token)
- ✅ **Rate Limiting**: 10 purchases/hour per user
- ✅ **RLS Policies**: User-scoped access, admin override
- ✅ **Secrets Management**: Environment variables (Supabase Secrets)
- ✅ **SQL Injection Prevention**: Parameterized queries (Supabase SDK)

---

## 🧪 Testing Strategy

### Test Environment
- **Telegram Test Bot**: Separate bot for payment testing
- **Test Cards**: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)
- **Local Supabase**: Full stack testing on localhost

### Test Coverage

| Test Type | Count | Coverage |
|-----------|-------|----------|
| **Unit Tests** | 10+ | Database functions, validation logic, credit calculation |
| **Integration Tests** | 5+ | Payment flow, webhook handlers, Edge Functions |
| **Contract Tests** | 3 | JSON schema validation (webhooks, APIs) |
| **E2E Tests** | 3+ | Credit purchase, subscription, refund (optional) |

### Test Cases Documented
1. ✅ Successful credit purchase
2. ✅ Subscription activation
3. ✅ Failed payment handling
4. ✅ Idempotency (duplicate webhook)
5. ✅ Bot command flow

---

## 📊 Success Metrics

### Pre-Launch Validation
- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] Constitution Check: PASS ✓ (already verified)
- [ ] Security audit: PASS
- [ ] Performance: <500ms p95 payment processing
- [ ] Idempotency: 10,000+ duplicate webhooks tested

### Post-Launch KPIs (30 days)
- **Payment success rate**: Target >98%
- **Conversion rate**: Free → Paid (baseline TBD)
- **Subscription retention**: Churn <10%/month
- **ARPU**: $5-10/month average revenue per user
- **Support tickets**: Payment issues <5% of total

---

## 🚀 Implementation Roadmap

### Sprint Breakdown (6-8 weeks)

| Sprint | Duration | Deliverables |
|--------|----------|--------------|
| **Sprint 1: Database** | 5-7 days | Migrations, functions, seeds, tests |
| **Sprint 2: Webhooks** | 5-7 days | stars-webhook, stars-create-invoice, validation |
| **Sprint 3: Frontend** | 7-10 days | React components, hooks, pages |
| **Sprint 4: Bot** | 5-7 days | /buy, /subscribe commands, menus |
| **Sprint 5: Admin** | 5-7 days | stars-admin-stats, dashboard, refunds |
| **Sprint 6: Testing** | 7-10 days | E2E tests, stress testing, QA |
| **Sprint 7: Deployment** | 3-5 days | Production deploy, monitoring |

**Critical Path**: Database → Webhooks → Frontend (parallel with Bot)

---

## 📚 Key Documentation References

### Internal Docs
- [MusicVerse Constitution](../../../.specify/memory/constitution.md)
- [Database Schema](../../../docs/DATABASE.md)
- [Existing Payments Doc](../../../docs/TELEGRAM_PAYMENTS.md)
- [Telegram Bot Architecture](../../../docs/TELEGRAM_BOT_ARCHITECTURE.md)

### External Refs
- [Telegram Bot API - Payments](https://core.telegram.org/bots/payments)
- [Telegram Stars Docs](https://core.telegram.org/bots/payments#telegram-stars)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 👥 Team & Responsibilities

### Development Team
- **Backend Lead**: Edge Functions, database migrations, webhooks
- **Frontend Lead**: React components, hooks, payment UI
- **Bot Developer**: Telegram Bot commands, menu handlers
- **QA Engineer**: Test cases, E2E testing, idempotency validation

### Stakeholders
- **Product Manager**: Feature prioritization, pricing strategy
- **Legal/Compliance**: Terms of service, refund policy, tax handling
- **DevOps**: Deployment pipeline, monitoring, Sentry alerts

---

## ⚠️ Risks & Mitigation

### Top 3 Technical Risks

1. **Duplicate Credit Allocation** (Medium probability, Critical impact)
   - **Mitigation**: UNIQUE constraint + comprehensive idempotency tests

2. **Webhook Timeout >30s** (Low probability, High impact)
   - **Mitigation**: Async processing, performance monitoring, alerts

3. **Rate Limit Abuse** (Medium probability, Medium impact)
   - **Mitigation**: 10 purchases/hour limit, IP blocking, user education

---

## ✅ Next Steps

1. **Immediate**: Run `/speckit.tasks` to generate Phase 2 implementation tasks
2. **Week 1-2**: Database migrations + webhook handlers
3. **Week 3-4**: Frontend components + bot integration
4. **Week 5-6**: Admin panel + comprehensive testing
5. **Week 7-8**: Production deployment + monitoring

---

## 📝 Change Log

| Date | Phase | Changes |
|------|-------|---------|
| 2025-12-09 | Phase 0-1 | Initial specification complete (research, data model, contracts, quickstart) |
| TBD | Phase 2 | Implementation tasks generated |
| TBD | Phase 3-7 | Development, testing, deployment |

---

## 📞 Contact & Support

**Questions about this spec?**
- **Spec Author**: GitHub Copilot Agent
- **Project Lead**: [Your Name]
- **Slack Channel**: #payments-dev
- **Email**: dev@musicverse.ai

**Found an issue?** Create a ticket with label `payments:stars`

---

**Branch**: `copilot/audit-telegram-bot-integration-again`  
**Last Updated**: 2025-12-09  
**Status**: ✅ Ready for Implementation (Phase 2)
