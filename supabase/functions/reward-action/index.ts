import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Action rewards configuration
const ACTION_REWARDS = {
  checkin: { credits: 5, experience: 10, description: 'Ежедневный чекин' },
  streak_bonus: { credits: 2, experience: 5, description: 'Бонус за серию' },
  share: { credits: 3, experience: 15, description: 'Расшаривание трека' },
  like_received: { credits: 1, experience: 5, description: 'Получен лайк' },
  generation_complete: { credits: 0, experience: 20, description: 'Генерация трека' },
  public_track: { credits: 2, experience: 10, description: 'Публичный трек' },
  artist_created: { credits: 5, experience: 25, description: 'Создание артиста' },
  project_created: { credits: 3, experience: 15, description: 'Создание проекта' },
};

function getLevelFromExperience(experience: number): number {
  return Math.max(1, Math.floor(Math.sqrt(experience / 100)) + 1);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      userId, 
      actionType, 
      customCredits, 
      customExperience, 
      description: customDescription,
      metadata 
    } = await req.json();

    if (!userId || !actionType) {
      return new Response(JSON.stringify({ error: 'userId and actionType required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reward = ACTION_REWARDS[actionType as keyof typeof ACTION_REWARDS];
    if (!reward && customCredits === undefined && customExperience === undefined) {
      return new Response(JSON.stringify({ error: 'Unknown action type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const credits = customCredits ?? reward?.credits ?? 0;
    const experience = customExperience ?? reward?.experience ?? 0;
    const description = customDescription || reward?.description || actionType;

    console.log(`🎁 Rewarding user ${userId}: ${actionType} = +${credits} credits, +${experience} XP`);

    // Get or create user credits record
    let { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user credits:', fetchError);
      throw fetchError;
    }

    const newExperience = (currentCredits?.experience || 0) + experience;
    const newLevel = getLevelFromExperience(newExperience);

    if (currentCredits) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          balance: currentCredits.balance + credits,
          total_earned: currentCredits.total_earned + credits,
          experience: newExperience,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        throw updateError;
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: credits,
          total_earned: credits,
          experience: experience,
          level: newLevel,
        });

      if (insertError) {
        console.error('Error inserting credits:', insertError);
        throw insertError;
      }
    }

    // Log transaction (only if credits > 0)
    if (credits > 0) {
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: credits,
          transaction_type: 'earn',
          action_type: actionType,
          description: description,
          metadata: { ...metadata, experience_earned: experience },
        });

      if (txError) {
        console.error('Error logging transaction:', txError);
      }
    }

    // Log to user_activity for mission tracking
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        action_type: actionType,
        action_data: metadata || {},
      });

    if (activityError) {
      console.error('Error logging activity:', activityError);
    }

    // Update total_shares counter if this is a share action
    if (actionType === 'share' && currentCredits) {
      await supabase
        .from('user_credits')
        .update({
          total_shares: (currentCredits.total_shares || 0) + 1,
        })
        .eq('user_id', userId);
    }

    // Update total_likes_received counter if this is a like_received action
    if (actionType === 'like_received' && currentCredits) {
      await supabase
        .from('user_credits')
        .update({
          total_likes_received: (currentCredits.total_likes_received || 0) + 1,
        })
        .eq('user_id', userId);
    }

    // Check for achievements
    await checkAndUnlockAchievements(supabase, userId, actionType, metadata);

    console.log(`✅ Reward granted: ${credits} credits, ${experience} XP, level ${newLevel}`);

    return new Response(JSON.stringify({ 
      success: true, 
      credits, 
      experience, 
      newLevel,
      message: description 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in reward-action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkAndUnlockAchievements(supabase: any, userId: string, actionType: string, metadata?: any) {
  try {
    // Get user stats for achievement checking
    const [
      { count: trackCount },
      { data: credits },
      { data: unlockedAchievements }
    ] = await Promise.all([
      supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
      supabase.from('user_credits').select('*').eq('user_id', userId).single(),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
    ]);

    const unlockedIds = new Set((unlockedAchievements || []).map((ua: any) => ua.achievement_id));

    // Get all achievements
    const { data: achievements } = await supabase.from('achievements').select('*');
    if (!achievements) return;

    const achievementsToUnlock = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      const code = achievement.code;

      // Track achievements
      if (code.startsWith('tracks_')) {
        const required = parseInt(code.split('_')[1]) || 0;
        shouldUnlock = (trackCount || 0) >= required;
      }
      // Streak achievements
      else if (code.startsWith('streak_')) {
        const required = parseInt(code.split('_')[1]) || 0;
        shouldUnlock = (credits?.current_streak || 0) >= required;
      }
      // Level achievements
      else if (code.startsWith('level_')) {
        const required = parseInt(code.split('_')[1]) || 0;
        shouldUnlock = (credits?.level || 1) >= required;
      }
      // Likes received achievements
      else if (code.startsWith('likes_')) {
        const required = parseInt(code.split('_')[1]) || 0;
        shouldUnlock = (credits?.total_likes_received || 0) >= required;
      }
      // Shares achievements
      else if (code.startsWith('shares_')) {
        const required = parseInt(code.split('_')[1]) || 0;
        shouldUnlock = (credits?.total_shares || 0) >= required;
      }
      // Special achievements based on action
      else {
        switch (code) {
          case 'first_public':
            if (actionType === 'public_track') shouldUnlock = true;
            break;
          case 'first_artist':
            if (actionType === 'artist_created') shouldUnlock = true;
            break;
          case 'first_project':
            if (actionType === 'project_created') shouldUnlock = true;
            break;
        }
      }

      if (shouldUnlock) {
        achievementsToUnlock.push(achievement);
      }
    }

    // Unlock achievements and grant rewards
    for (const achievement of achievementsToUnlock) {
      console.log(`🏆 Unlocking achievement: ${achievement.name} for user ${userId}`);

      const { error: insertError } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      if (insertError) {
        console.error(`Failed to unlock achievement ${achievement.code}:`, insertError);
        continue;
      }

      // Grant achievement rewards
      if (achievement.credits_reward > 0 || achievement.experience_reward > 0) {
        const { data: currentCredits } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (currentCredits) {
          const newExp = currentCredits.experience + achievement.experience_reward;
          await supabase
            .from('user_credits')
            .update({
              balance: currentCredits.balance + achievement.credits_reward,
              total_earned: currentCredits.total_earned + achievement.credits_reward,
              experience: newExp,
              level: getLevelFromExperience(newExp),
            })
            .eq('user_id', userId);

          if (achievement.credits_reward > 0) {
            await supabase.from('credit_transactions').insert({
              user_id: userId,
              amount: achievement.credits_reward,
              transaction_type: 'earn',
              action_type: 'achievement',
              description: `Достижение: ${achievement.name}`,
              metadata: { achievement_id: achievement.id, achievement_code: achievement.code },
            });
          }
        }
      }
    }

    if (achievementsToUnlock.length > 0) {
      console.log(`✅ Unlocked ${achievementsToUnlock.length} achievement(s)`);
    }

  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}
