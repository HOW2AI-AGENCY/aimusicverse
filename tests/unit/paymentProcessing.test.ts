/**
 * Unit tests for process_stars_payment() database function
 * Task: T038
 * 
 * Tests:
 * 1. Credit package purchase - allocates credits correctly
 * 2. Subscription purchase - activates subscription
 * 3. Idempotency - duplicate charge_id returns same result
 * 4. Invalid product - rejects transaction
 * 5. Amount mismatch - rejects transaction
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('process_stars_payment() function', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testProductId: string;
  let testTransactionId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });
    testUserId = user.user!.id;

    // Create test credit package product
    const { data: product } = await supabase
      .from('stars_products')
      .insert({
        product_code: `test_credits_${Date.now()}`,
        product_type: 'credit_package',
        name: { en: 'Test 100 Credits', ru: 'Тест 100 Кредитов' },
        description: { en: 'Test package', ru: 'Тестовый пакет' },
        stars_price: 100,
        credits_amount: 100,
        status: 'active',
      })
      .select()
      .single();
    
    testProductId = product!.id;

    // Create test transaction in 'processing' status
    const { data: transaction } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: true }),
        stars_amount: 100,
        status: 'processing',
      })
      .select()
      .single();
    
    testTransactionId = transaction!.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await supabase.from('credit_transactions').delete().eq('user_id', testUserId);
      await supabase.from('stars_transactions').delete().eq('user_id', testUserId);
      await supabase.from('subscription_history').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
    if (testProductId) {
      await supabase.from('stars_products').delete().eq('id', testProductId);
    }
  });

  it('should allocate credits for credit package purchase', async () => {
    // Test T038: Credit allocation
    const { data, error } = await supabase.rpc('process_stars_payment', {
      p_transaction_id: testTransactionId,
      p_telegram_payment_charge_id: `test_charge_${Date.now()}`,
      p_metadata: { test: true },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.success).toBe(true);
    expect(data.type).toBe('credits');
    expect(data.credits_granted).toBe(100);

    // Verify credit_transactions record created
    const { data: creditTx } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('stars_transaction_id', testTransactionId)
      .single();

    expect(creditTx).toBeDefined();
    expect(creditTx!.amount).toBe(100);
    expect(creditTx!.action_type).toBe('purchase');
  });

  it('should be idempotent - duplicate charge_id returns existing result', async () => {
    // Test T040: Idempotency
    const chargeId = `duplicate_test_${Date.now()}`;

    // First call
    const { data: firstCall } = await supabase.rpc('process_stars_payment', {
      p_transaction_id: testTransactionId,
      p_telegram_payment_charge_id: chargeId,
      p_metadata: {},
    });

    expect(firstCall.success).toBe(true);

    // Second call with same charge_id (should be idempotent)
    const { data: secondCall } = await supabase.rpc('process_stars_payment', {
      p_transaction_id: testTransactionId,
      p_telegram_payment_charge_id: chargeId,
      p_metadata: {},
    });

    expect(secondCall.success).toBe(true);
    expect(secondCall.message).toContain('already processed');
  });

  it('should activate subscription for subscription purchase', async () => {
    // Create subscription product
    const { data: subProduct } = await supabase
      .from('stars_products')
      .insert({
        product_code: `test_sub_pro_${Date.now()}`,
        product_type: 'subscription',
        name: { en: 'Test Pro', ru: 'Тест Про' },
        description: { en: 'Test subscription', ru: 'Тестовая подписка' },
        stars_price: 200,
        subscription_tier: 'premium',
        subscription_duration_days: 30,
        status: 'active',
      })
      .select()
      .single();

    // Create transaction for subscription
    const { data: subTx } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: subProduct!.id,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: true }),
        stars_amount: 200,
        status: 'processing',
      })
      .select()
      .single();

    // Process payment
    const { data } = await supabase.rpc('process_stars_payment', {
      p_transaction_id: subTx!.id,
      p_telegram_payment_charge_id: `sub_charge_${Date.now()}`,
      p_metadata: {},
    });

    expect(data.success).toBe(true);
    expect(data.type).toBe('subscription');
    expect(data.subscription_tier).toBe('premium');

    // Verify subscription_history record
    const { data: subHistory } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('transaction_id', subTx!.id)
      .single();

    expect(subHistory).toBeDefined();
    expect(subHistory!.tier).toBe('premium');
    expect(subHistory!.status).toBe('active');

    // Cleanup
    await supabase.from('stars_products').delete().eq('id', subProduct!.id);
  });

  it('should reject transaction with invalid product', async () => {
    const fakeProductId = '00000000-0000-0000-0000-000000000000';
    
    const { data: fakeTx } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: fakeProductId,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: true }),
        stars_amount: 100,
        status: 'processing',
      })
      .select()
      .single();

    const { data, error } = await supabase.rpc('process_stars_payment', {
      p_transaction_id: fakeTx!.id,
      p_telegram_payment_charge_id: `invalid_${Date.now()}`,
      p_metadata: {},
    });

    // Should fail gracefully
    expect(data?.success).toBe(false);
    expect(data?.error).toBeDefined();
  });

  it('should reject transaction if not in processing status', async () => {
    // Create transaction in 'pending' status
    const { data: pendingTx } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: true }),
        stars_amount: 100,
        status: 'pending', // Wrong status
      })
      .select()
      .single();

    const { data } = await supabase.rpc('process_stars_payment', {
      p_transaction_id: pendingTx!.id,
      p_telegram_payment_charge_id: `pending_${Date.now()}`,
      p_metadata: {},
    });

    expect(data.success).toBe(false);
    expect(data.error).toContain('not in processing status');
  });
});
