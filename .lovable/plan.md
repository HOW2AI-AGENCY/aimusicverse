## Текущая ситуация

Запрос объединяет 6 крупных направлений + аудит регрессий. Это слишком много для одного безопасного прохода — высокий риск повторно сломать то, что уже чинили (стемы, разметка). Предлагаю разбить на проверяемые этапы и начать с **аудита регрессий**, потому что вернувшиеся удалённые компоненты и поехавшая разметка — самое срочное.

## План работ (поэтапно)

### Этап 0 — Аудит регрессий (СНАЧАЛА, отдельным проходом)
Цель: понять что и почему вернулось/поехало, прежде чем накатывать новые изменения.

1. Найти упоминания «Стемы готовы» / `StemsReady` / связанных тостов и баннеров — определить какой коммит/файл их вернул.
2. Проверить `MainLayout`, `BottomNav`, `Index`, `GenerateSheet`, `VoiceCloneWizard` на конфликтующую разметку (двойные обёртки, дублирующиеся headers, потерянные safe-area отступы).
3. Запустить Playwright на `/` (mobile 424x783) и сделать скриншоты: hero, фид, BottomNav, открытие GenerateSheet, открытие VoiceCloneWizard.
4. Сверить с тем, что должно быть согласно `mem://ui/unified-system` и `mem://ui/standardized-section-header-component-pattern`.
5. Отчёт пользователю: список регрессий + предложение точечных фиксов.

**Останавливаюсь и показываю результат до перехода к следующим этапам.**

### Этап 1 — Унификация toast/hint системы
- Единый `notify.step({ stage, title, description, action? })` поверх `src/lib/toast.ts`.
- Aria-атрибуты: `role="status"` для info/success, `role="alert"` для error, `aria-live="polite"`.
- Применить в `VoiceCloneWizard` и `GenerateSheet` (заменить разрозненные `toast.*` вызовы).

### Этап 2 — Скелетоны, empty/error состояния
- Использовать существующий `UnifiedSkeleton` (см. `specs/002-ui-component-unification/contracts/unified-skeleton.types.ts`).
- Списки голосов в `CustomVoicePicker`, результаты генерации в `GenerationResultSheet`: skeleton с фиксированной высотой → empty (`EmptyState`) → error (`ErrorState` с retry) → данные. Без скачков верстки (reserve aspect-ratio).

### Этап 3 — Унификация диалогов
- Привести `GenerateSheet` и `VoiceCloneWizard` к единому шаблону:
  - `SectionHeader` сверху (заголовок + шаг N/M + close).
  - Тело со скроллом.
  - Sticky footer с primary/secondary кнопкой и единым `LoadingButton` состоянием.
- Focus trap, `aria-labelledby`, `aria-describedby`, возврат фокуса на триггер при закрытии.
- Esc/swipe-down закрытие там, где безопасно.

### Этап 4 — Accessibility сквозной проход
- Tab-навигация по BottomNav, GenerateSheet, VoiceCloneWizard.
- `aria-label` на icon-only кнопках.
- `focus-visible` рингование (через `src/styles/focus.css`).
- Прогон axe на `/`, `/library`, `/auth`.

### Этап 5 — Mobile-first редизайн главной страницы (отдельный спринт, с визуальными направлениями)
- Скриншот текущей `/`, 3 направления через `design--create_directions` (locked: dark theme, primary `#3B82F6`, SF Pro/Inter).
- Пользователь выбирает → реализую: hero, секции (Featured/Recent/Popular), BottomNav, MainLayout, общие отступы/типографика.
- Обновить перелинковку (карточки → детали трека, hero CTA → `/generate`, секции → `/library?filter=...`).

### Этап 6 — Финализация
- Обновить `.lovable/plan.md` (статусы Sprint 4.6 + новый Sprint 4.7).
- Обновить `mem://index.md` если появятся новые правила.
- E2E: `tests/e2e/home.navigation.spec.ts` + `voice-clone.flow.spec.ts` зелёные.

## Что делаю прямо сейчас

Только **Этап 0** — аудит регрессий. Никаких правок кода до подтверждения находок. После аудита покажу список проблем и спрошу, какие чинить в первую очередь и переходим ли к Этапам 1–4 (Этап 5 — отдельно, с выбором дизайн-направления).

## Технические детали

- Регрессии «Стемы готовы»: грепаю `rg -n "Стемы готовы|StemsReady|stems_ready"` + `git log` на `src/components/stem-studio/` и `src/components/player/` (через `chat_search`, не через stateful git).
- Layout-аудит: Playwright headless, viewport 424x783, скриншоты в `/tmp/browser/audit-regressions/`.
- Источник истины для UI-примитивов: `mem://ui/unified-system`.
- Toast-обёртка уже есть (`src/lib/toast.ts` с дедупликацией) — расширяю её, не создаю новую.

## Риски и контроль

- **Не трогаю** `src/integrations/supabase/*`, `supabase/config.toml`, бизнес-логику генерации.
- После каждого этапа — Playwright скриншот + проверка консоли на ошибки.
- Если этап ломает существующий функционал — откатываю изменения этого этапа и спрашиваю.
