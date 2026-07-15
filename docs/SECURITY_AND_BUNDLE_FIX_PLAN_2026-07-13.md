# 🔒 Детальный план устранения рисков и оптимизации Bundle

**Дата:** 2026-07-13  
**Основание:** Аудит интерфейса и интеграций [INTERFACE_INTEGRATION_AUDIT_2026-07-13.md](docs/audit/INTERFACE_INTEGRATION_AUDIT_2026-07-13.md) + `size-limit` CI failure  
**Цель:** Закрыть 3 HIGH-риска безопасности, оптимизировать bundle до green CI, устранить 5 Medium-рисков.

---

## 📋 Сводка по приоритетам

| Приоритет | Задачи                                  | Оценка (SP) | Риск при неисполнении                      |
| --------- | --------------------------------------- | ----------- | ------------------------------------------ |
| **P0**    | 3 HIGH-риска безопасности               | 8 SP        | Фишинг от бота, подмена треков, утечка PII |
| **P1**    | Bundle optimization + 5 Medium          | 13 SP       | CI красный, slow mobile, конфиг-хазард     |
| **P2**    | Гигиена (hex-цвета, any-касты, console) | 5 SP        | Технический долг                           |
| **Итого** |                                         | **26 SP**   |                                            |

---

## 🔴 P0 — Безопасность (до масштабирования)

### P0-1: HIGH-1 — Закрыть `send-telegram-notification` service-role guard

**Файл:** `supabase/functions/send-telegram-notification/index.ts` (1121 LOC)  
**Проблема:** `verify_jwt = false` + нет `authorize()` / `isServiceRoleToken()` guard. Любой может вызвать функцию с произвольным `chat_id` и отправить сообщение от имени бота.

**Паттерн исправления (из `_shared/auth.ts:152-176`):**

```typescript
// Добавить в начало обработчика (index.ts:566~):
import { authorize } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // HIGH-1 FIX: требовать service-role или авторизацию
  const auth = await authorize(req, { requireAdmin: false });
  if (!auth.ok && !auth.isService) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized — internal use only" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ... existing handler
});
```

**Проверка вызовов:** Убедиться, что все вызывающие функции передают `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}`:

- `supabase/functions/suno-music-callback/index.ts:47-54` (вызов `audit-log` через `Authorization: Bearer ${supabaseKey}`) — уже делает это правильно
- Проверить другие вызовы через `grep -n "send-telegram-notification" supabase/functions/`

**Тестирование:**

1. `curl` без заголовка → 401
2. `curl` с service-role → 200
3. `curl` с anon-key → 401

---

### P0-2: HIGH-2 — HMAC-верификация Suno callbacks

**Файлы:**

- `supabase/functions/suno-music-callback/index.ts` (1319 LOC)
- `supabase/functions/suno-wav-callback/index.ts`
- `supabase/functions/suno-cover-callback/index.ts`
- `supabase/functions/suno-vocal-callback/index.ts`
- `supabase/functions/lyrics-callback/index.ts`

**Проблема:** Все эти callback-функции `verify_jwt = false` и **не проверяют подпись** Suno. Единственная валидация — `checkRateLimit` (15/час).  
**Контраст:** `suno-voice-generate-callback/index.ts:7-26` уже реализует `verifySignature` с `X-Suno-Signature`.

#### Шаг 1: Создать shared helper

**Файл:** `supabase/functions/_shared/suno.ts` (текущий: 8 LOC)

```typescript
// Добавить в _shared/suno.ts
const WEBHOOK_SECRET = Deno.env.get("SUNO_WEBHOOK_SECRET");

/**
 * Verify Suno webhook HMAC-SHA256 signature.
 * Fail-closed: returns FALSE if secret is not configured.
 */
export async function verifySunoSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
): Promise<boolean> {
  if (!WEBHOOK_SECRET) {
    // FAIL-CLOSED (was fail-open in voice-callback)
    console.error("[suno] SUNO_WEBHOOK_SECRET not set, rejecting callback");
    return false;
  }
  if (!signature || !timestamp) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${payload}${timestamp}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison to prevent timing attacks
  if (hex.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < hex.length; i++) {
    result |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
```

