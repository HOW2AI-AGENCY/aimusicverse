/**
 * useAITools - Hook for managing AI tools execution
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';
import { AITool, AIMessage, AIAgentContext, AIToolId, OutputType } from '../types';
import { AI_TOOLS } from '../constants';

interface UseAIToolsOptions {
  context: AIAgentContext;
  onLyricsGenerated?: (lyrics: string) => void;
  onTagsGenerated?: (tags: string[]) => void;
}

export function useAITools({ context, onLyricsGenerated, onTagsGenerated }: UseAIToolsOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<AIToolId | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! Я AI-помощник для создания лирики. Выберите инструмент или опишите задачу.',
      timestamp: new Date(),
    },
  ]);

  const getToolById = useCallback((id: AIToolId): AITool | undefined => {
    return AI_TOOLS.find(t => t.id === id);
  }, []);

  const addMessage = useCallback((message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: `${message.role}-${Date.now()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateLastMessage = useCallback((updates: Partial<AIMessage>) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0) {
        newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates };
      }
      return newMessages;
    });
  }, []);

  const executeTool = useCallback(async (
    toolId: AIToolId,
    input: Record<string, any> = {}
  ) => {
    const tool = getToolById(toolId);
    if (!tool) {
      toast.error('Инструмент не найден');
      return null;
    }

    setIsLoading(true);
    setActiveTool(toolId);
    hapticImpact('light');

    // Add user message
    const userContent = input.message || input.theme || `Выполняю: ${tool.name}`;
    addMessage({
      role: 'user',
      content: userContent,
      toolId,
    });

    // Add loading placeholder
    const loadingMessage = addMessage({
      role: 'assistant',
      content: '',
      toolId,
      isLoading: true,
    });

    try {
      const requestBody: Record<string, any> = {
        action: tool.action,
        ...input,
      };

      // Add context based on tool type
      if (tool.autoContext || context.existingLyrics) {
        requestBody.existingLyrics = context.existingLyrics;
        requestBody.lyrics = context.existingLyrics;
      }

      if (context.selectedSection) {
        requestBody.sectionType = context.selectedSection.type;
        requestBody.sectionContent = context.selectedSection.content;
        requestBody.previousLyrics = context.selectedSection.content;
      }

      if (context.genre) requestBody.genre = context.genre;
      if (context.mood) requestBody.mood = context.mood;
      if (context.language) requestBody.language = context.language;

      // Special handling for hook generation
      if (toolId === 'hook') {
        requestBody.sectionType = 'Hook';
        requestBody.sectionName = 'Hook';
      }

      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: requestBody,
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error('Превышен лимит запросов. Подождите немного.');
        } else if (error.message?.includes('402') || error.message?.includes('Payment')) {
          toast.error('Необходимо пополнить баланс AI.');
        }
        throw error;
      }

      // Parse response based on output type
      let responseType: OutputType = tool.outputType;
      let responseData: AIMessage['data'] = {};
      let responseContent = data.message || data.result || 'Готово!';

      if (data.lyrics) {
        responseData.lyrics = data.lyrics;
        responseType = 'lyrics';
        onLyricsGenerated?.(data.lyrics);
      }

      if (data.tags && Array.isArray(data.tags)) {
        responseData.tags = data.tags;
        responseType = 'tags';
        if (tool.directApply) {
          onTagsGenerated?.(data.tags);
        }
      }

      if (data.rhymes) {
        responseData.rhymes = data.rhymes;
        responseType = 'rhymes';
      }

      if (data.analysis) {
        responseData.analysis = data.analysis;
        responseType = 'analysis';
      }

      if (data.suggestions) {
        responseData.suggestions = data.suggestions;
      }

      if (data.structure) {
        responseData.structure = data.structure;
      }

      // Update the loading message with actual content
      updateLastMessage({
        content: responseContent,
        type: responseType,
        data: responseData,
        isLoading: false,
      });

      hapticImpact('medium');
      return { data: responseData, content: responseContent };

    } catch (error) {
      console.error('AI Tool error:', error);
      updateLastMessage({
        content: 'Произошла ошибка. Попробуйте ещё раз.',
        isLoading: false,
      });
      toast.error('Ошибка выполнения');
      return null;
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  }, [context, getToolById, addMessage, updateLastMessage, onLyricsGenerated, onTagsGenerated]);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    hapticImpact('light');

    addMessage({
      role: 'user',
      content: message,
    });

    addMessage({
      role: 'assistant',
      content: '',
      isLoading: true,
    });

    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'chat',
          message,
          context: {
            existingLyrics: context.existingLyrics,
            sectionType: context.selectedSection?.type,
            sectionContent: context.selectedSection?.content,
            globalTags: context.globalTags,
            sectionTags: context.sectionTags,
          },
        },
      });

      if (error) throw error;

      let responseData: AIMessage['data'] = {};
      
      if (data.lyrics) responseData.lyrics = data.lyrics;
      if (data.tags) responseData.tags = data.tags;
      if (data.suggestions) responseData.suggestions = data.suggestions;

      updateLastMessage({
        content: data.message || data.result || 'Готово!',
        type: data.lyrics ? 'lyrics' : data.tags ? 'tags' : 'text',
        data: responseData,
        isLoading: false,
      });

      hapticImpact('medium');
    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage({
        content: 'Произошла ошибка. Попробуйте ещё раз.',
        isLoading: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [context, addMessage, updateLastMessage]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Чат очищен. Выберите инструмент или опишите задачу.',
      timestamp: new Date(),
    }]);
  }, []);

  return {
    messages,
    isLoading,
    activeTool,
    tools: AI_TOOLS,
    executeTool,
    sendChatMessage,
    clearMessages,
    getToolById,
    setActiveTool,
  };
}
