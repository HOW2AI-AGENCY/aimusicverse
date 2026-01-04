/**
 * Admin API Layer
 * Raw Supabase operations for admin functionality
 */

import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Types
// ==========================================

export interface UserBalanceSummary {
  total_users: number;
  total_balance: number;
  total_earned: number;
  total_spent: number;
  avg_balance: number;
  users_with_zero_balance: number;
  users_low_balance: number;
}

export interface BotMetrics {
  total_events: number;
  successful_events: number;
  failed_events: number;
  success_rate: number;
  avg_response_time_ms: number;
  events_by_type: Record<string, number>;
}

export interface UserWithBalance {
  user_id: string;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  level: number;
  experience: number;
  current_streak: number;
}

// ==========================================
// Admin Role Check
// ==========================================

/**
 * Check if user has admin role
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });
  
  if (error) throw new Error(error.message);
  return !!data;
}

/**
 * Get current user admin status
 */
export async function getCurrentUserAdminStatus(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, userId: null };
  
  const isAdmin = await checkAdminRole(user.id);
  return { isAdmin, userId: user.id };
}

// ==========================================
// User Balance Operations
// ==========================================

/**
 * Fetch user balance summary for admin dashboard
 */
export async function fetchUserBalanceSummary(): Promise<UserBalanceSummary | null> {
  const { data, error } = await supabase.rpc('get_user_balance_summary');
  if (error) throw new Error(error.message);
  return data?.[0] as UserBalanceSummary || null;
}

/**
 * Fetch users with their balances
 */
export async function fetchUsersWithBalances(options: {
  limit?: number;
  orderBy?: 'balance' | 'created_at';
}): Promise<UserWithBalance[]> {
  const { limit = 100, orderBy = 'created_at' } = options;

  // First get profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, username, first_name, last_name, photo_url, subscription_tier, subscription_expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (profilesError) throw new Error(profilesError.message);

  // Then get credits for these users
  const userIds = profiles?.map(p => p.user_id) || [];
  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('user_id, balance, total_earned, total_spent, level, experience, current_streak')
    .in('user_id', userIds);

  if (creditsError) throw new Error(creditsError.message);

  // Merge the data
  const mergedData = profiles?.map(profile => {
    const userCredits = credits?.find(c => c.user_id === profile.user_id);
    return {
      ...profile,
      balance: userCredits?.balance || 0,
      total_earned: userCredits?.total_earned || 0,
      total_spent: userCredits?.total_spent || 0,
      level: userCredits?.level || 1,
      experience: userCredits?.experience || 0,
      current_streak: userCredits?.current_streak || 0,
    };
  }) || [];

  // Sort by balance if needed
  if (orderBy === 'balance') {
    mergedData.sort((a, b) => b.balance - a.balance);
  }

  return mergedData;
}

// ==========================================
// Bot Metrics
// ==========================================

/**
 * Fetch Telegram bot metrics
 */
export async function fetchBotMetrics(period: string = '24 hours'): Promise<BotMetrics | null> {
  const { data, error } = await supabase.rpc('get_telegram_bot_metrics', {
    _time_period: period,
  });

  if (error) throw new Error(error.message);
  return (data?.[0] as BotMetrics) || null;
}

/**
 * Fetch recent bot metric events
 */
export async function fetchRecentBotEvents(limit: number = 50) {
  const { data, error } = await supabase
    .from('telegram_bot_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
