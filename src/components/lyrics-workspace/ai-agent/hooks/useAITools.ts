/**
 * useAITools - Hook for managing AI tools execution
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { hapticImpact } from "@/lib/haptic";
import { AITool, AIMessage, AIAgentContext, AIToolId, OutputType, AgentAction } from "../types";
import { AI_TOOLS } from "../constants";
import { parseAIResponse } from "@/lib/ai/aiResponseParser";
import { executeAiTool, sendAiChatMessage } from "@/services/lyrics/ai-tools.service";
import { logger } from "@/lib/logger";

/**
 * Clean lyrics from syllable counts that AI sometimes adds
 * e.g., "(8)" or "(10 слогов)" at the end of lines
 */
function cleanLyricsFromSyllableCounts(lyrics: string): string {
  return (
    lyrics
      // Remove patterns like (8), (10), (12) at the end of lines
      .replace(/\s*\(\d{1,2}\)\s*$/gm, "")
      // Remove patterns like (8 слогов), (10 syllables)
      .replace(/\s*\(\d{1,2}\s*(?:слог(?:а|ов)?|syl(?:lables?)?)\s*\)/gi, "")
      // Remove patterns like [8 syl] or [10]
      .replace(/\s*\[\d{1,2}(?:\s*syl(?:lables?)?)?\]\s*$/gm, "")
      .trim()
  );
}

interface UseAIToolsOptions {
  context: AIAgentContext;
  onLyricsGenerated?: (lyrics: string) => void;
  onTagsGenerated?: (tags: string[]) => void;
  onStylePromptGenerated?: (prompt: string) => void;
  onTitleGenerated?: (title: string) => void;
}

