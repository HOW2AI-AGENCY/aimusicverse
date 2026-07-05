/**
 * Mashup & Persona flow — localized strings (RU primary).
 *
 * Sprint 052-C cleanup. Извлечено из MashupDialog.tsx, GenerationResultSheet
 * (PersonaDialog), и Telegram-команд /mashup, /persona, /suno-mashup для:
 *   - единого места правок UX-копи
 *   - подготовки к миграции на полную i18n-инфраструктуру (Sprint 055+)
 *   - лучшей читаемости JSX (нет 5+ string-literals в одном файле)
 *
 * Текущая модель: только RU (i18n-система в проекте отсутствует, см. PROJECT_STATUS).
 * EN-вариант добавляется в Sprint 055 при вводе react-i18next.
 *
 * Использование:
 *   import { MASHUP_STRINGS } from "@/lib/locale/mashupStrings";
 *   <Label>{MASHUP_STRINGS.form.trackALabel}</Label>
 */

export const MASHUP_STRINGS = {
  // === MashupDialog (src/components/MashupDialog.tsx) ===
  dialog: {
    title: "Mashup",
    description: "Смешайте два своих трека в один",
  },
  form: {
    trackALabel: "Трек A *",
    trackBLabel: "Трек B *",
    selectTrackPlaceholder: "Выберите трек",
    selectTrackAFirstPlaceholder: "Сначала выберите трек A",
    modelLabel: "Модель",
    customModeLabel: "Custom-режим (стиль + название)",
    styleLabel: "Стиль *",
    stylePlaceholder: "Стиль результата...",
    titleLabel: "Название *",
    titlePlaceholder: "Название mashup",
    vocalToggleLabel: "С вокалом",
    promptLabel: "Описание *",
    promptPlaceholder: "Что должен звучать mashup...",
  },
  actions: {
    submit: "Создать mashup",
    submitting: "Создание mashup...",
    successToast: "Mashup запущен 🎛️",
    successDescription: "Результат появится в библиотеке через 1-3 минуты",
  },
  validation: {
    pickBothTracks: "Выберите оба трека",
    tracksMustDiffer: "Треки должны различаться",
    specifyStyle: "Укажите стиль",
    specifyTitle: "Укажите название",
    promptOrInstrumental: "Добавьте описание или выберите инструментальный режим",
    fallback: "Трек без названия",
  },

  // === PersonaDialog (GenerationResultSheet → «Обучить Persona») ===
  persona: {
    // Footer button (mashup|persona|stem)
    footerButtonLabel: "Persona",
    // Dialog header
    dialogTitle: "Обучить Persona",
    dialogDescription:
      "Suno создаст переиспользуемую персону из этого трека — её можно будет выбирать при следующих генерациях.",
    // Form fields
    nameLabel: "Имя персоны *",
    namePlaceholder: "Например: мой вокал",
    descriptionLabel: "Описание (необязательно)",
    descriptionPlaceholder: "Тёплый женский голос, поп-стиль",
    // Actions
    cancel: "Отмена",
    submit: "Обучить",
    submitting: "Запуск…",
    // Toasts
    successToastReady: "Persona готова к использованию.",
    successToastPending: "Persona обучается 🎙️",
    logEvent: "Persona training started",
    logEventFailed: "Persona training failed",
    // Validation errors (lines 98, 102, 123)
    validation: {
      specifyName: "Укажите имя персоны",
      nameTooLong: "Имя персоны — максимум 80 символов",
      trainingFailed: "Не удалось запустить обучение персоны",
    },
  },

  // === Telegram bot commands /mashup, /persona, /suno-mashup ===
  telegram: {
    mashupCommandHelp: "Запустить mashup с другим треком",
    mashupDeepLinkTitle: "Mashup с другим треком",
    personaCommandHelp: "Создать персону из текущего трека",
    personaDeepLinkTitle: "Создать персону",
    sunoMashupCallbackHelp: "Inline-кнопка под карточкой трека",
  },

  // === GenerationResultSheet (common strings) ===
  generationResult: {
    fallbackTrackTitle: "Новый трек",
    versionSwitchError: "Не удалось установить версию",
    playButtonLabel: "Воспроизвести",
    pauseButtonLabel: "Пауза",
  },
} as const;

export type MashupStrings = typeof MASHUP_STRINGS;
