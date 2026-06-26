## Что сломалось

Две мои правки задели общий лейаут на мобильных:

1. **Floating hamburger в `MainLayout.tsx`** — `MobileNavDrawer` рендерит `fixed` кнопку в top-left, которая накладывается на собственные header'ы страниц и ломает их симметрию (заголовок страницы смещён вправо, появляется второй слой).
2. **Bottom-sheet поведение в `Dialog` primitive** — насильно растягивает на всю ширину (`inset-x-0 bottom-0 w-full`) и убирает центрирование у всех диалогов, даже маленьких подтверждений. Внутренние `max-w-sm`/`max-w-md` от родителя игнорируются. Появляется ассиметрия в попапах, у которых был `text-center sm:text-left` хедер.

## План отката + правильной реализации

### Шаг 1 — Убрать floating hamburger (немедленно)

- Удалить рендер `<MobileNavDrawer>` из `MainLayout.tsx` (строки ~313–319).
- Оставить файл `src/components/layout/MobileNavDrawer.tsx`, но переэкспортировать его как **opt-in компонент** для будущей интеграции в `BottomNavigation` (заменим там профиль/больше).
- Снять локальное состояние `mobileNavOpen`, импорт `MobileNavDrawer`.

### Шаг 2 — Сделать bottom-sheet в Dialog **opt-in**, не глобальным

Текущая глобальная мутация ломает 40+ диалогов. Правильный подход:

- В `src/components/ui/dialog.tsx` вернуть `DialogContent` к исходному centered-modal поведению (как было до моих правок: `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-lg sm:rounded-xl`).
- Сохранить улучшение overlay (`backdrop-blur-md bg-background/40`) — оно не ломает геометрию.
- Добавить новый проп `mobileSheet?: boolean` (default `false`). Только когда явно передан — рендерим bottom-sheet вариант с drag-handle и safe-area-bottom.
- Документировать в `docs/DESIGN_TOKENS.md`: «для мобильных используем `<MobileBottomSheet>` (vaul) для контента-форм; для подтверждений оставляем стандартный центрированный `Dialog`».

### Шаг 3 — Проверить симметрию основных экранов

После отката пройти Playwright по 390×844 на: `/`, `/library`, `/projects`, `/pricing`, `/profile`. Скриншоты до/после. Убедиться, что:
- ширина main-контента = `100vw − safe-left − safe-right`,
- хедеры страниц выровнены по левому краю safe-area,
- bottom-nav не перекрывает CTA,
- никаких плавающих кнопок поверх контента.

### Шаг 4 — Альтернатива hamburger (без поломки)

Вместо floating-кнопки правильно: добавить «Меню» как 5-й айтем в `BottomNavigation` (заменить `Profile` → `Меню`, профиль доступен из меню). Это убирает наложение и делает навигацию консистентной. **Делаем это отдельным шагом после подтверждения отката.**

### Шаг 5 — Типчек + визуальная регрессия

- `npx tsgo --noEmit` — ожидаем 0 ошибок.
- Скриншоты 5 ключевых страниц через Playwright на 390×844, прикрепить в ответе.

## Acceptance

- Header страниц снова симметричен (заголовок начинается от safe-left + 12px, без сдвига).
- Все существующие диалоги (`AudioCoverDialog`, `WelcomeBonusPopup`, confirmы и т.д.) выглядят как до моих изменений — центрированный modal на всех viewport'ах.
- Полировка overlay сохраняется (blur + saturation).
- Опциональный `mobileSheet` проп доступен для новых форм, где явно нужен sheet.

## Затронутые файлы

- `src/components/MainLayout.tsx` — убрать `MobileNavDrawer` рендер + state + import.
- `src/components/ui/dialog.tsx` — откатить геометрию `DialogContent` к centered modal, оставить новый overlay, добавить опциональный `mobileSheet` проп.
- (без изменений) `src/components/layout/MobileNavDrawer.tsx` — остаётся как готовый компонент для будущего шага 4.
- (без изменений) `tailwind.config.ts` — токены `safe-top/dock-safe` оставляем, они геометрию не ломают.

## Риски

- Минимальные: чистый откат + сужение API. Никаких новых поверхностей.
