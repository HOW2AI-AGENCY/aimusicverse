/**
 * Bot API for application-bot interaction
 * Provides endpoints for:
 * - Getting/setting bot configuration
 * - Updating bot commands
 * - Sending notifications
 * - Managing bot state
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('bot-api');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotCommand {
  command: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface BotConfig {
  commands?: BotCommand[];
  messages?: Record<string, string>;
  menu?: {
    mainMenu: Array<{ text: string; callback: string; emoji?: string }>;
    generateMenu: Array<{ text: string; callback: string; emoji?: string }>;
  };
  settings?: {
    welcomeBanner?: string;
    defaultParseMode?: string;
    rateLimit?: { requests: number; windowMs: number };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/bot-api', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route handlers
    if (req.method === 'GET' && path === '/config') {
      // Get all bot configuration
      const { data, error } = await supabase
        .from('telegram_bot_config')
        .select('*')
        .order('config_key');

      if (error) throw error;

      const config: Record<string, unknown> = {};
      for (const row of data || []) {
        config[row.config_key] = row.config_value;
      }

      return new Response(JSON.stringify(config), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT' && path === '/config') {
      // Update bot configuration
      const body = await req.json() as BotConfig;
      
      const updates = [];
      for (const [key, value] of Object.entries(body)) {
        updates.push({
          config_key: key,
          config_value: value,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        });
      }

      const { error } = await supabase
        .from('telegram_bot_config')
        .upsert(updates, { onConflict: 'config_key' });

      if (error) throw error;

      // If commands were updated, sync with Telegram
      if (body.commands) {
        await syncBotCommands(body.commands);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === '/commands/sync') {
      // Sync commands with Telegram
      const { data } = await supabase
        .from('telegram_bot_config')
        .select('config_value')
        .eq('config_key', 'commands')
        .single();

      const commands = data?.config_value as BotCommand[] || getDefaultCommands();
      await syncBotCommands(commands);

      return new Response(JSON.stringify({ success: true, commandsCount: commands.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET' && path === '/messages') {
      // Get all message templates
      const { data, error } = await supabase
        .from('telegram_bot_config')
        .select('config_value')
        .eq('config_key', 'messages')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return new Response(JSON.stringify(data?.config_value || getDefaultMessages()), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT' && path === '/messages') {
      // Update message templates
      const messages = await req.json();
      
      const { error } = await supabase
        .from('telegram_bot_config')
        .upsert({
          config_key: 'messages',
          config_value: messages,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && path === '/notify') {
      // Send notification to user(s)
      const { userIds, message, keyboard } = await req.json();
      
      const results = await sendNotifications(userIds, message, keyboard);

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET' && path === '/stats') {
      // Get bot statistics
      const [metricsResult, sessionsResult, configResult] = await Promise.all([
        supabase.rpc('get_telegram_bot_metrics', { _time_period: '24 hours' }),
        supabase.from('telegram_bot_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('telegram_bot_config').select('config_key, updated_at'),
      ]);

      return new Response(JSON.stringify({
        metrics: metricsResult.data?.[0] || null,
        activeSessions: sessionsResult.count || 0,
        configUpdates: configResult.data || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Bot API error', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncBotCommands(commands: BotCommand[]): Promise<void> {
  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const telegramCommands = commands
    .filter(cmd => cmd.enabled)
    .map(cmd => ({
      command: cmd.command,
      description: cmd.description,
    }));

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: telegramCommands }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sync commands: ${error}`);
  }
}

async function sendNotifications(
  userIds: string[],
  message: string,
  keyboard?: unknown
): Promise<{ sent: number; failed: number }> {
  const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get chat IDs for users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('telegram_chat_id')
    .in('user_id', userIds)
    .not('telegram_chat_id', 'is', null);

  let sent = 0;
  let failed = 0;

  for (const profile of profiles || []) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: profile.telegram_chat_id,
          text: message,
          reply_markup: keyboard,
        }),
      });

      if (response.ok) {
        sent++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}

function getDefaultCommands(): BotCommand[] {
  return [
    { command: 'start', description: '🚀 Начать работу', category: 'main', enabled: true },
    { command: 'help', description: '📚 Справка по командам', category: 'main', enabled: true },
    { command: 'generate', description: '🎼 Создать трек', category: 'generation', enabled: true },
    { command: 'cover', description: '🎤 Создать кавер', category: 'generation', enabled: true },
    { command: 'extend', description: '➕ Расширить трек', category: 'generation', enabled: true },
    { command: 'library', description: '📚 Мои треки', category: 'library', enabled: true },
    { command: 'projects', description: '📁 Мои проекты', category: 'library', enabled: true },
    { command: 'analyze', description: '🔬 Анализ аудио', category: 'analysis', enabled: true },
    { command: 'status', description: '📊 Статус генерации', category: 'generation', enabled: true },
    { command: 'buy', description: '💎 Купить кредиты', category: 'settings', enabled: true },
    { command: 'cancel', description: '❌ Отменить загрузку', category: 'settings', enabled: true },
  ];
}

function getDefaultMessages(): Record<string, string> {
  return {
    welcome: '🎵 Добро пожаловать в MusicVerse Studio!\n\nЯ помогу вам создавать музыку с помощью ИИ.',
    help: '📚 Справка по командам\n\nИспользуйте меню ниже для навигации.',
    generating: '⏳ Генерация началась...\n\nЭто займёт 1-3 минуты.',
    generated: '✅ Ваш трек готов!',
    error: '❌ Произошла ошибка. Попробуйте ещё раз.',
    noCredits: '💎 Недостаточно кредитов. Пополните баланс.',
    uploadPrompt: '📤 Отправьте аудиофайл (MP3/WAV) или голосовое сообщение.',
    cancelled: '❌ Операция отменена.',
  };
}
