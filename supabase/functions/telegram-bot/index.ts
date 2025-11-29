import { webhookCallback } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { createBot } from './bot.ts';

const bot = createBot();
const handleUpdate = webhookCallback(bot, 'std/http');

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle webhook updates
    if (req.method === 'POST') {
      return await handleUpdate(req);
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
