# 🚀 Telegram Integration - Sprint 3 & 4

Продолжение плана интеграции Telegram функционала.

---

# 🎯 SPRINT 3: Bot-App Integration + Payments

**Цель:** Интегрировать бота с Mini App и реализовать монетизацию через Telegram Payments

**Длительность:** 5 рабочих дней
**Story Points:** 24

---

## 📋 Задачи Sprint 3

### TASK-3.1: Inline Mode для генерации музыки

**Priority:** 🟡 High
**Story Points:** 5
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `inline-mode`

#### Описание

Реализовать Inline Mode, позволяющий пользователям генерировать музыку из любого чата.

#### Acceptance Criteria

- [ ] Inline query обработчик реализован
- [ ] Поиск по стилям работает
- [ ] Результаты отображают превью треков
- [ ] Отправка трека в чат работает
- [ ] Статистика inline использования ведется

#### Технические требования

**1. Регистрация inline mode:**

```bash
# Через BotFather
/setinline
@musicverse_bot
# Placeholder text: Введите стиль музыки...
```

**2. Inline Query Handler:**

```typescript
// telegram-bot/inline/inline-query.ts
import { InlineQueryContext } from "grammy";
import { InlineQueryResultArticle } from "grammy/types";
import { supabase } from "../config.ts";

export async function handleInlineQuery(ctx: InlineQueryContext) {
  const query = ctx.inlineQuery.query.trim();

  if (!query) {
    // Показать популярные стили
    const results = await getPopularStyles();
    await ctx.answerInlineQuery(results, {
      cache_time: 300,
      is_personal: true,
    });
    return;
  }

  // Поиск стилей по запросу
  const { data: styles } = await supabase.from("music_styles").select("*").ilike("name", `%${query}%`).limit(10);

  const results: InlineQueryResultArticle[] =
    styles?.map((style, index) => ({
      type: "article",
      id: `style_${style.id}_${index}`,
      title: style.name,
      description: `Создать ${style.name} трек`,
      input_message_content: {
        message_text: `🎵 Генерирую трек в стиле: ${style.name}...`,
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📱 Открыть в MusicVerse",
              web_app: {
                url: `${process.env.MINI_APP_URL}/generate?style=${encodeURIComponent(style.name)}`,
              },
            },
          ],
        ],
      },
      thumbnail_url: style.image_url || generateStyleThumbnail(style.name),
    })) || [];

  await ctx.answerInlineQuery(results, {
    cache_time: 60,
    is_personal: true,
  });

  // Логирование для аналитики
  await logInlineQuery(ctx.from.id, query);
}

async function getPopularStyles(): Promise<InlineQueryResultArticle[]> {
  const popularStyles = ["Ambient Electronic", "Upbeat Pop", "Epic Orchestral", "Chill Lo-fi", "Energetic Rock"];

  return popularStyles.map((style, index) => ({
    type: "article",
    id: `popular_${index}`,
    title: style,
    description: `Популярный стиль`,
    input_message_content: {
      message_text: `🎵 Генерирую ${style} трек...`,
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎹 Создать трек",
            web_app: {
              url: `${process.env.MINI_APP_URL}/generate?style=${encodeURIComponent(style)}`,
            },
          },
        ],
      ],
    },
  }));
}

function generateStyleThumbnail(styleName: string): string {
  // Генерация thumbnail для стиля
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(styleName)}`;
}

async function logInlineQuery(userId: number, query: string) {
  await supabase.from("inline_queries").insert({
    user_id: userId,
    query: query,
    timestamp: new Date().toISOString(),
  });
}

// Регистрация в bot.ts
bot.on("inline_query", handleInlineQuery);
```

**3. Chosen Inline Result Handler:**

```typescript
// telegram-bot/inline/chosen-result.ts
import { ChosenInlineResultContext } from "grammy";

