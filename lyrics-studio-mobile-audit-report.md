# Аудит мобильного UI Lyrics Studio (Telegram Mini App)

**Дата:** 2026-07-26
**Контекст:** Telegram Mini App WebView на iOS/Android
**Проект:** MusicVerse AI

---

## 1. ПРОБЛЕМА ВСТАВКИ ТЕКСТА — Paste Issue

### 1.1 EditableLyricsContent.tsx — onBlur убивает редактирование при вставке

**Файл:** `src/components/lyrics-workspace/EditableLyricsContent.tsx`
**Строки:** 61–64, 77–79, 89–105

**Описание:**
Компонент использует click-to-edit паттерн: при клике на `<div>` отображается `<Textarea>`, при потере фокуса (onBlur) — сохраняет и закрывается. Это смертельно для мобильной вставки текста в Telegram:

1. **`onBlur={handleSave}` (строка 95):** На iOS Telegram WebView, когда пользователь тапает по текстовому полю, клавиатура поднимается — и сразу же может сработать `blur`, потому что Telegram динамически ресайзит WebView. Текстовая область исчезает (заменяется на `<div>`), и текст из буфера обмена вставить некуда.

2. **Нет `onPaste`:** Компонент не обрабатывает событие `onPaste` — полагается на дефолтное поведение `<textarea>`, которое в Telegram WebView может блокироваться (Telegram перехватывает системные действия с буфером обмена на iOS).

3. **Selections на iOS:** Строки 55–56: `selectionStart = value.length` — фокус в конец. Если пользователь хотел вставить в середину, он не успевает изменить позицию курсора до того, как blur спровоцирован клавиатурой.

**Рекомендация:**

- Заменить `onBlur={handleSave}` на явную кнопку "Готово" или `onBlur` с задержкой (debounce 300–500ms).
- Добавить `onPaste`-обработчик, который обрабатывает `e.clipboardData.getData('text/plain')` напрямую и обновляет `editValue`.
- Рассмотреть `pointer-events: auto` / `user-select: auto` на мобильной клавиатуре.

### 1.2 LyricsWorkspace.tsx — Диалог импорта через Dialog+Textarea

**Файл:** `src/components/lyrics-workspace/LyricsWorkspace.tsx`
**Строки:** 367–398

**Описание:**
Диалог импорта текста использует стандартную обёртку `Dialog` → `Textarea` (строка 381) с `autoFocus` (строка 386). Проблемы:

1. **`autoFocus` (строка 386):** В Telegram WebView на iOS фокус, установленный через `autoFocus` при открытии `Dialog`, может перехватываться или теряться. Telegram может открыть системную клавиатуру до того, как диалог полностью отрисован.

2. **Отсутствие `onPaste` (строка 381–387):** Пользователь не может вставить текст напрямую. `handleImportText` (строка 104–149) ожидает ручного нажатия кнопки "Вставить".

3. **Асинхронный `import()` в `handleImportText` (строка 110):** Динамический импорт `lyricsEditorHelpers` может фейлиться в медленных Telegram WebView на старых устройствах — код падает в `catch` (строка 136), создавая секцию verse с сырым текстом, что ломает парсинг.

**Рекомендация:**

- Добавить `onPaste`-обработчик на Textarea с `e.preventDefault()` и `setImportText(e.clipboardData.getData('text/plain'))`.
- В `handleImportText` использовать синхронный импорт (поменять на статический импорт наверху файла).
- Убрать `autoFocus`, заменить на `useEffect` с задержкой 300ms.

### 1.3 Telegram WebView Clipboard — системные ограничения

**Описание:**
Во всех файлах используется только `navigator.clipboard.writeText()` (запись), нигде — `navigator.clipboard.readText()` (чтение). В Telegram Mini App на iOS:

1. `navigator.clipboard.readText()` требует разрешения `clipboard-read` в HTTP заголовках ИЛИ событие `onPaste` с пользовательским жестом. Без `onPaste` обработчика чтение буфера через JS API не сработает.
2. Пользователь может нажать "Вставить" на системной клавиатуре iOS — это вызывает `onPaste`. Если компонент не слушает `onPaste`, событие может дойти до React SyntheticEvent, но Telegram может его проглотить.

**Где используется clipboard (write only):**

