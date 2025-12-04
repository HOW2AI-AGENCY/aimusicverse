import { musicService } from '../core/services/music.ts';
import { 
  createMainMenuKeyboard, 
  createPlayerControls, 
  createProjectControls,
  getMainBanner 
} from '../keyboards/main-menu.ts';
import { sendPhoto, editMessageMedia, editMessageCaption, answerCallbackQuery } from '../telegram-api.ts';

const MAIN_BANNER = getMainBanner();

export async function handleNavigationMain(chatId: number, messageId?: number) {
  const caption = `🏠 *MusicVerse Studio*\n\n` +
    `Создавайте музыку с помощью искусственного интеллекта\\.\n\n` +
    `🎵 Генерация треков по текстовым промптам\n` +
    `📁 Управление проектами\n` +
    `🎧 Встроенный плеер\n` +
    `✂️ Разделение на стемы\n\n` +
    `Выберите раздел:`;
  const keyboard = createMainMenuKeyboard();

  if (messageId) {
    // Обновляем существующее сообщение
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
  } else {
    // Отправляем новое сообщение
    await sendPhoto(chatId, MAIN_BANNER, {
      caption,
      replyMarkup: keyboard
    });
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
    const noTracksMsg = '📭 *У вас пока нет треков*\n\nНачните создавать музыку прямо сейчас!';
    
    if (messageId) {
      await editMessageCaption(chatId, messageId, noTracksMsg, createMainMenuKeyboard());
    } else {
      await sendPhoto(chatId, MAIN_BANNER, {
        caption: noTracksMsg,
        replyMarkup: createMainMenuKeyboard()
      });
    }
    return;
  }

  // Нормализуем page в пределах массива
  if (page < 0) page = tracks.length - 1;
  if (page >= tracks.length) page = 0;

  const track = tracks[page];
  const caption = musicService.formatTrackCaption(track, page, tracks.length);
  let coverUrl = musicService.getCoverUrl(track);
  
  // Validate cover URL - if it's invalid, use fallback
  try {
    new URL(coverUrl);
  } catch {
    console.warn(`Invalid cover URL for track ${track.id}:`, coverUrl);
    coverUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop&q=80';
  }
  
  const keyboard = createPlayerControls(track.id, page, tracks.length);

  if (messageId) {
    // Реактивное обновление - меняем только картинку и кнопки
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

    // Если editMessageMedia не сработал (устаревшее сообщение), отправляем новое
    if (!result) {
      await sendPhoto(chatId, coverUrl, {
        caption,
        replyMarkup: keyboard
      });
    }
  } else {
    // Первый раз - отправляем новое сообщение
    await sendPhoto(chatId, coverUrl, {
      caption,
      replyMarkup: keyboard
    });
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
