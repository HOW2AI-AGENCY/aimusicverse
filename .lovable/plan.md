# Редизайн пути генерации

Цель — снизить визуальный шум, унифицировать разметку и сократить путь «идея → готовый трек». Дизайн-токены и Neon-палитра остаются прежними (это не смена бренда, а чистка потока).

## Текущий путь и его боли

```text
Home → [триггер генерации]
  ↓
GenerateSheet (открытие sheet/dialog)
  ├─ Header (mode: Simple / Custom / References)   ← 3 таба, каждый со своим состоянием
  ├─ Body
  │   ├─ Simple form   (Prompt + Style + Title)
  │   ├─ Custom form   (Lyrics + Structure + Advanced)
  │   └─ References    (2×2 grid + upload dialogs)
  └─ Footer (Generate button + credits + warnings)
  ↓
GenerationLoadingState (2-3 мин ожидания)
  ↓
GenerationResultSheet  (A/B выбор + первое воспроизведение)
  ↓
Library / Player
```

Проблемы, которые я вижу в коде:

1. **Шум в шапке:** `CollapsibleFormHeader` + `GenerationStepIndicator` + `CreditBalanceIndicator` + `CreditBalanceWarning` дублируют статус.
2. **Три режима как табы** — пользователь платит когнитивно за выбор *до того*, как поймёт что хочет. На мобиле табы + свёрнутый sidebar ломают ритм.
3. **Loading state (261 строка)** — большой блок, но не даёт «предпросмотра» (title/lyrics приходят на стадии `text` callback ~10-30с, но не всегда показаны крупно).
4. **Result sheet (507 строк)** — переносит принятие решения на потом; выбор A/B часто игнорируется.
5. **Footer:** `GenerateFormActions` + `GenerateSheetFooter` — два футера в разных местах.

## Что делаем

### 1. Единый header-статус (объединение 4 компонентов)

Заменить `CollapsibleFormHeader` + `GenerationStepIndicator` + `CreditBalanceIndicator` + `CreditBalanceWarning` одной строкой:

```text
[Иконка режима] [Название режима]     ●─○─○  120 ⚡
```

- Один индикатор прогресса (dots), один счётчик кредитов, всё правое поле.
- Предупреждение о балансе — inline только при `credits < cost`, красным на месте счётчика.
- Экономит ~80px вертикали.

### 2. Прогрессивное раскрытие вместо табов

Убрать явные табы Simple/Custom/References. Оставить один экран, где:
- сверху — единое поле «Что создаём?» (prompt),
- под ним — свернутый аккордеон «Дополнительно: тексты, референсы, продвинутое»,
- Custom / References активируются автоматически, когда пользователь коснулся соответствующего раздела.

Табы остаются доступны через switcher в углу для power-users, но не блокируют вход.

### 3. Loading state = живой предпросмотр

Использовать `text`-callback (уже приходит на 10-30с), чтобы показать:
- реальный сгенерированный **заголовок** крупно,
- **первые 4 строки лирики** с эффектом typewriter,
- прогресс-бар с явными стадиями: `Обдумывание → Композиция → Финальный микс` (сейчас — три dot'а без семантики).

Убрать псевдо-анимации волн (`GenerationLoadingState`) — они не отражают реальности и добавляют шум.

### 4. Result sheet → inline compare

Вместо отдельного sheet — inline-панель в текущем контексте:
- две карточки A/B бок-о-бок с одноклик play на каждой,
- активный вариант автоматически подсвечивается, но переключение — один тап,
- кнопка «Оставить оба» / «Оставить только этот» одной строкой снизу.

Убирает лишний экран между генерацией и библиотекой.

### 5. Один футер, одно действие

Оставить только `GenerateSheetFooter`, удалить `GenerateFormActions` (или наоборот — выбор по контексту layoutа). Одна primary-кнопка «Создать трек», справа — стоимость.

### 6. Микро-разметка (везде)

- Отступы карточек в `Advanced settings` → `space-y-3` вместо `space-y-6` (сейчас перегружено).
- `SectionLabel` без иконок в 90% случаев — иконки оставить только для visual-anchor разделов (References, Lyrics).
- `PromptValidationAlert` → inline hint под полем, не отдельная плашка.

## Файлы, которые буду менять

| Файл | Что |
| --- | --- |
| `src/components/GenerateSheet.tsx` | Свести header/footer к единому layoutу |
| `src/components/generate-form/CollapsibleFormHeader.tsx` | Объединить с `GenerationStepIndicator` + credits |
| `src/components/generate-form/GenerationLoadingState.tsx` | Использовать `text` callback, стадийный прогресс |
| `src/components/generate-form/GenerationResultSheet.tsx` | Inline A/B compare вместо отдельного sheet |
| `src/components/generate-form/GenerateFormSimple.tsx` | Прогрессивный аккордеон вместо трёх режимов |
| `src/components/generate-sheet/GenerateSheetFooter.tsx` | Единственная точка primary-действия |
| `src/components/generate-form/PromptValidationAlert.tsx` | Inline hint |
| `src/components/generate-form/CreditBalanceIndicator.tsx` | Убирается — сливается в header |

Плюс визуальный регресс-тест `tests/visual/generate-flow.spec.ts` на 4 контрольные точки (idle, loading, text-callback, result).

## Что НЕ трогаю

- Neon-палитра, шрифты, дизайн-токены (`src/lib/design-tokens.ts`) — остаются.
- Логика Suno (callback handlers, RPC, credits).
- Роутинг и state stores (`useGenerateForm`, `useUnifiedStudioStore`).
- Компоненты студии, библиотеки, комьюнити — только вход в генерацию.

## Технические детали

- Всё через существующие shadcn-примитивы (`Sheet`, `Card`, `Progress`) — новых зависимостей нет.
- Иконки только из `@/lib/icons` (обёртка над lucide-react).
- Мобильный layout: остаётся `MobileBottomSheet` (vaul), touch-target ≥ 44px.
- Safe-area переменные `--tg-*` уже используются — сохраняю.
- Каждый рефакторнутый файл прогоняю через `bunx tsgo --noEmit`.

## Порядок работ

1. Header consolidation (небольшой, быстрый win) — 1 коммит.
2. Loading state + text-callback preview — 1 коммит.
3. Result sheet → inline compare — 1 коммит.
4. Simple/Custom прогрессивное раскрытие — 1 коммит (риск регрессий выше, поэтому в конце).
5. Микро-разметка и удаление дублирующих футеров — 1 коммит.
6. Визуальный regression-тест — финальный коммит.

Каждый шаг можно откатить независимо.