export async function handleChosenInlineResult(ctx: ChosenInlineResultContext) {
  const resultId = ctx.chosenInlineResult.result_id;
  const query = ctx.chosenInlineResult.query;

  console.log(`User chose inline result: ${resultId} for query: ${query}`);

  // Запустить генерацию если пользователь выбрал результат
  if (resultId.startsWith("style_")) {
    const styleName = query;

    // Получить user_id
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", ctx.from.id).single();

    if (profile) {
      // Создать задачу генерации
      await supabase.from("generation_tasks").insert({
        user_id: profile.user_id,
        prompt: `${styleName} music`,
        status: "pending",
        telegram_chat_id: ctx.from.id,
        source: "inline_mode",
      });
    }
  }

  // Логирование
  await supabase.from("inline_result_chosen").insert({
    user_id: ctx.from.id,
    result_id: resultId,
    query: query,
  });
}

// Регистрация
bot.on("chosen_inline_result", handleChosenInlineResult);
```

#### Testing

```bash
# 1. Открыть любой чат в Telegram
# 2. Ввести: @musicverse_bot ambient
# 3. Проверить появление результатов
# 4. Выбрать результат
# 5. Проверить отправку в чат
# 6. Проверить генерацию трека
```

#### Definition of Done

- ✅ Inline mode работает
- ✅ Поиск стилей функционирует
- ✅ Результаты отображаются корректно
- ✅ Генерация запускается при выборе
- ✅ Статистика логируется
- ✅ Code review пройден

---

### TASK-3.2: Telegram Payments Integration

**Priority:** 🔴 Critical
**Story Points:** 8
**Assignee:** Backend + Frontend Developer
**Labels:** `backend`, `frontend`, `payments`, `monetization`

#### Описание

Реализовать систему покупки кредитов через Telegram Payments.

#### Acceptance Criteria

- [ ] Настроены Telegram Payments через BotFather
- [ ] Пакеты кредитов определены
- [ ] Invoice API интегрирован
- [ ] Pre-checkout и успешная оплата обрабатываются
- [ ] Зачисление кредитов работает
- [ ] История платежей ведется
- [ ] Refund система реализована

#### Технические требования

**1. Настройка Payments Provider:**

```bash
# Через BotFather
/mybots → @musicverse_bot → Payments
# Выбрать провайдера: Stripe / YooKassa / etc.
# Получить PAYMENT_PROVIDER_TOKEN
```

**2. Таблица для биллинга:**

```sql
-- supabase/migrations/[timestamp]_create_billing_tables.sql

-- Таблица кредитов пользователя
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (credits >= 0)
);

-- Таблица транзакций
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
  description TEXT,
  telegram_payment_charge_id TEXT,
  telegram_invoice_payload TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_credit_transactions_user_id (user_id),
  INDEX idx_credit_transactions_created_at (created_at)
);

-- RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Функция для зачисления кредитов
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_payment_charge_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Обновить баланс
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits = user_credits.credits + p_amount,
    updated_at = NOW();

  -- Записать транзакцию
  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    telegram_payment_charge_id
  )
  VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_description,
    p_payment_charge_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**3. Пакеты кредитов:**

```typescript
// telegram-bot/payments/packages.ts
export interface CreditPackage {
  id: string;
  credits: number;
  price: number; // в центах
  currency: string;
  title: string;
  description: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    credits: 10,
    price: 299, // $2.99
    currency: "USD",
    title: "Starter Pack",
    description: "10 кредитов для генерации",
  },
  {
    id: "popular",
    credits: 50,
    price: 999, // $9.99
    currency: "USD",
    title: "Popular Pack",
    description: "50 кредитов + 5 бонус",
    popular: true,
  },
  {
    id: "pro",
    credits: 100,
    price: 1699, // $16.99
    currency: "USD",
    title: "Pro Pack",
    description: "100 кредитов + 20 бонус",
  },
  {
    id: "ultimate",
    credits: 500,
    price: 4999, // $49.99
    currency: "USD",
    title: "Ultimate Pack",
    description: "500 кредитов + 100 бонус",
  },
];
```

