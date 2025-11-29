import { Bot } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    const bot = new Bot(botToken);
    
    // Construct webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;

    // Set webhook
    await bot.api.setWebhook(webhookUrl, {
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    });

    // Set bot commands
    await bot.api.setMyCommands([
      { command: 'start', description: 'Начать работу' },
      { command: 'generate', description: 'Создать музыку' },
      { command: 'library', description: 'Моя библиотека' },
      { command: 'projects', description: 'Мои проекты' },
      { command: 'app', description: 'Открыть приложение' },
      { command: 'help', description: 'Помощь' },
    ]);

    // Get webhook info
    const webhookInfo = await bot.api.getWebhookInfo();

    return new Response(
      JSON.stringify({
        success: true,
        webhook_url: webhookUrl,
        webhook_info: webhookInfo,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error setting up webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
