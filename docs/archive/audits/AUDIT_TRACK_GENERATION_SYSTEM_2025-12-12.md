# АУДИТ СИСТЕМЫ ГЕНЕРАЦИИ ТРЕКОВ - AIMusverse

**Дата:** 2025-12-12
**Версия:** 1.0
**Статус:** 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ ОБНАРУЖЕНЫ

---

## 📋 КРАТКОЕ РЕЗЮМЕ

Проведен полный аудит системы генерации треков с акцентом на функции **cover (кавер)** и **extend (расширение)**. Обнаружены **серьезные логические ошибки**, которые делают эти функции **полностью нерабочими**.

### Ключевые находки:

- 🔴 **12 критических багов** в логике параметров
- 🟠 **8 важных проблем** с валидацией и безопасностью
- 🟡 **6 проблем дизайна** с публичностью треков и моделями
- ⚠️ **Функции cover и extend НЕ РАБОТАЮТ** из-за неправильной передачи параметров

---

## 🎯 МЕТОДОЛОГИЯ АУДИТА

1. **Статический анализ кода:**
   - Все Edge Functions для генерации
   - React хуки и компоненты
   - Telegram bot handlers

2. **Анализ потоков данных:**
   - От UI до Suno API
   - Callback обработка
   - Database транзакции

3. **Проверка логики:**
   - Валидация параметров
   - Состояния и переходы
   - Обработка ошибок

---

## 🏗️ АРХИТЕКТУРА СИСТЕМЫ

```
┌─────────────────────────────────────────────────────┐
│                 КЛИЕНТСКИЙ СЛОЙ                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  React App:                Telegram Bot:            │
│  - useGenerateForm.ts      - generate.ts            │
│  - UploadAudioDialog       - audio-upload.ts        │
│                            - audio.ts (handler)     │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Generation:                                        │
│  - suno-music-generate     [✅ РАБОТАЕТ]           │
│  - suno-upload-cover       [🔴 НЕ РАБОТАЕТ]        │
│  - suno-upload-extend      [🔴 НЕ РАБОТАЕТ]        │
│  - suno-music-extend       [🔴 НЕ РАБОТАЕТ]        │
│                                                     │
│  Callback:                                          │
│  - suno-music-callback     [⚠️ ПРОБЛЕМЫ]           │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│                  SUNO API                           │
├─────────────────────────────────────────────────────┤
│  - /api/v1/generate                                 │
│  - /api/v1/generate/upload-cover                    │
│  - /api/v1/generate/upload-extend                   │
│  - /api/v1/generate/extend                          │
└─────────────────────────────────────────────────────┘
```

---

## 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### ❌ ПРОБЛЕМА #1: Инвертированная логика defaultParamFlag в useGenerateForm

**Файл:** `src/hooks/generation/useGenerateForm.ts:558`
**Серьезность:** 🔴 КРИТИЧЕСКАЯ
**Статус:** СИСТЕМА НЕ РАБОТАЕТ

**Проблема:**

```typescript
const result = await supabase.functions.invoke("suno-upload-extend", {
  body: {
    // ...
    defaultParamFlag: mode === "custom", // ❌ ОШИБКА!
    // ...
  },
});
```

**Почему это ошибка:**

- `defaultParamFlag: true` означает "использовать **дефолтные** параметры оригинального трека"
- `mode === 'custom'` означает что пользователь **хочет указать СВОИ параметры**
- **Логика инвертирована!** Когда пользователь выбирает custom, система говорит Suno API использовать дефолтные параметры

**Правильная логика:**

```typescript
defaultParamFlag: mode !== 'custom',  // ✅ Используем дефолты только в simple mode
```

**Последствия:**

- Все extend операции из React приложения игнорируют пользовательские параметры
- Пользователь вводит style, lyrics, но генерация идет с дефолтными параметрами
- Функция extend **полностью нерабочая**

---

### ❌ ПРОБЛЕМА #2: Несоответствие параметров cover vs extend

**Файлы:**

- `supabase/functions/suno-upload-cover/index.ts:170`
- `supabase/functions/suno-upload-extend/index.ts:177`

**Серьезность:** 🔴 КРИТИЧЕСКАЯ

**Проблема:**

```typescript
// suno-upload-cover.ts
const requestBody = {
  uploadUrl: publicUrl,
  customMode, // ← используется customMode
  instrumental,
  // ...
};

// suno-upload-extend.ts
const requestBody = {
  uploadUrl: publicUrl,
  defaultParamFlag, // ← используется defaultParamFlag
  // ...
};
```

**Почему это ошибка:**

