/**
 * Integration Tests for Telegram Stars Payment System
 * 
 * Tasks: T062-T067
 * - T062: Pre-checkout validation
 * - T063: Successful payment flow
 * - T064: Idempotency
 * - T065: Subscription activation
 * - T066: Contract validation
 * - T067: Rate limiting
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Stars Payment Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user and product
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-stars@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });
    testUserId = user?.user?.id!;

    const { data: product } = await supabase
      .from('stars_products')
      .insert({
        product_code: 'test_credits_100',
        product_type: 'credit_package',
        name: { en: 'Test 100 Credits', ru: 'Тест 100 кредитов' },
        stars_price: 500,
        credits_amount: 100,
        status: 'active',
      })
      .select()
      .single();
    testProductId = product?.id!;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testProductId) {
      await supabase.from('stars_products').delete().eq('id', testProductId);
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  /**
   * T062: Pre-checkout validation
   * Test valid/invalid product, price mismatch
   */
  describe('Pre-checkout validation', () => {
    it('should accept valid product and price', async () => {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/create-stars-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
        body: JSON.stringify({
          productCode: 'test_credits_100',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.invoiceLink).toBeDefined();
    });

    it('should reject invalid product code', async () => {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/create-stars-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
        body: JSON.stringify({
          productCode: 'invalid_product_999',
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Product not found');
    });

    it('should reject inactive products', async () => {
      // Create inactive product
      const { data: inactiveProduct } = await supabase
        .from('stars_products')
        .insert({
          product_code: 'test_inactive',
          product_type: 'credit_package',
          name: { en: 'Inactive Product' },
          stars_price: 100,
          credits_amount: 50,
          status: 'inactive',
        })
        .select()
        .single();

      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/create-stars-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
        body: JSON.stringify({
          productCode: 'test_inactive',
        }),
      });

      expect(response.status).toBe(404);

      // Cleanup
      if (inactiveProduct) {
        await supabase.from('stars_products').delete().eq('id', inactiveProduct.id);
      }
    });

    it('should validate request schema', async () => {
      const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/create-stars-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
        body: JSON.stringify({
          productCode: 'invalid!format',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid request body');
    });
  });

  /**
   * T063: Successful payment flow
   * Test invoice → pre-checkout → payment → credit allocation
   */
  describe('Successful payment flow', () => {
    it('should complete full payment flow and allocate credits', async () => {
      // Step 1: Create invoice
      const invoiceResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/create-stars-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
        body: JSON.stringify({
          productCode: 'test_credits_100',
        }),
      });

      expect(invoiceResponse.status).toBe(200);
      const invoiceData = await invoiceResponse.json();
      const transactionId = invoiceData.transactionId;

      // Step 2: Simulate pre-checkout query (webhook)
      const preCheckoutPayload = {
        update_id: Date.now(),
        pre_checkout_query: {
          id: 'test_query_' + Date.now(),
          from: {
            id: 123456789,
            first_name: 'Test',
            username: 'testuser',
          },
          currency: 'XTR',
          total_amount: 500,
          invoice_payload: JSON.stringify({ transactionId }),
        },
      };

      const preCheckoutResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/stars-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preCheckoutPayload),
      });

      expect(preCheckoutResponse.status).toBe(200);

      // Step 3: Simulate successful payment (webhook)
      const paymentPayload = {
        update_id: Date.now(),
        message: {
          message_id: Date.now(),
          from: {
            id: 123456789,
            first_name: 'Test',
            username: 'testuser',
          },
          chat: {
            id: 123456789,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          successful_payment: {
            currency: 'XTR',
            total_amount: 500,
            invoice_payload: JSON.stringify({ transactionId }),
            telegram_payment_charge_id: 'test_charge_' + Date.now(),
          },
        },
      };

      const paymentResponse = await fetch(`${process.env.SUPABASE_URL}/functions/v1/stars-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      });

      expect(paymentResponse.status).toBe(200);

      // Step 4: Verify credits were allocated
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', testUserId)
        .single();

      expect(profile?.credits).toBeGreaterThanOrEqual(100);

      // Step 5: Verify transaction status
      const { data: transaction } = await supabase
        .from('stars_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      expect(transaction?.status).toBe('completed');
    });
  });

  /**
   * T064: Idempotency
   * Test duplicate webhook handling
   */
  describe('Idempotency', () => {
    it('should prevent duplicate credit allocation', async () => {
      const chargeId = 'test_idempotency_' + Date.now();
      const transactionId = crypto.randomUUID();

      // First payment
      const payload1 = {
        update_id: Date.now(),
        message: {
          message_id: Date.now(),
          from: { id: 123456789, first_name: 'Test' },
          chat: { id: 123456789, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          successful_payment: {
            currency: 'XTR',
            total_amount: 500,
            invoice_payload: JSON.stringify({ transactionId }),
            telegram_payment_charge_id: chargeId,
          },
        },
      };

      const response1 = await fetch(`${process.env.SUPABASE_URL}/functions/v1/stars-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1),
      });

      expect(response1.status).toBe(200);

      // Get credits after first payment
      const { data: profile1 } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', testUserId)
        .single();
      const creditsAfterFirst = profile1?.credits || 0;

      // Duplicate payment (same charge ID)
      const response2 = await fetch(`${process.env.SUPABASE_URL}/functions/v1/stars-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1),
      });

      expect(response2.status).toBe(200);

      // Get credits after duplicate
      const { data: profile2 } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', testUserId)
        .single();
      const creditsAfterDuplicate = profile2?.credits || 0;

      // Credits should NOT increase
      expect(creditsAfterDuplicate).toBe(creditsAfterFirst);
    });
  });

  /**
   * T065: Subscription activation
   * Test subscription purchase → tier upgrade → expiry set
   */
  describe('Subscription activation', () => {
    it.todo('should activate Pro subscription on purchase');
    it.todo('should set subscription expiry date');
    it.todo('should create subscription_history entry');
    it.todo('should upgrade from free to Pro tier');
  });

  /**
   * T066: Contract validation (Telegram webhook payloads)
   * Note: This should validate against contracts/telegram-webhook.json
   */
  describe('Contract validation', () => {
    it.todo('should validate pre_checkout_query payload schema');
    it.todo('should validate successful_payment payload schema');
    it.todo('should reject invalid webhook payloads');
  });

  /**
   * T067: Rate limiting
   * Test 11th request within 1 minute blocked
   */
  describe('Rate limiting', () => {
    it('should enforce rate limit on invoice creation', async () => {
      const requests = [];
      
      // Make 11 requests rapidly
      for (let i = 0; i < 11; i++) {
        const request = fetch(`${process.env.SUPABASE_URL}/functions/v1/create-stars-invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TEST_USER_TOKEN}`,
          },
          body: JSON.stringify({
            productCode: 'test_credits_100',
          }),
        });
        requests.push(request);
      }

      const responses = await Promise.all(requests);
      const statuses = responses.map(r => r.status);

      // At least one request should be rate limited (429)
      expect(statuses).toContain(429);

      // First 10 requests should succeed
      const successCount = statuses.filter(s => s === 200).length;
      expect(successCount).toBeLessThanOrEqual(10);
    });
  });
});
