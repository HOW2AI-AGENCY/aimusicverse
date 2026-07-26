/**
 * useLyricsAssistant — AI chat state machine for lyrics generation
 *
 * Manages the conversation flow:
 *   genre → mood → structure → generate → preview → edit/apply
 *
 * Communicates with the ai-lyrics-assistant Edge Function.
 */

import { useState, useCallback } from "react";
import { sendAiChatMessage } from "@/services/lyrics/ai-tools.service";
import { invokeLyricsAssistant, type RecommendedTags } from "@/api/lyrics.api";
import { streamLyricsAssistant } from "@/lib/lyrics/streaming";
import { useIsMobile } from "@/hooks/use-mobile";
import { parseLyrics } from "@/components/generate-form/lyricsEditorHelpers";
import type { ChatMessage } from "@/components/generate-form/lyrics-chat/types";

interface UseLyricsAssistantOptions {
  currentLyrics?: string;
  genre?: string;
  mood?: string[];
  language?: string;
  projectContext?: {
    projectId: string;
    projectTitle: string;
    genre?: string;
    mood?: string;
    language?: "ru" | "en";
    concept?: string;
    targetAudience?: string;
    referenceArtists?: string[];
    existingTracks?: Array<{
      position: number;
      title: string;
      stylePrompt?: string;
      draftLyrics?: string;
      generatedLyrics?: string;
      recommendedTags?: string[];
      recommendedStructure?: string;
      notes?: string;
      lyrics?: string;
      lyricsStatus?: "draft" | "prompt" | "generated" | "approved" | undefined;
    }>;
    projectType?: string;
  };
  trackContext?: {
    position: number;
    title: string;
    stylePrompt?: string;
    draftLyrics?: string;
    generatedLyrics?: string;
    recommendedTags?: string[];
    recommendedStructure?: string;
    notes?: string;
    lyrics?: string;
    lyricsStatus?: "draft" | "prompt" | "generated" | "approved" | undefined;
  };
  onApply: (text: string, targetSectionId?: string) => void;
  onApplyTitle?: (title: string) => void;
  onApplyStyle?: (style: string) => void;
}

interface LyricsResult {
  lyrics: string;
  title?: string;
  style?: string;
}

export type { UseLyricsAssistantOptions };