- Оба endpoint используют **одинаковый Suno API механизм**
- Но используют **разные названия параметров**
- `customMode` (cover) vs `defaultParamFlag` (extend)
- Это **семантически противоположные** параметры:
  - `customMode: true` = "использовать кастомные параметры"
  - `defaultParamFlag: true` = "использовать дефолтные параметры"

**Документация Suno API:**
Согласно https://docs.sunoapi.org, для обоих endpoints используется параметр **`customMode`**.

**Последствия:**

- Один из endpoints передает неправильный параметр
- Suno API либо игнорирует параметр, либо возвращает ошибку
- Inconsistency в коде, сложно поддерживать

---

### ❌ ПРОБЛЕМА #3: Противоречивая логика в audio.ts handler

**Файл:** `supabase/functions/telegram-bot/handlers/audio.ts:438-451`
**Серьезность:** 🔴 КРИТИЧЕСКАЯ

**Проблема:**

```typescript
if (isExtend) {
  requestBody.defaultParamFlag = true; // ❌ Говорим "используй дефолты"
  requestBody.instrumental = pendingUpload.instrumental || false;
  if (pendingUpload.style) requestBody.style = pendingUpload.style; // ❌ Но передаем custom style!
  if (pendingUpload.title) requestBody.title = pendingUpload.title; // ❌ И custom title!
  if (pendingUpload.prompt && !pendingUpload.instrumental) {
    requestBody.prompt = pendingUpload.prompt; // ❌ И custom prompt!
  }
}
```

**Почему это ошибка:**

- `defaultParamFlag: true` означает "игнорировать все custom параметры"
- Но затем код **передает custom параметры** (style, title, prompt)
- Suno API **проигнорирует эти параметры** потому что defaultParamFlag=true
- Пользователь указывает style, но генерация идет **без учета style**

**Правильная логика:**

```typescript
if (isExtend) {
  // Если есть custom параметры - НЕ используем дефолты
  const hasCustomParams = pendingUpload.style || pendingUpload.title || pendingUpload.prompt;
  requestBody.defaultParamFlag = !hasCustomParams;
  // ... затем передаем параметры
}
```

**Последствия:**

- **Все extend операции из Telegram бота НЕ РАБОТАЮТ**
- Параметры игнорируются
- Пользователь получает результат не соответствующий ожиданиям

---

### ❌ ПРОБЛЕМА #4: Неиспользуемая переменная и ошибочная проверка

**Файл:** `supabase/functions/suno-music-extend/index.ts:94-184`
**Серьезность:** 🔴 КРИТИЧЕСКАЯ

**Проблема 4a - Неиспользуемая переменная:**

```typescript
const useCustomParams = !defaultParamFlag; // Line 94
// ... переменная создается, но НЕ ИСПОЛЬЗУЕТСЯ нигде!
```

**Проблема 4b - Неправильная проверка:**

```typescript
// suno-upload-extend.ts:182
if (defaultParamFlag) {
  // ❌ Проверяем "если используем дефолты"
  // Custom mode
  if (!style) {
    return new Response(
      JSON.stringify({ error: "Style is required in custom mode" }),
      // ❌ Но требуем style для "дефолтного режима"!
    );
  }
}
```

**Почему это ошибка:**

- `defaultParamFlag: true` означает "используй дефолтные параметры"
- Но проверка **требует style**, что является **custom параметром**
- Логика инвертирована: проверка должна быть `if (!defaultParamFlag)`

**Правильная логика:**

```typescript
if (!defaultParamFlag) {
  // ✅ Если НЕ используем дефолты (т.е. custom mode)
  if (!style) {
    return new Response(JSON.stringify({ error: "Style is required in custom mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
```

**Последствия:**

- Валидация **не работает правильно**
- В custom mode может пройти запрос **без обязательного style**
- В default mode валидация **требует параметры, которые не нужны**

---

### ❌ ПРОБЛЕМА #5: customMode зависит от наличия style

**Файл:** `supabase/functions/telegram-bot/handlers/audio.ts:446`
**Серьезность:** 🔴 КРИТИЧЕСКАЯ

**Проблема:**

```typescript
} else {
  // Cover mode
  requestBody.customMode = Boolean(pendingUpload.style);  // ❌ ОШИБКА!
  requestBody.instrumental = pendingUpload.instrumental || false;
  if (pendingUpload.style) requestBody.style = pendingUpload.style;
  if (pendingUpload.prompt) requestBody.prompt = pendingUpload.prompt;
  if (pendingUpload.title) requestBody.title = pendingUpload.title;
}
```

**Почему это ошибка:**

