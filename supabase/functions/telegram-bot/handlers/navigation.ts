import { musicService } from '../core/services/music.ts';
import { 
  createMainMenuKeyboard, 
  createPlayerControls, 
  createProjectControls,
  getMainBanner 
} from '../keyboards/main-menu.ts';
import { sendPhoto, editMessageMedia, editMessageCaption, answerCallbackQuery } from '../telegram-api.ts';
import { buildMessage, createSection, createKeyValue } from '../utils/message-formatter.ts';
import { ButtonBuilder, mediaPlayerKeyboard, paginationKeyboard } from '../utils/button-builder.ts';
import { trackMessage, messageManager } from '../utils/message-manager.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';

const MAIN_BANNER = getMainBanner();

export async function handleNavigationMain(chatId: number, messageId?: number) {
  const caption = buildMessage({
    title: 'MusicVerse Studio',
    emoji: '🏠',
    description: 'Создавайте музыку с помощью искусственного интеллекта',
    sections: [
      {
        title: 'Возможности',
        content: [
          'Генерация треков по текстовым промптам',
          'Управление проектами',
          'Встроенный плеер',
          'Разделение на стемы'
        ],
        emoji: '✨',
        style: 'list'
      }
    ],
    footer: 'Выберите раздел ниже 👇'
  });
  
  const keyboard = createMainMenuKeyboard();

  if (messageId) {
    // Clean up old main menu messages
    await messageManager.deleteCategory(chatId, 'main_menu', { except: messageId });
    
    // Update existing message
    await editMessageMedia(
      chatId,
      messageId,
      {
        type: 'photo',
        media: MAIN_BANNER,
        caption,
        parse_mode: 'MarkdownV2'
      },
      keyboard
    );
    
    await trackMessage(chatId, messageId, 'menu', 'main_menu', { persistent: true });
  } else {
    // Send new message
    const result = await sendPhoto(chatId, MAIN_BANNER, {
      caption,
      replyMarkup: keyboard
    });
    
    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, 'menu', 'main_menu', { persistent: true });
    }
  }
}

export async function handleNavigationLibrary(
  chatId: number,
  userId: number,
  messageId?: number,
  page: number = 0
) {
  const tracks = await musicService.getUserTracks(userId);

  if (!tracks.length) {
    const noTracksMsg = buildMessage({
      title: 'У вас пока нет треков',
      emoji: '📭',
      description: 'Начните создавать музыку прямо сейчас!',
      sections: [
        {
          title: 'Как начать',
          content: [
            'Используйте /generate для создания трека',
            'Откройте студию для полного функционала',
            'Загрузите аудио для обработки'
          ],
          emoji: '💡',
          style: 'list'
        }
      ]
    });
    
    const keyboard = new ButtonBuilder()
      .addButton({
        text: 'Создать трек',
        emoji: '🎼',
        action: { type: 'callback', data: 'nav_generate' }
      })
      .addButton({
        text: 'Открыть студию',
        emoji: '🚀',
        action: { type: 'webapp', url: (await import('../config.ts')).BOT_CONFIG.miniAppUrl }
      })
      .addButton({
        text: 'Главное меню',
        emoji: '🏠',
        action: { type: 'callback', data: 'nav_main' }
      })
      .build();
    
    if (messageId) {
      await editMessageCaption(chatId, messageId, noTracksMsg, keyboard);
      await trackMessage(chatId, messageId, 'content', 'library', { expiresIn: 60000 });
    } else {
      const result = await sendPhoto(chatId, MAIN_BANNER, {
        caption: noTracksMsg,
        replyMarkup: keyboard
      });
      
      if (result?.result?.message_id) {
        await trackMessage(chatId, result.result.message_id, 'content', 'library', { expiresIn: 60000 });
      }
    }
    return;
  }

  // Normalize page
  if (page < 0) page = tracks.length - 1;
  if (page >= tracks.length) page = 0;

  const track = tracks[page];
  
  // Create enhanced track caption
  const trackInfo: Record<string, string> = {};
  if (track.artist) trackInfo['Исполнитель'] = track.artist;
  if (track.duration) trackInfo['Длительность'] = musicService.formatDuration(track.duration);
  if (track.style) trackInfo['Стиль'] = track.style;
  if (track.created_at) trackInfo['Создан'] = new Date(track.created_at).toLocaleDateString('ru-RU');
  
  const caption = buildMessage({
    title: track.title || 'Без названия',
    emoji: '🎵',
    description: `Трек ${page + 1} из ${tracks.length}`,
    sections: [
      {
        title: 'Информация',
        content: createKeyValue(trackInfo),
        emoji: 'ℹ️'
      }
    ]
  });
  
  let coverUrl = musicService.getCoverUrl(track);
  
  // Validate cover URL
  try {
    new URL(coverUrl);
  } catch {
    console.warn(`Invalid cover URL for track ${track.id}:`, coverUrl);
    coverUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop&q=80';
  }
  
  const keyboard = mediaPlayerKeyboard(track.id, page, tracks.length);

  if (messageId) {
    // Clean up old library messages
    await messageManager.deleteCategory(chatId, 'library', { except: messageId });
    
    // Update existing message
    const result = await editMessageMedia(
      chatId,
      messageId,
      {
        type: 'photo',
        media: coverUrl,
        caption,
        parse_mode: 'MarkdownV2'
      },
      keyboard
    );

    if (!result) {
      // If edit failed, send new message
      const newResult = await sendPhoto(chatId, coverUrl, {
        caption,
        replyMarkup: keyboard
      });
      
      if (newResult?.result?.message_id) {
        await trackMessage(chatId, newResult.result.message_id, 'content', 'library');
      }
    } else {
      await trackMessage(chatId, messageId, 'content', 'library');
    }
  } else {
    // Send new message
    const result = await sendPhoto(chatId, coverUrl, {
      caption,
      replyMarkup: keyboard
    });
    
    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, 'content', 'library');
    }
  }
}

