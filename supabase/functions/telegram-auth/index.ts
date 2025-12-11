import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  allows_write_to_pm?: boolean;
  is_premium?: boolean;
}

interface TelegramAuthData {
  initData: string;
  chatId?: number; // Optional chat_id from Mini App
}

interface AuthResponse {
  user: TelegramUser;
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Validates Telegram Web App initData using the official algorithm
 */
function validateTelegramWebAppData(initData: string, botToken: string): TelegramUser | null {
  try {
    console.log('🔐 Starting Telegram validation...');

    const decoded = decodeURIComponent(initData);
    const params = decoded.split('&');
    
    let receivedHash = '';
    const dataCheckArray: string[] = [];
    
    for (const param of params) {
      const [key, value] = param.split('=');
      if (key === 'hash') {
        receivedHash = value;
      } else {
        dataCheckArray.push(param);
      }
    }

    if (!receivedHash) {
      console.error('❌ No hash found in initData');
      return null;
    }

    dataCheckArray.sort((a, b) => a.localeCompare(b));
    const dataCheckString = dataCheckArray.join('\n');

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== receivedHash) {
      console.error('❌ Hash mismatch!');
      return null;
    }

    console.log('✅ Hash validation successful!');

    // Validate timestamp (24 hours max age)
    const authDateParam = params.find(p => p.startsWith('auth_date='));
    if (authDateParam) {
      const authTimestamp = parseInt(authDateParam.split('=')[1], 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const maxAge = 86400;

      if (currentTimestamp - authTimestamp > maxAge) {
        console.error('❌ InitData expired');
        return null;
      }
    }

    const userParam = params.find(p => p.startsWith('user='));
    if (!userParam) {
      console.error('❌ No user data in initData');
      return null;
    }

    const userData = decodeURIComponent(userParam.split('=')[1]);
    const user = JSON.parse(userData) as TelegramUser;
    
    console.log('✅ User validated:', { id: user.id, name: user.first_name });

    return user;
  } catch (error) {
    console.error('❌ Validation error:', error);
    return null;
  }
}

/**
 * Extract chat_id from initData if available
 */
function extractChatId(initData: string): number | null {
  try {
    const decoded = decodeURIComponent(initData);
    const params = decoded.split('&');
    const chatParam = params.find(p => p.startsWith('chat='));
    
    if (chatParam) {
      const chatData = JSON.parse(decodeURIComponent(chatParam.split('=')[1]));
      return chatData.id;
    }
    
    // Also check start_param for chat context
    const startParam = params.find(p => p.startsWith('start_param='));
    if (startParam) {
      const param = startParam.split('=')[1];
      // Some Mini Apps pass chat_id in start_param
      const chatMatch = param.match(/chat_(\d+)/);
      if (chatMatch) {
        return parseInt(chatMatch[1], 10);
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Telegram Auth function invoked');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { initData, chatId: providedChatId } = await req.json() as TelegramAuthData;

    if (!initData || typeof initData !== 'string' || initData.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid initData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramUser = validateTelegramWebAppData(initData, botToken);
    
    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram authentication data' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract chat_id from initData or use provided one
    const chatId = providedChatId || extractChatId(initData) || telegramUser.id;

    console.log('✅ Telegram user validated:', telegramUser.id, 'ChatID:', chatId);

    // Check if user already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    if (profileCheckError) {
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = `telegram_${telegramUser.id}@telegram.user`;
    let userId: string;
    let accessToken: string;
    let refreshToken: string;

    if (existingProfile) {
      console.log('👤 Existing profile found');
      userId = existingProfile.user_id;

      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
      
      if (authUserError || !authUser) {
        // Orphaned profile - clean up
        await supabase.from('profiles').delete().eq('telegram_id', telegramUser.id);
      } else {
        const newPassword = crypto.randomUUID();
        
        await supabase.auth.admin.updateUserById(userId, { password: newPassword });

      // Update profile with latest Telegram data AND chat_id, ensure public
      await supabase
        .from('profiles')
        .update({
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          language_code: telegramUser.language_code,
          photo_url: telegramUser.photo_url,
          telegram_chat_id: chatId, // Save chat_id for notifications
          is_public: true, // All profiles are public by default
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

        // Also update/create notification settings
        await supabase
          .from('user_notification_settings')
          .upsert({
            user_id: userId,
            telegram_chat_id: chatId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: newPassword,
        });

        if (signInError || !signInData.session) {
          return new Response(
            JSON.stringify({ error: 'Failed to create session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response: AuthResponse = {
          user: telegramUser,
          session: {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
          },
        };

        return new Response(
          JSON.stringify(response),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Create new user
    console.log('🆕 Creating new user for Telegram ID:', telegramUser.id);
    
    const password = crypto.randomUUID();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
        photo_url: telegramUser.photo_url,
        telegram_chat_id: chatId, // Include chat_id in metadata
      },
    });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    userId = authData.user.id;

    // Update the auto-created profile with chat_id and ensure public
    await supabase
      .from('profiles')
      .update({ 
        telegram_chat_id: chatId,
        is_public: true, // All profiles are public by default
      })
      .eq('user_id', userId);

    // Create notification settings
    await supabase
      .from('user_notification_settings')
      .insert({
        user_id: userId,
        telegram_chat_id: chatId,
      });

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response: AuthResponse = {
      user: telegramUser,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
    };

    console.log('✅ Authentication successful for user:', userId);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
