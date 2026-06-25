# 🚀 Telegram Integration - Sprints 5-6

## Sprint 5: Native App Interface (grammY Migration)

**Цель**: Переход на реактивный интерфейс с использованием grammY framework

**Даты**: 2024-Q1 (4 недели)

---

### 5.1 Миграция на grammY Framework

**Приоритет**: 🔴 Critical

**Задачи**:

- [ ] Установить grammY + plugins (`@grammyjs/menu`, `@grammyjs/runner`)
- [ ] Создать типы для `BotContext` с сессиями
- [ ] Перенести существующие handlers на grammY API
- [ ] Настроить middleware (auth, logging, error handling)
- [ ] Написать тесты для основных сценариев

**Технические детали**:

```typescript
// supabase/functions/telegram-bot/core/types/bot.ts
import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  currentTrackIndex: number;
  currentProjectIndex: number;
  lastMessageId?: number;
  view: "main" | "library" | "projects" | "settings";
}

export type BotContext = Context & SessionFlavor<SessionData>;
```

**Acceptence Criteria**:

- ✅ Все команды работают через grammY
- ✅ Сессии сохраняются между запросами
- ✅ Тесты покрывают 80%+ кода

---

### 5.2 Реактивное обновление интерфейса

**Приоритет**: 🔴 Critical

**Задачи**:

- [ ] Реализовать `editMessageMedia` для смены картинок
- [ ] Создать систему навигации с одним активным сообщением
- [ ] Добавить пагинацию для библиотеки (⏮️/⏭️)
- [ ] Реализовать fallback на `replyWithPhoto` при ошибках

**Код**:

```typescript
// handlers/navigation.ts
async function renderTrack(ctx: BotContext, index: number) {
  const tracks = await musicService.getTracks(ctx.from!.id);
  const track = tracks[index];

  try {
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: track.coverUrl,
        caption: formatTrackCaption(track, index, tracks.length),
      },
      {
        reply_markup: createPlayerControls(track.id, index, tracks.length),
      },
    );
  } catch (error) {
    // Fallback: новое сообщение
    await ctx.replyWithPhoto(track.coverUrl, {
      caption: formatTrackCaption(track, index, tracks.length),
      reply_markup: createPlayerControls(track.id, index, tracks.length),
    });
  }
}
```

**Acceptence Criteria**:

- ✅ Навигация между треками без новых сообщений
- ✅ Плавная смена картинок (< 500ms)
- ✅ Корректная работа с устаревшими сообщениями

---

### 5.3 Улучшенный плеер

**Приоритет**: 🟡 High

**Задачи**:

- [ ] Добавить кнопки: ❤️ (like), ⬇️ (download), ✂️ (stems)
- [ ] Реализовать отправку аудио с метаданными (`sendAudio`)
- [ ] Добавить превью обложки в плеере Telegram
- [ ] Показывать длительность и теги трека

**Макет кнопок**:

```
┌─────────────────────────────┐
│  [Обложка трека]            │
│                             │
│  🎧 Sunset Dreams           │
│  👤 AI Artist               │
│  🏷 #Pop #Chill             │
│  💿 Трек 1 из 5             │
├─────────────────────────────┤
│  [⏮️] [ ▶️ PLAY ] [⏭️]      │
│  [❤️ Like] [⬇️] [✂️ Stems]  │
│  [🔙 Назад]                 │
└─────────────────────────────┘
```

**Acceptence Criteria**:

- ✅ Аудио воспроизводится в нативном плеере
- ✅ Обложка отображается корректно
- ✅ Все кнопки работают

---

### 5.4 Экран "Проекты"

**Приоритет**: 🟡 High

**Задачи**:

- [ ] Создать handler для `/projects`
- [ ] Реализовать пагинацию проектов (⬅️/➡️)
- [ ] Показывать обложку альбома и метаданные
- [ ] Добавить кнопку "Открыть в Studio" (WebApp)

**Макет**:

```
┌─────────────────────────────┐
│  [Обложка альбома]          │
│                             │
│  📁 My Summer EP            │
│  5 треков • 15 минут        │
│  Создан: 12.12.2024         │
├─────────────────────────────┤
│  [⬅️] [Проект 1/3] [➡️]     │
│  [📂 Открыть в Studio]      │
│  [🔙 Назад]                 │
└─────────────────────────────┘
```

**Acceptence Criteria**:

- ✅ Список проектов загружается из БД
- ✅ Навигация между проектами
- ✅ Кнопка "Открыть" запускает Mini App

---

### 5.5 Главное меню

**Приоритет**: 🔴 Critical

**Задачи**:

