import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { title, message, targetType = 'all', blogPostId } = await req.json();

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Title and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get users with telegram_chat_id based on target type
    let query = supabase.from('profiles').select('telegram_chat_id, user_id, username');
    
    if (targetType === 'premium') {
      query = query.in('subscription_tier', ['premium', 'enterprise']);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const usersWithChat = users?.filter(u => u.telegram_chat_id) || [];
    console.log(`Broadcasting to ${usersWithChat.length} users`);

    let sentCount = 0;
    let failedCount = 0;

    // Escape markdown special characters
    const escapeMarkdown = (text: string) => {
      return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
    };

    // Build message with optional blog link
    const fullMessage = `📢 *${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}\n\n🤖 _@AIMusicVerseBot_`;
    
    const inlineKeyboard: { text: string; callback_data?: string; url?: string }[][] = [];
    
    if (blogPostId) {
      const miniAppUrl = Deno.env.get('MINI_APP_URL') || 'https://t.me/AIMusicVerseBot/app';
      inlineKeyboard.push([
        { text: '📖 Читать статью', url: `${miniAppUrl}?startapp=blog_${blogPostId}` }
      ]);
    }
    
    inlineKeyboard.push([
      { text: '🏠 Меню', callback_data: 'open_main_menu' }
    ]);

    // Send messages in batches - delete previous menu before sending broadcast
    for (const user of usersWithChat) {
      try {
        // Try to delete user's active menu before sending broadcast
        const { data: menuState } = await supabase
          .from('telegram_menu_state')
          .select('active_menu_message_id')
          .eq('chat_id', user.telegram_chat_id)
          .single();

        if (menuState?.active_menu_message_id) {
          // Delete the old menu message
          await fetch(`${TELEGRAM_API}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.telegram_chat_id,
              message_id: menuState.active_menu_message_id,
            }),
          });

          // Clear the active menu state
          await supabase
            .from('telegram_menu_state')
            .update({ active_menu_message_id: null })
            .eq('chat_id', user.telegram_chat_id);
        }

        // Send broadcast message (NOT saving as active menu - it's content, not navigation)
        const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_chat_id,
            text: fullMessage,
            parse_mode: 'MarkdownV2',
            reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined,
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          const error = await response.text();
          console.error(`Failed to send to ${user.telegram_chat_id}:`, error);
          failedCount++;
        }

        // Rate limiting - max 30 messages per second
        await new Promise(resolve => setTimeout(resolve, 35));
      } catch (err) {
        console.error(`Error sending to ${user.telegram_chat_id}:`, err);
        failedCount++;
      }
    }

    // Also create in-app notifications for all users (including those without Telegram)
    const { data: allUsers } = await supabase.from('profiles').select('user_id');
    const usersToNotify = allUsers?.filter(u => u.user_id) || [];
    
    if (usersToNotify.length > 0) {
      const actionUrl = blogPostId ? `/blog/${blogPostId}` : undefined;
      const notificationsToInsert = usersToNotify.map(u => ({
        user_id: u.user_id,
        title: `📢 ${title}`,
        message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
        type: 'info',
        action_url: actionUrl,
        read: false,
      }));

      // Insert in batches of 100
      for (let i = 0; i < notificationsToInsert.length; i += 100) {
        const batch = notificationsToInsert.slice(i, i + 100);
        await supabase.from('notifications').insert(batch);
      }
      console.log(`Created ${usersToNotify.length} in-app notifications`);
    }

    // Log broadcast
    const authHeader = req.headers.get('Authorization');
    let senderId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      senderId = user?.id;
    }

    await supabase.from('broadcast_messages').insert({
      sender_id: senderId,
      title,
      message,
      target_type: targetType,
      sent_count: sentCount,
      failed_count: failedCount,
    });

    return new Response(JSON.stringify({
      success: true,
      sentCount,
      failedCount,
      totalTargeted: usersWithChat.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