**4. Команда покупки кредитов:**

```typescript
// telegram-bot/commands/buy.ts
import { CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import { CREDIT_PACKAGES } from "../payments/packages.ts";

export async function buyCommand(ctx: CommandContext) {
  const keyboard = new InlineKeyboard();

  CREDIT_PACKAGES.forEach((pkg) => {
    const label = pkg.popular ? `⭐ ${pkg.title}` : pkg.title;
    keyboard.text(`${label} - $${(pkg.price / 100).toFixed(2)}`, `buy_${pkg.id}`).row();
  });

  keyboard.webApp("💳 Все пакеты", `${process.env.MINI_APP_URL}/pricing`);

  await ctx.reply(
    `💰 <b>Покупка кредитов</b>

Кредиты используются для генерации музыки:
• 1 кредит = 1 трек (до 2 минут)
• 2 кредита = 1 трек (до 4 минут)
• 3 кредита = stems разделение

Выберите пакет:`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    },
  );
}

// Регистрация
bot.command("buy", buyCommand);
```

**5. Обработчик покупки:**

```typescript
// telegram-bot/payments/purchase-handler.ts
import { CallbackQueryContext } from "grammy";
import { CREDIT_PACKAGES } from "./packages.ts";

export async function handlePurchaseCallback(ctx: CallbackQueryContext) {
  const packageId = ctx.callbackQuery.data.replace("buy_", "");
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);

  if (!pkg) {
    await ctx.answerCallbackQuery({ text: "❌ Пакет не найден" });
    return;
  }

  // Создать invoice
  const PAYMENT_TOKEN = Deno.env.get("PAYMENT_PROVIDER_TOKEN")!;

  const invoice = {
    title: pkg.title,
    description: pkg.description,
    payload: JSON.stringify({
      package_id: pkg.id,
      user_id: ctx.from.id,
      credits: pkg.credits,
    }),
    provider_token: PAYMENT_TOKEN,
    currency: pkg.currency,
    prices: [
      {
        label: `${pkg.credits} кредитов`,
        amount: pkg.price,
      },
    ],
    max_tip_amount: 500,
    suggested_tip_amounts: [100, 200, 300, 500],
  };

  await ctx.replyWithInvoice(invoice);
  await ctx.answerCallbackQuery();
}

// Регистрация
bot.on("callback_query:data", (ctx) => {
  if (ctx.callbackQuery.data.startsWith("buy_")) {
    return handlePurchaseCallback(ctx);
  }
});
```

**6. Pre-checkout и Payment handlers:**

```typescript
// telegram-bot/payments/payment-handlers.ts
import { PreCheckoutQueryContext, MessageContext } from "grammy";
import { supabase } from "../config.ts";

// Pre-checkout query (валидация перед оплатой)
export async function handlePreCheckout(ctx: PreCheckoutQueryContext) {
  const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);

  // Можно добавить дополнительную валидацию
  // Например, проверить лимиты, промокоды и т.д.

  console.log("Pre-checkout query:", payload);

  // Подтверждаем возможность оплаты
  await ctx.answerPreCheckoutQuery(true);
}

// Successful payment (после успешной оплаты)
export async function handleSuccessfulPayment(ctx: MessageContext) {
  const payment = ctx.message?.successful_payment;

  if (!payment) return;

  const payload = JSON.parse(payment.invoice_payload);
  const { package_id, credits } = payload;

  console.log("Payment successful:", {
    telegram_payment_charge_id: payment.telegram_payment_charge_id,
    provider_payment_charge_id: payment.provider_payment_charge_id,
    total_amount: payment.total_amount,
    currency: payment.currency,
  });

  // Получить user_id
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", ctx.from.id).single();

  if (!profile) {
    await ctx.reply("❌ Ошибка: профиль не найден. Обратитесь в поддержку.");
    return;
  }

  try {
    // Зачислить кредиты
    await supabase.rpc("add_credits", {
      p_user_id: profile.user_id,
      p_amount: credits,
      p_type: "purchase",
      p_description: `Покупка пакета: ${package_id}`,
      p_payment_charge_id: payment.telegram_payment_charge_id,
    });

    await ctx.reply(
      `✅ <b>Оплата успешна!</b>