- [ ] Создать красивый баннер для главного меню
- [ ] Реализовать кнопку "🚀 OPEN STUDIO" (WebApp)
- [ ] Добавить кнопки: 🎹 Проекты, 🎧 Библиотека, ⚙️ Настройки
- [ ] Добавить раздел "ℹ️ О платформе"

**Код меню**:

```typescript
// menus/main-menu.ts
export const createMainMenuKeyboard = () => {
  return new InlineKeyboard()
    .webApp("🚀 OPEN STUDIO", { url: MINI_APP_URL })
    .row()
    .text("🎹 Проекты", "nav_projects")
    .text("🎧 Библиотека", "nav_library")
    .row()
    .text("ℹ️ О платформе", "nav_about")
    .text("⚙️ Настройки", "nav_settings");
};
```

**Acceptence Criteria**:

- ✅ Все кнопки работают
- ✅ WebApp открывается корректно
- ✅ Возврат в меню из любого раздела

---

## Sprint 6: Advanced Features

**Цель**: Добавить продвинутые функции шаринга, inline-режима и AI-интеграции

**Даты**: 2024-Q1 (3 недели)

---

### 6.1 Inline Mode (Полный)

**Приоритет**: 🟡 High

**Задачи**:

- [ ] Реализовать `bot.on('inline_query')` handler
- [ ] Добавить поиск треков по названию/тегам
- [ ] Показывать превью обложек в результатах
- [ ] Добавить кнопку "Открыть трек" при отправке

**Пример использования**:

```
@MusicVerseBot sunset chill
→ Список треков с тегами "sunset" и "chill"
→ При клике → отправка аудио в чат
```

**Код**:

```typescript
// handlers/inline.ts
bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query.toLowerCase();
  const tracks = await searchTracks(query);

  const results = tracks.map((track, i) => ({
    type: "audio" as const,
    id: track.id,
    audio_url: track.audioUrl,
    title: track.title,
    performer: track.artist,
    thumbnail_url: track.coverUrl,
    reply_markup: {
      inline_keyboard: [[{ text: "🎵 Открыть трек", url: `${BOT_URL}?start=track_${track.id}` }]],
    },
  }));

  await ctx.answerInlineQuery(results, {
    cache_time: 300,
    is_personal: true,
  });
});
```

**Acceptence Criteria**:

- ✅ Поиск работает в любом чате
- ✅ Аудио отправляется корректно
- ✅ Кнопки работают

---

### 6.2 Share Menu

**Приоритет**: 🟢 Medium

**Задачи**:

- [ ] Создать меню шаринга (chat, friends, story, link)
- [ ] Реализовать `switch_inline_query` для друзей
- [ ] Добавить кнопку "Share to Story" (Telegram Stories API)
- [ ] Реализовать "Копировать ссылку"

**Макет меню**:

```
┌─────────────────────────────┐
│  📤 Поделиться треком       │
│                             │
│  🎵 Sunset Dreams           │
│  🎸 Pop                     │
├─────────────────────────────┤
│  [💬 Отправить в чат]       │
│  [👥 Поделиться с друзьями] │ ← switch_inline_query
│  [📖 Поделиться в Stories]  │
│  [🔗 Копировать ссылку]     │
│  [🔙 Назад к треку]         │
└─────────────────────────────┘
```

**Код**:

```typescript
// menus/share-menu.ts
export const createShareMenu = (trackId: string) => {
  return new InlineKeyboard()
    .text("💬 Отправить в чат", `share_chat_${trackId}`)
    .row()
    .switchInline("👥 С друзьями", `track_${trackId}`)
    .row()
    .text("📖 В Stories", `share_story_${trackId}`)
    .row()
    .text("🔗 Копировать ссылку", `share_link_${trackId}`)
    .row()
    .text("🔙 Назад", `track_${trackId}`);
};
```

**Acceptence Criteria**:

- ✅ Все способы шаринга работают
- ✅ Ссылка копируется в буфер
- ✅ Stories API интегрирован

---

### 6.3 Emoji Status

**Приоритет**: 🟢 Medium

**Задачи**:

- [ ] Интеграция с Telegram Emoji Status API
- [ ] Добавить кнопку "🎵 Установить статус"
- [ ] Показывать текущий трек в статусе (временно)
- [ ] Автоматическое удаление статуса через N минут

**Пример**:

```
Пользователь слушает "Sunset Dreams"
→ Статус: 🎵 Слушаю AI-трек (1 час)
→ После прослушивания статус удаляется
```

**Acceptence Criteria**:

- ✅ Статус устанавливается
- ✅ Автоматическое удаление
- ✅ Красивая анимация эмодзи

---

