/**
 * Credits API Layer
 * Raw Supabase database operations for user credits and gamification
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type UserCreditsRow = Database['public']['Tables']['user_credits']['Row'];
export type AchievementRow = Database['public']['Tables']['achievements']['Row'];
export type UserAchievementRow = Database['public']['Tables']['user_achievements']['Row'];
export type CreditTransactionRow = Database['public']['Tables']['credit_transactions']['Row'];

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  level: number;
  experience: number;
}

/**
 * Fetch user credits by user ID
 */
export async function fetchUserCredits(userId: string): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as UserCredits | null;
}

/**
 * Create or update user credits
 */
export async function upsertUserCredits(
  userId: string,
  updates: Partial<Omit<UserCredits, 'id' | 'user_id'>>
): Promise<UserCredits> {
  const { data: existing } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('user_credits')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as UserCredits;
  } else {
    const { data, error } = await supabase
      .from('user_credits')
      .insert({ user_id: userId, ...updates })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as UserCredits;
  }
}

/**
 * Add balance to user
 */
export async function addCredits(
  userId: string,
  amount: number,
  experienceAmount: number = 0
): Promise<UserCredits> {
  const current = await fetchUserCredits(userId);
  const newBalance = (current?.balance || 0) + amount;
  const newEarned = (current?.total_earned || 0) + amount;
  const newExperience = (current?.experience || 0) + experienceAmount;

  return upsertUserCredits(userId, {
    balance: newBalance,
    total_earned: newEarned,
    experience: newExperience,
  });
}

/**
 * Deduct balance from user
 */
export async function deductCredits(userId: string, amount: number): Promise<UserCredits> {
  const current = await fetchUserCredits(userId);
  if (!current || current.balance < amount) {
    throw new Error('Insufficient balance');
  }

  return upsertUserCredits(userId, {
    balance: current.balance - amount,
    total_spent: (current.total_spent || 0) + amount,
  });
}

/**
 * Log credit transaction
 */
export async function logCreditTransaction(
  userId: string,
  amount: number,
  transactionType: 'earn' | 'spend' | 'bonus',
  actionType: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    transaction_type: transactionType,
    action_type: actionType,
    description,
    metadata: metadata as unknown as Database['public']['Tables']['credit_transactions']['Insert']['metadata'],
  });

  if (error) throw new Error(error.message);
}

/**
 * Fetch credit transactions
 */
export async function fetchCreditTransactions(
  userId: string,
  limit: number = 20
): Promise<CreditTransactionRow[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Check if user is admin
 */
export async function checkAdminStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (error) return false;
  return !!data;
}

/**
 * Fetch all achievements
 */
export async function fetchAchievements(): Promise<AchievementRow[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('requirement_value', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch user's unlocked achievements
 */
export async function fetchUserAchievements(userId: string): Promise<(UserAchievementRow & { achievement: AchievementRow })[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievements(*)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as (UserAchievementRow & { achievement: AchievementRow })[];
}

/**
 * Fetch leaderboard
 */
export async function fetchLeaderboard(
  limit: number = 50,
  category: 'overall' | 'generators' | 'sharers' | 'popular' | 'listeners' = 'overall'
): Promise<unknown[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    _limit: limit,
    _category: category,
  });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Fetch Suno API balance (admin only)
 */
export async function fetchSunoApiBalance(): Promise<number> {
  const { data, error } = await supabase.functions.invoke('suno-credits');
  if (error) throw new Error(error.message);
  return data?.credits ?? 0;
}

/**
 * Check if user checked in today
 */
export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('user_checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .maybeSingle();

  return !!data;
}

/**
 * Record daily check-in
 */
export async function recordCheckin(
  userId: string,
  creditsEarned: number,
  streakDay: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase.from('user_checkins').insert({
    user_id: userId,
    checkin_date: today,
    credits_earned: creditsEarned,
    streak_day: streakDay,
  });

  if (error) throw new Error(error.message);
}