💳 Зачислено: <b>${credits} кредитов</b>
📝 Чек: <code>${payment.telegram_payment_charge_id}</code>

Используйте /generate для создания треков!`,
      { parse_mode: "HTML" },
    );

    // Отправить уведомление в Mini App
    // (через webhook или realtime subscriptions)
  } catch (error) {
    console.error("Error crediting:", error);
    await ctx.reply(
      "⚠️ Оплата прошла, но возникла ошибка зачисления. Обратитесь в поддержку с этим кодом: " +
        payment.telegram_payment_charge_id,
    );
  }
}

// Регистрация
bot.on("pre_checkout_query", handlePreCheckout);
bot.on("message:successful_payment", handleSuccessfulPayment);
```

**7. Frontend - Invoice API:**

```typescript
// src/hooks/useTelegramPayments.tsx
import { useTelegram } from "@/contexts/TelegramContext";
import { toast } from "sonner";

interface InvoiceParams {
  title: string;
  description: string;
  payload: string;
  provider_token: string;
  currency: string;
  prices: Array<{ label: string; amount: number }>;
}

export const useTelegramPayments = () => {
  const { webApp } = useTelegram();

  const openInvoice = async (invoiceLink: string): Promise<boolean> => {
    if (!webApp?.openInvoice) {
      toast.error("Telegram Payments недоступны");
      return false;
    }

    return new Promise((resolve) => {
      webApp.openInvoice(invoiceLink, (status) => {
        if (status === "paid") {
          toast.success("Оплата успешна!");
          resolve(true);
        } else if (status === "cancelled") {
          toast.info("Оплата отменена");
          resolve(false);
        } else if (status === "failed") {
          toast.error("Ошибка оплаты");
          resolve(false);
        } else {
          resolve(false);
        }
      });
    });
  };

  return {
    openInvoice,
    isPaymentsAvailable: !!webApp?.openInvoice,
  };
};
```

**8. Страница Pricing:**

