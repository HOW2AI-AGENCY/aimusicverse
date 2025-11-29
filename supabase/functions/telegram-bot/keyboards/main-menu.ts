import { InlineKeyboard } from 'https://deno.land/x/grammy@v1.21.1/mod.ts';
import { BOT_CONFIG } from '../config.ts';

export function createMainMenuKeyboard() {
  return new InlineKeyboard()
    .webApp('🎵 Открыть приложение', BOT_CONFIG.miniAppUrl)
    .row()
    .text('📚 Моя библиотека', 'library')
    .text('📁 Проекты', 'projects')
    .row()
    .text('❓ Помощь', 'help');
}

export function createTrackKeyboard(trackId: string) {
  return new InlineKeyboard()
    .webApp('▶️ Открыть трек', `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}`)
    .row()
    .text('🔄 Создать еще', 'generate');
}

export function createProjectKeyboard(projectId: string) {
  return new InlineKeyboard()
    .webApp('📁 Открыть проект', `${BOT_CONFIG.miniAppUrl}?startapp=project_${projectId}`);
}
