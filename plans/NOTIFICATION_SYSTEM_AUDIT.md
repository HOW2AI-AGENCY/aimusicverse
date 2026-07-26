# Аудит: Система оповещений, онбординг и советы

## Текущая архитектура — 6 систем

### 1. Toast (sonner)
- **285 файлов** используют `toast.*`
- sonner — ready-made, без кастомизации
- **Где используется:** все формы, генерация, ошибки, успех
- **Проблемы:** нет группировки, нет очереди, toast могут заспамить

### 2. AnnouncementContext (системная)
- **257 LOC** — приоритетная очередь (`low/normal/high/critical`)
- dismiss-трекинг (`wasDismissed(id)`)
- pause/resume для онбординга
- **Где используется:** `SystemAnnouncement`, `SubscriptionFeatureAnnouncement`
- **Проблемы:** нет React-компонента для рендеринга (кроме toast)

### 3. Onboarding
- `OnboardingFlow` — state machine (idle → quick_start → telegram → ...)
- `OnboardingOverlay` — полупрозрачный туториал
- `QuickStartOverlay`, `TelegramOnboarding`
- `OnboardingStateMachine` — конечный автомат
- `GamificationOnboarding` — геймификация первого визита
- `GraphOnboarding` — для музыкального графа
- `ProfileSetupOnboarding`
- **Где используется:** App.tsx (MainLayout)
- **Проблемы:** 8+ разрозненных онбордингов, нет единого orchestrator

### 4. OfflineBanner
- Собственный компонент в `MainLayout`
- **Хорошо:** persistent, auto-hide при восстановлении
- **Проблемы:** не интегрирован в AnnouncementContext

### 5. Tooltips/Хинты
- `MoreMenuHintTooltip` — разовый хинт для меню
- `Tooltip` (shadcn/ui) — базовый
- **Проблемы:** нет системы контекстных советов (contextual tips)

### 6. Changelog
- `TrackChangelogTab` — история изменений трека
- `changelog` queries — для версий треков
- **Проблемы:** нет глобального changelog для новых функций

## Схема unified-системы

```
┌─────────────────────────────────────────────────┐
│              NotificationOrchestrator             │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │  Priority Queue                          │     │
│  │  high     → показать немедленно          │     │
│  │  normal   → показать, если нет high       │     │
│  │  low      → показать, если тихо          │     │
│  │  tips     → показывать в свободное время  │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  Sources:                                          │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐   │
│  │ Toast    │ │ Announce │ │ Onboarding       │   │
│  │ (sonner) │ │ Context  │ │ Flow             │   │
│  └──────────┘ └──────────┘ └─────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐   │
│  │ Tips     │ │ Offline  │ │ Changelog        │   │
│  │ Engine   │ │ Banner   │ │ (new features)   │   │
│  └──────────┘ └──────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Рекомендуемые компоненты

### A. NotificationOrchestrator (новый)
- Объединяет AnnouncementContext + sonner + tips
- Единая очередь с приоритетами
- UI-слот в MainLayout

### B. TipsEngine (новый)
- Контекстные советы: "Попробуйте разделить трек на стемы"
- Триггеры: первое действие, N-я генерация, idle time
- База советов в JSON/DB
- dismiss навсегда / напомнить позже

### C. FeatureAnnouncementBanner (новый)
- Показывается при первом визите после фичи
- Читает `user_dismissed_announcements` из DB
- Встраивается в AnnouncementContext

### D. OnboardingOrchestrator (рефакторинг)
- Управляет порядком: QuickStart → Telegram → Gamification → Graph
- Единая state machine
- Координирует с AnnouncementContext (pause/resume)

## Приоритет реализации

| Компонент | Время | Сложность |
|-----------|-------|-----------|
| A. NotificationOrchestrator (обёртка над существующим) | 1ч | Средняя |
| B. TipsEngine (база советов + UI) | 2ч | Высокая |
| C. FeatureAnnouncementBanner | 1ч | Средняя |
| D. OnboardingOrchestrator | 3ч | Высокая |
