import { MESSAGES } from '../config.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage } from '../telegram-api.ts';

export async function handleHelp(chatId: number) {
  const enhancedHelp = `${MESSAGES.help}

🎹 *MIDI и аудио:*
/midi \\- Конвертация трека в MIDI
/piano \\- Фортепианная аранжировка \\(Pop2Piano\\)
/recognize \\- 🎵 Распознать музыку \\(Shazam\\)

ℹ️ *Информация:*
/about \\- О приложении
/terms \\- Условия использования
/privacy \\- Политика конфиденциальности`;

  await sendMessage(chatId, enhancedHelp, createMainMenuKeyboard());
}
