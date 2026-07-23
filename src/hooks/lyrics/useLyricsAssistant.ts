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
import { invokeLyricsAssistant } from "@/api/lyrics.api";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ChatMessage } from "@/components/generate-form/lyrics-chat/types";

interface UseLyricsAssistantOptions {
  currentLyrics?: string;
  onApply: (text: string, targetSectionId?: string) => void;
  onApplyTitle?: (title: string) => void;
  onApplyStyle?: (style: string) => void;
}

interface LyricsResult {
  lyrics: string;
  title?: string;
  style?: string;
}

export function useLyricsAssistant({ currentLyrics, onApply, onApplyTitle, onApplyStyle }: UseLyricsAssistantOptions) {
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

  // Selections
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedStructure, setSelectedStructure] = useState("");

  // Result
  const [generatedLyrics, setGeneratedLyrics] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedStyle, setGeneratedStyle] = useState("");

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

  // Structure selection
  const handleStructureSelect = useCallback(
    async (structure: string) => {
      setSelectedStructure(structure);
      addUserMessage(`Структура: ${structure}`);

      // Generate lyrics
      setIsLoading(true);
      addAssistantMessage("Создаю текст...");

      try {
        const { data } = await invokeLyricsAssistant({
          action: "generate",
          genre: selectedGenre,
          mood: selectedMoods.join(", "),
          structure,
          language: "ru",
          lyrics: currentLyrics || undefined,
        });

        if (data?.lyrics) {
          const title = data?.suggestions?.[0] || "Новый трек";
          const style = `${selectedGenre} — ${selectedMoods.join("/")}`;
          setGeneratedLyrics(data.lyrics);
          setGeneratedTitle(title);
          setGeneratedStyle(style);

          // Remove the "creating..." message and show result
          setMessages((prev) => prev.filter((m) => m.content !== "Создаю текст..."));
          addAssistantMessage(
            "Вот что получилось! Можешь отредактировать, скопировать или применить:",
            "lyrics-preview",
            {
              lyrics: data.lyrics,
              title,
              style,
            },
          );
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
      const { data } = await sendAiChatMessage({
        message: text,
        context: {
          genre: selectedGenre,
          mood: selectedMoods,
          structure: selectedStructure,
          currentLyrics: generatedLyrics || currentLyrics,
        },
      });

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        addAssistantMessage("Готово! Вот обновлённый вариант:", "lyrics-preview", {
          lyrics: data.lyrics,
          title: generatedTitle,
          style: generatedStyle,
        });
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
        const { data } = await sendAiChatMessage({
          message: instruction,
          context: {
            currentLyrics: generatedLyrics,
            genre: selectedGenre,
            mood: selectedMoods,
            structure: selectedStructure,
          },
        });
        if (data?.lyrics) {
          setGeneratedLyrics(data.lyrics);
          addAssistantMessage("Обновил:", "lyrics-preview", {
            lyrics: data.lyrics,
            title: generatedTitle,
            style: generatedStyle,
          });
        }
      } catch {
        addAssistantMessage("Ошибка при редактировании.");
      } finally {
        setIsLoading(false);
      }
    },
    [
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
  };
}
