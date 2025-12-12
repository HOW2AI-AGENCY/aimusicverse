/**
 * Unit tests for Row Level Security (RLS) policies
 * Task: T041
 * 
 * Tests:
 * 1. stars_products: Anyone can view active products
 * 2. stars_products: Only admins can manage products
 * 3. stars_transactions: Users can only view own transactions
 * 4. stars_transactions: Admins can view all transactions
 * 5. subscription_history: Users can only view own subscriptions
 * 6. Service role bypasses RLS
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('Row Level Security (RLS) policies', () => {
  let supabaseAdmin: SupabaseClient;
  let supabaseUser1: SupabaseClient;
  let supabaseUser2: SupabaseClient;
  let supabaseAdmin User: SupabaseClient;
  
  let user1Id: string;
  let user2Id: string;
  let adminUserId: string;
  let testProductId: string;
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
    
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create test users
    const { data: user1 } = await supabaseAdmin.auth.admin.createUser({
      email: `test-rls-user1-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });
    user1Id = user1.user!.id;

    const { data: user2 } = await supabaseAdmin.auth.admin.createUser({
      email: `test-rls-user2-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });
    user2Id = user2.user!.id;

    // Create admin user
    const { data: adminUser } = await supabaseAdmin.auth.admin.createUser({
      email: `test-rls-admin-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });
    adminUserId = adminUser.user!.id;

    // Set admin role
    await supabaseAdmin
      .from('profiles')
      .update({ is_admin: true })
      .eq('user_id', adminUserId);

    // Create authenticated clients for each user
    const { data: session1 } = await supabaseAdmin.auth.signInWithPassword({
      email: `test-rls-user1-${Date.now()}@example.com`,
      password: 'testpassword123',
    });
    user1Token = session1.session!.access_token;
    supabaseUser1 = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${user1Token}` } },
    });

    const { data: session2 } = await supabaseAdmin.auth.signInWithPassword({
      email: `test-rls-user2-${Date.now()}@example.com`,
      password: 'testpassword123',
    });
    user2Token = session2.session!.access_token;
    supabaseUser2 = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${user2Token}` } },
    });

    const { data: adminSession } = await supabaseAdmin.auth.signInWithPassword({
      email: `test-rls-admin-${Date.now()}@example.com`,
      password: 'testpassword123',
    });
    adminToken = adminSession.session!.access_token;
    supabaseAdminUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    // Create test product
    const { data: product } = await supabaseAdmin
      .from('stars_products')
      .insert({
        product_code: `test_rls_${Date.now()}`,
        product_type: 'credit_package',
        name: { en: 'Test Product', ru: 'Тестовый продукт' },
        description: { en: 'Test', ru: 'Тест' },
        stars_price: 100,
        credits_amount: 100,
        status: 'active',
      })
      .select()
      .single();
    
    testProductId = product!.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabaseAdmin.from('credit_transactions').delete().eq('user_id', user1Id);
    await supabaseAdmin.from('credit_transactions').delete().eq('user_id', user2Id);
    await supabaseAdmin.from('stars_transactions').delete().eq('user_id', user1Id);
    await supabaseAdmin.from('stars_transactions').delete().eq('user_id', user2Id);
    await supabaseAdmin.from('subscription_history').delete().eq('user_id', user1Id);
    await supabaseAdmin.from('subscription_history').delete().eq('user_id', user2Id);
    await supabaseAdmin.from('stars_products').delete().eq('id', testProductId);
    await supabaseAdmin.auth.admin.deleteUser(user1Id);
    await supabaseAdmin.auth.admin.deleteUser(user2Id);
    await supabaseAdmin.auth.admin.deleteUser(adminUserId);
  });

  describe('stars_products RLS', () => {
    it('should allow anyone to view active products', async () => {
      const { data, error } = await supabaseUser1
        .from('stars_products')
        .select('*')
        .eq('status', 'active');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should prevent non-admin from creating products', async () => {
      const { error } = await supabaseUser1
        .from('stars_products')
        .insert({
          product_code: `unauthorized_${Date.now()}`,
          product_type: 'credit_package',
          name: { en: 'Unauthorized', ru: 'Неавторизованный' },
          description: { en: 'Test', ru: 'Тест' },
          stars_price: 50,
          credits_amount: 50,
          status: 'active',
        });

      expect(error).not.toBeNull();
      // RLS policy should block this
    });

    it('should allow admin to create products', async () => {
      const { data, error } = await supabaseAdminUser
        .from('stars_products')
        .insert({
          product_code: `admin_created_${Date.now()}`,
          product_type: 'credit_package',
          name: { en: 'Admin Created', ru: 'Создано админом' },
          description: { en: 'Test', ru: 'Тест' },
          stars_price: 75,
          credits_amount: 75,
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Cleanup
      await supabaseAdmin.from('stars_products').delete().eq('id', data!.id);
    });
  });

  describe('stars_transactions RLS', () => {
    let user1TransactionId: string;
    let user2TransactionId: string;

    beforeAll(async () => {
      // Create transactions for both users
      const { data: tx1 } = await supabaseAdmin
        .from('stars_transactions')
        .insert({
          user_id: user1Id,
          product_id: testProductId,
          telegram_user_id: 111111111,
          invoice_payload: JSON.stringify({ user: 1 }),
          stars_amount: 100,
          status: 'completed',
        })
        .select()
        .single();
      user1TransactionId = tx1!.id;

      const { data: tx2 } = await supabaseAdmin
        .from('stars_transactions')
        .insert({
          user_id: user2Id,
          product_id: testProductId,
          telegram_user_id: 222222222,
          invoice_payload: JSON.stringify({ user: 2 }),
          stars_amount: 100,
          status: 'completed',
        })
        .select()
        .single();
      user2TransactionId = tx2!.id;
    });

    it('should allow user to view own transactions', async () => {
      const { data, error } = await supabaseUser1
        .from('stars_transactions')
        .select('*')
        .eq('id', user1TransactionId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
      expect(data![0].user_id).toBe(user1Id);
    });

    it('should prevent user from viewing other users transactions', async () => {
      const { data, error } = await supabaseUser1
        .from('stars_transactions')
        .select('*')
        .eq('id', user2TransactionId); // User2's transaction

      // RLS should filter this out
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(0); // Should be empty
    });

    it('should allow admin to view all transactions', async () => {
      const { data, error } = await supabaseAdminUser
        .from('stars_transactions')
        .select('*')
        .in('id', [user1TransactionId, user2TransactionId]);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(2);
    });
  });

  describe('subscription_history RLS', () => {
    let user1SubId: string;
    let user2SubId: string;

    beforeAll(async () => {
      // Create subscriptions for both users
      const { data: sub1 } = await supabaseAdmin
        .from('subscription_history')
        .insert({
          user_id: user1Id,
          tier: 'premium',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        })
        .select()
        .single();
      user1SubId = sub1!.id;

      const { data: sub2 } = await supabaseAdmin
        .from('subscription_history')
        .insert({
          user_id: user2Id,
          tier: 'premium',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        })
        .select()
        .single();
      user2SubId = sub2!.id;
    });

    it('should allow user to view own subscription history', async () => {
      const { data, error } = await supabaseUser1
        .from('subscription_history')
        .select('*')
        .eq('id', user1SubId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(1);
      expect(data![0].user_id).toBe(user1Id);
    });

    it('should prevent user from viewing other users subscriptions', async () => {
      const { data, error } = await supabaseUser1
        .from('subscription_history')
        .select('*')
        .eq('id', user2SubId);

      expect(error).toBeNull();
      expect(data!.length).toBe(0); // RLS filters it out
    });

    it('should allow admin to view all subscriptions', async () => {
      const { data, error } = await supabaseAdminUser
        .from('subscription_history')
        .select('*')
        .in('id', [user1SubId, user2SubId]);

      expect(error).toBeNull();
      expect(data!.length).toBe(2);
    });
  });

  describe('Service role bypass', () => {
    it('should allow service role to bypass RLS', async () => {
      // Service role client (admin) can read all
      const { data: allTransactions } = await supabaseAdmin
        .from('stars_transactions')
        .select('*');

      expect(allTransactions).toBeDefined();
      expect(allTransactions!.length).toBeGreaterThanOrEqual(2);

      const { data: allSubs } = await supabaseAdmin
        .from('subscription_history')
        .select('*');

      expect(allSubs).toBeDefined();
      expect(allSubs!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