- `StructuredLyricsDisplay.tsx` (строка 215)
- `StructuredLyricsPreview.tsx` (строка 163)
- `EnhancedMessages.tsx` (строка 55)
- `TranslateResultCard.tsx` (строка 38)
- `VocalMapResultCard.tsx` (строки 43, 56)
- `ParaphraseResultCard.tsx` (строка 34)
- `HookResultCard.tsx` (строка 35)
- `ProducerResultCard.tsx` (строка 58)

**Рекомендация:**

- Для вставки: использовать `onPaste` + `clipboardData.getData('text/plain')` во всех текстовых областях и полях ввода.
- Добавить fallback через `document.execCommand('paste')` (устаревший, но рабочий в Telegram WebView).

---

## 2. ПЕРЕКРЫТИЕ ОВЕРЛЕЯ — Overlay Overlap

### 2.1 MobileAIAgentPanel — fixed overlay пропускает скролл

**Файл:** `src/components/lyrics-workspace/ai-agent/MobileAIAgentPanel.tsx`
**Строки:** 414–427, 504–557

**Описание:**
Панель использует `fixed inset-0 z-[100]` (строка 420) — это корректно, но есть критические проблемы:

1. **Нет `overscroll-behavior: none`:** На мобильном Telegram WebView жест скролла, достигнув края `ScrollArea` внутри панели (строка 505), может "протечь" на body и прокрутить редактор, который находится под overlay. Нужен `overscroll-behavior: contain` на панели.

2. **`touch-action` не контролируется:** На панели не задан `touch-action: manipulation` или `touch-action: pan-y`. Telegram WebView иногда обрабатывает touch события на уровне вебвью до того, как они доходят до JS.

3. **Editor в DOM под overlay:** В `LyricsStudioPage.tsx` (строка 474–540) `LyricsEditor` и `LyricsAIPanel` — дети одного flex-контейнера. На mobile `MobileAIAgentPanel` уходит из потока (`fixed`), но редактор остаётся в DOM. При быстром анимированном закрытии панели (`AnimatePresence`, `exit={{ opacity: 0, y: "100%" }}`, строка 418) — во время анимации z-index может перекрываться некорректно, и тач-события попадают в редактор.

4. **`pointer-events` не отключены на редакторе:** Нет `pointer-events: none` на `LyricsEditor` или его контейнере, когда `aiPanelOpen === true`. В строках 476–493 редактор рендерится без проверки `aiPanelOpen`.

**Строки в LyricsStudioPage.tsx: 473–540:**

```tsx
<div className="flex-1 overflow-hidden flex">      {/* ← line 474 */}
  <div className="flex-1 min-w-0 ...">
    <LyricsEditor ... />                              {/* ← line 476, всегда в DOM */}
    <LyricsAIPanel ... />                             {/* ← line 495 */}
  </div>
</div>
```

**Рекомендация:**

- Добавить на overlay: `style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}`.
- При `isOpen === true`: добавить `pointer-events: none` на контейнер редактора (можно через CSS-класс).
- Обернуть `LyricsEditor` в условный рендеринг или затемнение: если панель открыта на mobile, скрыть редактор за `opacity: 0` или `display: none`.
- Добавить `onTouchMove` с `e.preventDefault()` на overlay для предотвращения протекания скролла.

### 2.2 LyricsAIPanel.tsx — мобильный FAB z-index конфликт

**Файл:** `src/pages/lyrics-studio/LyricsAIPanel.tsx`
**Строки:** 242–265

**Описание:**
Мобильный FAB (плавающая кнопка AI) использует `fixed z-40` (строка 246). Потенциально может перекрываться с Telegram MainButton, который Telegram рендерит поверх Mini App (z-index примерно 10000+). Bottom calc (строка 250) учитывает `tg-content-safe-area-inset-bottom` + `5rem` — но если MainButton видим, FAB будет под ним, что корректно.

**Рекомендация:**

- Добавить проверку `isMainButtonVisible` из `useTelegram()` и динамически поднимать FAB выше при скрытом MainButton.
- Увеличить z-index на FAB до `z-[90]` (между контентом и оверлеем AI).

---

## 3. НЕРАБОТАЮЩИЕ ФУНКЦИИ — Non-working functions

### 3.1 useTelegramMainButton в MobileAIAgentPanel

**Файл:** `src/components/lyrics-workspace/ai-agent/MobileAIAgentPanel.tsx`
**Строки:** 181–194

**Файл хука:** `src/hooks/telegram/useTelegramMainButton.ts`
**Строки:** 82–89, 96–113

**Проблемы:**

