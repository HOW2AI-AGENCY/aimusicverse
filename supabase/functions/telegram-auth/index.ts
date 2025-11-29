import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

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
 * Validates Telegram Web App initData according to official documentation
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
async function validateTelegramData(initData: string, botToken: string): Promise<TelegramUser | null> {
  try {
    console.log('🔐 Starting Telegram data validation...');
    console.log('📊 InitData length:', initData.length);
    
    // Parse the init data as URL parameters
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      console.error('❌ No hash in initData');
      return null;
    }
    
    console.log('🔑 Hash found:', hash);
    
    // Remove hash and signature from validation
    // Note: signature parameter is NOT part of Mini Apps validation
    urlParams.delete('hash');
    urlParams.delete('signature');

    // Sort all parameters alphabetically by key and create data check string
    const sortedKeys = Array.from(urlParams.keys()).sort();
    const dataCheckArr: string[] = [];
    
    console.log('📋 Parameters to validate:', sortedKeys.join(', '));
    
    for (const key of sortedKeys) {
      const value = urlParams.get(key);
      if (value) {
        // URLSearchParams already handles decoding, use values as-is
        dataCheckArr.push(`${key}=${value}`);
      }
    }
    
    const dataCheckString = dataCheckArr.join('\n');
    console.log('📝 Data check string created');

    // Create secret key using HMAC-SHA256("WebAppData", bot_token)
    const encoder = new TextEncoder();
    
    // Step 1: Create secret key from "WebAppData" string
    const secretKeyData = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode('WebAppData')
    );
    
    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Step 2: Sign bot token with secret key
    const tokenSignature = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(botToken)
    );

    // Step 3: Import token signature as the data key
    const dataKey = await crypto.subtle.importKey(
      'raw',
      tokenSignature,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Step 4: Calculate hash of data check string
    const signature = await crypto.subtle.sign(
      'HMAC',
      dataKey,
      encoder.encode(dataCheckString)
    );

    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('🔐 Calculated hash:', calculatedHash);
    console.log('🔐 Received hash:  ', hash);

    // Verify hash matches
    if (calculatedHash !== hash) {
      console.error('❌ Hash validation failed - hashes do not match');
      console.error('Expected:', calculatedHash);
      console.error('Received:', hash);
      return null;
    }

    console.log('✅ Hash validation successful!');

    // Validate timestamp to prevent replay attacks
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const maxAge = 86400; // 24 hours for development
      
      if (currentTimestamp - authTimestamp > maxAge) {
        console.error('❌ InitData too old:', {
          authTimestamp,
          currentTimestamp,
          age: currentTimestamp - authTimestamp,
          maxAge
        });
        return null;
      }
      console.log('✅ Timestamp validation passed');
    }

    // Parse and return user data
    const userParam = urlParams.get('user');
    if (!userParam) {
      console.error('❌ No user data in initData');
      return null;
    }

    const user = JSON.parse(userParam) as TelegramUser;
    console.log('✅ User validated:', user.id, user.first_name, user.username || '(no username)');
    
    return user;
  } catch (error) {
    console.error('❌ Validation error:', error);
    return null;
  }
}

/**
 * Main handler for Telegram OAuth authentication
 * Implements secure OAuth flow with Telegram Mini App
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Telegram Auth function invoked');
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);

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
        JSON.stringify({ error: 'Telegram bot token not configured' }),
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

    if (!initData) {
      console.error('❌ No initData in request');
      return new Response(
        JSON.stringify({ error: 'Missing initData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📦 InitData received, length:', initData.length);

    // Step 1: Validate Telegram data
    const telegramUser = await validateTelegramData(initData, botToken);
    
    if (!telegramUser) {
      console.error('❌ Telegram validation failed');
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram authentication data' }),
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
      console.error('❌ Error checking profile:', profileCheckError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = `telegram_${telegramUser.id}@telegram.user`;
    let userId: string;
    let sessionData: any;

    // Step 3: Handle existing user
    if (existingProfile) {
      console.log('👤 Existing user found:', existingProfile.user_id);
      userId = existingProfile.user_id;

      // Generate new password for session
      const newPassword = crypto.randomUUID();
      
      // Update user password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('❌ Failed to update password:', updateError);
        return new Response(
          JSON.stringify({ error: 'Authentication error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update profile data
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

      // Create session
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });

      if (signInError || !data.session) {
        console.error('❌ Session creation failed:', signInError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      sessionData = data;
      console.log('✅ Session created for existing user');
    } 
    // Step 4: Create new user
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
        // Try to clean up auth user
        await supabase.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: 'Failed to create profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Profile created');

      // Create session
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.session) {
        console.error('❌ Session creation failed:', signInError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      sessionData = data;
      console.log('✅ Session created for new user');
    }

    // Step 5: Return OAuth tokens
    const response: AuthResponse = {
      user: telegramUser,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
    };

    console.log('✅ Authentication successful for user:', userId);
    console.log('🎉 Returning session tokens');

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
