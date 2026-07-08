/**
 * useGenerationStrings - Hook for localized generation form strings
 *
 * Wraps i18n translations for the generation form domain.
 * Falls back to Russian if translation key is missing.
 */

import { useTranslation } from "react-i18next";

export function useGenerationStrings() {
  const { t } = useTranslation();

  return {
    form: {
      describeSong: t("generation.form.describeSong", "Опишите песню"),
      describeMusic: t("generation.form.describeMusic", "Опишите музыку"),
      placeholderVocals: t("generation.form.placeholderVocals", "Энергичный поп с запоминающимся припевом..."),
      placeholderInstrumental: t("generation.form.placeholderInstrumental", "Атмосферный эмбиент с синтезаторами..."),
      style: t("generation.form.style", "Стиль"),
      title: t("generation.form.title", "Название"),
      titleSuffix: t("generation.form.titleSuffix", "(опционально)"),
      titlePlaceholder: t("generation.form.titlePlaceholder", "Автогенерация если пусто"),
      trackType: t("generation.form.trackType", "Тип трека"),
      lyrics: t("generation.form.lyrics", "Текст песни"),
      privacyPublic: t("generation.form.privacyPublic", "Публичный"),
      privacyPrivate: t("generation.form.privacyPrivate", "Приватный"),
      characterCount: t("generation.form.characterCount", "символов"),
    },
    actions: {
      audio: t("generation.actions.audio", "Аудио"),
      voice: t("generation.actions.voice", "Голос"),
      persona: t("generation.actions.persona", "Персона"),
      project: t("generation.actions.project", "Проект"),
      boostAi: t("generation.actions.boostAi", "Улучшить описание с помощью AI"),
      aiBoostEmptyHint: t("generation.actions.aiBoostEmptyHint", "Введите описание, чтобы использовать AI Boost"),
      chooseStyle: t("generation.actions.chooseStyle", "Выбрать стиль музыки"),
      copyDescription: t("generation.actions.copyDescription", "Копировать описание"),
      clearDescription: t("generation.actions.clearDescription", "Очистить описание"),
      addAudioReference: t("generation.actions.addAudioReference", "Добавить аудио референс"),
      cloneVoice: t("generation.actions.cloneVoice", "Клонировать голос"),
      selectAiPersona: t("generation.actions.selectAiPersona", "Выбрать AI персону"),
      selectProject: t("generation.actions.selectProject", "Выбрать проект"),
      groupLabel: t("generation.actions.groupLabel", "Источники и референсы"),
    },
    hints: {
      trackType: t(
        "generation.hints.trackType",
        "Вокал — AI сгенерирует голос и текст. Инструментал — только музыка без вокала.",
      ),
      title: t("generation.hints.title", "Оставьте пустым для автогенерации названия на основе стиля"),
      style: t("generation.hints.style", "Используйте теги на английском: indie rock, 120 bpm, male vocals"),
      description: t(
        "generation.hints.description",
        "Опишите жанр, настроение и инструменты. Можно на русском или английском.",
      ),
      lyrics: t("generation.hints.lyrics", "Используйте [Verse], [Chorus], [Bridge] для структуры песни"),
      privacy: t("generation.hints.privacy", "Приватные треки видны только вам. Публичные — в ленте сообщества."),
      showHint: t("generation.hints.showHint", "Показать подсказку"),
    },
    vocalToggle: {
      vocalLabel: t("generation.vocalToggle.vocalLabel", "Вокал"),
      instrumentalLabel: t("generation.vocalToggle.instrumentalLabel", "Инструментал"),
      withVocalsDesc: t("generation.vocalToggle.withVocalsDesc", "AI сгенерирует вокал по тексту песни"),
      instrumentalDesc: t("generation.vocalToggle.instrumentalDesc", "Чистая музыка без голоса"),
    },
    lyrics: {
      preview: t("generation.lyrics.preview", "Предпросмотр текста песни"),
      textEditor: t("generation.lyrics.textEditor", "Текстовый редактор"),
      visualEditor: t("generation.lyrics.visualEditor", "Визуальный редактор секций"),
      sectionLabel: t("generation.lyrics.sectionLabel", "Текст песни"),
      fullSong: t("generation.lyrics.fullSong", "Полная песня"),
      rapTrack: t("generation.lyrics.rapTrack", "Рэп трек"),
      sections_one: t("generation.lyrics.sections_one", "секция"),
      sections_few: t("generation.lyrics.sections_few", "секции"),
      sections_many: t("generation.lyrics.sections_many", "секций"),
      line_one: t("generation.lyrics.line_one", "строка"),
      line_few: t("generation.lyrics.line_few", "строки"),
      line_many: t("generation.lyrics.line_many", "строк"),
      duplicateSection: t("generation.lyrics.duplicateSection", "Дублировать секцию"),
      addSection: t("generation.lyrics.addSection", "добавлен"),
      sectionMoved: t("generation.lyrics.sectionMoved", "Секция перемещена"),
      sectionDuplicated: t("generation.lyrics.sectionDuplicated", "Секция дублирована"),
      sectionDeleted: t("generation.lyrics.sectionDeleted", "Секция удалена"),
      showStats: t("generation.lyrics.showStats", "Показать статистику"),
      hideStats: t("generation.lyrics.hideStats", "Скрыть статистику"),
    },
    guitar: {
      recordMelody: t("generation.guitar.recordMelody", "Запишите мелодию"),
      analyzeFirst: t("generation.guitar.analyzeFirst", "Сначала проанализируйте запись"),
    },
    promptHistory: {
      promptLoaded: t("generation.promptHistory.promptLoaded", "Промпт загружен"),
      inspirationLoaded: t("generation.promptHistory.inspirationLoaded", "Промпт для вдохновения загружен"),
      savedPromptLoaded: t("generation.promptHistory.savedPromptLoaded", "Сохраненный промпт загружен"),
      promptDeleted: t("generation.promptHistory.promptDeleted", "Промпт удален из истории"),
      promptUnbookmarked: t("generation.promptHistory.promptUnbookmarked", "Промпт удален из закладок"),
      promptBookmarked: t("generation.promptHistory.promptBookmarked", "Промпт сохранен в закладки"),
      promptSaved: t("generation.promptHistory.promptSaved", "Промпт сохранен"),
      copiedToClipboard: t("generation.promptHistory.copiedToClipboard", "Скопировано в буфер"),
      untitled: t("generation.promptHistory.untitled", "Без названия"),
    },
    template: {
      saveDialogTitle: t("generation.template.saveDialogTitle", "Сохранить в библиотеку"),
      save: t("generation.template.save", "Сохранить"),
      saving: t("generation.template.saving", "Сохранение..."),
      cancel: t("generation.template.cancel", "Отмена"),
      templateName: t("generation.template.templateName", "Название шаблона"),
      namePlaceholder: t("generation.template.namePlaceholder", "Например: Романтичная баллада"),
      tagsCount: t("generation.template.tagsCount", "тегов"),
    },
    style: {
      replaceWarning: t("generation.style.replaceWarning", "Выберите хотя бы один тег"),
      tagAdded: t("generation.style.tagAdded", "Тег добавлен в текст"),
      notFound: t("generation.style.notFound", "Ничего не найдено"),
      noSaved: t("generation.style.noSaved", "Нет сохранённых стилей"),
      noSavedDesc: t("generation.style.noSavedDesc", "Сохраняйте любимые стили при генерации для быстрого доступа"),
    },
    toast: {
      copied: t("generation.toast.copied", "Скопировано"),
      copyFailed: t("generation.toast.copyFailed", "Не удалось скопировать"),
    },
    validation: {
      vocalsNeedLyrics: t("generation.validation.vocalsNeedLyrics", "Для вокального трека требуется текст песни"),
    },
  };
}
