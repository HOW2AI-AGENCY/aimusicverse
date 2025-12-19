/**
 * Reward Purchase Edge Function
 * Handles XP and achievement rewards for purchases
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Economy constants (must match frontend)
const ECONOMY = {
  PURCHASE_XP_PER_100_STARS: 10,
  SUBSCRIPTION_XP_BONUS: 50,
  FIRST_PURCHASE_BONUS_CREDITS: 25,
  REFERRAL_PERCENT: 10,
  CREDITS_PER_STAR: 2,
};

interface RewardRequest {
  userId: string;
  transactionId: string;
  starsAmount: number;
  productType: 'credit_package' | 'subscription';
  productCode: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, transactionId, starsAmount, productType, productCode } = 
      await req.json() as RewardRequest;

    console.log('Processing purchase reward:', { userId, transactionId, starsAmount, productType });

    // Get user's current credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (creditsError && creditsError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user credits: ${creditsError.message}`);
    }

    // Calculate XP reward
    let xpReward = Math.floor(starsAmount / 100) * ECONOMY.PURCHASE_XP_PER_100_STARS;
    if (productType === 'subscription') {
      xpReward += ECONOMY.SUBSCRIPTION_XP_BONUS;
    }

    // Check if first purchase
    const { count: purchaseCount } = await supabase
      .from('stars_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    const isFirstPurchase = (purchaseCount || 0) === 1;
    let bonusCredits = 0;

    if (isFirstPurchase) {
      bonusCredits = ECONOMY.FIRST_PURCHASE_BONUS_CREDITS;
      xpReward += 50; // Extra XP for first purchase
    }

    // Update user credits with XP and bonus
    const currentExp = userCredits?.experience || 0;
    const newExp = currentExp + xpReward;
    const newLevel = Math.max(1, Math.floor(Math.sqrt(newExp / 100)) + 1);

    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: (userCredits?.balance || 0) + bonusCredits,
        total_earned: (userCredits?.total_earned || 0) + bonusCredits,
        experience: newExp,
        level: newLevel,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error('Failed to update user credits:', updateError);
    }

    // Log bonus credit transaction if applicable
    if (bonusCredits > 0) {
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: bonusCredits,
          transaction_type: 'earn',
          action_type: 'first_purchase_bonus',
          description: 'Бонус за первую покупку',
          metadata: { transaction_id: transactionId, stars_amount: starsAmount },
        });
    }

    // Check and grant achievements
    const achievementsToCheck = [
      { code: 'first_purchase', type: 'purchases', value: 1 },
      { code: 'big_spender', type: 'stars_spent', value: starsAmount },
    ];

    if (productType === 'subscription') {
      achievementsToCheck.push({ code: 'subscriber', type: 'subscription', value: 1 });
      if (productCode === 'sub_enterprise') {
        achievementsToCheck.push({ code: 'vip_member', type: 'subscription_tier', value: 1 });
      }
    }

    // Get user's total stars spent
    const { data: totalSpent } = await supabase
      .from('stars_transactions')
      .select('stars_amount')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalStarsSpent = (totalSpent || []).reduce((sum, tx) => sum + tx.stars_amount, 0);

    // Check achievements
    for (const check of achievementsToCheck) {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('code', check.code)
        .single();

      if (!achievement) continue;

      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

      if (existing) continue;

      // Check if requirement is met
      let requirementMet = false;
      if (check.type === 'purchases' && (purchaseCount || 0) >= achievement.requirement_value) {
        requirementMet = true;
      } else if (check.type === 'stars_spent' && totalStarsSpent >= achievement.requirement_value) {
        requirementMet = true;
      } else if (check.type === 'subscription' || check.type === 'subscription_tier') {
        requirementMet = true;
      }

      if (requirementMet) {
        // Grant achievement
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
          });

        // Grant achievement rewards
        if (achievement.credits_reward > 0 || achievement.experience_reward > 0) {
          await supabase
            .from('user_credits')
            .update({
              balance: (userCredits?.balance || 0) + bonusCredits + achievement.credits_reward,
              total_earned: (userCredits?.total_earned || 0) + bonusCredits + achievement.credits_reward,
              experience: newExp + achievement.experience_reward,
            })
            .eq('user_id', userId);
        }

        console.log(`Achievement unlocked: ${achievement.code} for user ${userId}`);
      }
    }

    // Process referral reward if applicable
    if (userCredits?.referred_by) {
      const referralCredits = Math.floor(
        (starsAmount * ECONOMY.CREDITS_PER_STAR) * (ECONOMY.REFERRAL_PERCENT / 100)
      );

      if (referralCredits > 0) {
        // Create referral reward record
        await supabase
          .from('referral_rewards')
          .insert({
            referrer_id: userCredits.referred_by,
            referred_id: userId,
            transaction_id: transactionId,
            stars_amount: starsAmount,
            credits_reward: referralCredits,
            reward_percent: ECONOMY.REFERRAL_PERCENT,
            status: 'credited',
            credited_at: new Date().toISOString(),
          });

        // Credit referrer
        const { data: referrerCredits } = await supabase
          .from('user_credits')
          .select('balance, total_earned, referral_earnings')
          .eq('user_id', userCredits.referred_by)
          .single();

        await supabase
          .from('user_credits')
          .update({
            balance: (referrerCredits?.balance || 0) + referralCredits,
            total_earned: (referrerCredits?.total_earned || 0) + referralCredits,
            referral_earnings: (referrerCredits?.referral_earnings || 0) + referralCredits,
          })
          .eq('user_id', userCredits.referred_by);

        // Log referral transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userCredits.referred_by,
            amount: referralCredits,
            transaction_type: 'earn',
            action_type: 'referral_reward',
            description: 'Вознаграждение за покупку реферала',
            metadata: { 
              referred_id: userId, 
              transaction_id: transactionId,
              stars_amount: starsAmount,
            },
          });

        console.log(`Referral reward: ${referralCredits} credits to ${userCredits.referred_by}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        xp_earned: xpReward,
        bonus_credits: bonusCredits,
        is_first_purchase: isFirstPurchase,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in reward-purchase:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
