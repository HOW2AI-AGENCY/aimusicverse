const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callTelegramAPI(method: string, body?: any) {
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
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    });
    
    console.log('Webhook set result:', webhookResult);

    // Set bot commands
    const commandsResult = await callTelegramAPI('setMyCommands', {
      commands: [
        { command: 'start', description: 'Начать работу' },
        { command: 'generate', description: 'Создать музыку' },
        { command: 'library', description: 'Моя библиотека' },
        { command: 'projects', description: 'Мои проекты' },
        { command: 'app', description: 'Открыть приложение' },
        { command: 'help', description: 'Помощь' },
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