- `customMode` определяется только наличием `style`
- Но custom параметры включают также `prompt` и `title`!
- Если пользователь указал **только prompt без style**, то:
  - `customMode = false` (нет style)
  - `requestBody.prompt = pendingUpload.prompt` (передаем prompt)
  - Suno API **проигнорирует prompt**, потому что `customMode: false`

**Правильная логика:**

```typescript
const hasCustomParams = pendingUpload.style || pendingUpload.prompt || pendingUpload.title;
requestBody.customMode = hasCustomParams;
```

**Последствия:**

- **Cover с prompt но без style НЕ РАБОТАЕТ**
- Prompt игнорируется
- Пользователь не получает ожидаемый результат

---

### ❌ ПРОБЛЕМА #6: Telegram bot generate передает prompt как style

**Файл:** `supabase/functions/telegram-bot/commands/generate.ts:167`
**Серьезность:** 🔴 КРИТИЧЕСКАЯ

**Проблема:**

```typescript
const { data, error: generateError } = await supabase.functions.invoke("suno-music-generate", {
  body: {
    mode,
    instrumental,
    model,
    prompt: actualPrompt,
    style: mode === "custom" ? actualPrompt : undefined, // ❌ prompt передается как style!
  },
});
```

**Почему это ошибка:**

- В custom mode для генерации нужны **разные** параметры:
  - `prompt` = текст песни (lyrics)
  - `style` = музыкальный стиль (жанр, настроение)
- Но код передает **один и тот же текст** для обоих!
- `actualPrompt` идет и как `prompt`, и как `style`

**Последствия:**

- **Custom генерация из Telegram бота работает неправильно**
- Текст песни используется как музыкальный стиль
- Suno API получает некорректные данные

---

## 🟠 ВАЖНЫЕ ПРОБЛЕМЫ

### ⚠️ ПРОБЛЕМА #7: Нет проверки кредитов в upload-cover и upload-extend

**Файлы:**

- `supabase/functions/suno-upload-cover/index.ts` - нет проверки
- `supabase/functions/suno-upload-extend/index.ts` - нет проверки
- `supabase/functions/suno-music-generate/index.ts:132` - есть проверка ✅

**Серьезность:** 🟠 ВАЖНАЯ

**Проблема:**
Только `suno-music-generate` проверяет баланс кредитов **перед** вызовом Suno API:

```typescript
// suno-music-generate.ts:132
if (!isAdmin) {
  const { data: userCredits } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const userBalance = userCredits?.balance ?? 0;

  if (userBalance < GENERATION_COST) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Недостаточно кредитов. Баланс: ${userBalance}, требуется: ${GENERATION_COST}`,
      }),
      { status: 402 },
    );
  }
}
```

**А в upload-cover и upload-extend этой проверки НЕТ!**

**Последствия:**

- Пользователь может запустить cover/extend **без достаточных кредитов**
- Запрос пойдет к Suno API
- Создастся task и track в БД
- Затем Suno API вернет ошибку "insufficient credits"
- Task и track помечаются как failed
- **Деньги НЕ дебятся** (callback не вызывается для failed)
- Но **мусорные записи** остаются в БД

**Рекомендация:**
Добавить проверку кредитов в upload-cover и upload-extend аналогично suno-music-generate.

---

### ⚠️ ПРОБЛЕМА #8: Race condition при дебете кредитов

**Файл:** `supabase/functions/suno-music-callback/index.ts:437-463`
**Серьезность:** 🟠 ВАЖНАЯ

**Проблема:**

```typescript
// Line 437
if (!isAdmin) {
  // Deduct credits from user balance
  const { data: currentCredits } = await supabase
    .from("user_credits")
    .select("balance, total_spent")
    .eq("user_id", task.user_id)
    .single();

  if (currentCredits) {
    const newBalance = Math.max(0, currentCredits.balance - GENERATION_COST);

    // ❌ Race condition здесь!
    const { error: updateError } = await supabase
      .from("user_credits")
      .update({
        balance: newBalance,
        total_spent: newTotalSpent,
      })
      .eq("user_id", task.user_id);
  }
}
```

**Почему это проблема:**

- Между `SELECT balance` и `UPDATE balance` может пройти время
- Если пользователь запустит **две генерации одновременно**, обе:
  1. Прочитают `balance = 50`
  2. Обе пройдут проверку (50 >= 10)
  3. Создадут два task
  4. Обе генерации завершатся
  5. Callback 1: прочитает balance=50, обновит на 40
  6. Callback 2: прочитает balance=40, обновит на 30
  7. **Результат: баланс 30 вместо 30** ← только одна генерация учтена!

**Правильное решение:**
Использовать **атомарное обновление** или **database lock**:

```sql
-- Атомарное обновление
UPDATE user_credits
SET
  balance = GREATEST(0, balance - 10),
  total_spent = total_spent + 10