```typescript
// src/pages/Pricing.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTelegramPayments } from '@/hooks/useTelegramPayments';
import { supabase } from '@/integrations/supabase/client';

const PACKAGES = [
  { id: 'starter', credits: 10, price: 2.99, popular: false },
  { id: 'popular', credits: 50, price: 9.99, popular: true },
  { id: 'pro', credits: 100, price: 16.99, popular: false },
  { id: 'ultimate', credits: 500, price: 49.99, popular: false },
];

export default function Pricing() {
  const { openInvoice } = useTelegramPayments();

  const handlePurchase = async (packageId: string) => {
    // Создать invoice через backend
    const { data, error } = await supabase.functions.invoke('create-invoice', {
      body: { package_id: packageId },
    });

    if (error || !data?.invoice_link) {
      toast.error('Ошибка создания счета');
      return;
    }

    // Открыть invoice
    const paid = await openInvoice(data.invoice_link);

    if (paid) {
      // Обновить баланс кредитов
      // (будет автоматически через webhook/realtime)
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Покупка кредитов</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PACKAGES.map((pkg) => (
          <Card key={pkg.id} className={pkg.popular ? 'border-primary' : ''}>
            {pkg.popular && (
              <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-semibold">
                ⭐ Популярный
              </div>
            )}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold">{pkg.credits} кредитов</h3>
                <p className="text-3xl font-bold text-primary">${pkg.price}</p>
              </div>
              <Button
                onClick={() => handlePurchase(pkg.id)}
                className="w-full"
                variant={pkg.popular ? 'default' : 'outline'}
              >
                Купить
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### Testing

```bash
# 1. Отправить /buy в боте
# 2. Выбрать пакет
# 3. Заполнить платежную информацию (test mode)
# 4. Подтвердить оплату
# 5. Проверить зачисление кредитов в БД
# 6. Проверить историю транзакций
# 7. Проверить обновление баланса в Mini App
```

#### Definition of Done

- ✅ Payments провайдер настроен
- ✅ Invoice API работает
- ✅ Pre-checkout валидация реализована
- ✅ Successful payment обрабатывается
- ✅ Кредиты зачисляются корректно
- ✅ История платежей ведется
- ✅ Frontend интеграция работает
- ✅ Тесты в test mode проходят
- ✅ Code review пройден

---

### TASK-3.3: Real-time синхронизация между ботом и Mini App

**Priority:** 🟡 High
**Story Points:** 5
**Assignee:** Backend Developer
**Labels:** `backend`, `realtime`, `sync`

#### Описание

Реализовать real-time синхронизацию состояния между ботом и Mini App.

#### Acceptance Criteria

- [ ] Supabase Realtime subscriptions настроены
- [ ] Изменения в боте отражаются в Mini App
- [ ] Изменения в Mini App отражаются в боте
- [ ] Уведомления синхронизируются
- [ ] Баланс кредитов обновляется в реальном времени

#### Технические требования

**1. Настройка Realtime в Supabase:**

```sql
-- Включить Realtime для таблиц
ALTER PUBLICATION supabase_realtime ADD TABLE generation_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
```

**2. Frontend hook для Realtime:**

```typescript
// src/hooks/useRealtimeSync.tsx
import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useRealtimeSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Подписка на изменения кредитов
    const creditsChannel = supabase
      .channel("user_credits_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Credits updated:", payload.new);

          // Обновить кэш React Query
          queryClient.invalidateQueries({ queryKey: ["credits"] });

          // Показать уведомление
          toast.success(`Баланс обновлен: ${payload.new.credits} кредитов`);
        },
      )
      .subscribe();

    // Подписка на новые треки
    const tracksChannel = supabase
      .channel("tracks_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New track created:", payload.new);

          // Обновить список треков
          queryClient.invalidateQueries({ queryKey: ["tracks"] });

          // Уведомление
          toast.success("Новый трек готов!");
        },
      )
      .subscribe();

    // Подписка на уведомления
    const notificationsChannel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;

          toast.info(notification.message, {
            action: notification.action_url
              ? {
                  label: "Открыть",
                  onClick: () => (window.location.href = notification.action_url),
                }
              : undefined,
          });
        },
      )
      .subscribe();

    // Cleanup
    return () => {
      creditsChannel.unsubscribe();
      tracksChannel.unsubscribe();
      notificationsChannel.unsubscribe();
    };
  }, [user, queryClient]);
};
```

**3. Использование в App:**

```typescript
// src/App.tsx
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

function App() {
  useRealtimeSync(); // Активировать realtime sync

  return (
    <Router>
      {/* ... */}
    </Router>
  );
}
```

**4. Backend - отправка изменений в Mini App:**

```typescript
// supabase/functions/notify-mini-app/index.ts
// Вызывается после изменений в боте

import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const { user_id, event_type, data } = await req.json();

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Создать уведомление
  await supabase.from("notifications").insert({
    user_id,
    message: getMessageForEvent(event_type, data),
    type: event_type,
    data: data,
  });

  // Realtime автоматически доставит уведомление в Mini App

  return new Response(JSON.stringify({ success: true }));
});