export function useLyricsAssistant({
  currentLyrics,
  genre: initialGenre,
  mood: initialMood,
  language: initialLanguage = "ru",
  projectContext,
  trackContext,
  onApply,
  onApplyTitle,
  onApplyStyle,
}: UseLyricsAssistantOptions) {
  const isMobile = useIsMobile();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Привет! Я помогу написать текст песни. Давай начнём с выбора жанра:",
      component: "genre",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Selections — pre-seed from incoming context when available
  const [selectedGenre, setSelectedGenre] = useState(initialGenre || "");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(initialMood || []);
  const [selectedStructure, setSelectedStructure] = useState("");

  // Result
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedStyle, setGeneratedStyle] = useState("");
  const [recommendedTags, setRecommendedTags] = useState<RecommendedTags | null>(null);

  // Actions state
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addUserMessage = useCallback(
    (content: string) => {
      const msg: ChatMessage = { id: `user-${Date.now()}`, role: "user", content };
      addMessage(msg);
      return msg;
    },
    [addMessage],
  );

  const addAssistantMessage = useCallback(
    (content: string, component?: ChatMessage["component"], data?: Record<string, unknown>) => {
      const msg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
        ...(component && { component }),
        ...(data && { data }),
      };
      addMessage(msg);
    },
    [addMessage],
  );

  // Genre selection
  const handleGenreSelect = useCallback(
    async (genre: string) => {
      setSelectedGenre(genre);
      addUserMessage(`Жанр: ${genre}`);
      addAssistantMessage("Отлично! Теперь выбери настроение (до 3):", "mood");
    },
    [addUserMessage, addAssistantMessage],
  );

  // Mood selection
  const handleMoodSelect = useCallback((moods: string[]) => {
    setSelectedMoods(moods);
  }, []);

  const handleMoodConfirm = useCallback(() => {
    const moodText = selectedMoods.join(", ");
    addUserMessage(`Настроение: ${moodText}`);
    addAssistantMessage("Теперь выбери структуру песни:", "structure");
  }, [selectedMoods, addUserMessage, addAssistantMessage]);

  // Structure selection — streams the generation so the editor fills as tokens arrive.
  const handleStructureSelect = useCallback(
    async (structure: string) => {
      setSelectedStructure(structure);
      addUserMessage(`Структура: ${structure}`);

      setIsLoading(true);
      // Reset the generated buffer up front so the streamed text replaces prior output.
      setGeneratedLyrics("");
      addAssistantMessage("Создаю текст...");

      try {
        const { final, aborted } = await streamLyricsAssistant({
          action: "generate",
          genre: selectedGenre,
          mood: selectedMoods.join(", "),
          structure,
          language: "ru",
          lyrics: currentLyrics || undefined,
          onLyricsProgress: (partial) => {
            // Live-update the preview state as SSE deltas arrive.
            setGeneratedLyrics(partial);
          },
        });

        if (aborted) {
          setMessages((prev) => prev.filter((m) => m.content !== "Создаю текст..."));
          addAssistantMessage("Генерация отменена.");
          return;
        }

        const data = final;

        if (data?.lyrics) {
          const sections = parseLyrics(data.lyrics);
          const hasValidSections = sections.length > 0;
          const title = data?.title || data?.suggestions?.[0] || "Новый трек";
          const style = data?.style || `${selectedGenre} — ${selectedMoods.join("/")}`;

          setGeneratedLyrics(data.lyrics);
          setGeneratedTitle(title);
          setGeneratedStyle(style);

          if (data?.metadata?.recommendedTags) {
            setRecommendedTags(data.metadata.recommendedTags as RecommendedTags);
          }

          setMessages((prev) => prev.filter((m) => m.content !== "Создаю текст..."));
          const resultMsg = hasValidSections
            ? `Готово! ${sections.length} секций. Можешь скопировать, применить или продолжить:`
            : "Текст создан, но секции не распознаны. Проверь формат тегов [Verse], [Chorus]...";
          addAssistantMessage(resultMsg, "lyrics-preview", {
            lyrics: data.lyrics,
            title,
            style,
          });
        } else {
          setMessages((prev) => prev.filter((m) => m.content !== "Создаю текст..."));
          addAssistantMessage("Что-то пошло не так. Попробуй ещё раз или напиши, что изменить.");
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.content !== "Создаю текст..."));
        addAssistantMessage("Ошибка соединения. Проверь интернет и попробуй снова.");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedGenre, selectedMoods, currentLyrics, addUserMessage, addAssistantMessage],
  );

  // Send message
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue("");
    addUserMessage(text);

    setIsLoading(true);
    try {
      const conversationHistory = messages
        .slice(-10)
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await sendAiChatMessage({
        message: text,
        context: {
          genre: selectedGenre,
          mood: selectedMoods,
          structure: selectedStructure,
          currentLyrics: generatedLyrics || currentLyrics,
          conversationHistory,
        },
      });

      if (error) {
        addAssistantMessage("Не получилось связаться с AI. Попробуй ещё раз.");
        return;
      }

      const anyData = data as Record<string, unknown> | null;
      const responseText = typeof anyData?.response === "string" ? (anyData.response as string) : "";

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        addAssistantMessage(responseText || "Готово! Вот обновлённый вариант:", "lyrics-preview", {
          lyrics: data.lyrics,
          title: data.title || generatedTitle,
          style: data.style || generatedStyle,
        });
        if (data.title) setGeneratedTitle(data.title);
        if (data.style) setGeneratedStyle(data.style);
      } else if (responseText) {
        addAssistantMessage(responseText);
      } else if (data?.suggestions?.length) {
        addAssistantMessage(data.suggestions.join("\n"));
      } else {
        addAssistantMessage("Готово! Что-то ещё?");
      }
    } catch {
      addAssistantMessage("Не получилось связаться с AI. Попробуй ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }, [
    inputValue,
    isLoading,
    messages,
    selectedGenre,
    selectedMoods,
    selectedStructure,
    generatedLyrics,
    currentLyrics,
    generatedTitle,
    generatedStyle,
    addUserMessage,
    addAssistantMessage,
  ]);

  // Action handlers
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedLyrics]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Simulate save — in production would persist to DB
    await new Promise((r) => setTimeout(r, 500));
    setSaved(true);
    setIsSaving(false);
  }, []);

  const handleRegenerate = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await invokeLyricsAssistant({
        action: "generate",
        genre: selectedGenre,
        mood: selectedMoods.join(", "),
        structure: selectedStructure,
        language: "ru",
      });
      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        addAssistantMessage("Новый вариант:", "lyrics-preview", {
          lyrics: data.lyrics,
          title: generatedTitle,
          style: generatedStyle,
        });
      }
    } catch {
      addAssistantMessage("Не удалось сгенерировать новый вариант.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenre, selectedMoods, selectedStructure, generatedTitle, generatedStyle, addAssistantMessage]);

  const handleApply = useCallback(() => {
    onApply(generatedLyrics);
    if (onApplyTitle && generatedTitle) onApplyTitle(generatedTitle);
    if (onApplyStyle && generatedStyle) onApplyStyle(generatedStyle);
  }, [generatedLyrics, generatedTitle, generatedStyle, onApply, onApplyTitle, onApplyStyle]);

  const handleContinue = useCallback(() => {
    addAssistantMessage("Что хочешь изменить? Напиши, и я переделаю.");
  }, [addAssistantMessage]);

  const handleRequestEdit = useCallback(
    async (instruction: string) => {
      setIsLoading(true);
      addUserMessage(instruction);
      try {
        const conversationHistory = messages
          .slice(-10)
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));
        const { data, error } = await sendAiChatMessage({
          message: instruction,
          context: {
            currentLyrics: generatedLyrics,
            genre: selectedGenre,
            mood: selectedMoods,
            structure: selectedStructure,
            conversationHistory,
          },
        });
        if (error) {
          addAssistantMessage("Ошибка при редактировании.");
          return;
        }
        const anyData = data as Record<string, unknown> | null;
        const responseText = typeof anyData?.response === "string" ? (anyData.response as string) : "";
        if (data?.lyrics) {
          setGeneratedLyrics(data.lyrics);
          addAssistantMessage(responseText || "Обновил:", "lyrics-preview", {
            lyrics: data.lyrics,
            title: data.title || generatedTitle,
            style: data.style || generatedStyle,
          });
          if (data.title) setGeneratedTitle(data.title);
          if (data.style) setGeneratedStyle(data.style);
        } else if (responseText) {
          addAssistantMessage(responseText);
        } else {
          addAssistantMessage("Готово.");
        }
      } catch {
        addAssistantMessage("Ошибка при редактировании.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      generatedLyrics,
      selectedGenre,
      selectedMoods,
      selectedStructure,
      generatedTitle,
      generatedStyle,
      addUserMessage,
      addAssistantMessage,
    ],
  );

  const handleTitleChange = useCallback((title: string) => {
    setGeneratedTitle(title);
  }, []);

  const handleStyleChange = useCallback((style: string) => {
    setGeneratedStyle(style);
  }, []);

  // Quick option handler
  const handleOptionClick = useCallback((option: { value: string }) => {
    if (option.value) {
      setInputValue(option.value);
    }
  }, []);

  // Execute arbitrary AI action (analysis, validation, etc.)
  const handleAiAction = useCallback(
    async (action: string, params?: Record<string, unknown>) => {
      setIsLoading(true);
      const actionLabels: Record<string, string> = {
        improve: "Улучшить текст",
        add_tags: "Добавить теги",
        full_analysis: "Проанализировать",
        deep_analysis: "Глубокий анализ",
        producer_review: "Продюсерский разбор",
        validate_suno_v5: "Проверить теги Suno",
        hook_generator: "Улучшить хук",
        vocal_map: "Вокальная карта",
      };
      addUserMessage(actionLabels[action] || `Действие: ${action}`);
      try {
        const { data, error } = await invokeLyricsAssistant({
          action,
          genre: selectedGenre,
          mood: selectedMoods.join(", "),
          structure: selectedStructure,
          language: "ru",
          lyrics: generatedLyrics || currentLyrics,
          ...params,
        });

        if (error) {
          addAssistantMessage("Ошибка при выполнении действия.");
          return;
        }

        if (data?.metadata?.recommendedTags) {
          setRecommendedTags(data.metadata.recommendedTags as RecommendedTags);
        }

        if (data?.lyrics) {
          setGeneratedLyrics(data.lyrics);
          if (data.title) setGeneratedTitle(data.title);
          if (data.style) setGeneratedStyle(data.style);
          addAssistantMessage("Результат:", "lyrics-preview", {
            lyrics: data.lyrics,
            title: data.title || generatedTitle,
            style: data.style || generatedStyle,
          });
        } else if (data?.message) {
          addAssistantMessage(data.message as string);
        } else if (data?.fullAnalysis) {
          addAssistantMessage(JSON.stringify(data.fullAnalysis, null, 2).substring(0, 500));
        } else {
          addAssistantMessage("Готово! Результат обработан.");
        }
      } catch {
        addAssistantMessage("Ошибка при выполнении действия.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedGenre,
      selectedMoods,
      selectedStructure,
      generatedLyrics,
      currentLyrics,
      generatedTitle,
      generatedStyle,
      addUserMessage,
      addAssistantMessage,
    ],
  );

  return {
    // State
    messages,
    isLoading,
    inputValue,
    selectedGenre,
    selectedMoods,
    selectedStructure,
    generatedLyrics,
    generatedTitle,
    generatedStyle,
    recommendedTags,
    copied,
    saved,
    isSaving,
    isMobile,

    // Input
    setInputValue,
    handleSend,

    // Flows
    handleGenreSelect,
    handleMoodSelect,
    handleMoodConfirm,
    handleStructureSelect,
    handleOptionClick,

    // Actions
    handleCopy,
    handleSave,
    handleRegenerate,
    handleApply,
    handleContinue,
    handleRequestEdit,
    handleTitleChange,
    handleStyleChange,
    handleAiAction,
  };
}