1. **Условие видимости (MobileAIAgentPanel.tsx строка 191):**

   ```tsx
   visible: hasGeneratedLyrics && isOpen && !isLoading && !isWorkflowRunning,
   ```

   `hasGeneratedLyrics` (строка 161–163) = `messages.some(m => m.role === "assistant" && m.data?.lyrics)`. Если AI сгенерировал структурированные данные (анализ, хук, перевод), но не полные лирики — MainButton никогда не появится. Пользователь не может применить результат.

2. **`isRealMiniApp` неверно определяется (useTelegramMainButton.ts строка 83–85):**

   ```tsx
   const isRealMiniApp = Boolean(hasMainButtonAPI && platform && platform !== "web" && platform !== "");
   ```

   Если `platform === ""` (пустая строка — бывает при инициализации Telegram WebView или в тестовой среде), `isRealMiniApp = false`. MainButton не отображается нативно, а UI fallback не рендерится (в MobileAIAgentPanel нет `<Button>` для `shouldShowUIButton`). Кнопка полностью отсутствует.

3. **Двойная подписка (useTelegramActions.ts строка 38):**
   ```tsx
   webApp.MainButton.onClick(onClick);
   ```
   Дважды подписывается: один раз через `showMainButton` (строка 38) и ещё раз через `mainButtonCallbackRef` + `onClick` (строки 28–33). При клике коллбэк может вызваться дважды.

**Рекомендация:**

- Заменить `hasGeneratedLyrics` на условие, показывающее MainButton для ЛЮБОГО результата AI (анализ, перевод, хуки, лирики).
- В `isRealMiniApp` добавить fallback: если `platform === ""` но `hasMainButtonAPI === true` — считать, что это реальный Mini App.
- Убрать дублирующуюся подписку `onClick` в `showMainButton` — либо через `onClick`, либо через `mainButtonCallbackRef`.

### 3.2 useTelegramBackButton в LyricsStudioPage

**Файл:** `src/hooks/telegram/useTelegramBackButton.ts`
**Строки:** 43–93

**Файл:** `src/pages/lyrics-studio/LyricsStudioPage.tsx`
**Строки:** 127–136

**Проблемы:**

1. **`isRealMiniApp` (useTelegramBackButton.ts строка 59):**

   ```tsx
   const isRealMiniApp = Boolean(platform && platform !== "web" && platform !== "" && !isDevelopmentMode);
   ```

   Те же проблемы с `platform === ""`. На iOS Telegram WebView `platform` может быть `"ios"`, но если SDK не инициализирован полностью — значение ещё не установлено.

2. **Возвращаемое значение `shouldShowUIButton` не используется:**
   Хук возвращает `{ isRealMiniApp, shouldShowUIButton }` (строка 89–92), но в `LyricsStudioPage` (строка 127) не проверяется результат. Нет UI-кнопки "Назад" для dev-режима или web-превью.

3. **BackButton видим всегда:**
   `visible: true` (строка 128). Даже когда AI-панель открыта и показывает свой `DialogHeader` с крестиком. Пользователь может нажать системную кнопку "Назад" и выйти из редактора, потеряв несохранённые изменения.

4. **`isVersionAtLeast("6.1")` (useTelegramActions.ts строка 100):**
   BackButton API доступен только с Telegram SDK 6.1+. Если пользователь использует старую версию Telegram, вызовы `show()/hide()` молча падают в `catch` (строки 104–108).

**Рекомендация:**

- Проверять `platform` с задержкой на инициализацию (подписаться на `isInitialized` из `useTelegram()`).
- Рендерить UI-кнопку "Назад" в `LyricsStudioPage` при `shouldShowUIButton === true`.
- Установить `visible` в `false` при `aiPanelOpen === true` (пока AI-панель открыта, не показывать BackButton, чтобы избежать неожиданного выхода).

### 3.3 useVoiceInput в MobileAIAgentPanel

**Файл:** `src/hooks/useVoiceInput.ts`
**Строки:** 15–158

**Файл:** `src/components/lyrics-workspace/ai-agent/MobileAIAgentPanel.tsx`
**Строки:** 153–159

**Проблемы:**

1. **`getUserMedia` заблокирован в Telegram WebView (useVoiceInput.ts строка 28):**
   - На iOS Telegram Mini App, `navigator.mediaDevices.getUserMedia` требует:
     - `media` permission в Content-Security-Policy HTTP-заголовка.
     - Пользовательского жеста (тапа) непосредственно перед вызовом.
   - Если CSP не настроен, `getUserMedia` выбросит `NotAllowedError` или `NotFoundError`. Ошибка ловится (строка 123–128), пользователь видит "Нет доступа к микрофону" — но это финально: голосовой ввод никогда не работает на iOS.

