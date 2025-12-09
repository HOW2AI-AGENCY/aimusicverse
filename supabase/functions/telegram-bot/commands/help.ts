import { MESSAGES } from '../config.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage } from '../telegram-api.ts';

export async function handleHelp(chatId: number) {
  const enhancedHelp = `${MESSAGES.help}

ℹ️ *Дополнительные команды:*
/recognize \\- 🎵 Распознать музыку \\(Shazam\\)
/about \\- Информация о приложении
/terms \\- Условия использования
/privacy \\- Политика конфиденциальности`;

  await sendMessage(chatId, enhancedHelp, createMainMenuKeyboard());
}
