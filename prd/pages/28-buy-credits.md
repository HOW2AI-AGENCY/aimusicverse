# Buy Credits Page

> **Route:** `/buy-credits`  
> **Module:** Payments  
> **Generated:** 2026-06-26

## Overview

Buy Credits Page allows users to purchase credits using Telegram Stars or direct payment methods. Features credit packages, pricing display, and payment processing integration.

**Primary Use Cases:**

- Purchase credit packages via Telegram Stars
- View pricing and package details
- Complete payment flow
- View transaction history

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER: Back + "Buy Credits"              │
├─────────────────────────────────────────┤
│ Credit Packages (Cards)                      │
│ ┌──────────────┬──────────────┬──────────┐  │
│ │ 50 Credits   │ 200 Credits  │ 500 Cr   │  │
│ │ ⭐ 75        │ ⭐ 299       │ ⭐ 699   │  │
│ │ [Buy Now]    │ [Buy Now]    │ [Buy Now] │  │
│ └──────────────┴──────────────┴──────────┘  │
├─────────────────────────────────────────┤
│ Pricing Information                        │
│ • Rate: ⭐ = 1.33 USD (varies by region)  │
│ • Bonus: +10% free credits on 200+       │
│ • Expiry: No expiry, use anytime          │
├─────────────────────────────────────────┤
│ Transaction History                         │
│ [View History]                              │
└─────────────────────────────────────────┘
```

## Fields

### Credit Package Cards

| Package | Stars | Credits | Bonus            | Notes        |
| ------- | ----- | ------- | ---------------- | ------------ |
| Small   | 75    | 50      | None             | Entry level  |
| Medium  | 299   | 200     | +10% (220 total) | Most popular |
| Large   | 699   | 500     | +10% (550 total) | Best value   |

### Payment Info

| Field  | Description                                         |
| ------ | --------------------------------------------------- |
| Rate   | Stars to USD conversion (varies by Telegram region) |
| Bonus  | Extra credits added on larger packages              |
| Expiry | Credits never expire, no time limit                 |
| Refund | 7-day refund window for unused purchases            |

---

## Interactions

### Purchase Credits

**Trigger:** Click "Buy Now" button

**Behavior:**

1. Open Telegram invoice payment flow:
   - Create invoice via Telegram Stars API
   - Display payment dialog
   - User confirms payment in Telegram
2. On success: Credits added to user balance
3. Show "Purchase successful!" toast
4. Refresh credit balance display

**API Calls:**

- `POST /api/payments/create-invoice` — Create Telegram Stars invoice
- `POST /api/credits/add` — Add credits to balance after payment

### View Transaction History

**Trigger:** Click "View History" link

**Behavior:**

1. Navigate to transaction history page
2. Display past purchases with:
   - Date/time
   - Package purchased
   - Amount paid
   - Credits received
   - Status (completed, refunded)

## API Dependencies

| API            | Method | Path                         | Trigger      |
| -------------- | ------ | ---------------------------- | ------------ |
| Get Packages   | GET    | /api/payments/packages       | Page load    | Available packages     |
| Create Invoice | POST   | /api/payments/create-invoice | Buy button   | Telegram Stars invoice |
| Get Balance    | GET    | /api/credits/balance         | Page load    | Current credit balance |
| Get History    | GET    | /api/payments/history        | History link | Transaction history    |

## Page Relationships

**From:** `/settings` → Click "Buy Credits" or subscription page
**To:** `/subscription` → View subscription options
**Back:** Previous page

## Business Rules

1. **Pricing:** Stars to USD rate varies by Telegram region
2. **Bonus:** Extra credits on larger packages (incentive for bulk purchase)
3. **Expiry:** Credits never expire (no time limit)
4. **Refund:** 7-day window for unused purchases (Telegram policy)
5. **Verification:** Payment verified via webhook before credits added

---
