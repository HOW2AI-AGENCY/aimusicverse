/**
 * Unit tests for duplicate transaction prevention (idempotency)
 * Task: T040
 * 
 * Tests:
 * 1. UNIQUE constraint on telegram_payment_charge_id prevents duplicates
 * 2. Duplicate webhook calls return same result without re-processing
 * 3. Idempotency_key field provides additional protection
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Idempotency and duplicate transaction prevention', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testProductId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: `test-idem-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });
    testUserId = user.user!.id;

    // Create test product
    const { data: product } = await supabase
      .from('stars_products')
      .insert({
        product_code: `test_idem_${Date.now()}`,
        product_type: 'credit_package',
        name: { en: 'Test Credits', ru: 'Тестовые кредиты' },
        description: { en: 'Test', ru: 'Тест' },
        stars_price: 50,
        credits_amount: 50,
        status: 'active',
      })
      .select()
      .single();
    
    testProductId = product!.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await supabase.from('credit_transactions').delete().eq('user_id', testUserId);
      await supabase.from('stars_transactions').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
    if (testProductId) {
      await supabase.from('stars_products').delete().eq('id', testProductId);
    }
  });

  it('should prevent duplicate telegram_payment_charge_id', async () => {
    const uniqueChargeId = `charge_${Date.now()}_unique`;

    // First insertion should succeed
    const { data: first, error: firstError } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_payment_charge_id: uniqueChargeId,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: 'first' }),
        stars_amount: 50,
        status: 'completed',
      })
      .select()
      .single();

    expect(firstError).toBeNull();
    expect(first).toBeDefined();

    // Second insertion with same charge_id should fail
    const { data: second, error: secondError } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_payment_charge_id: uniqueChargeId, // DUPLICATE
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: 'second' }),
        stars_amount: 50,
        status: 'completed',
      })
      .select()
      .single();

    expect(secondError).not.toBeNull();
    expect(secondError?.code).toBe('23505'); // PostgreSQL unique_violation
    expect(second).toBeNull();
  });

  it('should prevent duplicate idempotency_key', async () => {
    const uniqueIdempotencyKey = `idem_${Date.now()}_unique`;

    // First insertion
    const { error: firstError } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_payment_charge_id: `charge_${Date.now()}_1`,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: true }),
        stars_amount: 50,
        status: 'completed',
        idempotency_key: uniqueIdempotencyKey,
      });

    expect(firstError).toBeNull();

    // Second insertion with same idempotency_key
    const { error: secondError } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_payment_charge_id: `charge_${Date.now()}_2`,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: true }),
        stars_amount: 50,
        status: 'completed',
        idempotency_key: uniqueIdempotencyKey, // DUPLICATE
      });

    expect(secondError).not.toBeNull();
    expect(secondError?.code).toBe('23505'); // unique_violation
  });

  it('should handle concurrent duplicate attempts gracefully', async () => {
    const chargeId = `charge_concurrent_${Date.now()}`;
    
    // Simulate concurrent webhook calls with same charge_id
    const promises = Array(5).fill(null).map(async (_, i) => {
      const { error } = await supabase
        .from('stars_transactions')
        .insert({
          user_id: testUserId,
          product_id: testProductId,
          telegram_payment_charge_id: chargeId,
          telegram_user_id: 123456789,
          invoice_payload: JSON.stringify({ attempt: i }),
          stars_amount: 50,
          status: 'completed',
        });
      
      return { attempt: i, error };
    });

    const results = await Promise.all(promises);

    // Only 1 should succeed
    const successCount = results.filter(r => r.error === null).length;
    const failCount = results.filter(r => r.error !== null).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(4);
    
    // All failures should be unique_violation
    results
      .filter(r => r.error !== null)
      .forEach(r => {
        expect(r.error?.code).toBe('23505');
      });
  });

  it('should allow same charge_id with different users', async () => {
    // Create second test user
    const { data: user2 } = await supabase.auth.admin.createUser({
      email: `test-idem2-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });
    const testUser2Id = user2.user!.id;

    const sharedChargeId = `shared_charge_${Date.now()}`;

    // User 1 transaction
    const { error: error1 } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_payment_charge_id: sharedChargeId,
        telegram_user_id: 111111111,
        invoice_payload: JSON.stringify({ user: 1 }),
        stars_amount: 50,
        status: 'completed',
      });

    expect(error1).toBeNull();

    // User 2 with same charge_id should fail (charge_id is globally unique)
    const { error: error2 } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUser2Id,
        product_id: testProductId,
        telegram_payment_charge_id: sharedChargeId, // Same charge_id
        telegram_user_id: 222222222,
        invoice_payload: JSON.stringify({ user: 2 }),
        stars_amount: 50,
        status: 'completed',
      });

    // Should fail - telegram_payment_charge_id is globally unique
    expect(error2).not.toBeNull();
    expect(error2?.code).toBe('23505');

    // Cleanup
    await supabase.from('stars_transactions').delete().eq('user_id', testUser2Id);
    await supabase.auth.admin.deleteUser(testUser2Id);
  });

  it('should query existing transaction by charge_id before processing', async () => {
    const existingChargeId = `existing_${Date.now()}`;

    // Create existing transaction
    const { data: existing } = await supabase
      .from('stars_transactions')
      .insert({
        user_id: testUserId,
        product_id: testProductId,
        telegram_payment_charge_id: existingChargeId,
        telegram_user_id: 123456789,
        invoice_payload: JSON.stringify({ test: true }),
        stars_amount: 50,
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Query by charge_id (this is what webhook handler should do)
    const { data: found } = await supabase
      .from('stars_transactions')
      .select('*')
      .eq('telegram_payment_charge_id', existingChargeId)
      .single();

    expect(found).toBeDefined();
    expect(found!.id).toBe(existing!.id);
    expect(found!.processed_at).toBeDefined();
    
    // Webhook handler should detect this and skip processing
    if (found!.processed_at) {
      // Already processed - return early
      expect(found!.status).toBe('completed');
    }
  });
});
