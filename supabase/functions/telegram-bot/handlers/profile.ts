/**
 * Profile and balance handling for Telegram bot
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { sendPhoto, editMessageMedia, answerCallbackQuery } from '../telegram-api.ts';
import { buildMessage, createKeyValue } from '../utils/message-formatter.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';
import { getMenuImage, MENU_IMAGES } from '../keyboards/menu-images.ts';
import { navigateTo } from '../core/navigation-state.ts';
import { BOT_CONFIG } from '../config.ts';
import { deleteAndSendNewMenuPhoto } from '../core/active-menu-manager.ts';

const supabase = getSupabaseClient();

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  telegram_id: number;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  language_code: string | null;
}

interface UserCredits {
  balance: number;
  total_earned: number;
  total_spent: number;
  level: number;
  experience: number;
  current_streak: number;
  longest_streak: number;
  total_tracks: number;
  total_likes_received: number;
  total_shares: number;
  total_plays: number;
}

interface ProfileData {
  profile: UserProfile | null;
  credits: UserCredits | null;
  trackCount: number;
  projectCount: number;
  achievementCount: number;
}

async function getProfileData(telegramId: number): Promise<ProfileData> {
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (!profile) {
    return { profile: null, credits: null, trackCount: 0, projectCount: 0, achievementCount: 0 };
  }

  // Get credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', profile.user_id)
    .single();

  // Get track count
  const { count: trackCount } = await supabase
    .from('tracks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.user_id)
    .eq('status', 'completed');

  // Get project count
  const { count: projectCount } = await supabase
    .from('music_projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.user_id);

  // Get achievement count
  const { count: achievementCount } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.user_id);

  return {
    profile: profile as UserProfile,
    credits: credits as UserCredits | null,
    trackCount: trackCount || 0,
    projectCount: projectCount || 0,
    achievementCount: achievementCount || 0
  };
}

function formatSubscriptionTier(tier: string | null): string {
  const tiers: Record<string, string> = {
    free: '🆓 Free',
    basic: '⭐ Basic',
    premium: '💎 Premium',
    enterprise: '👑 Enterprise'
  };
  return tiers[tier || 'free'] || '🆓 Free';
}

function formatLevel(level: number, experience: number): string {
  const nextLevelExp = level * level * 100;
  const progress = Math.min(100, Math.round((experience / nextLevelExp) * 100));
  const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
  return `${level} [${progressBar}] ${progress}%`;
}

function getExperienceToNextLevel(level: number): number {
  return level * level * 100;
}

export async function handleProfile(
  chatId: number,
  userId: number,
  messageId?: number
): Promise<void> {
  navigateTo(userId, 'profile', messageId);

  const data = await getProfileData(userId);
  const imageUrl = await getMenuImage('profile');

  if (!data.profile) {
    const caption = buildMessage({
      title: 'Профиль не найден',
      emoji: '❌',
      description: 'Пожалуйста, запустите бот командой /start для создания профиля'
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: 'Главное меню',
        emoji: '🏠',
        action: { type: 'callback', data: 'open_main_menu' }
      })
      .build();

    await deleteAndSendNewMenuPhoto(chatId, userId, imageUrl, caption, keyboard, 'profile');
    return;
  }

  const { profile, credits, trackCount, projectCount, achievementCount } = data;

  // Build profile info
  const profileInfo: Record<string, string> = {};
  
  const displayName = profile.username 
    ? `@${profile.username}` 
    : `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`;
  
  profileInfo['Имя'] = displayName;
  profileInfo['Статус'] = formatSubscriptionTier(profile.subscription_tier);
  
  if (credits) {
    profileInfo['Баланс'] = `💰 ${credits.balance} кредитов`;
    profileInfo['Уровень'] = formatLevel(credits.level || 1, credits.experience || 0);
    if (credits.current_streak > 0) {
      profileInfo['Серия'] = `🔥 ${credits.current_streak} дней`;
    }
  }

  // Stats section
  const statsInfo: Record<string, string> = {
    'Треки': `🎵 ${trackCount}`,
    'Проекты': `📁 ${projectCount}`,
    'Достижения': `🏆 ${achievementCount}`
  };

  if (credits) {
    statsInfo['Прослушивания'] = `▶️ ${credits.total_plays || 0}`;
    statsInfo['Лайки'] = `❤️ ${credits.total_likes_received || 0}`;
    statsInfo['Поделились'] = `📤 ${credits.total_shares || 0}`;
  }

  const caption = buildMessage({
    title: 'Мой профиль',
    emoji: '👤',
    sections: [
      {
        title: 'Информация',
        content: createKeyValue(profileInfo),
        emoji: 'ℹ️'
      },
      {
        title: 'Статистика',
        content: createKeyValue(statsInfo),
        emoji: '📊'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть профиль',
      emoji: '📱',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/profile` }
    })
    .addRow(
      {
        text: 'Купить кредиты',
        emoji: '💎',
        action: { type: 'callback', data: 'buy_credits' }
      },
      {
        text: 'Достижения',
        emoji: '🏆',
        action: { type: 'callback', data: 'nav_achievements' }
      }
    )
    .addRow(
      {
        text: 'Лидерборд',
        emoji: '🏅',
        action: { type: 'callback', data: 'nav_leaderboard' }
      },
      {
        text: 'История',
        emoji: '📜',
        action: { type: 'callback', data: 'nav_transactions' }
      }
    )
    .addButton({
      text: 'Назад',
      emoji: '🔙',
      action: { type: 'callback', data: 'open_main_menu' }
    })
    .build();

  await deleteAndSendNewMenuPhoto(chatId, userId, imageUrl, caption, keyboard, 'profile');
}

export async function handleBalance(
  chatId: number,
  userId: number,
  messageId?: number
): Promise<void> {
  const data = await getProfileData(userId);
  const imageUrl = await getMenuImage('shop');

  if (!data.credits) {
    const caption = buildMessage({
      title: 'Баланс недоступен',
      emoji: '❌',
      description: 'Не удалось загрузить информацию о балансе'
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: 'Главное меню',
        emoji: '🏠',
        action: { type: 'callback', data: 'open_main_menu' }
      })
      .build();

    await deleteAndSendNewMenuPhoto(chatId, userId, imageUrl, caption, keyboard, 'balance');
    return;
  }

  const { credits } = data;

  const balanceInfo: Record<string, string> = {
    'Текущий баланс': `💰 ${credits.balance} кредитов`,
    'Заработано всего': `📈 ${credits.total_earned || 0}`,
    'Потрачено всего': `📉 ${credits.total_spent || 0}`
  };

  const caption = buildMessage({
    title: 'Мой баланс',
    emoji: '💰',
    sections: [
      {
        title: 'Кредиты',
        content: createKeyValue(balanceInfo),
        emoji: '💎'
      },
      {
        title: 'Как заработать',
        content: [
          '• Ежедневный чекин: +1-7 кредитов',
          '• Получение лайков: +1 кредит',
          '• Достижения: +5-50 кредитов',
          '• Приглашение друзей: +10 кредитов'
        ],
        emoji: '💡',
        style: 'list'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Купить кредиты',
      emoji: '💎',
      action: { type: 'callback', data: 'buy_credits' }
    })
    .addRow(
      {
        text: '50 кредитов',
        emoji: '⭐',
        action: { type: 'callback', data: 'buy_credits_50' }
      },
      {
        text: '150 кредитов',
        emoji: '⭐',
        action: { type: 'callback', data: 'buy_credits_150' }
      }
    )
    .addRow(
      {
        text: '500 кредитов',
        emoji: '💫',
        action: { type: 'callback', data: 'buy_credits_500' }
      },
      {
        text: 'Подписка',
        emoji: '👑',
        action: { type: 'callback', data: 'buy_subscription' }
      }
    )
    .addButton({
      text: 'Назад',
      emoji: '🔙',
      action: { type: 'callback', data: 'nav_profile' }
    })
    .build();

  await deleteAndSendNewMenuPhoto(chatId, userId, imageUrl, caption, keyboard, 'balance');
}

export async function handleProfileCallback(
  callbackData: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  await answerCallbackQuery(queryId);

  if (callbackData === 'nav_profile') {
    await handleProfile(chatId, userId, messageId);
    return true;
  }

  if (callbackData === 'nav_balance') {
    await handleBalance(chatId, userId, messageId);
    return true;
  }

  if (callbackData === 'nav_achievements') {
    await handleAchievements(chatId, userId, messageId);
    return true;
  }

  if (callbackData === 'nav_leaderboard') {
    await handleLeaderboard(chatId, userId, messageId);
    return true;
  }

  if (callbackData === 'nav_transactions') {
    await handleTransactions(chatId, userId, messageId);
    return true;
  }

  return false;
}

async function handleAchievements(
  chatId: number,
  userId: number,
  messageId?: number
): Promise<void> {
  // Get user profile first
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (!profile) return;

  // Get user achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', profile.user_id)
    .order('unlocked_at', { ascending: false })
    .limit(10);

  const imageUrl = await getMenuImage('profile');

  const achievementList = userAchievements?.map(ua => {
    const a = ua.achievements;
    return `${a.icon} ${a.name}`;
  }).join('\n') || 'Пока нет достижений';

  const caption = buildMessage({
    title: 'Мои достижения',
    emoji: '🏆',
    description: `Разблокировано: ${userAchievements?.length || 0}`,
    sections: [
      {
        title: 'Последние достижения',
        content: achievementList,
        emoji: '⭐'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Все достижения',
      emoji: '📱',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/achievements` }
    })
    .addButton({
      text: 'Назад',
      emoji: '🔙',
      action: { type: 'callback', data: 'nav_profile' }
    })
    .build();

  await deleteAndSendNewMenuPhoto(chatId, userId, imageUrl, caption, keyboard, 'achievements');
}

async function handleLeaderboard(
  chatId: number,
  userId: number,
  messageId?: number
): Promise<void> {
  // Get leaderboard data
  const { data: leaderboard } = await supabase
    .rpc('get_leaderboard', { _limit: 5 });

  const imageUrl = await getMenuImage('profile');

  const leaderboardList = leaderboard?.map((user: any, index: number) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    const name = user.username || 'Аноним';
    return `${medal} ${name} — Ур.${user.level} (${user.experience} XP)`;
  }).join('\n') || 'Лидерборд пуст';

  const caption = buildMessage({
    title: 'Лидерборд',
    emoji: '🏅',
    sections: [
      {
        title: 'Топ-5 игроков',
        content: leaderboardList,
        emoji: '👑'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Полный лидерборд',
      emoji: '📱',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/leaderboard` }
    })
    .addButton({
      text: 'Назад',
      emoji: '🔙',
      action: { type: 'callback', data: 'nav_profile' }
    })
    .build();

  await deleteAndSendNewMenuPhoto(chatId, userId, imageUrl, caption, keyboard, 'leaderboard');
}

async function handleTransactions(
  chatId: number,
  userId: number,
  messageId?: number
): Promise<void> {
  // Get user profile first
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (!profile) return;

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', profile.user_id)
    .order('created_at', { ascending: false })
    .limit(5);

  const imageUrl = await getMenuImage('shop');

  const transactionList = transactions?.map(t => {
    const sign = t.transaction_type === 'earn' ? '+' : '-';
    const emoji = t.transaction_type === 'earn' ? '📈' : '📉';
    const date = new Date(t.created_at).toLocaleDateString('ru-RU');
    return `${emoji} ${sign}${t.amount} — ${t.description || t.action_type} (${date})`;
  }).join('\n') || 'Нет транзакций';

  const caption = buildMessage({
    title: 'История транзакций',
    emoji: '📜',
    sections: [
      {
        title: 'Последние операции',
        content: transactionList,
        emoji: '💳'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Полная история',
      emoji: '📱',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/transactions` }
    })
    .addButton({
      text: 'Назад',
      emoji: '🔙',
      action: { type: 'callback', data: 'nav_profile' }
    })
    .build();

  await deleteAndSendNewMenuPhoto(chatId, userId, imageUrl, caption, keyboard, 'transactions');
}
