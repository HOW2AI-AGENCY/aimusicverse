/**
 * Unit tests for get_subscription_status() database function
 * Task: T039
 * 
 * Tests:
 * 1. Returns active subscription with correct expiry
 * 2. Returns free tier for users without subscription
 * 3. Returns correct days_remaining calculation
 * 4. Returns expired subscription as inactive
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

describe('get_subscription_status() function', () => {
  let supabase: SupabaseClient;
  let testUserId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: `test-sub-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    });
    testUserId = user.user!.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await supabase.from('subscription_history').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('should return free tier for user without subscription', async () => {
    const { data, error } = await supabase.rpc('get_subscription_status', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.has_subscription).toBe(false);
    expect(data.tier).toBe('free');
  });

  it('should return active subscription with correct details', async () => {
    // Create active subscription
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15); // 15 days from now

    await supabase
      .from('subscription_history')
      .insert({
        user_id: testUserId,
        tier: 'premium',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
      });

    const { data } = await supabase.rpc('get_subscription_status', {
      p_user_id: testUserId,
    });

    expect(data.has_subscription).toBe(true);
    expect(data.tier).toBe('premium');
    expect(data.expires_at).toBeDefined();
    expect(data.days_remaining).toBeGreaterThanOrEqual(14);
    expect(data.days_remaining).toBeLessThanOrEqual(15);
  });

  it('should calculate days_remaining correctly', async () => {
    // Update subscription to expire in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('subscription_history')
      .update({
        expires_at: expiresAt.toISOString(),
      })
      .eq('user_id', testUserId)
      .eq('status', 'active');

    const { data } = await supabase.rpc('get_subscription_status', {
      p_user_id: testUserId,
    });

    expect(data.days_remaining).toBeGreaterThanOrEqual(6);
    expect(data.days_remaining).toBeLessThanOrEqual(7);
  });

  it('should return free tier for expired subscription', async () => {
    // Create expired subscription
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() - 5); // 5 days ago

    await supabase
      .from('subscription_history')
      .delete()
      .eq('user_id', testUserId);

    await supabase
      .from('subscription_history')
      .insert({
        user_id: testUserId,
        tier: 'premium',
        starts_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: expiredAt.toISOString(),
        status: 'active',
      });

    const { data } = await supabase.rpc('get_subscription_status', {
      p_user_id: testUserId,
    });

    expect(data.has_subscription).toBe(false);
    expect(data.tier).toBe('free');
  });

  it('should return most recent subscription if multiple exist', async () => {
    // Create multiple subscriptions
    await supabase.from('subscription_history').delete().eq('user_id', testUserId);

    const now = new Date();
    
    // Old subscription (expired)
    await supabase
      .from('subscription_history')
      .insert({
        user_id: testUserId,
        tier: 'premium',
        starts_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'expired',
      });

    // Current subscription (active)
    const currentExpiry = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
    await supabase
      .from('subscription_history')
      .insert({
        user_id: testUserId,
        tier: 'premium',
        starts_at: now.toISOString(),
        expires_at: currentExpiry.toISOString(),
        status: 'active',
      });

    const { data } = await supabase.rpc('get_subscription_status', {
      p_user_id: testUserId,
    });

    expect(data.has_subscription).toBe(true);
    expect(data.tier).toBe('premium');
    expect(data.days_remaining).toBeGreaterThanOrEqual(19);
    expect(data.days_remaining).toBeLessThanOrEqual(20);
  });
});
