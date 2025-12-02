const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definition for Telegram API request body
type TelegramAPIBody = Record<string, unknown>;

async function callTelegramAPI(method: string, body?: TelegramAPIBody) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    // Construct webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;

    console.log('Setting webhook to:', webhookUrl);

    // Set webhook
    const webhookResult = await callTelegramAPI('setWebhook', {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query', 'inline_query'],
      drop_pending_updates: true,
    });
    
    console.log('Webhook set result:', webhookResult);

    // Set bot commands
    const commandsResult = await callTelegramAPI('setMyCommands', {
      commands: [
        { command: 'start', description: '🎵 Начать работу с ботом' },
        { command: 'generate', description: '🎼 Создать музыкальный трек' },
        { command: 'library', description: '📚 Моя библиотека треков' },
        { command: 'projects', description: '📁 Мои музыкальные проекты' },
        { command: 'status', description: '⚡ Статус генерации' },
        { command: 'settings', description: '⚙️ Настройки бота' },
        { command: 'app', description: '🎵 Открыть приложение' },
        { command: 'help', description: '❓ Справка по командам' },
      ],
    });
    
    console.log('Commands set result:', commandsResult);

    // Get webhook info
    const webhookInfo = await callTelegramAPI('getWebhookInfo');

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
