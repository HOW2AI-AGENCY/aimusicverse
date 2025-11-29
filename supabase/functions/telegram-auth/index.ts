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

// Validate Telegram initData according to official Telegram docs
async function validateTelegramData(initData: string, botToken: string): Promise<TelegramUser | null> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      console.error('No hash in initData');
      return null;
    }
    
    // Remove hash and signature from validation (signature is not part of the data check)
    urlParams.delete('hash');
    urlParams.delete('signature');

    // Sort params and create data check string
    const dataCheckArr: string[] = [];
    for (const [key, value] of urlParams.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    console.log('Data check string:', dataCheckString);

    // Create secret key using WebAppData constant from Telegram Bot API
    const encoder = new TextEncoder();
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

    // Sign bot token with secret key
    const tokenSignature = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(botToken)
    );

    // Import token signature as new key
    const dataKey = await crypto.subtle.importKey(
      'raw',
      tokenSignature,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Calculate hash using data key
    const signature = await crypto.subtle.sign(
      'HMAC',
      dataKey,
      encoder.encode(dataCheckString)
    );

    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Calculated hash:', calculatedHash);
    console.log('Received hash:', hash);

    // Verify hash
    if (calculatedHash !== hash) {
      console.error('Hash validation failed - hashes do not match');
      return null;
    }

    // Check timestamp to prevent replay attacks (max age: 5 minutes)
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const maxAge = 300; // 5 minutes in seconds
      
      if (currentTimestamp - authTimestamp > maxAge) {
        console.error('initData too old:', {
          authTimestamp,
          currentTimestamp,
          age: currentTimestamp - authTimestamp,
          maxAge
        });
        return null;
      }
      console.log('Timestamp validation passed - initData is fresh');
    } else {
      console.warn('No auth_date found in initData - skipping timestamp validation');
    }

    // Parse user data
    const userParam = urlParams.get('user');
    if (!userParam) {
      console.error('No user data in initData');
      return null;
    }

    const user = JSON.parse(userParam) as TelegramUser;
    console.log('User validated:', user.id);
    return user;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { initData } = await req.json() as TelegramAuthData;

    // Validate Telegram data
    const telegramUser = await validateTelegramData(initData, botToken);
    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram data' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Telegram user validated:', telegramUser.id);

    // Check if user exists by telegram_id
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', telegramUser.id)
      .maybeSingle();

    let userId: string;

    // Sign in the user to create a session
    const email = `telegram_${telegramUser.id}@telegram.user`;
    
    // For existing users, we need to reset their password first and update profile data
    if (existingProfile) {
      userId = existingProfile.user_id;
      const newPassword = crypto.randomUUID();
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Update profile data including photo_url
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
        console.error('Error updating profile:', profileUpdateError);
      }
      
      // Sign in with new password
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });
      
      if (signInError || !sessionData.session) {
        console.error('Error signing in:', signInError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Session created successfully for existing user:', userId);
      
      return new Response(
        JSON.stringify({
          user: telegramUser,
          session: {
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For new users, use the password we just created
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
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    userId = authData.user.id;
    console.log('New user created:', userId);

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
      console.error('Error creating profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sign in the new user
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError || !sessionData.session) {
      console.error('Error signing in new user:', signInError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session created successfully for new user:', userId);

    return new Response(
      JSON.stringify({
        user: telegramUser,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