#### Шаг 2: Применить ко всем callback-функциям

**Пример для `suno-music-callback/index.ts:108~`:**

```typescript
import { verifySunoSignature } from "../_shared/suno.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // HIGH-2 FIX: verify signature before processing
  const rawBody = await req.text();
  const sig = req.headers.get("X-Suno-Signature") || req.headers.get("x-suno-signature");
  const ts = req.headers.get("X-Suno-Timestamp") || req.headers.get("x-suno-timestamp");
  if (!(await verifySunoSignature(rawBody, sig, ts))) {
    return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = JSON.parse(rawBody);
  // ... rest of handler
});
```

**Повторить для:** `suno-wav-callback`, `suno-cover-callback`, `suno-vocal-callback`, `lyrics-callback`.

#### Шаг 3: Пофиксить fail-open в `suno-voice-generate-callback`

**Файл:** `supabase/functions/suno-voice-generate-callback/index.ts:8-11`

```typescript
// БЫЛО (fail-open):
if (!WEBHOOK_SECRET) {
  console.warn("...skipping signature verification");
  return true; // ← принимает без проверки
}

// СТАЛО (fail-closed):
if (!WEBHOOK_SECRET) {
  console.error("...SUNO_WEBHOOK_SECRET not set, rejecting");
  return false; // ← отклоняет
}
```

**Тестирование:**

1. `curl` callback без заголовка `X-Suno-Signature` → 401
2. `curl` с невалидной подписью → 401
3. `curl` с валидной подписью → 200

---

### P0-3: HIGH-3 — Маскирование Sentry Session Replay

**Файл:** `src/lib/sentry.ts` (495 LOC)

**Проблема:**

- `sendDefaultPii: true` → отправляет IP, email, user agent
- `maskAllText: false` → записывает весь текст UI (тексты песен, формы, платёжные данные)
- `blockAllMedia: false` → записывает изображения/видео
- Hardcoded production DSN fallback (строки 16-18) → dev/fork шлют ошибки в прод
- `replaysSessionSampleRate: 0.1` → 10% сессий записываются

**Исправления:**

```typescript
// src/lib/sentry.ts:35-52

Sentry.init({
  dsn: SENTRY_DSN,
  environment: import.meta.env.MODE,
  // HIGH-3 FIX: disable PII by default
  sendDefaultPii: false, // ← было true
  enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.consoleLoggingIntegration({
      levels: ["warn", "error"],
    }),
    Sentry.replayIntegration({
      maskAllText: true, // ← было false
      maskAllInputs: true, // ← новое (mask формы, платёжные поля)
      blockAllMedia: true, // ← было false
      // Размаскировать только безопасные элементы
      unmask: ["[data-sentry-unmask]"], // если нужно размаскировать конкретные элементы
    }),
  ],
  tracesSampleRate: 0.1,
  // HIGH-3 FIX: снизить sample rate в production
  replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.1, // ← 1% в проде
  replaysOnErrorSampleRate: 1.0, // оставить 100% на ошибки
  // ...
});
```

**Hardcoded DSN (строки 16-18):**

```typescript
// БЫЛО:
const SENTRY_DSN =
  import.meta.env.VITE_SENTRY_DSN ||
  "https://c5b78ff8198243ead020079930e99dc0@o4510153936076800.ingest.de.sentry.io/4510651370242128";

// СТАЛО:
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
// Если DSN не задан — Sentry не инициализируется (уже есть guard на строке 30)
```

**User context (строки 465-468):**

```typescript
// БЫЛО: email в открытом виде
Sentry.setUser({
  id: userId,
  email: extra?.email, // ← утечка PII
  username: extra?.username || extra?.telegramId?.toString(),
});

// СТАЛО: hash-им email, username обезличиваем
Sentry.setUser({
  id: userId,
  // email НЕ отправляем в Sentry (GDPR)
  username: extra?.username || extra?.telegramId?.toString(),
});
// email можно отправлять только в исключительных случаях через setExtra
// с explicit consent, но лучше вообще не отправлять
```

