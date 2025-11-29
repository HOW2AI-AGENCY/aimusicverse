import { setWebhook, setMyCommands, getWebhookInfo } from '../telegram-bot/telegram-api.ts';

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

    // Construct webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;

    // Set webhook
    const webhookResult = await setWebhook(webhookUrl);
    console.log('Webhook set result:', webhookResult);

    // Set bot commands
    const commandsResult = await setMyCommands([
      { command: 'start', description: 'Начать работу' },
      { command: 'generate', description: 'Создать музыку' },
      { command: 'library', description: 'Моя библиотека' },
      { command: 'projects', description: 'Мои проекты' },
      { command: 'app', description: 'Открыть приложение' },
      { command: 'help', description: 'Помощь' },
    ]);
    console.log('Commands set result:', commandsResult);

    // Get webhook info
    const webhookInfo = await getWebhookInfo();

    return new Response(
      JSON.stringify({
        success: true,
        webhook_url: webhookUrl,
        webhook_result: webhookResult,
        commands_result: commandsResult,
        webhook_info: webhookInfo,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error setting up webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