2. **Base64 encoding для больших файлов (строки 67–73):**

   ```tsx
   let binary = "";
   for (let i = 0; i < uint8Array.length; i += chunkSize) {
     const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
     binary += String.fromCharCode.apply(null, Array.from(chunk));
   }
   ```

   На больших записях (30+ секунд) это создаёт гигантские строки в памяти. `String.fromCharCode.apply(null, largeArray)` может превысить стэк аргументов JavaScript. Edge Function `speech-to-text` получит base64 размером >10MB, что вызовет таймаут.

3. **Supabase Edge Function зависимость:**
   `supabase.functions.invoke("speech-to-text")` (строка 76) и `supabase.functions.invoke("correct-text")` (строка 91). Если хотя бы одна из функций не развёрнута или упала — вся запись теряется. Нет fallback (отправить сырой текст без коррекции).

**Рекомендация:**

- Добавить проверку: `navigator.mediaDevices?.getUserMedia !== undefined`. Если нет — показать сообщение "Голосовой ввод недоступен в этом браузере".
- Использовать `Blob.text()` или `FileReader.readAsDataURL` вместо ручного бинарного цикла.
- Добавить таймаут записи (30 секунд), после которого запись автоматически останавливается.
- Сделать `correct-text` опциональным: если фейлится, отправлять сырой распознанный текст.

### 3.4 renderToolPanel в мобильном контексте

**Файл:** `src/components/lyrics-workspace/ai-agent/MobileAIAgentPanel.tsx`
**Строки:** 263–295, 485

**Описание:**
`renderToolPanel` возвращает один из 9 tool-панелей. Проблемы:

1. **AnimatePresence без motion (строка 485):**

   ```tsx
   <AnimatePresence mode="wait">{renderToolPanel()}</AnimatePresence>
   ```

   Tool-панели не обёрнуты в `<motion.div>`, поэтому `AnimatePresence` не может анимировать вход/выход. Компоненты появляются/исчезают мгновенно.

2. **Tool-панели не фиксированные (не fixed/absolute):**
   Панели рендерятся в потоке flex-контейнера (строка 414: `fixed inset-0 z-[100] bg-background flex flex-col`). Когда tool-панель открывается (`WriteToolPanel`, `AnalyzeToolPanel` и т.д.), она раздвигает содержимое вниз, и пользователю приходится скроллить, чтобы добраться до поля ввода.

3. **Все 9 панелей импортируются всегда (строки 21–30):**
   Нет lazy-loading. На мобильном устройстве с медленным интернетом загрузка всех панелей сразу замедляет первый рендер.

**Рекомендация:**

- Обернуть каждую tool-панель в `<motion.div>` с `initial/animate/exit` для анимации.
- Tool-панели рендерить как absolute внутри контейнера сообщений (не раздвигая поток).
- Использовать `React.lazy()` + `<Suspense>` для отложенной загрузки панелей.

---

## 4. ДОПОЛНИТЕЛЬНЫЕ НАХОДКИ

### 4.1 Telegram SDK — silent failures

**Файл:** `src/contexts/telegram/useTelegramActions.ts`
**Строки:** 25–49, 99–123

Все Telegram API вызовы обёрнуты в try-catch с логгированием через `logger.warn`/`logger.debug`. Проблема: если логгер не сконфигурирован для remote-отправки, ошибки проглатываются без уведомления пользователя. Функции визуально не работают, но никто не знает почему.

### 4.2 LyricsStudioPage — нет confirmation on back

**Файл:** `src/pages/lyrics-studio/LyricsStudioPage.tsx`
**Строки:** 110, 314–326

При `isDirty === true` (есть несохранённые изменения), нажатие BackButton не спрашивает подтверждения:

- `handleBack` (строка 314–326) сразу навигирует.
- Telegram BackButton (строка 127–136) вызывает `handleBack` без проверки `isDirty`.
- Нет вызова `enableClosingConfirmation()` из Telegram WebApp SDK.

---

## СВОДНАЯ ТАБЛИЦА

