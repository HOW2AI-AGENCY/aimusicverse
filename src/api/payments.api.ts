/**
 * Payments API — credit transactions, Stars payments, subscriptions.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export async function insertCreditTransaction(data: {
  user_id: string;
  amount: number;
  type?: string;
  transaction_type?: string;
  action_type?: string;
  description?: string;
  admin_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("credit_transactions").insert(data as never);
  if (error) logger.error("Failed to insert credit transaction", { error: error.message });
  return { error };
}

export async function upsertUserCreditsBalance(data: {
  user_id: string;
  balance: number;
  total_earned?: number;
}) {
  const { error } = await supabase.from("user_credits").upsert(data as never, { onConflict: "user_id" });
  if (error) logger.error("Failed to upsert user credits balance", { error: error.message });
  return { error };
}

export async function updateUserCreditsBalance(userId: string, updates: { balance?: number; total_earned?: number }) {
  const { error } = await supabase.from("user_credits").update(updates as never).eq("user_id", userId);
  if (error) logger.error("Failed to update user credits balance", { error: error.message });
  return { error };
}

export async function upsertUserCredits(data: { user_id: string; balance: number }) {
  const { error } = await supabase.from("user_credits").upsert(data, { onConflict: "user_id" });
  if (error) logger.error("Failed to upsert user credits", { error: error.message });
  return { error };
}

export async function getUserCredits(userId: string) {
  const { data, error } = await supabase.from("user_credits").select("*").eq("user_id", userId).single();
  return { data, error };
}

export async function getStarsTransactions(options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 100;
  const query = supabase.from("stars_transactions").select("*").order("created_at", { ascending: false }).limit(limit);

  const { data, error } = await query;
  return { data, error };
}

export async function getStarsPaymentStats() {
  const { data, error } = await supabase.rpc("get_stars_payment_stats");
  return { data, error };
}