function getMessageForEvent(type: string, data: any): string {
  switch (type) {
    case "generation_started":
      return `Генерация трека "${data.prompt}" началась`;
    case "generation_completed":
      return `Трек "${data.title}" готов!`;
    case "credits_added":
      return `Зачислено ${data.amount} кредитов`;
    default:
      return "Новое уведомление";
  }
}
```

#### Testing

```bash
# 1. Открыть Mini App
# 2. В другом окне отправить /buy в боте
# 3. Купить кредиты
# 4. Проверить обновление баланса в Mini App без перезагрузки
# 5. Запустить генерацию через бота
# 6. Проверить обновление списка треков в Mini App
# 7. Создать трек в Mini App
# 8. Проверить уведомление в боте
```

#### Definition of Done

- ✅ Realtime subscriptions настроены
- ✅ Изменения синхронизируются
- ✅ Уведомления доставляются
- ✅ UI обновляется автоматически
- ✅ Нет дублирования уведомлений
- ✅ Тесты написаны
- ✅ Code review пройден

---

### TASK-3.4: Voice Messages → Music Generation

**Priority:** 🟢 Medium
**Story Points:** 4
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `ai`, `voice`

#### Описание

Реализовать генерацию музыки из голосовых сообщений пользователя.

#### Acceptance Criteria

- [ ] Обработчик голосовых сообщений реализован
- [ ] Скачивание voice файла работает
- [ ] Whisper транскрипция интегрирована
- [ ] Генерация музыки на основе текста работает
- [ ] Результат отправляется пользователю

#### Технические требования

**1. Voice Message Handler:**

```typescript
// telegram-bot/handlers/voice-handler.ts
import { MessageContext } from "grammy";
import { supabase } from "../config.ts";