**Тестирование:**

1. Запустить приложение в dev mode → проверить, что Sentry не инициализируется без DSN
2. Сгенерировать ошибку → проверить, что Replay маскирует текст полей ввода
3. Проверить Sentry Dashboard → убедиться, что нет plain-text emails в событиях

---

## 🟠 P1 — Bundle Optimization (CI gate: `size-limit`)

### P1-1: Диагностика bundle (`feature-studio` ~1061 KB vs 750 KB limit)

**Запуск анализа:**

```bash
npm run build          # production build
npm run size           # size-limit check
# Открыть dist/stats.html в браузере для визуального анализа
```

**Проблема:** `vite.config.ts:328-367` — MEGA-CHUNK `feature-studio` объединяет:

- `/pages/AdminDashboard`, `/pages/admin/`
- `/pages/LyricsStudio`, `/pages/LyricsWorkspace`
- `/pages/Studio`, `/pages/StudioHub`, `/pages/ProjectDetail`
- `/components/admin/`, `/components/stem-studio/`, `/components/studio/`
- `/components/generate-form/`, `/components/lyrics/`, `/components/lyrics-workspace/`
- `/components/performance/`, `/components/guitar/`, `/components/drum-machine/`
- `/components/audio-record/`, `/components/audio-reference/`, `/components/audio/`

**Комментарий в коде:** _"Sprint 061 Phase B attempted to split these but barrel cleanup did NOT fully eliminate circular imports — Rollup still reports 'Circular chunk: feature-studio -> feature-generation -> feature-studio' which causes TDZ crashes in production."_

#### План решения (итеративный):

**Шаг 1: Аудит circular dependencies**

```bash
npx madge --circular src/ > madge-circular.txt
# Или:
npx madge --circular --extensions ts,tsx src/
```

**Шаг 2: Исправить barrel imports**

Проверить, что barrel-файлы (`index.ts`) не создают циклов:

```bash
# Примеры потенциальных циклов:
# components/studio/index.ts → components/generate-form/index.ts → components/studio/
# hooks/studio/ → stores/studio/ → hooks/studio/
```

**Шаг 3: Разбить MEGA-CHUNK на 3-4 меньших**

```typescript
// vite.config.ts:manualChunks — заменить MEGA-CHUNK на:

// Chunk A: Admin (отдельный, lazy-loaded)
if (id.includes("/pages/AdminDashboard") || id.includes("/pages/admin/") || id.includes("/components/admin/")) {
  return "feature-admin";
}

// Chunk B: Studio Core (mixer, timeline, editor — тяжёлый Web Audio)
if (
  id.includes("/components/studio/mixer/") ||
  id.includes("/components/studio/editor/") ||
  id.includes("/components/studio/timeline/")
) {
  return "feature-studio-core";
}

// Chunk C: Studio Unified (остальное studio UI)
if (id.includes("/components/studio/") || id.includes("/pages/Studio")) {
  return "feature-studio";
}

// Chunk D: Lyrics (тяжёлые редакторы)
if (
  id.includes("/pages/LyricsStudio") ||
  id.includes("/pages/LyricsWorkspace") ||
  id.includes("/components/lyrics/") ||
  id.includes("/components/lyrics-workspace/")
) {
  return "feature-lyrics";
}

// Chunk E: Generate Form (отдельно, самый частый lazy-load)
if (id.includes("/components/generate-form/")) {
  return "feature-generation";
}

// Chunk F: Audio tools (stem, guitar, drum)
if (
  id.includes("/components/stem-studio/") ||
  id.includes("/components/guitar/") ||
  id.includes("/components/drum-machine/") ||
  id.includes("/components/audio-record/") ||
  id.includes("/components/audio-reference/")
) {
  return "feature-audio-tools";
}

// Chunk G: Performance (analytics dashboard)
if (id.includes("/components/performance/")) {
  return "feature-analytics";
}
```