| #   | Компонент             | Файл:строка                    | Серьёзность | Описание                                                  | Рекомендация                                 |
| --- | --------------------- | ------------------------------ | ----------- | --------------------------------------------------------- | -------------------------------------------- |
| 1   | EditableLyricsContent | EditableLyricsContent.tsx:95   | **HIGH**    | `onBlur={handleSave}` убивает вставку на mobile Telegram  | Debounce blur, добавить onPaste              |
| 2   | LyricsWorkspace       | LyricsWorkspace.tsx:367-398    | **HIGH**    | Dialog импорта без onPaste, autoFocus ломает Telegram     | Добавить onPaste, убрать autoFocus           |
| 3   | Clipboard             | Все редактируемые поля         | **HIGH**    | Нет обработки onPaste через clipboardData                 | Добавить onPaste везде                       |
| 4   | MobileAIAgentPanel    | MobileAIAgentPanel.tsx:420     | **MEDIUM**  | Нет `overscroll-behavior: contain` / `touch-action`       | Добавить CSS-свойства для блокировки скролла |
| 5   | LyricsStudioPage      | LyricsStudioPage.tsx:474-538   | **MEDIUM**  | Editor в DOM под overlay, нет pointer-events: none        | Скрывать редактор при открытой AI-панели     |
| 6   | useTelegramMainButton | MobileAIAgentPanel.tsx:191     | **HIGH**    | MainButton не показывается при `hasGeneratedLyrics=false` | Расширить условие на любые результаты AI     |
| 7   | useTelegramMainButton | useTelegramMainButton.ts:83-85 | **HIGH**    | `isRealMiniApp=false` при пустой платформе                | Добавить fallback через hasMainButtonAPI     |
| 8   | useTelegramMainButton | MobileAIAgentPanel.tsx:182-194 | **MEDIUM**  | Нет UI fallback кнопки для dev/web режима                 | Рендерить Button при shouldShowUIButton      |
| 9   | useTelegramBackButton | useTelegramBackButton.ts:59    | **HIGH**    | `isRealMiniApp=false` при пустой платформе                | Учесть `isInitialized` из TelegramContext    |
| 10  | useTelegramBackButton | LyricsStudioPage.tsx:127-136   | **MEDIUM**  | BackButton видим всегда, даже при открытой AI-панели      | Скрывать при aiPanelOpen                     |
| 11  | useTelegramBackButton | LyricsStudioPage.tsx:127       | **LOW**     | shouldShowUIButton не используется                        | Рендерить UI-кнопку при !isRealMiniApp       |
| 12  | useVoiceInput         | useVoiceInput.ts:28            | **HIGH**    | getUserMedia может быть заблокирован в Telegram WebView   | Добавить фичу-чек, таймаут, fallback         |
| 13  | useVoiceInput         | useVoiceInput.ts:67-73         | **MEDIUM**  | Неэффективное base64 кодирование больших записей          | Использовать Blob.text() или FileReader      |
| 14  | renderToolPanel       | MobileAIAgentPanel.tsx:485     | **LOW**     | AnimatePresence без motion-компонентов                    | Обернуть панели в motion.div                 |
| 15  | Tool panels           | MobileAIAgentPanel.tsx:263-295 | **MEDIUM**  | Панели раздвигают контент вместо absolute/overlay         | Рендерить как absolute                       |
| 16  | LyricsStudioPage      | LyricsStudioPage.tsx:314-326   | **MEDIUM**  | Нет подтверждения при isDirty=true и BackButton           | Добавить confirm dialog                      |
| 17  | Telegram API          | useTelegramActions.ts          | **LOW**     | Все ошибки молча логируются, пользователь не видит        | Добавить toast для критических ошибок        |

---

## Файлы, проанализированные в аудите

- `src/pages/lyrics-studio/LyricsStudioPage.tsx` — 581 строк
- `src/components/lyrics-workspace/EditableLyricsContent.tsx` — 123 строки
- `src/components/lyrics-workspace/LyricsWorkspace.tsx` — 516 строк
- `src/components/lyrics-workspace/ai-agent/MobileAIAgentPanel.tsx` — 609 строк
- `src/pages/lyrics-studio/LyricsAIPanel.tsx` — 268 строк
- `src/pages/lyrics-studio/LyricsEditor.tsx` — 105 строк
- `src/hooks/telegram/useTelegramMainButton.ts` — 151 строка
- `src/hooks/telegram/useTelegramBackButton.ts` — 93 строки
- `src/hooks/useVoiceInput.ts` — 158 строк
- `src/contexts/telegram/TelegramProvider.tsx` — 94 строки
- `src/contexts/telegram/useTelegramActions.ts` — 531 строка
- `src/components/ui/textarea.tsx` — 32 строки