### 6.4 AI Lyrics Assistant

**Приоритет**: 🟢 Medium

**Задачи**:

- [ ] Добавить команду `/lyrics <тема>`
- [ ] Интеграция с GPT/Gemini через Supabase AI
- [ ] Генерация лирики по запросу
- [ ] Кнопка "Использовать для трека"

**Пример диалога**:

```
User: /lyrics love and summer
Bot:
🎤 Генерирую лирику...

📝 Generated Lyrics:
[Verse 1]
Summer breeze, warm embrace
Your smile lights up this place
...

[Chorus]
Love like summer, never ends
...

[✅ Использовать] [🔄 Перегенерировать]
```

**Acceptence Criteria**:

- ✅ Лирика генерируется < 5 сек
- ✅ Структура (Verse/Chorus) корректная
- ✅ Можно использовать в `/generate`

---

### 6.5 Stems UI

**Приоритет**: 🟡 High

**Задачи**:

- [ ] Создать экран "Разделение трека"
- [ ] Показывать прогресс генерации стемов
- [ ] Отправлять ZIP с файлами (vocals, drums, bass, other)
- [ ] Добавить превью стемов (waveform)

**Макет**:

```
┌─────────────────────────────┐
│  ✂️ Разделение трека        │
│                             │
│  🎵 Sunset Dreams           │
│                             │
│  ⏳ Генерация стемов...     │
│  ████████████░░░░░  75%     │
│                             │
│  ✅ Vocals (готово)         │
│  ✅ Drums (готово)          │
│  ⏳ Bass (обработка...)     │
│  ⏸️ Other (в очереди)       │
├─────────────────────────────┤
│  [📥 Скачать все (ZIP)]     │
│  [🔙 К треку]               │
└─────────────────────────────┘
```

**Acceptence Criteria**:

- ✅ Прогресс отображается
- ✅ ZIP файл отправляется
- ✅ Можно скачать отдельные стемы

---

## Технические требования

### Performance

- Время ответа бота: < 500ms (90 percentile)
- Загрузка медиа: < 2 секунды
- Поддержка: 100+ одновременных пользователей

### Security

- JWT токены для авторизации
- RLS policies для всех таблиц
- Rate limiting: 10 запросов/минуту на пользователя
- Валидация `initData` через HMAC

### Monitoring

- Логирование всех запросов (Supabase Logs)
- Метрики: DAU, MAU, треки в день
- Alerts: ошибки > 5% за 5 минут

---

## Testing Plan

### Unit Tests

```typescript
describe("Navigation Handler", () => {
  it("should render track on lib_page callback", async () => {
    const ctx = mockContext({ match: ["lib_page_2", "2"] });
    await navigationHandler.middleware()(ctx, jest.fn());
    expect(ctx.editMessageMedia).toHaveBeenCalled();
  });
});
```

### Integration Tests

- Полный flow: /start → library → play → back
- Deep linking: `t.me/bot?start=track_123`
- Inline режим: поиск → отправка

### E2E Tests (Playwright)

```typescript
test("User can navigate library", async ({ page }) => {
  await page.goto("https://web.telegram.org");
  await page.click('[data-testid="bot-menu"]');
  await page.click("text=Библиотека");
  await page.click('[data-testid="next-track"]');
  expect(await page.textContent(".track-title")).toBe("Track 2");
});
```

---

## Rollout Plan

### Phase 1: Alpha (10 пользователей)

- Внутренняя команда + друзья
- Сбор багов и фидбека

### Phase 2: Beta (100 пользователей)

- Приглашения через форму
- A/B тестирование UI

### Phase 3: Public Launch

- Открытый доступ
- Пресс-релиз
- Маркетинговая кампания

---

## Risks & Mitigation

| Риск                         | Вероятность | Митигация                   |
| ---------------------------- | ----------- | --------------------------- |
| Высокая нагрузка на Suno API | Средняя     | Кэширование + rate limiting |
| Ошибки `editMessageMedia`    | Высокая     | Fallback на новые сообщения |
| Большие файлы (stems)        | Средняя     | Компрессия + CDN            |
| Спам-атаки                   | Низкая      | Rate limiting + CAPTCHA     |

---

## Success Metrics

### Sprint 5

- ✅ 100% команд мигрированы на grammY
- ✅ < 500ms время отклика (p90)
- ✅ 0 критических багов

### Sprint 6

- ✅ Inline режим используют 30%+ пользователей
- ✅ Share menu: 50+ шарингов/день
- ✅ AI Lyrics: 20+ генераций/день

---

**Автор**: MusicVerse Team  
**Дата**: 2024  
**Версия**: 2.0
