/**
 * Smart Generation Assistant Hook
 * Provides AI-powered suggestions based on user history and project context
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGenerationHistory } from '@/hooks/useGenerationHistory';
import { logger } from '@/lib/logger';
import type {
  SmartAssistantState,
  SmartSuggestion,
  UserGenerationContext,
  ProjectGenerationContext,
} from '@/components/generate-form/smart-assistant/types';

// Style patterns for intelligent suggestions
const STYLE_PATTERNS = {
  genres: ['pop', 'rock', 'electronic', 'hip-hop', 'jazz', 'classical', 'ambient', 'folk', 'metal', 'r&b'],
  moods: ['happy', 'sad', 'energetic', 'calm', 'dark', 'uplifting', 'romantic', 'aggressive', 'dreamy', 'nostalgic'],
  tempos: ['slow', 'moderate', 'fast', 'uptempo', 'downtempo'],
  instruments: ['piano', 'guitar', 'synth', 'drums', 'bass', 'strings', 'brass', 'vocals'],
};

// Suggestion templates based on context patterns
const SUGGESTION_TEMPLATES: Omit<SmartSuggestion, 'id' | 'confidence' | 'reasoning'>[] = [
  {
    type: 'continuation',
    title: 'Продолжение альбома',
    description: 'Трек в стиле предыдущих композиций проекта',
    prompt: 'Similar style continuation with slight evolution, maintaining cohesive album feel',
    tags: ['альбом', 'продолжение', 'стиль'],
    metadata: { energy: 'medium' },
  },
  {
    type: 'variation',
    title: 'Вариация темы',
    description: 'Новый взгляд на успешный стиль',
    prompt: 'Fresh variation on proven style with new melodic elements',
    tags: ['вариация', 'свежий', 'мелодия'],
    metadata: { energy: 'medium' },
  },
  {
    type: 'mood',
    title: 'Контрастный трек',
    description: 'Противоположное настроение для баланса',
    prompt: 'Contrasting mood track to balance the album dynamics',
    tags: ['контраст', 'баланс', 'динамика'],
    metadata: { energy: 'high' },
  },
];

interface UseSmartAssistantOptions {
  autoAnalyze?: boolean;
  maxSuggestions?: number;
}

export function useSmartAssistant(options: UseSmartAssistantOptions = {}) {
  const { autoAnalyze = true, maxSuggestions = 5 } = options;
  const { user } = useAuth();
  const { data: historyData } = useGenerationHistory(20);

  const [state, setState] = useState<SmartAssistantState>({
    isAnalyzing: false,
    suggestions: [],
    userContext: null,
    projectContext: null,
    lastAnalyzedAt: null,
    error: null,
  });

  // Build user context from generation history
  const userContext = useMemo((): UserGenerationContext | null => {
    if (!historyData || historyData.length === 0) return null;

    const prompts = historyData.map(h => h.prompt).filter(Boolean);
    const styles = historyData.map(h => h.style).filter(Boolean) as string[];
    const tags = historyData.flatMap(h => h.tags || []);

    // Count genre occurrences
    const genreCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};

    tags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      STYLE_PATTERNS.genres.forEach(genre => {
        if (lowerTag.includes(genre)) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });
      STYLE_PATTERNS.moods.forEach(mood => {
        if (lowerTag.includes(mood)) {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        }
      });
    });

    // Sort by frequency
    const favoriteGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const favoriteMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood]) => mood);

    // Calculate style success rates (simplified)
    const styleSuccessRates: Record<string, number> = {};
    styles.forEach(style => {
      if (!styleSuccessRates[style]) {
        styleSuccessRates[style] = 0.7 + Math.random() * 0.3; // Simulated for now
      }
    });

    return {
      recentPrompts: prompts.slice(0, 5),
      favoriteGenres,
      favoriteMoods,
      styleSuccessRates,
      totalGenerations: historyData.length,
      avgSessionDuration: 15, // Placeholder
    };
  }, [historyData]);

  // Generate smart suggestions based on context
  const generateSuggestions = useCallback((): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    const context = userContext;
    const project = state.projectContext;

    // If no context, return template suggestions
    if (!context && !project) {
      return SUGGESTION_TEMPLATES.slice(0, maxSuggestions).map((template, idx) => ({
        ...template,
        id: `suggestion-${idx}-${Date.now()}`,
        confidence: 0.6,
        reasoning: 'Базовая рекомендация для начала работы',
      }));
    }

    // Personalized suggestions based on user history
    if (context) {
      // Suggest based on favorite genres
      if (context.favoriteGenres.length > 0) {
        const topGenre = context.favoriteGenres[0];
        suggestions.push({
          id: `genre-${topGenre}-${Date.now()}`,
          type: 'style',
          title: `${topGenre.charAt(0).toUpperCase() + topGenre.slice(1)} трек`,
          description: `Вы часто создаёте ${topGenre} — попробуйте новую вариацию`,
          prompt: `${topGenre} track with fresh melodic ideas and modern production`,
          confidence: 0.85,
          reasoning: `Основано на ${context.totalGenerations} ваших генерациях`,
          tags: [topGenre, 'персонализировано', 'ваш стиль'],
          metadata: { genre: topGenre, energy: 'medium' },
        });
      }

      // Suggest based on favorite moods
      if (context.favoriteMoods.length > 0) {
        const topMood = context.favoriteMoods[0];
        suggestions.push({
          id: `mood-${topMood}-${Date.now()}`,
          type: 'mood',
          title: `${topMood.charAt(0).toUpperCase() + topMood.slice(1)} настроение`,
          description: `Ваш любимый стиль настроения`,
          prompt: `${topMood} atmospheric track with emotional depth`,
          confidence: 0.8,
          reasoning: `Часто используемое настроение в ваших треках`,
          tags: [topMood, 'настроение', 'атмосфера'],
          metadata: { mood: topMood, energy: topMood === 'energetic' ? 'high' : 'medium' },
        });
      }

      // Suggest exploration of new genre
      const unusedGenres = STYLE_PATTERNS.genres.filter(g => !context.favoriteGenres.includes(g));
      if (unusedGenres.length > 0) {
        const newGenre = unusedGenres[Math.floor(Math.random() * unusedGenres.length)];
        suggestions.push({
          id: `explore-${newGenre}-${Date.now()}`,
          type: 'prompt',
          title: `Исследуйте ${newGenre}`,
          description: `Попробуйте новый жанр для расширения стиля`,
          prompt: `${newGenre} track with unique elements and creative production`,
          confidence: 0.65,
          reasoning: `Жанр, который вы ещё не пробовали`,
          tags: [newGenre, 'новое', 'эксперимент'],
          metadata: { genre: newGenre, energy: 'medium' },
        });
      }
    }

    // Project-specific suggestions
    if (project) {
      const trackCount = project.existingTracks.length;
      const completedTracks = project.existingTracks.filter(t => t.status === 'completed' || t.status === 'approved');

      // Continuation suggestion
      if (completedTracks.length > 0) {
        const lastTrack = completedTracks[completedTracks.length - 1];
        suggestions.push({
          id: `continuation-${project.projectId}-${Date.now()}`,
          type: 'continuation',
          title: `Продолжение "${project.projectTitle}"`,
          description: `Следующий трек для проекта (${trackCount + 1}/${project.targetTrackCount || '∞'})`,
          prompt: `Continuation track for album "${project.projectTitle}" in ${project.projectGenre || 'similar'} style`,
          confidence: 0.9,
          reasoning: `Рекомендация на основе ${trackCount} существующих треков проекта`,
          tags: ['проект', 'продолжение', project.projectGenre || 'альбом'],
          metadata: {
            basedOnTrack: lastTrack.id,
            genre: project.projectGenre,
            mood: project.projectMood,
          },
        });
      }

      // Genre consistency suggestion
      if (project.projectGenre) {
        suggestions.push({
          id: `project-genre-${Date.now()}`,
          type: 'style',
          title: `${project.projectGenre} для проекта`,
          description: `Соответствует стилю проекта "${project.projectTitle}"`,
          prompt: `${project.projectGenre} ${project.projectMood || 'atmospheric'} track matching project aesthetic`,
          confidence: 0.88,
          reasoning: `Жанр проекта: ${project.projectGenre}`,
          tags: [project.projectGenre, 'проект', 'стиль'],
          metadata: { genre: project.projectGenre, mood: project.projectMood },
        });
      }
    }

    // Sort by confidence and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  }, [userContext, state.projectContext, maxSuggestions]);

  // Analyze and generate suggestions
  const analyze = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Simulate analysis delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const suggestions = generateSuggestions();

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        suggestions,
        userContext,
        lastAnalyzedAt: new Date().toISOString(),
      }));

      logger.info('Smart assistant analyzed', { suggestionsCount: suggestions.length });
    } catch (error) {
      logger.error('Smart assistant analysis failed', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: 'Не удалось проанализировать контекст',
      }));
    }
  }, [generateSuggestions, userContext]);

  // Set project context
  const setProjectContext = useCallback((context: ProjectGenerationContext | null) => {
    setState(prev => ({ ...prev, projectContext: context }));
  }, []);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
    }));
  }, []);

  // Auto-analyze on mount and when history changes
  useEffect(() => {
    if (autoAnalyze && user && historyData) {
      analyze();
    }
  }, [autoAnalyze, user, historyData?.length, analyze]);

  return {
    ...state,
    analyze,
    setProjectContext,
    dismissSuggestion,
    refreshSuggestions: analyze,
    hasContext: !!userContext || !!state.projectContext,
  };
}