export async function handleNavigationProjects(
  chatId: number,
  userId: number,
  messageId?: number,
  page: number = 0
) {
  console.log('Navigation: Projects page', page, 'for user', userId);
  
  const projects = await musicService.getUserProjects(userId);

  console.log('Projects returned:', projects.length);

  if (!projects.length) {
    const noProjectsMsg = '📭 *У вас пока нет проектов*\n\nСоздайте первый проект в приложении!';
    
    if (messageId) {
      await editMessageCaption(chatId, messageId, noProjectsMsg, createMainMenuKeyboard());
    } else {
      await sendPhoto(chatId, MAIN_BANNER, {
        caption: noProjectsMsg,
        replyMarkup: createMainMenuKeyboard()
      });
    }
    return;
  }

  // Нормализуем page
  if (page < 0) page = projects.length - 1;
  if (page >= projects.length) page = 0;

  console.log('Displaying project', page + 1, 'of', projects.length);

  const project = projects[page];
  const caption = musicService.formatProjectCaption(project, page, projects.length);
  const coverUrl = musicService.getProjectCoverUrl(project);
  const keyboard = createProjectControls(project.id, page, projects.length);

  console.log('Project cover URL:', coverUrl);

  if (messageId) {
    const result = await editMessageMedia(
      chatId,
      messageId,
      {
        type: 'photo',
        media: coverUrl,
        caption,
        parse_mode: 'MarkdownV2'
      },
      keyboard
    );

    if (!result) {
      await sendPhoto(chatId, coverUrl, {
        caption,
        replyMarkup: keyboard
      });
    }
  } else {
    await sendPhoto(chatId, coverUrl, {
      caption,
      replyMarkup: keyboard
    });
  }
}

export async function handleNavigationCallback(
  callbackData: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
) {
  await answerCallbackQuery(queryId);

  if (callbackData === 'nav_main') {
    await handleNavigationMain(chatId, messageId);
  } else if (callbackData === 'nav_library') {
    await handleNavigationLibrary(chatId, userId, messageId, 0);
  } else if (callbackData === 'nav_projects') {
    await handleNavigationProjects(chatId, userId, messageId, 0);
  } else if (callbackData.startsWith('lib_page_')) {
    const page = parseInt(callbackData.replace('lib_page_', ''));
    await handleNavigationLibrary(chatId, userId, messageId, page);
  } else if (callbackData.startsWith('project_page_')) {
    const page = parseInt(callbackData.replace('project_page_', ''));
    await handleNavigationProjects(chatId, userId, messageId, page);
  }
}