export async function handleVoiceMessage(ctx: MessageContext) {
  const voice = ctx.message?.voice;

  if (!voice) return;

  await ctx.reply("🎙️ Обрабатываю голосовое сообщение...");

  try {
    // 1. Скачать голосовое сообщение
    const file = await ctx.api.getFile(voice.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${file.file_path}`;

    const audioResponse = await fetch(fileUrl);
    const audioBuffer = await audioResponse.arrayBuffer();

    // 2. Транскрибировать с помощью Whisper
    const transcript = await transcribeAudio(audioBuffer);

    if (!transcript) {
      await ctx.reply("❌ Не удалось распознать речь. Попробуйте еще раз.");
      return;
    }

    await ctx.reply(`📝 Распознано: "${transcript}"\n\n⏳ Генерирую музыку...`);

    // 3. Получить user_id
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", ctx.from.id).single();

    if (!profile) {
      await ctx.reply("❌ Сначала авторизуйтесь в Mini App!");
      return;
    }

    // 4. Запустить генерацию
    await supabase.from("generation_tasks").insert({
      user_id: profile.user_id,
      prompt: transcript,
      status: "pending",
      telegram_chat_id: ctx.chat.id,
      source: "voice_message",
    });

    await ctx.reply("✅ Генерация началась! Вы получите уведомление, когда трек будет готов.");
  } catch (error) {
    console.error("Voice handling error:", error);
    await ctx.reply("❌ Ошибка обработки голосового сообщения.");
  }
}

// Транскрипция через Whisper (OpenAI API или Lovable AI Gateway)
async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer]), "voice.ogg");
    formData.append("model", "whisper-1");
    formData.append("language", "ru"); // Можно определять автоматически

    const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: formData,
    });

    const result = await response.json();
    return result.text || null;
  } catch (error) {
    console.error("Transcription error:", error);
    return null;
  }
}

// Регистрация
bot.on("message:voice", handleVoiceMessage);
```

#### Testing

```bash
# 1. Отправить голосовое сообщение в бота
# 2. Сказать: "Создай спокойную ambient музыку"
# 3. Проверить транскрипцию
# 4. Дождаться генерации
# 5. Проверить получение трека
```

#### Definition of Done

- ✅ Voice handler работает
- ✅ Whisper транскрипция функционирует
- ✅ Генерация запускается
- ✅ Результат доставляется
- ✅ Обработка ошибок реализована
- ✅ Code review пройден

---

### TASK-3.5: Analytics Dashboard в боте

**Priority:** 🟢 Medium
**Story Points:** 2
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `analytics`

#### Описание

Добавить команду /analytics для просмотра статистики в боте.

#### Acceptance Criteria

- [ ] Команда /analytics реализована
- [ ] Показывает основные метрики
- [ ] Кнопка для полного dashboard в Mini App
- [ ] Данные кэшируются для производительности

#### Технические требования

```typescript
// telegram-bot/commands/analytics.ts
import { CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import { supabase } from "../config.ts";

export async function analyticsCommand(ctx: CommandContext) {
  const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", ctx.from.id).single();

  if (!profile) {
    return ctx.reply("❌ Сначала авторизуйтесь в Mini App!");
  }

  // Получить статистику
  const stats = await getUserAnalytics(profile.user_id);

  const message = `📊 <b>Ваша статистика</b>

🎵 Треков создано: <b>${stats.tracks_count}</b>
💿 Проектов: <b>${stats.projects_count}</b>
⏱️ Общее время: <b>${formatDuration(stats.total_duration)}</b>
🔥 Топ стиль: <b>${stats.top_style || "N/A"}</b>
💰 Кредитов осталось: <b>${stats.credits}</b>

📈 За последний месяц:
• Треков: ${stats.monthly_tracks}
• Активных дней: ${stats.active_days}`;

  const keyboard = new InlineKeyboard().webApp("📱 Полная аналитика", `${process.env.MINI_APP_URL}/analytics`);

  await ctx.reply(message, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

async function getUserAnalytics(userId: string) {
  // Запросы к БД для получения статистики
  const { data: tracks } = await supabase.from("tracks").select("duration, created_at").eq("user_id", userId);

  const { data: projects } = await supabase.from("music_projects").select("id").eq("user_id", userId);

  const { data: credits } = await supabase.from("user_credits").select("credits").eq("user_id", userId).single();

  // ... вычисления

  return {
    tracks_count: tracks?.length || 0,
    projects_count: projects?.length || 0,
    total_duration: tracks?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0,
    top_style: "Ambient Electronic", // TODO: вычислить
    credits: credits?.credits || 0,
    monthly_tracks: 0, // TODO
    active_days: 0, // TODO
  };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}ч ${minutes}м`;
}

// Регистрация
bot.command("analytics", analyticsCommand);
```

#### Testing

```bash
# 1. Отправить /analytics
# 2. Проверить отображение статистики
# 3. Нажать кнопку "Полная аналитика"
# 4. Проверить открытие страницы /analytics в Mini App
```

#### Definition of Done

- ✅ Команда работает
- ✅ Статистика корректная
- ✅ Deep link в Mini App работает
- ✅ Code review пройден

---

## 📊 Sprint 3 Review Checklist

- [ ] Inline mode работает
- [ ] Payments полностью интегрированы
- [ ] Real-time sync функционирует
- [ ] Voice → Music работает
- [ ] Analytics отображается
- [ ] Все тесты проходят
- [ ] Documentation обновлена
- [ ] Deploy completed

---

# 🎯 SPRINT 4: Advanced Features + Polish

**Цель:** Добавить продвинутые функции и отполировать UX

**Длительность:** 5 рабочих дней
**Story Points:** 15

---

## 📋 Задачи Sprint 4

### TASK-4.1: Collaboration Rooms (Групповые чаты)

**Priority:** 🟢 Medium
**Story Points:** 5
**Assignee:** Backend + Frontend
**Labels:** `backend`, `frontend`, `collaboration`

#### Описание

Создание групповых чатов в Telegram для совместной работы над проектами.

#### Acceptance Criteria

- [ ] Создание collaboration room
- [ ] Invite links генерируются
- [ ] Интеграция с проектами
- [ ] Уведомления в группе о новых треках

#### Технические требования

```typescript
// Создание collaboration room
async function createCollaborationRoom(projectId: string, chatId: number) {
  // Создать invite link
  const inviteLink = await bot.api.createChatInviteLink(chatId, {
    name: "MusicVerse Collaboration",
    creates_join_request: false,
  });

  // Сохранить в БД
  await supabase.from("collaboration_rooms").insert({
    project_id: projectId,
    telegram_chat_id: chatId,
    invite_link: inviteLink.invite_link,
  });

  // Настроить webhook для группы
  // Отправлять обновления о новых треках в группу
}
```

---

### TASK-4.2: AI Daily Recommendations

**Priority:** 🟢 Medium
**Story Points:** 3
**Assignee:** Backend Developer
**Labels:** `backend`, `ai`, `cron`

#### Описание

Ежедневная рассылка персонализированных рекомендаций стилей.

#### Acceptance Criteria

- [ ] Cron job настроен
- [ ] AI генерирует рекомендации
- [ ] Рассылка происходит в выбранное время
- [ ] Пользователи могут отписаться

#### Технические требования

```typescript
// Cron job через Supabase Edge Function
// Запуск каждый день в 10:00

import { createClient } from "@supabase/supabase-js";

Deno.cron("daily_recommendations", "0 10 * * *", async () => {
  const users = await getActiveUsers();

  for (const user of users) {
    const recommendations = await generateRecommendations(user.id);

    await sendTelegramMessage(user.telegram_id, recommendations);
  }
});

async function generateRecommendations(userId: string) {
  // AI генерация на основе истории пользователя
  const history = await getUserHistory(userId);

  // Промпт для AI
  const prompt = `Based on user's music generation history: ${JSON.stringify(history)},
  suggest 3 new music styles to try today.`;

  // ... AI call
}
```

---

### TASK-4.3: Music Sharing в группах

**Priority:** 🟢 Medium
**Story Points:** 3
**Assignee:** Backend Developer
**Labels:** `backend`, `telegram-bot`, `sharing`

#### Описание

Улучшенный шаринг треков в группах с красивыми карточками.

#### Acceptance Criteria

- [ ] Красивые карточки треков
- [ ] Inline keyboard с действиями
- [ ] Remix из группового чата
- [ ] Preview треков

---

### TASK-4.4: UI/UX Polish

**Priority:** 🟡 High
**Story Points:** 3
**Assignee:** Frontend Developer
**Labels:** `frontend`, `ui`, `ux`

#### Описание

Финальная полировка UI/UX Mini App.

#### Acceptance Criteria

- [ ] Анимации transitions
- [ ] Loading states
- [ ] Error boundaries
- [ ] Skeleton loaders
- [ ] Responsive design

---

### TASK-4.5: Documentation & Deployment

**Priority:** 🔴 Critical
**Story Points:** 1
**Assignee:** Team Lead
**Labels:** `documentation`, `deployment`

#### Описание

Финализация документации и deployment.

#### Acceptance Criteria

- [ ] README обновлен
- [ ] API документация
- [ ] User guides
- [ ] Production deployment
- [ ] Monitoring настроен

---

## 🎉 Sprint 4 Final Review

- [ ] Все функции работают в production
- [ ] Документация complete
- [ ] User acceptance testing пройден
- [ ] Performance metrics в норме
- [ ] Monitoring активен
- [ ] Support готов

---

## 📊 ИТОГОВАЯ СТАТИСТИКА ВСЕХ СПРИНТОВ

| Sprint    | Story Points | Status          |
| --------- | ------------ | --------------- |
| Sprint 1  | 21           | ⏳ Planned      |
| Sprint 2  | 18           | ⏳ Planned      |
| Sprint 3  | 24           | ⏳ Planned      |
| Sprint 4  | 15           | ⏳ Planned      |
| **ИТОГО** | **78**       | **0% Complete** |

---

**Estimated completion:** 4 недели
**Team size:** 2-3 разработчика
**Start date:** TBD

---
