# TODO: Интеграция Робокассы

## Статус: ⏸️ Ожидает данных

Интеграция Робокассы запланирована после получения недостающих учётных данных.

---

## Требуемые данные (получить у пользователя)

- [ ] `ROBOKASSA_PASSWORD_1` - пароль для формирования подписи платежа
- [ ] `ROBOKASSA_PASSWORD_2` - пароль для проверки callback'ов

### Уже есть:
- ✅ `ROBOKASSA_MERCHANT_LOGIN` = `AIMusicVerseBot`
- ✅ `ROBOKASSA_MERCHANT_ID` = `200000001711217`

---

## План реализации

### 1. Добавить секреты
```
ROBOKASSA_MERCHANT_LOGIN=AIMusicVerseBot
ROBOKASSA_MERCHANT_ID=200000001711217
ROBOKASSA_PASSWORD_1=<от пользователя>
ROBOKASSA_PASSWORD_2=<от пользователя>
```

### 2. Shared SDK
**Файл:** `supabase/functions/_shared/robokassa.ts`

```typescript
// Особенности Робокассы:
// - Подпись: MD5 (НЕ SHA-256 как у Tinkoff)
// - Формат подписи платежа: MerchantLogin:OutSum:InvId:Password1
// - Формат подписи callback: OutSum:InvId:Password2
// - Ответ на callback: OK{InvId}

export function generateRobokassaSignature(
  merchantLogin: string,
  outSum: number,
  invId: number,
  password: string
): string {
  const str = `${merchantLogin}:${outSum}:${invId}:${password}`;
  return md5(str);
}

export function verifyRobokassaCallback(
  outSum: number,
  invId: number,
  signatureValue: string,
  password2: string
): boolean {
  const expected = md5(`${outSum}:${invId}:${password2}`);
  return signatureValue.toLowerCase() === expected.toLowerCase();
}
```

### 3. Edge Functions

#### `robokassa-create-payment/index.ts`
- Создать запись в `payment_transactions` с `gateway = 'robokassa'`
- Сформировать URL для редиректа на Робокассу
- Вернуть URL клиенту

#### `robokassa-webhook/index.ts`
- Проверить подпись с Password2
- Найти транзакцию по InvId
- Вызвать `process_gateway_payment()` для начисления кредитов
- Вернуть `OK{InvId}`

### 4. URL для Робокассы

**Webhook URL:**
```
https://ygmvthybdrqymfsqifmj.supabase.co/functions/v1/robokassa-webhook
```

**Success URL:**
```
https://your-domain.com/payment/success?gateway=robokassa
```

**Fail URL:**
```
https://your-domain.com/payment/fail?gateway=robokassa
```

### 5. Frontend

- Добавить `'robokassa'` в `PaymentMethodSelector`
- Создать `src/hooks/useRobokassaPayment.ts`
- Создать `src/services/robokassaPaymentService.ts`

---

## API Робокассы

### Инициализация платежа (редирект)

```
https://auth.robokassa.ru/Merchant/Index.aspx?
  MerchantLogin=<login>&
  OutSum=<сумма>&
  InvId=<номер счёта>&
  Description=<описание>&
  SignatureValue=<подпись>&
  IsTest=1  // для тестового режима
```

### Callback (Result URL)

POST-запрос от Робокассы:
```
OutSum=100.00&
InvId=123&
SignatureValue=abc123...&
```

Ответ при успехе:
```
OK123
```

---

## Тестовый режим

Для тестирования добавить `&IsTest=1` к URL платежа.

Тестовые данные:
- Любые данные карты в тестовом режиме
- InvId должен быть уникальным

---

## Файлы для создания

```
supabase/functions/
├── _shared/
│   └── robokassa.ts              # SDK + подписи
├── robokassa-create-payment/
│   └── index.ts                   # Создание платежа
└── robokassa-webhook/
    └── index.ts                   # Обработка callback

src/
├── services/
│   └── robokassaPaymentService.ts
└── hooks/
    └── useRobokassaPayment.ts
```

---

## Оценка времени

| Этап | Время |
|------|-------|
| Секреты | 5 мин |
| Shared SDK | 30 мин |
| Edge Functions | 1 час |
| Frontend | 30 мин |
| Тестирование | 30 мин |
| **Итого** | **~2.5 часа** |

---

## Следующие шаги

1. Получить `ROBOKASSA_PASSWORD_1` и `ROBOKASSA_PASSWORD_2` от пользователя
2. Добавить секреты через Lovable
3. Реализовать SDK и Edge Functions
4. Обновить `PaymentMethodSelector` для трёх методов оплаты
5. Протестировать в тестовом режиме
