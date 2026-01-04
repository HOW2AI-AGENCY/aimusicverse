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

    // Parse request body for webhook type selection
    let webhookType = 'bot'; // default
    try {
      const body = await req.json();
      webhookType = body.type || 'bot';
    } catch {
      // No body or invalid JSON, use default
    }

    // Configure webhook URL based on type
    const webhookUrl = webhookType === 'payments'
      ? `${supabaseUrl}/functions/v1/stars-webhook`
      : `${supabaseUrl}/functions/v1/telegram-bot`;

    // Get secret token for webhook verification (recommended)
    // Use the same secret as the webhook handler expects.
    const secretToken = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');

    console.log(`Setting ${webhookType} webhook to:`, webhookUrl);

    // Set webhook with pre_checkout_query for payments support
    const webhookParams: TelegramAPIBody = {
      url: webhookUrl,
      allowed_updates: [
        'message',
        'callback_query',
        'inline_query',
        'pre_checkout_query', // Required for Stars payments
      ],
      drop_pending_updates: true,
    };

    // Add secret token if configured
    if (secretToken) {
      webhookParams.secret_token = secretToken;
    }

    const webhookResult = await callTelegramAPI('setWebhook', webhookParams);
    
    console.log('Webhook set result:', webhookResult);

    // Set bot commands - full list
    const commandsResult = await callTelegramAPI('setMyCommands', {
      commands: [
        { command: 'start', description: '🚀 Начать работу' },
        { command: 'help', description: '📚 Справка по командам' },
        { command: 'app', description: '📱 Открыть приложение' },
        { command: 'channel', description: '📢 Канал @AIMusiicVerse' },
        { command: 'news', description: '📰 Новости платформы' },
        { command: 'generate', description: '🎼 Создать трек' },
        { command: 'cover', description: '🎤 Создать кавер' },
        { command: 'extend', description: '➕ Расширить трек' },
        { command: 'status', description: '📊 Статус генерации' },
        { command: 'analyze', description: '🔬 Анализ аудио' },
        { command: 'library', description: '📚 Мои треки' },
        { command: 'projects', description: '📁 Мои проекты' },
        { command: 'upload', description: '📤 Загрузить аудио' },
        { command: 'buy', description: '💎 Купить кредиты' },
      ],
    });
    
    console.log('Commands set result:', commandsResult);

    // Get webhook info
    const webhookInfo = await callTelegramAPI('getWebhookInfo');

    return new Response(
      JSON.stringify({
        success: true,
        webhook_type: webhookType,
        webhook_url: webhookUrl,
        webhook_result: webhookResult,
        commands_result: commandsResult,
        webhook_info: webhookInfo,
        secret_token_configured: !!secretToken,
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
