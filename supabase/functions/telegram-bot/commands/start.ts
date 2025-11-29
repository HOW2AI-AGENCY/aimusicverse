import { CommandContext } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { MESSAGES } from '../config.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';

export async function handleStart(ctx: CommandContext<any>) {
  const startParam = ctx.match;
  
  // Handle deep links
  if (startParam) {
    const paramStr = String(startParam);
    
    if (paramStr.startsWith('track_')) {
      const trackId = paramStr.replace('track_', '');
      await ctx.reply(
        '🎵 Открываем трек...',
        { reply_markup: createMainMenuKeyboard() }
      );
      return;
    }
    
    if (paramStr.startsWith('project_')) {
      const projectId = paramStr.replace('project_', '');
      await ctx.reply(
        '📁 Открываем проект...',
        { reply_markup: createMainMenuKeyboard() }
      );
      return;
    }
    
    if (paramStr.startsWith('generate_')) {
      const style = paramStr.replace('generate_', '');
      await ctx.reply(
        `🎼 Создаем трек в стиле ${style}...\n\nИспользуйте /generate <описание>`,
        { reply_markup: createMainMenuKeyboard() }
      );
      return;
    }
  }
  
  // Default start message
  await ctx.reply(MESSAGES.welcome, {
    reply_markup: createMainMenuKeyboard(),
  });
}
