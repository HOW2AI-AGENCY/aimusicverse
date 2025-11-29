import { MESSAGES } from '../config.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage } from '../telegram-api.ts';

export async function handleHelp(chatId: number) {
  await sendMessage(chatId, MESSAGES.help, createMainMenuKeyboard());
}
