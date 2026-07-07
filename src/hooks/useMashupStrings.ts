/**
 * useMashupStrings - Hook for localized mashup/persona strings
 *
 * Wraps i18n translations for the mashup domain.
 * Falls back to Russian if translation key is missing.
 */

import { useTranslation } from "react-i18next";

export function useMashupStrings() {
  const { t } = useTranslation();

  return {
    dialog: {
      title: t("mashup.dialog.title", "Mashup"),
      description: t("mashup.dialog.description", "Смешайте два своих трека в один"),
    },
    form: {
      trackALabel: t("mashup.form.trackALabel", "Трек A *"),
      trackBLabel: t("mashup.form.trackBLabel", "Трек B *"),
      selectTrackPlaceholder: t("mashup.form.selectTrackPlaceholder", "Выберите трек"),
      selectTrackAFirstPlaceholder: t("mashup.form.selectTrackAFirstPlaceholder", "Сначала выберите трек A"),
      modelLabel: t("mashup.form.modelLabel", "Модель"),
      customModeLabel: t("mashup.form.customModeLabel", "Custom-режим (стиль + название)"),
      styleLabel: t("mashup.form.styleLabel", "Стиль *"),
      stylePlaceholder: t("mashup.form.stylePlaceholder", "Стиль результата..."),
      titleLabel: t("mashup.form.titleLabel", "Название *"),
      titlePlaceholder: t("mashup.form.titlePlaceholder", "Название mashup"),
      vocalToggleLabel: t("mashup.form.vocalToggleLabel", "С вокалом"),
      promptLabel: t("mashup.form.promptLabel", "Описание *"),
      promptPlaceholder: t("mashup.form.promptPlaceholder", "Что должен звучать mashup..."),
    },
    actions: {
      submit: t("mashup.actions.submit", "Создать mashup"),
      submitting: t("mashup.actions.submitting", "Создание mashup..."),
      successToast: t("mashup.actions.successToast", "Mashup запущен"),
      successDescription: t("mashup.actions.successDescription", "Результат появится в библиотеке через 1-3 минуты"),
    },
    validation: {
      pickBothTracks: t("mashup.validation.pickBothTracks", "Выберите оба трека"),
      tracksMustDiffer: t("mashup.validation.tracksMustDiffer", "Треки должны различаться"),
      specifyStyle: t("mashup.validation.specifyStyle", "Укажите стиль"),
      specifyTitle: t("mashup.validation.specifyTitle", "Укажите название"),
      promptOrInstrumental: t(
        "mashup.validation.promptOrInstrumental",
        "Добавьте описание или выберите инструментальный режим",
      ),
      fallback: t("mashup.validation.fallback", "Трек без названия"),
    },
    persona: {
      footerButtonLabel: t("mashup.persona.footerButtonLabel", "Persona"),
      dialogTitle: t("mashup.persona.dialogTitle", "Обучить Persona"),
      dialogDescription: t("mashup.persona.dialogDescription", "Suno создаст переиспользуемую персону из этого трека"),
      nameLabel: t("mashup.persona.nameLabel", "Имя персоны *"),
      namePlaceholder: t("mashup.persona.namePlaceholder", "Например: мой вокал"),
      descriptionLabel: t("mashup.persona.descriptionLabel", "Описание (необязательно)"),
      descriptionPlaceholder: t("mashup.persona.descriptionPlaceholder", "Тёплый женский голос, поп-стиль"),
      cancel: t("mashup.persona.cancel", "Отмена"),
      submit: t("mashup.persona.submit", "Обучить"),
      submitting: t("mashup.persona.submitting", "Запуск…"),
      successToastReady: t("mashup.persona.successToastReady", "Persona готова к использованию."),
      successToastPending: t("mashup.persona.successToastPending", "Persona обучается"),
      validation: {
        specifyName: t("mashup.persona.validation.specifyName", "Укажите имя персоны"),
        nameTooLong: t("mashup.persona.validation.nameTooLong", "Имя персоны — максимум 80 символов"),
        trainingFailed: t("mashup.persona.validation.trainingFailed", "Не удалось запустить обучение персоны"),
      },
    },
    generationResult: {
      fallbackTrackTitle: t("mashup.generationResult.fallbackTrackTitle", "Новый трек"),
      versionSwitchError: t("mashup.generationResult.versionSwitchError", "Не удалось установить версию"),
      playButtonLabel: t("mashup.generationResult.playButtonLabel", "Воспроизвести"),
      pauseButtonLabel: t("mashup.generationResult.pauseButtonLabel", "Пауза"),
    },
  };
}
