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
  onStylePromptGenerated?: (prompt: string) => void;
}

export function useAITools({ context, onLyricsGenerated, onTagsGenerated, onStylePromptGenerated }: UseAIToolsOptions) {
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

    const userContent = input.message || input.theme || `Выполняю: ${tool.name}`;
    addMessage({ role: 'user', content: userContent, toolId });
    addMessage({ role: 'assistant', content: '', toolId, isLoading: true });

    try {
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

      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: requestBody,
      });

      if (error) {
        if (error.message?.includes('429')) toast.error('Превышен лимит запросов.');
        else if (error.message?.includes('402')) toast.error('Необходимо пополнить баланс AI.');
        throw error;
      }

      let responseType: OutputType = tool.outputType;
      let responseData: AIMessage['data'] = {};
      let responseContent = data.message || data.result || 'Готово!';

      // Handle full_analysis response
      if (data.fullAnalysis) {
        responseData.fullAnalysis = data.fullAnalysis;
        responseType = 'full_analysis';
        // Add quick actions from analysis if present
        if (data.fullAnalysis.quickActions) {
          responseData.quickActions = data.fullAnalysis.quickActions;
        }
      }
      // Handle producer_review response
      else if (data.producerReview) {
        responseData.producerReview = data.producerReview;
        responseType = 'producer_review';
        if (data.producerReview.stylePrompt) {
          onStylePromptGenerated?.(data.producerReview.stylePrompt);
        }
        if (data.producerReview.quickActions) {
          responseData.quickActions = data.producerReview.quickActions;
        }
        if (data.producerReview.suggestedTags) {
          responseData.tags = data.producerReview.suggestedTags;
        }
      }
      // Handle lyrics response
      else if (data.lyrics) {
        responseData.lyrics = data.lyrics;
        responseType = 'lyrics';
        // Auto-apply only for write/optimize tools
        if (toolId === 'write' || toolId === 'optimize') {
          onLyricsGenerated?.(data.lyrics);
        }
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
      if (data.stylePrompt) responseData.stylePrompt = data.stylePrompt;
      if (data.changes) responseData.changes = data.changes;
      if (data.analysis) responseData.analysis = data.analysis;
      if (data.suggestions) responseData.suggestions = data.suggestions;
      if (data.structure) responseData.structure = data.structure;

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
      updateLastMessage({ content: 'Произошла ошибка. Попробуйте ещё раз.', isLoading: false });
      toast.error('Ошибка выполнения');
      return null;
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  }, [context, getToolById, addMessage, updateLastMessage, onLyricsGenerated, onTagsGenerated, onStylePromptGenerated]);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    hapticImpact('light');
    addMessage({ role: 'user', content: message });
    addMessage({ role: 'assistant', content: '', isLoading: true });

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
            stylePrompt: context.stylePrompt,
            allSectionNotes: context.allSectionNotes,
          },
        },
      });

      if (error) throw error;

      let responseData: AIMessage['data'] = {};
      let responseType: OutputType = 'text';
      
      // Handle lyrics - don't auto-apply, show in card with buttons
      if (data.lyrics) {
        responseData.lyrics = data.lyrics;
        responseType = 'lyrics';
      }
      
      if (data.tags) responseData.tags = data.tags;
      if (data.suggestions) responseData.suggestions = data.suggestions;
      if (data.quickActions) responseData.quickActions = data.quickActions;
      if (data.stylePrompt) responseData.stylePrompt = data.stylePrompt;
      if (data.changes) responseData.changes = data.changes;

      updateLastMessage({
        content: data.message || data.result || 'Готово!',
        type: responseType,
        data: responseData,
        isLoading: false,
      });

      hapticImpact('medium');
    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage({ content: 'Произошла ошибка. Попробуйте ещё раз.', isLoading: false });
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