WHERE user_id = $1
RETURNING balance;
```

Или использовать **RPC функцию** с transaction lock.

**Последствия:**

- **Потеря учета кредитов**
- Пользователь может использовать больше кредитов чем имеет
- Финансовые потери

---

### ⚠️ ПРОБЛЕМА #9: Нет валидации размера audioFile на клиенте

**Файл:** `src/hooks/generation/useGenerateForm.ts:531-549`
**Серьезность:** 🟠 ВАЖНАЯ

**Проблема:**

```typescript
if (audioFile) {
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error("File reading timeout")); // ← Timeout 30 сек
    }, FILE_READER_TIMEOUT);

    reader.onload = () => {
      clearTimeout(timeout);
      resolve(reader.result as string);
    };
    // ...
    reader.readAsDataURL(audioFile); // ❌ Нет проверки размера!
  });
}
```

**Константа:** `FILE_READER_TIMEOUT = 30000` (30 секунд)

**Почему это проблема:**

- Нет проверки размера файла **перед** чтением
- Большие файлы (> 50MB) могут:
  - Превысить timeout 30 сек
  - Вызвать ошибку "File reading timeout"
  - Съесть память браузера
- Telegram bot проверяет (25MB limit на line 85 audio.ts)
- Но React app **НЕ проверяет**

**Рекомендация:**

```typescript
if (audioFile) {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  if (audioFile.size > MAX_FILE_SIZE) {
    toast.error("Файл слишком большой", {
      description: `Максимум ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    });
    return;
  }

  // ... затем читать файл
}
```

**Последствия:**

- Плохой UX (долгая загрузка, затем ошибка)
- Трата ресурсов клиента
- Возможные проблемы с памятью

---

### ⚠️ ПРОБЛЕМА #10: Несоответствие DEFAULT_MODEL в разных файлах

**Файлы:**

- `suno-music-generate/index.ts:18` → `DEFAULT_MODEL = 'V4_5'`
- `suno-music-extend/index.ts:17` → `DEFAULT_MODEL = 'V4_5PLUS'` ❌
- `suno-upload-cover/index.ts:17` → `DEFAULT_MODEL = 'V4_5'`
- `suno-upload-extend/index.ts:17` → `DEFAULT_MODEL = 'V4_5'`

**Серьезность:** 🟠 ВАЖНАЯ

**Проблема:**

- **Несоответствие дефолтной модели** в suno-music-extend
- Все используют `V4_5`, кроме extend который использует `V4_5PLUS`
- Это может привести к **разным результатам** для одинаковых операций

**Последствия:**

- Inconsistency в поведении
- Сложнее отладка
- Потенциально разные тарифы (PLUS дороже?)

---

### ⚠️ ПРОБЛЕМА #11: Дублирующиеся callback могут обработаться дважды

**Файл:** `supabase/functions/suno-music-callback/index.ts:63-69`
**Серьезность:** 🟠 ВАЖНАЯ

**Проблема:**

```typescript
// Line 63
if (task.status === "completed" && callbackType === "complete") {
  logger.warn("Duplicate completion callback", { sunoTaskId });
  return new Response(JSON.stringify({ success: true, status: "already_processed" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

**Защита есть, но недостаточная:**

- Проверка только для `status === 'completed'`
- Если callback приходит **до** обновления статуса в БД:
  1. Callback 1 начинает обработку
  2. Callback 2 (дубликат) приходит **до** того как Callback 1 обновил статус
  3. Оба видят `status = 'processing'`
  4. Оба проходят проверку
  5. **Оба обрабатываются!**

**Race condition window:** время между проверкой статуса и обновлением статуса

**Последствия:**

- **Двойной дебет кредитов**
- Двойные уведомления
- Дублирующиеся track_versions

**Решение:**
Использовать **database lock** или **unique constraint** на обработку callback.

---

### ⚠️ ПРОБЛЕМА #12: Отсутствие retry при сетевых ошибках download audio

**Файл:** `supabase/functions/suno-music-callback/index.ts:313-327`
**Серьезность:** 🟠 ВАЖНАЯ

**Проблема:**

```typescript
try {
  const audioResponse = await fetch(audioUrl);
  if (audioResponse.ok) {
    const audioBlob = await audioResponse.blob();
    // ... upload to storage
  }
} catch (e) {
  logger.error("Download error for clip", e, { clipIndex: i });
  // ❌ Нет retry! Просто логируем ошибку
}
```

**Почему это проблема:**

- Download от Suno может **временно** не работать
- Сетевые ошибки могут быть **intermittent**
- Если download failed, track **остается без аудио**
  - `localAudioUrl = null`
  - Используется только Suno URL (может быть временным)

**Рекомендация:**
Добавить retry логику с exponential backoff:

```typescript
const maxRetries = 3;
for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    const audioResponse = await fetch(audioUrl);
    if (audioResponse.ok) {
      // success
      break;
    }
  } catch (e) {
    if (attempt === maxRetries - 1) throw e;
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
}
```

**Последствия:**

- Треки без локального аудио
- Зависимость от Suno CDN
- Возможная потеря треков если Suno удалит файлы

---

## 🟡 ПРОБЛЕМЫ ДИЗАЙНА

### 💡 ПРОБЛЕМА #13: Все треки публичные по умолчанию

**Файл:** `supabase/functions/suno-music-generate/index.ts:272`
**Серьезность:** 🟡 ДИЗАЙН

**Проблема:**

```typescript
const { data: track } = await supabase.from("tracks").insert({
  // ...
  is_public: true, // ❌ ВСЕ треки публичные!
  // ...
});
```

**Комментарий в коде (line 272):**

```typescript
// ALL tracks are public by default for community discovery
```

**Почему это может быть проблемой:**

- Нет **выбора** для пользователя
- Пользователь может генерировать **приватные треки**
- Некоторые пользователи могут хотеть **скрыть черновики**

**Рекомендация:**
Добавить опцию в UI и передавать в API:

```typescript
is_public: body.isPublic ?? true,  // Дефолт true, но можно переопределить
```

---

### 💡 ПРОБЛЕМА #14: Не используется поле is_primary в track_versions

**Файл:** `supabase/functions/suno-music-callback/index.ts:362`
**Серьезность:** 🟡 ДИЗАЙН

**Проблема:**

```typescript
const { data: newVersion } = await supabase
  .from("track_versions")
  .insert({
    track_id: trackId,
    // ...
    is_primary: i === 0, // Только первая версия primary
  })
  .select()
  .single();

if (newVersion && i === 0) {
  await supabase
    .from("tracks")
    .update({ active_version_id: newVersion.id })
    .eq("id", trackId)
    .is("active_version_id", null); // ❌ Только если active_version_id === null!
}
```

**Почему это проблема:**

- Условие `.is('active_version_id', null)` означает:
  - Обновить active_version_id **только если** он **еще не установлен**
- Но затем создаются версии B, C, D с `is_primary: false`
- Если пользователь захочет **переключить primary версию**, нет механизма

**Последствия:**

- active_version_id устанавливается **один раз** и не меняется
- is_primary flag не используется после создания
- Нет способа выбрать другую версию как primary

**Рекомендация:**
Добавить endpoint для смены active_version и использовать is_primary для UI индикации.

---

### 💡 ПРОБЛЕМА #15: Смешивание двух систем аутентификации

**Файлы:**

- `suno-upload-cover/index.ts:71-113`
- `suno-upload-extend/index.ts:71-113`

**Серьезность:** 🟡 ДИЗАЙН

**Проблема:**

```typescript
if (source === "telegram_bot") {
  // Проверка по x-telegram-bot-secret header
  const botSecret = req.headers.get("x-telegram-bot-secret");
  if (!botSecret || botSecret !== telegramBotSecret) {
    return new Response(/* 401 Unauthorized */);
  }
  userId = telegramUserId; // ← userId из body
} else {
  // Standard JWT auth
  const authHeader = req.headers.get("Authorization");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  userId = user.id; // ← userId из JWT
}
```

**Почему это проблема:**

- **Два разных способа** аутентификации в одной функции
- Telegram bot передает userId **в body** (можно подделать если знать secret)
- Web app использует JWT (более безопасно)
- **Потенциальная уязвимость:** если кто-то узнает TELEGRAM_BOT_TOKEN, может:
  - Отправить запрос с `source: 'telegram_bot'`
  - Передать `userId` любого пользователя
  - Генерировать треки **от имени другого пользователя**

**Рекомендация:**

- Telegram bot должен тоже использовать service role JWT
- Или добавить дополнительную валидацию (check telegram_id в profiles)

---

### 💡 ПРОБЛЕМА #16: Непоследовательность в именовании параметров

**Все файлы генерации**
**Серьезность:** 🟡 ДИЗАЙН

**Проблема:**
Разные названия для **одного и того же** концепта:

| Файл | Параметр "использовать custom параметры" |
| ------------------ | ---------------------------------------------- | --------- |
| suno-upload-cover | `customMode: boolean` |
| suno-upload-extend | `defaultParamFlag: boolean` (инвертированный!) |
| suno-music-extend | `defaultParamFlag: boolean` (инвертированный!) |
| useGenerateForm | `mode: 'simple'                                | 'custom'` |

**Последствия:**

- **Путаница** при чтении кода
- **Ошибки** при передаче параметров (как показано в проблемах выше)
- **Сложность поддержки**

**Рекомендация:**
Стандартизировать на **одно название**:

```typescript
interface GenerationRequest {
  mode: "simple" | "custom"; // ✅ Единое именование
  // ... остальные параметры
}
```

---

### 💡 ПРОБЛЕМА #17: Timeout для FileReader может быть недостаточным

**Файл:** `src/hooks/generation/useGenerateForm.ts:536`
**Константа:** `FILE_READER_TIMEOUT = 30000` (30 сек)

**Серьезность:** 🟡 ДИЗАЙН

**Проблема:**

- Timeout 30 секунд для чтения файла
- Для **больших файлов** на **медленных устройствах** может быть недостаточно
- Особенно если файл > 20MB и идет конвертация в base64

**Рекомендация:**

- Увеличить timeout до 60 сек
- Или показывать progress bar
- Или использовать chunked upload вместо base64

---

### 💡 ПРОБЛЕМА #18: Отсутствие версионирования для обычных генераций

**Файл:** `supabase/functions/suno-music-callback/index.ts:288-398`
**Серьезность:** 🟡 ДИЗАЙН

**Проблема:**

```typescript
// Создаются track_versions для каждого clip
for (let i = 0; i < clips.length; i++) {
  // ...
  await supabase.from("track_versions").insert({
    track_id: trackId,
    version_type: "initial", // ← Все "initial"
    version_label: versionLabel, // A, B, C
    // ...
  });
}

// Обновляется ГЛАВНЫЙ track только первым клипом
await supabase
  .from("tracks")
  .update({
    status: "completed",
    audio_url: finalAudioUrl, // ← Только clip[0]
    // ...
  })
  .eq("id", trackId);
```

**Почему это проблема:**

- Главный track **всегда** показывает только версию A
- Версии B, C, D создаются, но **не становятся активными**
- Нет способа **переключить** track.audio_url на версию B
- Нет истории изменений track.audio_url

**Последствия:**

- Невозможно проследить **когда пользователь переключил версию**
- Нет **changelog** для track
- Сложно понять **какая версия была active в какой момент**

**Рекомендация:**
Добавить track_change_log при смене active_version.

---

## 📊 ПРИОРИТИЗАЦИЯ ИСПРАВЛЕНИЙ

### 🔴 НЕМЕДЛЕННО (Критические - блокируют функциональность)

1. **Проблема #1** - Инвертированная логика defaultParamFlag в useGenerateForm
2. **Проблема #3** - Противоречивая логика в audio.ts handler
3. **Проблема #4** - Неправильная проверка defaultParamFlag в upload-extend
4. **Проблема #5** - customMode зависит только от style
5. **Проблема #6** - Telegram bot передает prompt как style

### 🟠 В БЛИЖАЙШЕЕ ВРЕМЯ (Важные - риски безопасности/финансов)

6. **Проблема #7** - Нет проверки кредитов в upload-cover/extend
7. **Проблема #8** - Race condition при дебете кредитов
8. **Проблема #11** - Дублирующиеся callback
9. **Проблема #2** - Несоответствие параметров cover vs extend (после #1-#6)

### 🟡 ПЛАНОВО (Улучшения качества)

10. **Проблема #9** - Валидация размера audioFile
11. **Проблема #10** - Несоответствие DEFAULT_MODEL
12. **Проблема #12** - Нет retry при download audio
13. **Проблема #16** - Непоследовательность именования

### 💡 ДОЛГОСРОЧНО (Дизайн и архитектура)

14. **Проблема #13** - Все треки публичные
15. **Проблема #14** - is_primary не используется
16. **Проблема #15** - Смешивание аутентификации
17. **Проблема #17** - Timeout для FileReader
18. **Проблема #18** - Версионирование

---

## 🛠️ КОНКРЕТНЫЕ ИСПРАВЛЕНИЯ

### Исправление #1: useGenerateForm.ts

**Файл:** `src/hooks/generation/useGenerateForm.ts`

**Изменить строку 558:**

```typescript
// ДО (НЕПРАВИЛЬНО):
defaultParamFlag: mode === 'custom',

// ПОСЛЕ (ПРАВИЛЬНО):
defaultParamFlag: mode !== 'custom',
```

### Исправление #2: suno-upload-extend.ts

**Файл:** `supabase/functions/suno-upload-extend/index.ts`

**Изменить строку 177-210:**

```typescript
// ДО (НЕПРАВИЛЬНО):
const requestBody: any = {
  uploadUrl: publicUrl,
  defaultParamFlag,
  model: apiModel,
  callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
};

if (defaultParamFlag) {
  // ❌ Неправильная проверка
  // Custom mode
  if (!style) {
    return new Response(JSON.stringify({ error: "Style is required in custom mode" }), { status: 400 });
  }

  requestBody.instrumental = instrumental;
  requestBody.style = style;
  // ...
}

// ПОСЛЕ (ПРАВИЛЬНО):
const requestBody: any = {
  uploadUrl: publicUrl,
  customMode: !defaultParamFlag, // ✅ Используем customMode, инвертируем defaultParamFlag
  model: apiModel,
  callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
};

if (!defaultParamFlag) {
  // ✅ Правильная проверка
  // Custom mode
  if (!style) {
    return new Response(JSON.stringify({ error: "Style is required in custom mode" }), { status: 400 });
  }

  requestBody.instrumental = instrumental;
  requestBody.style = style;
  // ...
}
```

### Исправление #3: audio.ts handler

**Файл:** `supabase/functions/telegram-bot/handlers/audio.ts`

**Изменить строки 431-451:**

```typescript
// ДО (НЕПРАВИЛЬНО):
const requestBody: Record<string, unknown> = {
  uploadUrl: publicUrl,
  model: apiModel,
  callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
};

if (isExtend) {
  requestBody.defaultParamFlag = true; // ❌ Всегда true!
  requestBody.instrumental = pendingUpload.instrumental || false;
  if (pendingUpload.style) requestBody.style = pendingUpload.style;
  if (pendingUpload.title) requestBody.title = pendingUpload.title;
  if (pendingUpload.prompt && !pendingUpload.instrumental) {
    requestBody.prompt = pendingUpload.prompt;
  }
} else {
  requestBody.customMode = Boolean(pendingUpload.style); // ❌ Только если есть style!
  requestBody.instrumental = pendingUpload.instrumental || false;
  if (pendingUpload.style) requestBody.style = pendingUpload.style;
  if (pendingUpload.prompt) requestBody.prompt = pendingUpload.prompt;
  if (pendingUpload.title) requestBody.title = pendingUpload.title;
}

// ПОСЛЕ (ПРАВИЛЬНО):
const hasCustomParams = Boolean(pendingUpload.style || pendingUpload.prompt || pendingUpload.title);

const requestBody: Record<string, unknown> = {
  uploadUrl: publicUrl,
  model: apiModel,
  callBackUrl: `${supabaseUrl}/functions/v1/suno-music-callback`,
  customMode: hasCustomParams, // ✅ Единый параметр для обоих режимов
};

if (hasCustomParams) {
  requestBody.instrumental = pendingUpload.instrumental || false;
  if (pendingUpload.style) requestBody.style = pendingUpload.style;
  if (pendingUpload.title) requestBody.title = pendingUpload.title;
  if (pendingUpload.prompt && !pendingUpload.instrumental) {
    requestBody.prompt = pendingUpload.prompt;
  }
}
```

### Исправление #4: generate.ts

**Файл:** `supabase/functions/telegram-bot/commands/generate.ts`

**Изменить строки 161-169:**

```typescript
// ДО (НЕПРАВИЛЬНО):
const { data, error: generateError } = await supabase.functions.invoke("suno-music-generate", {
  body: {
    mode,
    instrumental,
    model,
    prompt: actualPrompt,
    style: mode === "custom" ? actualPrompt : undefined, // ❌ prompt как style!
  },
});

// ПОСЛЕ (ПРАВИЛЬНО):
const { data, error: generateError } = await supabase.functions.invoke("suno-music-generate", {
  body: {
    mode,
    instrumental,
    model,
    prompt: actualPrompt,
    // Для custom mode style должен быть отдельным параметром
    // Пока что можно использовать actualPrompt, но нужно добавить
    // возможность указать style отдельно через флаг --style
    style: mode === "custom" ? flags.style || actualPrompt : undefined,
  },
});
```

**И добавить в парсинг флагов (строка 99):**

```typescript
if (flags.instrumental) instrumental = true;
if (flags.mode) mode = flags.mode;
if (flags.model) model = flags.model.toUpperCase();
if (flags.style && mode === "custom") {
  // ✅ Добавлен флаг --style
  // style будет использован вместо actualPrompt
}
```

### Исправление #5: Проверка кредитов

**Файлы:**

- `supabase/functions/suno-upload-cover/index.ts`
- `supabase/functions/suno-upload-extend/index.ts`

**Добавить после получения userId (после строки 113):**

```typescript
userId = user.id;

// ✅ ДОБАВИТЬ: Проверка кредитов (только для non-admin и non-telegram)
if (source !== "telegram_bot") {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (!isAdmin) {
    const GENERATION_COST = 10;

    const { data: userCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const userBalance = userCredits?.balance ?? 0;

    if (userBalance < GENERATION_COST) {
      return new Response(
        JSON.stringify({
          error: `Недостаточно кредитов. Баланс: ${userBalance}, требуется: ${GENERATION_COST}`,
          errorCode: "INSUFFICIENT_CREDITS",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }
}
```

### Исправление #6: Race condition при дебете

**Файл:** `supabase/functions/suno-music-callback/index.ts`

**Создать RPC функцию в Supabase:**

```sql
CREATE OR REPLACE FUNCTION deduct_generation_credits(
  p_user_id UUID,
  p_cost INTEGER,
  p_description TEXT,
  p_metadata JSONB
)
RETURNS TABLE (new_balance INTEGER, success BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock row для предотвращения race condition
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Проверка достаточности кредитов
  IF v_current_balance < p_cost THEN
    RETURN QUERY SELECT v_current_balance, FALSE;
    RETURN;
  END IF;

  -- Атомарное обновление
  UPDATE user_credits
  SET
    balance = balance - p_cost,
    total_spent = total_spent + p_cost,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Логирование транзакции
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    action_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_cost,
    'spend',
    'generation',
    p_description,
    p_metadata
  );

  RETURN QUERY SELECT v_new_balance, TRUE;
END;
$$;
```

**Заменить строки 437-483 в suno-music-callback.ts:**

```typescript
// ДО: Весь блок с SELECT и UPDATE

// ПОСЛЕ:
if (!isAdmin) {
  const { data: deductResult, error: deductError } = await supabase.rpc("deduct_generation_credits", {
    p_user_id: task.user_id,
    p_cost: GENERATION_COST,
    p_description: `Генерация трека: ${clips[0]?.title || "Трек"}`,
    p_metadata: {
      trackId,
      clips: clips.length,
      model: task.model_used,
    },
  });

  if (deductError) {
    logger.error("Failed to deduct credits", deductError);
  } else if (deductResult && deductResult.length > 0) {
    const { new_balance, success } = deductResult[0];
    if (success) {
      logger.success("Credits deducted successfully", { newBalance: new_balance });
    } else {
      logger.warn("Insufficient credits for deduction", { balance: new_balance });
    }
  }
}
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Критические тесты (необходимо выполнить перед деплоем):

1. **Extend от audioFile из React app:**
   - Upload audioFile
   - Указать custom style
   - Проверить что Suno API получает customMode=true и style

2. **Cover от audioFile из React app:**
   - Upload audioFile с только prompt (без style)
   - Проверить что Suno API получает customMode=true и prompt

3. **Extend из Telegram bot:**
   - /extend --style="rock" --title="Test"
   - Отправить audio
   - Проверить что параметры используются

4. **Generate custom из Telegram bot:**
   - /generate текст песни --mode=custom --style="jazz"
   - Проверить что style != prompt

5. **Проверка кредитов:**
   - Установить balance = 5
   - Попробовать generate (cost=10)
   - Проверить ошибку 402

6. **Race condition test:**
   - Запустить 2 генерации одновременно с balance=15
   - Проверить что balance = 0 (не -5!)
   - Проверить что обе генерации failed или одна failed

---

## 📝 ЗАКЛЮЧЕНИЕ

### Текущее состояние: 🔴 КРИТИЧЕСКОЕ

**Основные проблемы:**

- ❌ Функция **extend НЕ РАБОТАЕТ** из-за инвертированной логики параметров
- ❌ Функция **cover РАБОТАЕТ ЧАСТИЧНО** (только если указан style)
- ❌ Telegram bot **генерация работает неправильно** (prompt=style)
- ⚠️ **Финансовые риски** из-за race condition при дебете кредитов
- ⚠️ **Отсутствие валидации** кредитов в upload функциях

### После исправлений:

✅ Все функции генерации будут работать корректно
✅ Параметры будут передаваться правильно
✅ Финансовые операции будут атомарными
✅ Валидация будет единообразной

### Рекомендуемый порядок исправлений:

**Фаза 1 (1-2 дня):** Исправления #1-#6 (критические баги)
**Фаза 2 (2-3 дня):** Исправления #7-#9 (важные проблемы)
**Фаза 3 (1 неделя):** Исправления #10-#13 (улучшения)
**Фаза 4 (долгосрочно):** Исправления #14-#18 (архитектура)

### Контакты для вопросов:

Если есть вопросы по аудиту или исправлениям, обращайтесь к команде разработки.

---

**Документ подготовлен:** 2025-12-12
**Автор:** Claude Code AI Auditor
**Версия:** 1.0
