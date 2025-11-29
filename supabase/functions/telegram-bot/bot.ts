import { Bot } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { BOT_CONFIG } from './config.ts';
import { handleStart } from './commands/start.ts';
import { handleHelp } from './commands/help.ts';
import { handleGenerate } from './commands/generate.ts';
import { handleLibrary } from './commands/library.ts';
import { handleProjects } from './commands/projects.ts';

export function createBot() {
  const bot = new Bot(BOT_CONFIG.botToken);

  // Register commands
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('generate', handleGenerate);
  bot.command('library', handleLibrary);
  bot.command('projects', handleProjects);
  bot.command('app', async (ctx) => {
    await ctx.reply('🎵 Открываем приложение...', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎵 Открыть MusicVerse', web_app: { url: BOT_CONFIG.miniAppUrl } }
        ]]
      }
    });
  });

  // Handle callback queries from inline buttons
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (data === 'library') {
      await handleLibrary(ctx as any);
    } else if (data === 'projects') {
      await handleProjects(ctx as any);
    } else if (data === 'help') {
      await handleHelp(ctx as any);
    } else if (data === 'generate') {
      await ctx.reply('Используйте команду:\n/generate <описание трека>');
    }
    
    await ctx.answerCallbackQuery();
  });

  // Error handling
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}