export function useAITools({
  context,
  onLyricsGenerated,
  onTagsGenerated,
  onStylePromptGenerated,
  onTitleGenerated,
}: UseAIToolsOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<AIToolId | null>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);

  // Generate context-aware welcome message
  const getWelcomeMessage = () => {
    if (context.projectContext) {
      const parts = ["Привет! Я готов помочь с лирикой для вашего проекта"];
      if (context.projectContext.projectTitle) {
        parts.push(`"${context.projectContext.projectTitle}"`);
      }
      if (context.trackContext) {
        parts.push(`(трек #${context.trackContext.position + 1}: "${context.trackContext.title}")`);
      }
      parts.push(".");

      if (context.existingLyrics) {
        parts.push("\n\nУ вас уже есть текст. Хотите его улучшить, дополнить или создать новый вариант?");
      } else {
        parts.push(
          '\n\nГотов сгенерировать лирику на основе концепции проекта. Используйте инструмент "Написать" или опишите желаемое настроение и тему.',
        );
      }

      return parts.join(" ");
    }

    if (context.existingLyrics) {
      return "Привет! Вижу, у вас уже есть текст. Выберите инструмент для его анализа, улучшения или дополнения.";
    }

    return 'Привет! Я AI-помощник для создания лирики. Выберите инструмент "Написать" для генерации текста или опишите свою задачу.';
  };

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: getWelcomeMessage(),
      timestamp: new Date(),
    },
  ]);

  const getToolById = useCallback((id: AIToolId): AITool | undefined => {
    return AI_TOOLS.find((t) => t.id === id);
  }, []);

  const addMessage = useCallback((message: Omit<AIMessage, "id" | "timestamp">) => {
    const newMessage: AIMessage = {
      ...message,
      id: `${message.role}-${Date.now()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateLastMessage = useCallback((updates: Partial<AIMessage>) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0) {
        newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates };
      }
      return newMessages;
    });
  }, []);

  const addAction = useCallback((action: Omit<AgentAction, "id" | "timestamp">) => {
    const newAction: AgentAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
    };
    setActions((prev) => [newAction, ...prev].slice(0, 20));
    return newAction.id;
  }, []);

  const updateAction = useCallback((id: string, updates: Partial<AgentAction>) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const executeTool = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI tool input is heterogeneous; tool-specific types own the schema
    async (toolId: AIToolId, input: Record<string, any> = {}) => {
      const tool = getToolById(toolId);
      if (!tool) {
        toast.error("Инструмент не найден");
        return null;
      }

      setIsLoading(true);
      setActiveTool(toolId);
      hapticImpact("light");

      const actionId = addAction({
        type: "tool",
        label: `Выполняю: ${tool.name}`,
        toolId,
        status: "running",
      });

      const userContent = input.message || input.theme || `Выполняю: ${tool.name}`;
      addMessage({ role: "user", content: userContent, toolId });
      addMessage({ role: "assistant", content: "", toolId, isLoading: true });

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI tool request body is heterogeneous; tool-specific types own the schema
        const requestBody: Record<string, any> = {
          action: tool.action,
          ...input,
          existingLyrics: context.existingLyrics,
          lyrics: context.existingLyrics,
          stylePrompt: context.stylePrompt,
          title: context.title,
          allSectionNotes: context.allSectionNotes,
          globalTags: context.globalTags,
        };

        if (context.selectedSection) {
          requestBody.sectionType = context.selectedSection.type;
          requestBody.sectionContent = context.selectedSection.content;
          requestBody.sectionNotes = context.selectedSection.notes;
        }

        if (context.genre) requestBody.genre = context.genre;
        if (context.mood) requestBody.mood = context.mood;
        if (context.language) requestBody.language = context.language;

        // Add project context if available
        if (context.projectContext) {
          requestBody.projectContext = context.projectContext;
        }
        if (context.trackContext) {
          requestBody.trackContext = context.trackContext;
        }
        if (context.tracklist) {
          requestBody.tracklist = context.tracklist;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI tool response schema varies per action
        const { data: rawData, error } = await executeAiTool(requestBody as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI tool response schema varies per action
        const data: any = rawData ?? {};


        if (error) {
          if (error.message?.includes("429")) toast.error("Превышен лимит запросов.");
          else if (error.message?.includes("402")) toast.error("Необходимо пополнить баланс AI.");
          throw error;
        }

        // Use robust parser
        const parsed = parseAIResponse(data, tool.action);

        let responseType: OutputType = (parsed.type as OutputType) || tool.outputType;
        const responseData: AIMessage["data"] = {};
        const responseContent = parsed.message || data.message || data.result || "Готово!";

        // Handle expanded/deep analysis response
        if (parsed.type === "expanded_analysis" && parsed.expandedAnalysis) {
          responseData.expandedAnalysis = parsed.expandedAnalysis;
          responseType = "expanded_analysis";
          if (parsed.expandedAnalysis.quickActions) {
            responseData.quickActions = parsed.expandedAnalysis.quickActions;
          }
        }
        // Handle full_analysis response
        else if (data.fullAnalysis || parsed.type === "full_analysis") {
          responseData.fullAnalysis = data.fullAnalysis || parsed.data;
          responseType = "full_analysis";
          if (data.fullAnalysis?.quickActions) {
            responseData.quickActions = data.fullAnalysis.quickActions;
          }
        }
        // Handle producer_review response
        else if (data.producerReview || parsed.type === "producer_review") {
          responseData.producerReview = data.producerReview || parsed.data;
          responseType = "producer_review";
          if (data.producerReview?.stylePrompt) {
            onStylePromptGenerated?.(data.producerReview.stylePrompt);
          }
          if (data.producerReview?.quickActions) {
            responseData.quickActions = data.producerReview.quickActions;
          }
          if (data.producerReview?.suggestedTags) {
            responseData.tags = data.producerReview.suggestedTags;
          }
        }
        // Handle lyrics response
        else if (data.lyrics || parsed.lyrics) {
          let lyricsContent = data.lyrics || parsed.lyrics;
          if (lyricsContent) {
            // Clean syllable counts from lyrics
            lyricsContent = cleanLyricsFromSyllableCounts(lyricsContent);
            responseData.lyrics = lyricsContent;
            responseType = "lyrics";
            // Auto-apply lyrics, title, style for write/optimize/style_convert/translate/drill/epic tools
            const autoApplyTools = [
              "write",
              "optimize",
              "style_convert",
              "translate",
              "drill_builder",
              "epic_builder",
              "add_tags",
              "improve",
            ];
            if (autoApplyTools.includes(toolId)) {
              onLyricsGenerated?.(lyricsContent);
              // Also apply title and style if returned
              if (data.title) {
                responseData.title = data.title;
                onTitleGenerated?.(data.title);
              }
              if (data.style) {
                responseData.stylePrompt = data.style;
                onStylePromptGenerated?.(data.style);
              }
            }
          }
        }
        // Handle hooks response (Phase 2)
        else if (data.currentHooks || data.suggestedHooks || data.hookScore !== undefined) {
          responseData.hooks = {
            currentHooks: data.currentHooks,
            suggestedHooks: data.suggestedHooks,
            hookScore: data.hookScore,
            recommendations: data.recommendations,
          };
          responseType = "hooks";
        }
        // Handle vocal map response (legacy - now merged into producer)
        else if (data.sections && "vocalType" in data && data.vocalType) {
          responseData.vocalMap = data.sections;
          responseType = "vocal_map";
        }
        // Handle paraphrase response (legacy - now merged into style_convert)
        else if (data.variants) {
          responseData.paraphraseVariants = data.variants;
          responseType = "paraphrase";
        }
        // Handle translation response (Phase 2)
        else if (data.translatedLyrics) {
          responseData.translation = {
            translatedLyrics: data.translatedLyrics,
            sourceLanguage: data.sourceLanguage,
            targetLanguage: data.targetLanguage,
            adaptationNotes: data.adaptationNotes,
            syllablePreserved: data.syllablePreserved,
          };
          responseType = "translation";
          // Also store lyrics for apply button
          responseData.lyrics = data.translatedLyrics;
        }

        // Handle tags
        if (data.tags && Array.isArray(data.tags)) {
          responseData.tags = data.tags;
          if (tool.directApply) onTagsGenerated?.(data.tags);
        }

        // Handle additional data
        if (data.quickActions && !responseData.quickActions) {
          responseData.quickActions = data.quickActions;
        }
        // Handle style - check both stylePrompt and style keys
        if (data.stylePrompt && !responseData.stylePrompt) {
          responseData.stylePrompt = data.stylePrompt;
        }
        if (data.style && !responseData.stylePrompt) {
          responseData.stylePrompt = data.style;
        }
        // Handle title
        if (data.title && !responseData.title) {
          responseData.title = data.title;
        }
        if (data.changes) responseData.changes = data.changes;
        if (data.analysis) responseData.analysis = data.analysis;
        if (data.suggestions) responseData.suggestions = data.suggestions;
        if (data.structure) responseData.structure = data.structure;
        if (parsed.keyInsights) responseData.keyInsights = parsed.keyInsights;
        if (parsed.uniqueStrength) responseData.uniqueStrength = parsed.uniqueStrength;

        updateLastMessage({
          content: responseContent,
          type: responseType,
          data: responseData,
          isLoading: false,
        });

        hapticImpact("medium");
        updateAction(actionId, { status: "completed" });
        return { data: responseData, content: responseContent };
      } catch (error: unknown) {
        logger.error("AI Tool error", error instanceof Error ? error : new Error(String(error)));
        updateLastMessage({ content: "Произошла ошибка. Попробуйте ещё раз.", isLoading: false });
        updateAction(actionId, { status: "error", metadata: { error: String(error) } });
        toast.error("Ошибка выполнения");
        return null;
      } finally {
        setIsLoading(false);
        setActiveTool(null);
      }
    },
    [
      context,
      getToolById,
      addAction,
      addMessage,
      updateLastMessage,
      updateAction,
      onLyricsGenerated,
      onTagsGenerated,
      onStylePromptGenerated,
      onTitleGenerated,
    ],
  );

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      hapticImpact("light");

      const actionId = addAction({
        type: "chat",
        label: `Сообщение: ${message.slice(0, 40)}${message.length > 40 ? "…" : ""}`,
        status: "running",
      });

      addMessage({ role: "user", content: message });
      addMessage({ role: "assistant", content: "", isLoading: true });

      try {
        // Build full context with project/track info for better AI responses
        const fullContext = {
          existingLyrics: context.existingLyrics,
          currentLyrics: context.existingLyrics,
          sectionType: context.selectedSection?.type,
          sectionContent: context.selectedSection?.content,
          globalTags: context.globalTags,
          sectionTags: context.sectionTags,
          stylePrompt: context.stylePrompt,
          allSectionNotes: context.allSectionNotes,
          genre: context.genre,
          mood: context.mood,
          language: context.language,
          title: context.title,
          // Include full project context for coherent album lyrics
          projectContext: context.projectContext,
          trackContext: context.trackContext,
          tracklist: context.tracklist,
          // Build conversation history for context continuity
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content?.slice(0, 500),
          })),
        };

        const { data: rawChatData, error } = await sendAiChatMessage({ message, context: fullContext });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = rawChatData ?? {};

        if (error) {
          if (error.message?.includes("429")) toast.error("Превышен лимит запросов.");
          else if (error.message?.includes("402")) toast.error("Необходимо пополнить баланс AI.");
          throw error;
        }

        const responseData: AIMessage["data"] = {};
        let responseType: OutputType = "text";

        // Handle lyrics - don't auto-apply, show in card with buttons
        if (data.lyrics) {
          responseData.lyrics = cleanLyricsFromSyllableCounts(data.lyrics);
          responseType = "lyrics";
        }

        if (data.tags) responseData.tags = data.tags;
        if (data.suggestions) responseData.suggestions = data.suggestions;
        if (data.quickActions) responseData.quickActions = data.quickActions;
        if (data.stylePrompt) responseData.stylePrompt = data.stylePrompt;
        if (data.style) responseData.stylePrompt = data.style;
        if (data.title) responseData.title = data.title;
        if (data.changes) responseData.changes = data.changes;

        updateLastMessage({
          content: data.message || data.result || "Готово!",
          type: responseType,
          data: responseData,
          model: data.model,
          provider: data.provider,
          isLoading: false,
        });

        hapticImpact("medium");
        updateAction(actionId, { status: "completed" });
      } catch (error: unknown) {
        logger.error("Chat error", error instanceof Error ? error : new Error(String(error)));
        updateLastMessage({ content: "Произошла ошибка. Попробуйте ещё раз.", isLoading: false });
        updateAction(actionId, { status: "error", metadata: { error: String(error) } });
        toast.error("Ошибка чата");
      } finally {
        setIsLoading(false);
      }
    },
    [context, messages, addAction, addMessage, updateAction, updateLastMessage],
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Чат очищен. Выберите инструмент или опишите задачу.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    activeTool,
    actions,
    tools: AI_TOOLS,
    executeTool,
    sendChatMessage,
    clearMessages,
    getToolById,
    setActiveTool,
  };
}