**Шаг 4: Обновить `size-limit` в `package.json:218-273`**

```json
{
  "name": "Feature Studio Core",
  "path": "dist/assets/feature-studio-core*.js",
  "limit": "500 KB",
  "gzip": true
},
{
  "name": "Feature Admin",
  "path": "dist/assets/feature-admin*.js",
  "limit": "400 KB",
  "gzip": true
},
{
  "name": "Feature Generation",
  "path": "dist/assets/feature-generation*.js",
  "limit": "400 KB",
  "gzip": true
}
```

**Шаг 5: Проверить на TDZ crashes**

```bash
npm run build
# Проверить, что build проходит без ошибок
# Проверить, что `npm run size` green
# Сделать smoke-test: npm run test:smoke:chromium
```

---

### P1-2: `vendor-radix` chunk не эмитится

**Проблема:** `size-limit` ожидает `vendor-radix*.js`, но он не создаётся. Возможные причины:

1. Radix импортируются через `lucide-react` или `shadcn/ui` barrel-файлы, которые tree-shake всё в `vendor-react` или `vendor-icons`
2. `@radix-ui/react-slot` через `class-variance-authority` попадает в другой чанк

**Диагностика:**

```bash
# После build:
ls -la dist/assets/ | grep radix
# Если пусто — проверить, куда попадает Radix

# Проверить импорты:
grep -r "@radix-ui" src/ | head -20
```

**Исправление:** Если Radix действительно не образует отдельный chunk, убрать `vendor-radix` из `size-limit` или исправить manualChunks, чтобы Radix гарантированно выделялся:

```typescript
// vite.config.ts:manualChunks — добавить дополнительный guard:
if (id.includes("@radix-ui") || id.includes("class-variance-authority") || id.includes("tailwind-merge")) {
  return "vendor-radix";
}
```

---

## 🟠 P1 — Medium Issues (5 находок)

### M-1: Рассинхрон имён секрета вебхука Telegram

**Файлы:**

- `stars-webhook/index.ts:74` — `TELEGRAM_WEBHOOK_SECRET_TOKEN`
- `telegram-webhook-setup/index.ts:62` — `TELEGRAM_WEBHOOK_SECRET`

**Исправление:** Свести к одному имени. Рекомендуется `TELEGRAM_WEBHOOK_SECRET_TOKEN` (более явное).

```typescript
// telegram-webhook-setup/index.ts:62
// БЫЛО: const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
// СТАЛО:
const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET_TOKEN") || Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
// Fallback для обратной совместимости, но депрекейтнуть старое имя
```

**Документация:** Добавить в `docs/ENVIRONMENT_VARIABLES.md` (или создать) единую таблицу имён секретов.

---

### M-2: Fail-open верификация voice-callback

Уже покрыто в **P0-2** (шаг 3). `suno-voice-generate-callback:8-11` → `return false`.

---

### M-3: In-memory rate-limiter

**Файл:** `supabase/functions/_shared/rate-limiter.ts:21` — `const rateLimitMap = new Map<string, RateLimitEntry>()`

**Проблема:** Per-isolate Map. В Deno/Supabase Edge Functions каждый вызов может запускаться в новом isolate → rate-limit не работает между вызовами.

