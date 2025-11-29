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
 * Based on https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * 
 * Algorithm:
 * 1. Parse initData as URL query string
 * 2. Extract hash parameter
 * 3. Sort remaining parameters alphabetically
 * 4. Create data-check-string: key=value pairs joined by \n
 * 5. secret_key = HMAC-SHA256("WebAppData", bot_token)
 * 6. calculated_hash = HMAC-SHA256(secret_key, data-check-string)
 * 7. Compare calculated_hash with received hash
 */
function validateTelegramWebAppData(initData: string, botToken: string): TelegramUser | null {
  try {
    console.log('🔐 Starting Telegram validation...');
    console.log('📊 InitData length:', initData.length);

    // Step 1: Decode and parse initData
    const decoded = decodeURIComponent(initData);
    const params = decoded.split('&');
    
    let receivedHash = '';
    const dataCheckArray: string[] = [];
    
    // Step 2: Extract hash and collect other parameters
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

    console.log('🔑 Received hash:', receivedHash);

    // Step 3: Sort parameters alphabetically
    dataCheckArray.sort((a, b) => a.localeCompare(b));
    
    // Step 4: Create data-check-string
    const dataCheckString = dataCheckArray.join('\n');
    console.log('📝 Data check string:', dataCheckString.substring(0, 100) + '...');

    // Step 5: Calculate secret_key = HMAC-SHA256("WebAppData", bot_token)
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    console.log('🔑 Secret key generated');

    // Step 6: Calculate hash = HMAC-SHA256(secret_key, data-check-string)
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    console.log('🔐 Calculated hash:', calculatedHash);
    console.log('🔐 Received hash:  ', receivedHash);

    // Step 7: Compare hashes
    if (calculatedHash !== receivedHash) {
      console.error('❌ Hash mismatch!');
      console.error('📋 Bot token preview:', botToken.substring(0, 15) + '...');
      return null;
    }

    console.log('✅ Hash validation successful!');

    // Step 8: Validate timestamp (24 hours max age)
    const authDateParam = params.find(p => p.startsWith('auth_date='));
    if (authDateParam) {
      const authTimestamp = parseInt(authDateParam.split('=')[1], 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const maxAge = 86400; // 24 hours

      if (currentTimestamp - authTimestamp > maxAge) {
        console.error('❌ InitData expired');
        return null;
      }
      console.log('✅ Timestamp valid');
    }

    // Step 9: Extract and parse user data
    const userParam = params.find(p => p.startsWith('user='));
    if (!userParam) {
      console.error('❌ No user data in initData');
      return null;
    }

    const userData = decodeURIComponent(userParam.split('=')[1]);
    const user = JSON.parse(userData) as TelegramUser;
    
    console.log('✅ User validated:', {
      id: user.id,
      name: user.first_name,
      username: user.username || 'none'
    });

    return user;
  } catch (error) {
    console.error('❌ Validation error:', error);
    return null;
  }
}

/**
 * Main handler for Telegram OAuth authentication
 * Implements secure OAuth flow with JWT generation
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Telegram Auth function invoked');
  console.log('📍 Method:', req.method);

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    // Validate environment
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not set');
      return new Response(
        JSON.stringify({
          error: 'TELEGRAM_BOT_TOKEN not configured',
          message: 'Настройте TELEGRAM_BOT_TOKEN в Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Environment configured');

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const { initData } = await req.json() as TelegramAuthData;

    if (!initData || typeof initData !== 'string' || initData.trim().length === 0) {
      console.error('❌ Invalid initData');
      return new Response(
        JSON.stringify({
          error: 'Invalid initData',
          message: 'InitData обязателен'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📦 InitData received, length:', initData.length);

    // Step 1: Validate Telegram data
    const telegramUser = validateTelegramWebAppData(initData, botToken);
    
    if (!telegramUser) {
      console.error('❌ Telegram validation failed');
      return new Response(
        JSON.stringify({
          error: 'Invalid Telegram authentication data',
          message: 'Валидация не прошла. Проверьте TELEGRAM_BOT_TOKEN.',
          hint: 'Перезапустите Mini App для получения свежего initData'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Telegram user validated:', telegramUser.id);

    // Step 2: Check if user already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    if (profileCheckError) {
      console.error('❌ Database error:', profileCheckError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = `telegram_${telegramUser.id}@telegram.user`;
    let userId: string;
    let accessToken: string;
    let refreshToken: string;

    // Step 3: Handle existing user - generate new session
    if (existingProfile) {
      console.log('👤 Existing user found:', existingProfile.user_id);
      userId = existingProfile.user_id;

      // Generate new secure password for session
      const newPassword = crypto.randomUUID();
      
      // Update user password to allow sign in
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('❌ Password update failed:', updateError);
        return new Response(
          JSON.stringify({ error: 'Authentication error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update profile with latest Telegram data
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          language_code: telegramUser.language_code,
          photo_url: telegramUser.photo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileUpdateError) {
        console.warn('⚠️ Profile update failed:', profileUpdateError);
      }

      // Sign in to generate JWT tokens
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });

      if (signInError || !signInData.session) {
        console.error('❌ Session generation failed:', signInError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      accessToken = signInData.session.access_token;
      refreshToken = signInData.session.refresh_token;
      
      console.log('✅ Session created for existing user');
    } 
    // Step 4: Create new user and generate session
    else {
      console.log('🆕 Creating new user for Telegram ID:', telegramUser.id);
      
      const password = crypto.randomUUID();

      // Create auth user
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
        },
      });

      if (authError || !authData.user) {
        console.error('❌ User creation failed:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = authData.user.id;
      console.log('✅ Auth user created:', userId);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          language_code: telegramUser.language_code,
          photo_url: telegramUser.photo_url,
        });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        // Clean up auth user
        await supabase.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: 'Failed to create profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Profile created');

      // Sign in to generate JWT tokens
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.session) {
        console.error('❌ Session generation failed:', signInError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      accessToken = signInData.session.access_token;
      refreshToken = signInData.session.refresh_token;
      
      console.log('✅ Session created for new user');
    }

    // Step 5: Return JWT tokens to client
    const response: AuthResponse = {
      user: telegramUser,
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };

    console.log('✅ Authentication successful for user:', userId);
    console.log('🎉 Returning JWT tokens');

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
