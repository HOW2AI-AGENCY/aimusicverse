# Большой проход: плеер + главная + навигация + безопасность

## 1. Подсветка лирики в полноэкранном плеере
**Проблема:** `KaraokeView`/`LyricsPanel` не показывают синхронизированный текст в fullscreen.

**Действия:**
- В `src/components/player/KaraokeView.tsx`: подключить активную версию через `useActiveVersion(trackId)`, читать `lyrics` + `timestamped_lyrics` из неё (а не из `activeTrack` напрямую).
- Использовать `useAudioTime()` для текущего времени, скролл активной строки через `scrollIntoView({ block: 'center', behavior: 'smooth' })`.
- Fallback: если нет таймкодов — выровненный текст без подсветки + сообщение «Тайминги недоступны».
- Поддержка LRC/JSON тегов через существующий `src/lib/lyricsTiming.ts` (если есть) или inline парсер.

## 2. Унификация fullscreen-плеера
**Сейчас:** `MobileFullscreenPlayer.tsx` (1025 строк), `DesktopFullscreenPlayer.tsx` (384), `ExpandedPlayer.tsx` (456) — дубли логики.

**Действия:**
- Создать `src/components/player/FullscreenPlayer.tsx` (≤450 строк) — единый компонент с тремя layout-вариантами через `useMediaQuery`:
  - **mobile (<768px):** вертикальный stack — cover (60vh) → title/artist → waveform+таймлайн → controls (prev/play/next, size 56) → secondary row (like, queue, lyrics toggle, ×).
  - **tablet (768–1279):** split — cover слева 45%, lyrics/controls справа.
  - **desktop (≥1280):** широкая палитра — cover слева 40%, в центре waveform + transport, справа lyrics panel; close ×, queue, like в header.
- Подкомпоненты вынести в `src/components/player/fullscreen/`: `FullscreenHeader.tsx`, `FullscreenCover.tsx`, `FullscreenTimeline.tsx` (waveform + currentTime/duration), `FullscreenControls.tsx`, `FullscreenLyrics.tsx` (обёртка над `KaraokeView`).
- Таймлайн: waveform высотой 56px на desktop / 40px на mobile, времена `mm:ss` слева/справа, прогресс синхронизирован с `useAudioTime`.
- Удалить `MobileFullscreenPlayer.tsx`, `DesktopFullscreenPlayer.tsx`, `ExpandedPlayer.tsx` после миграции всех импортов (поиск через rg).
- Кнопка × — `min-h-11 min-w-11`, `aria-label="Закрыть плеер"`, `stopPropagation`, всегда в правом верхнем углу с учётом safe-area.

## 3. Главная страница + навигация
**Действия в `src/pages/Index.tsx`:**
- Перекомпоновать секции в чёткую иерархию: Hero/StatsHighlight → Quick Actions (Generate/Library/Studio CTA) → Featured tracks → New releases → Popular → AutoPlaylists → Community.
- Унифицировать обёртку секций через новый `src/components/home/HomeSection.tsx` с консистентными `py-8 md:py-12`, заголовком + действием справа.
- Desktop: max-w-7xl container, 12-колоночный grid; убрать произвольные ширины и `gap`-конфликты.
- Mobile: 1 колонка, горизонтальные scroll-ленты для карусели.

**Навигация:**
- `Sidebar.tsx`: проверить z-index (`z-40`), edge-rail mode (`w-14`) для md+, full mode (`w-64`) для xl+; на mobile — sheet.
- `BottomNav.tsx`: только mobile/tablet portrait; убрать пересечения с CompactPlayer (отступ снизу = высота плеера через CSS var `--compact-player-height`).
- В `MainLayout` пробросить `--compact-player-height` из `ResizablePlayer` через `useEffect` + `ResizeObserver`.

## 4. Тесты
- Уже добавлен `tests/e2e/player.compact.fullscreen.spec.ts`.
- Добавить `tests/e2e/player.lyrics.spec.ts`: открыть fullscreen, переключить вкладку «Текст», убедиться что активная строка имеет `data-active="true"` и видна.
- Добавить `tests/e2e/home.layout.spec.ts`: 390/820/1440 — нет overflow, секции не пересекаются с Sidebar/BottomNav.

## 5. Security findings (обязательно)
- `credit_transactions`: удалить клиентскую INSERT-политику; инсерты только через `secure_credit_update` RPC / service_role.
- `user_credits`: удалить «Admins can update user credits»; админ-изменения только через server-side функцию.
- `stars_transactions`: удалить клиентскую INSERT-политику; вставки только из webhook через service_role.
- Миграция SQL + `manage_security_finding` mark_as_fixed + обновить `security memory`.

## Технические детали
- Все цвета — semantic токены (`bg-background`, `text-foreground`, `border-border`), без `text-white`/`bg-black`.
- Импорты иконок — `@/lib/icons`.
- Логгер — `@/lib/logger`, без `console.*`.
- Haptic — `hapticImpact('light')` на основных действиях.
- Bundle: проверить `npm run size` после удаления 3 плееров (ожидаем минус ~15–20KB gzip).

## Порядок коммитов
1. Security миграция + memory.
2. KaraokeView fix + тест лирики.
3. FullscreenPlayer unified + подкомпоненты + миграция импортов + удаление старых файлов.
4. Home layout + HomeSection + sidebar/bottomnav z-index + CSS var.
5. E2E тесты home.layout.spec.ts.

## Риски
- Удаление `MobileFullscreenPlayer` затронет ~5–10 импортов — поиск через rg обязателен.
- Изменение RLS на `stars_transactions` сломает текущие клиентские вставки — нужно убедиться что вебхук пишет от service_role (проверить `supabase/functions/telegram-payment-webhook/`).
- `secure_credit_update` RPC должна существовать; иначе создать.