**Решение:** Для критичных функций (callback'и, платежи) заменить на DB-backed rate-limit:

```typescript
// _shared/rate-limiter.ts — добавить:
async function checkRateLimitDb(
  supabase: SupabaseClient,
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

  const { count } = await supabase
    .from("rate_limit_logs")
    .select("*", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", windowStart);

  const current = count || 0;
  if (current >= config.maxRequests) {
    return {
      isLimited: true,
      remaining: 0,
      limit: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  await supabase.from("rate_limit_logs").insert({ key, created_at: new Date().toISOString() });
  return {
    isLimited: false,
    remaining: config.maxRequests - current - 1,
    limit: config.maxRequests,
    resetAt: new Date(Date.now() + config.windowMs),
  };
}
```

**Миграция:**

```sql
-- supabase/migrations/20260713000000_rate_limit_logs.sql
CREATE TABLE rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_limit_logs_key_created ON rate_limit_logs(key, created_at);
-- Cleanup old records (cron or trigger)
```

---

### M-4: Wildcard CORS

**Файл:** `supabase/functions/_shared/cors.ts:4`

```typescript
// _shared/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // ← слишком широко
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

**Исправление:**

```typescript
// _shared/cors.ts
const ALLOWED_ORIGINS = [
  "https://aimusicverse.lovable.app",
  "https://t.me", // Telegram WebView
  "https://web.telegram.org",
  "http://localhost:8080", // dev
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ""; // empty = no CORS
  return {
    "Access-Control-Allow-Origin": allowed || "*", // fallback для dev
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
```

**Применение:** Заменить inline `corsHeaders` во всех функциях, где вызывается из клиента (а не только из webhook'ов).

---

### M-5: Аудит `verify_jwt = false`

**Файл:** `supabase/config.toml` — 30+ функций с `verify_jwt = false`

**Критерий:** Каждая `verify_jwt = false` функция должна иметь либо:

1. Внешний guard (HMAC/подпись/secret token) — webhook'и, callbacks
2. Internal-only guard (`isServiceRoleToken`) — `send-telegram-notification`, `cleanup-*`
3. Публичный доступ по дизайну — `health-check`, `telegram-auth` (initData validation), `telegram-bot` (webhook)

**Проверка:**

```bash
# Список всех verify_jwt = false:
grep -n "verify_jwt = false" supabase/config.toml

# Для каждой функции проверить, есть ли guard в коде:
for fn in $(grep "verify_jwt = false" supabase/config.toml | sed 's/.*functions\.\(.*\)\].*/\1/'); do
  echo "=== $fn ==="
  grep -n "isServiceRoleToken\|authorize\|verifySignature\|verifyToken\|webhook_secret" "supabase/functions/$fn/index.ts" || echo "NO GUARD FOUND"
done
```

**Функции без guard (требуют исправления):**

- `send-telegram-notification` → **P0-1**
- `suno-music-callback`, `suno-wav-callback`, `suno-cover-callback`, `suno-vocal-callback`, `lyrics-callback` → **P0-2**
- `suno-send-audio` → проверить, нужен ли guard (если вызывается только внутренне — service-role)
- `analyze-audio-flamingo` → проверить, публичный ли по дизайну
- `generate-track-cover` → проверить, публичный ли по дизайну
- `separate-reference-stems` → проверить, публичный ли по дизайну
- `create-notification` → проверить, публичный ли по дизайну
- `process-audio-pipeline` → проверить, публичный ли по дизайну
- `audit-log` → проверить, публичный ли по дизайну

---

## 🟡 P2 — Гигиена (Low)

### P2-1: `as any` / `<any>`-касты

**Данные:** ~117 вхождений. `count-any` скрипт не ловит `as any`.

**Исправление:**

```bash
# Найти все as any:
grep -rn "as any\|<any>" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "__tests__" | wc -l

# План: 5-10 вхождений за спринт, начиная с самых критичных (API层, stores)
```

**ESLint-правило:**

```javascript
// eslint.config.js — добавить:
{
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
  }
}
```

---

### P2-2: Hex-цвета → Design Tokens

**Данные:** 54 hardcoded hex-цвета в компонентах.

```bash
grep -rn "#\([0-9a-fA-F]\{3\}\|[0-9a-fA-F]\{6\}\|[0-9a-fA-F]\{8\}\)" src/components/ --include="*.tsx" | grep -v "node_modules" | wc -l
```

**Исправление:** Мигрировать на `styles/colors.css` или `lib/design-colors.ts` tokens.

---

### P2-3: `console.*` → `logger`

**Данные:** 34 вызова в 15 файлах.

```bash
grep -rn "console\.\(log\|info\|debug\|warn\|error\)" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "src/lib/logger" | grep -v "main.tsx" | grep -v "boot-log"
```

**Исключения:** `main.tsx` (boot-log), `src/lib/debug/**` (по дизайну), `sentry.ts` (Sentry guard) — оставить.

---

### P2-4: Constant-time сравнения секретов

**Файлы:**

- `_shared/auth.ts:141` — `token === serviceKey` (string comparison, timing attack)
- `tinkoff.ts:177` — `calculatedToken !== receivedToken`
- `stars-webhook:86` — `secret !== token`
- `telegram-auth:88` — `calculatedHash !== receivedHash`

**Исправление:**

```typescript
// _shared/auth.ts:141
// БЫЛО: return !!serviceKey && token === serviceKey;

// СТАЛО:
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function isServiceRoleToken(req: Request): boolean {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return !!serviceKey && timingSafeEqual(token, serviceKey);
}
```

---

## 📅 План спринта

| День      | Задача                                    | Файлы                                                                                                       | SP                  |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- |
| **1**     | P0-1: send-telegram-notification guard    | `send-telegram-notification/index.ts`, `_shared/auth.ts`                                                    | 2                   |
| **1**     | P0-2 Step 1: shared `verifySunoSignature` | `_shared/suno.ts`                                                                                           | 1                   |
| **2**     | P0-2 Step 2: apply to all callbacks       | `suno-music-callback`, `suno-wav-callback`, `suno-cover-callback`, `suno-vocal-callback`, `lyrics-callback` | 3                   |
| **2**     | P0-2 Step 3: fix fail-open voice-callback | `suno-voice-generate-callback/index.ts`                                                                     | 0.5                 |
| **3**     | P0-3: Sentry masking                      | `src/lib/sentry.ts`                                                                                         | 1.5                 |
| **3**     | M-4: CORS fix                             | `_shared/cors.ts`, все функции                                                                              | 1                   |
| **4**     | P1-1: Bundle analysis + madge             | `vite.config.ts`, `package.json`                                                                            | 2                   |
| **4-5**   | P1-1: Split MEGA-CHUNK                    | `vite.config.ts:manualChunks`                                                                               | 3                   |
| **5**     | M-1: Secret name sync                     | `telegram-webhook-setup/index.ts`, `stars-webhook/index.ts`                                                 | 0.5                 |
| **5**     | M-3: DB rate-limiter                      | `_shared/rate-limiter.ts`, migration                                                                        | 1.5                 |
| **6**     | M-5: verify_jwt audit                     | `config.toml`, все функции                                                                                  | 1                   |
| **6**     | P1-2: vendor-radix fix                    | `vite.config.ts`, `package.json`                                                                            | 0.5                 |
| **7**     | P2-4: Constant-time comparisons           | `_shared/auth.ts`, `tinkoff.ts`, `stars-webhook`, `telegram-auth`                                           | 1                   |
| **7**     | Тестирование + CI green                   | `npm run check-all`, `npm run size`                                                                         | 1                   |
| **Итого** |                                           |                                                                                                             | **~20 SP** (7 дней) |

---

## ✅ Definition of Done

- [ ] Все 3 HIGH-риска закрыты (код в `main`, PR merged)
- [ ] `npm run size` — green (все size-limit checks проходят)
- [ ] `npm run check-all` — green (lint + format + typecheck + test)
- [ ] `npm run test:smoke:chromium` — проходит
- [ ] Security regression tests написаны:
  - `curl` callback без подписи → 401
  - `curl` send-telegram-notification без service-role → 401
  - Sentry Replay маскирует текст в dev-tools
- [ ] Документация обновлена: `docs/SECURITY_FIXES_2026-07-13.md` (changelog fixes)

---

_План составлен на основе аудита `INTERFACE_INTEGRATION_AUDIT_2026-07-13.md` и анализа `vite.config.ts`, `src/lib/sentry.ts`, `supabase/functions/_shared/auth.ts`, `supabase/config.toml`._
