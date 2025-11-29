import { CommandContext } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { MESSAGES } from '../config.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';

export async function handleHelp(ctx: CommandContext<any>) {
  await ctx.reply(MESSAGES.help, {
    reply_markup: createMainMenuKeyboard(),
  });
}
