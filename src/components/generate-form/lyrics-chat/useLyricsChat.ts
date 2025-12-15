import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { ChatMessage, QuickOption, ProjectContext, TrackContext } from './types';
import { GENRES, MOODS, STRUCTURE_MAP, INITIAL_MESSAGE_OPTIONS, getContextualOptions } from './constants';

// Auto-scroll behavior constants
const USER_SCROLL_THRESHOLD = 5; // pixels - minimum scroll delta to detect user scroll
const AUTO_SCROLL_RESUME_DELAY = 5000; // ms - delay before resuming auto-scroll after user scroll
const PROGRAMMATIC_SCROLL_RESET_DELAY = 600; // ms - time to complete smooth scroll animation

interface UseLyricsChatOptions {
  open: boolean;
  initialGenre?: string;
  initialMood?: string[];
  initialLanguage?: 'ru' | 'en';
  projectContext?: ProjectContext;
  trackContext?: TrackContext;
  initialMode?: 'new' | 'edit' | 'improve' | 'freeform';
  onLyricsGenerated: (lyrics: string) => void;
  onStyleGenerated?: (style: string) => void;
  onClose: () => void;
}

export function useLyricsChat({
  open,
  initialGenre,
  initialMood,
  initialLanguage = 'ru',
  projectContext,
  trackContext,
  initialMode = 'new',
  onLyricsGenerated,
  onStyleGenerated,
  onClose,
}: UseLyricsChatOptions) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [freeformMode, setFreeformMode] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const isProgrammaticScrollRef = useRef(false);
  
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState(initialGenre || projectContext?.genre || '');
  const [mood, setMood] = useState<string[]>(initialMood || (projectContext?.mood ? [projectContext.mood] : []));
  const [language] = useState<'ru' | 'en'>(initialLanguage || projectContext?.language || 'ru');
  const [structure, setStructure] = useState('standard');
  const [generatedLyrics, setGeneratedLyrics] = useState('');

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  // Handle user scroll detection
  const handleScroll = useCallback((e: Event) => {
    // Ignore programmatic scrolls
    if (isProgrammaticScrollRef.current) return;

    const target = e.target as HTMLElement;
    const currentScrollTop = target.scrollTop;

    // Detect if this is user-initiated scroll (not programmatic)
    const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);

    if (scrollDelta > USER_SCROLL_THRESHOLD) {
      setUserScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Resume auto-scroll after delay
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, AUTO_SCROLL_RESUME_DELAY);
    }

    lastScrollTopRef.current = currentScrollTop;
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', () => setUserScrolling(true), { passive: true });
    container.addEventListener('touchstart', () => setUserScrolling(true), { passive: true });
    container.addEventListener('touchmove', () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, AUTO_SCROLL_RESUME_DELAY);
    }, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Smart conversation initialization based on context
  const initConversation = useCallback(() => {
    // Scenario 1: Has draft lyrics
    if (trackContext?.draftLyrics) {
      const preview = trackContext.draftLyrics.slice(0, 100);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `📝 Трек "${trackContext.title}" — черновик:\n\n"${preview}${trackContext.draftLyrics.length > 100 ? '...' : ''}"\n\n💬 Напишите что изменить, например:\n• "Улучши черновик"\n• "Добавь теги Suno"\n• "Сделай более энергичным"\n\nИли выберите действие:`,
        options: [
          { label: '✨ Улучшить', value: 'improve_draft', action: 'editDraft' },
          { label: '🏷️ Добавить теги', value: 'add_tags', action: 'useContext' },
          { label: '🔄 Переписать', value: 'rewrite', action: 'setTheme' },
        ],
      }]);
      return;
    }

    // Scenario 2: Has generated lyrics from linked track
    if (trackContext?.generatedLyrics) {
      setGeneratedLyrics(trackContext.generatedLyrics);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `🎵 Трек "${trackContext.title}" — текст готов!\n\n💬 Напишите что изменить:\n• "Сделай припев мощнее"\n• "Добавь больше метафор"\n• "Переведи на английский"\n\nИли выберите:`,
        options: [
          { label: '✏️ Изменить', value: 'edit', action: 'freeform' },
          { label: '🔄 Новая версия', value: 'new_version', action: 'setTheme' },
          { label: '🌍 Перевести', value: 'translate', action: 'useContext' },
        ],
      }]);
      return;
    }

    // Scenario 3: Has full context (genre, mood, theme) - GENERATE IMMEDIATELY
    if (projectContext && (projectContext.genre || projectContext.mood || projectContext.concept)) {
      const trackTitle = trackContext?.title || 'Новый трек';

      let contextMessage = `🎼 У меня есть контекст проекта!\n\n`;
      if (projectContext.genre) contextMessage += `🎸 Жанр: ${projectContext.genre}\n`;
      if (projectContext.mood) contextMessage += `💫 Настроение: ${projectContext.mood}\n`;
      if (projectContext.concept) contextMessage += `📖 Концепция: ${projectContext.concept}\n`;
      if (trackContext?.notes) contextMessage += `💡 Подсказка: ${trackContext.notes}\n`;
      contextMessage += `\n💬 Напишите тему для "${trackTitle}" или нажмите кнопку:`;

      setMessages([{
        id: '1',
        role: 'assistant',
        content: contextMessage,
        options: [
          { label: '✨ Создать на основе контекста', value: 'generate_now', action: 'freeform' },
          { label: '💬 Свободный ввод', value: 'freeform', action: 'freeform' },
        ],
      }]);
      return;
    }

    // Scenario 4: Has project context but no genre/mood
    if (projectContext) {
      const trackCount = projectContext.existingTracks?.length || 0;
      const trackTitle = trackContext?.title || 'Новый трек';

      let contextMessage = `🎼 Проект "${projectContext.projectTitle}"`;
      if (projectContext.genre) contextMessage += ` (${projectContext.genre})`;
      if (trackCount > 0) {
        contextMessage += ` уже содержит ${trackCount} ${trackCount === 1 ? 'трек' : trackCount < 5 ? 'трека' : 'треков'}.`;
      } else {
        contextMessage += '.';
      }
      contextMessage += `\n\nДля трека "${trackTitle}" предлагаю:`;

      const contextOptions = getContextualOptions(projectContext, trackContext);
      contextOptions.push({ label: '💬 Свободный чат', value: 'freeform', action: 'freeform' });

      setMessages([{
        id: '1',
        role: 'assistant',
        content: contextMessage,
        options: contextOptions,
      }]);
      return;
    }

    // Scenario 5: Standard (no context)
    setMessages([{
      id: '1',
      role: 'assistant',
      content: '👋 Привет! Я создам текст песни.\n\n💬 Просто напишите, о чём песня — например:\n• "Создай песню о любви"\n• "Рок-баллада про дорогу"\n• "Летняя поп-песня"\n\nИли выберите готовый вариант:',
      options: INITIAL_MESSAGE_OPTIONS,
    }]);
  }, [projectContext, trackContext]);

  useEffect(() => {
    if (open && messages.length === 0) {
      initConversation();
    }
  }, [open, messages.length, initConversation]);

  // Smart auto-scroll - only scroll if user hasn't manually scrolled
  useEffect(() => {
    if (!scrollRef.current || userScrolling) return;

    // Use requestAnimationFrame for smooth scroll
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;

      isProgrammaticScrollRef.current = true;
      const targetScrollTop = scrollRef.current.scrollHeight;
      lastScrollTopRef.current = targetScrollTop;

      scrollRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });

      // Reset programmatic flag after animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, PROGRAMMATIC_SCROLL_RESET_DELAY);
    });
  }, [messages, userScrolling]);

  const askForGenre = useCallback(() => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Отлично! 🎵 Выберите жанр:',
        component: 'genre',
      });
    }, 400);
  }, [addMessage]);

  const askForMood = useCallback(() => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Какое настроение? Можно выбрать несколько:',
        component: 'mood',
      });
    }, 400);
  }, [addMessage]);

  const askForStructure = useCallback(() => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '📝 Выберите структуру песни:',
        component: 'structure',
      });
    }, 400);
  }, [addMessage]);

  const generateLyrics = useCallback(async (selectedStructure: string) => {
    setIsLoading(true);
    
    addMessage({
      id: 'loading-' + Date.now(),
      role: 'assistant',
      content: '✨ Создаю текст песни...',
    });

    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'generate',
          theme: theme,
          genre: genre || 'pop',
          mood: mood.join(', ') || 'romantic',
          language: language,
          structure: STRUCTURE_MAP[selectedStructure] || STRUCTURE_MAP.standard,
          // Pass project context if available
          projectContext: projectContext ? {
            title: projectContext.projectTitle,
            concept: projectContext.concept,
            targetAudience: projectContext.targetAudience,
          } : undefined,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        setMessages(prev => prev.filter(m => !m.id.startsWith('loading-')));
        
        // Build response message with metadata
        const responseContent = data.title 
          ? `🎉 Готово! "${data.title}"`
          : '🎉 Готово! Вот текст вашей песни:';
        
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          component: 'lyrics-preview',
          data: { 
            lyrics: data.lyrics,
            title: data.title,
            style: data.style,
          },
        });
        
        // Generate style prompt if callback exists
        if (onStyleGenerated && data.style) {
          onStyleGenerated(data.style);
        }
      }
    } catch (err) {
      logger.error('Error generating lyrics', { error: err });
      setMessages(prev => prev.filter(m => !m.id.startsWith('loading-')));
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '😔 Не удалось сгенерировать текст. Попробуем ещё раз?',
        options: [{ label: '🔄 Попробовать снова', value: 'retry', action: 'retry' }],
      });
    } finally {
      setIsLoading(false);
    }
  }, [theme, genre, mood, language, projectContext, addMessage, onStyleGenerated]);

  const modifyLyrics = useCallback(async (instruction: string) => {
    setIsLoading(true);
    
    addMessage({
      id: 'loading-' + Date.now(),
      role: 'assistant',
      content: '✨ Изменяю текст...',
    });

    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'improve',
          lyrics: generatedLyrics,
          instruction: instruction,
          language: language,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        setMessages(prev => prev.filter(m => !m.id.startsWith('loading-')));
        
        const responseContent = data.changes
          ? `✅ Изменения: ${data.changes}`
          : '✅ Обновлённый текст:';
        
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          component: 'lyrics-preview',
          data: { 
            lyrics: data.lyrics,
            title: data.title,
            style: data.style,
          },
        });
      }
    } catch (err) {
      logger.error('Error modifying lyrics', { error: err });
      setMessages(prev => prev.filter(m => !m.id.startsWith('loading-')));
      toast.error('Ошибка при изменении');
    } finally {
      setIsLoading(false);
    }
  }, [generatedLyrics, language, addMessage]);

  // NEW: Free chat mode handler
  const processFreechat = useCallback(async (message: string) => {
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'chat',
          message,
          context: {
            currentLyrics: generatedLyrics || undefined,
            // Pass all user parameters to allow AI to use them
            theme: theme || undefined,
            genre: genre || projectContext?.genre,
            mood: mood.length > 0 ? mood.join(', ') : projectContext?.mood,
            language,
            projectContext: projectContext ? {
              title: projectContext.projectTitle,
              concept: projectContext.concept,
              genre: projectContext.genre,
              mood: projectContext.mood,
              projectType: projectContext.projectType,
              targetAudience: projectContext.targetAudience,
              existingTracks: projectContext.existingTracks?.map(t => ({
                title: t.title,
                stylePrompt: t.stylePrompt,
                generatedLyrics: t.generatedLyrics,
                draftLyrics: t.draftLyrics,
              })),
            } : undefined,
            trackContext: trackContext ? {
              title: trackContext.title,
              position: trackContext.position,
              stylePrompt: trackContext.stylePrompt,
              recommendedTags: trackContext.recommendedTags,
              recommendedStructure: trackContext.recommendedStructure,
              notes: trackContext.notes,
              lyricsStatus: trackContext.lyricsStatus,
            } : undefined,
            conversationHistory,
          },
        },
      });

      if (error) throw error;

if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response || '✅ Готово! Вот текст:',
          component: 'lyrics-preview',
          data: { 
            lyrics: data.lyrics,
            title: data.title,
            style: data.style,
          },
        });
        
        // Generate style prompt if callback exists and style is provided
        if (onStyleGenerated && data.style) {
          onStyleGenerated(data.style);
        }
      } else if (data?.response) {
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          options: data.suggestions || undefined,
        });
      }
    } catch (err) {
      logger.error('Error in free chat', { error: err });
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '😔 Произошла ошибка. Попробуйте переформулировать.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, generatedLyrics, theme, genre, mood, language, projectContext, trackContext, addMessage]);

  const handleQuickOption = useCallback(async (option: QuickOption) => {
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
    });

    // Handle different action types
    switch (option.action) {
      case 'freeform':
        // Special case: "generate_now" - immediately generate using context
        if (option.value === 'generate_now') {
          setFreeformMode(true);
          // Trigger generation with existing context
          await processFreechat('Создай полный текст песни с профессиональными тегами Suno, используя всю доступную информацию о проекте и треке');
        } else {
          setFreeformMode(true);
          addMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: '💬 Режим свободного чата активирован. Опишите, что хотите создать, или задайте вопрос.',
          });
        }
        break;

      case 'setTheme':
        if (option.value === 'custom_theme') {
          addMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: '📝 О чём будет песня? Опишите тему или историю.',
          });
        } else {
          setTheme(option.value);
          askForGenre();
        }
        break;

      case 'editDraft':
        if (trackContext?.draftLyrics) {
          setGeneratedLyrics(trackContext.draftLyrics);
          await modifyLyrics('Улучши этот текст, сохранив основную идею');
        }
        break;

      case 'useContext':
        if (option.value === 'add_tags' && trackContext?.draftLyrics) {
          setGeneratedLyrics(trackContext.draftLyrics);
          setIsLoading(true);
          try {
            const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
              body: {
                action: 'add_tags',
                lyrics: trackContext.draftLyrics,
                genre: genre || projectContext?.genre || 'pop',
                mood: mood.join(', ') || projectContext?.mood || 'romantic',
                language,
              },
            });
            if (error) throw error;
            if (data?.lyrics) {
              setGeneratedLyrics(data.lyrics);
              
              let responseContent = '🏷️ Добавил теги Suno:';
              if (data.tagsSummary) {
                const totalTags = Object.values(data.tagsSummary).flat().length;
                responseContent = `🏷️ Добавлено ${totalTags} профессиональных тегов Suno V5`;
              }
              
              addMessage({
                id: Date.now().toString(),
                role: 'assistant',
                content: responseContent,
                component: 'lyrics-preview',
                data: { 
                  lyrics: data.lyrics,
                  title: data.title,
                  style: data.style,
                  tagsSummary: data.tagsSummary,
                },
              });
            }
          } catch (err) {
            logger.error('Error adding tags', { error: err });
            toast.error('Ошибка добавления тегов');
          } finally {
            setIsLoading(false);
          }
        } else if (option.value === 'translate' && generatedLyrics) {
          await modifyLyrics('Переведи на английский язык, сохранив рифмы и ритм');
        } else {
          setTheme(option.value);
          askForGenre();
        }
        break;

      case 'retry':
        generateLyrics(structure);
        break;

      default:
        if (!theme) {
          setTheme(option.value);
          askForGenre();
        }
    }
  }, [theme, trackContext, generatedLyrics, genre, mood, language, projectContext, structure, addMessage, askForGenre, modifyLyrics, generateLyrics, processFreechat]);

  const handleGenreSelect = useCallback((selectedGenre: string) => {
    setGenre(selectedGenre);
    const genreData = GENRES.find(g => g.value === selectedGenre);
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: `${genreData?.emoji} ${genreData?.label}`,
    });
    askForMood();
  }, [addMessage, askForMood]);

  const handleMoodSelect = useCallback((selectedMood: string) => {
    setMood(prev => prev.includes(selectedMood)
      ? prev.filter(m => m !== selectedMood)
      : [...prev, selectedMood]
    );
  }, []);

  const confirmMood = useCallback(() => {
    if (mood.length === 0) {
      toast.error('Выберите хотя бы одно настроение');
      return;
    }
    const moodLabels = mood.map(m => {
      const moodData = MOODS.find(mo => mo.value === m);
      return `${moodData?.emoji} ${moodData?.label}`;
    }).join(', ');
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: moodLabels,
    });
    askForStructure();
  }, [mood, addMessage, askForStructure]);

  const handleStructureSelect = useCallback((selectedStructure: string) => {
    setStructure(selectedStructure);
    const structLabel = ['standard', 'simple', 'extended'].includes(selectedStructure)
      ? { standard: 'Стандартная', simple: 'Простая', extended: 'Расширенная' }[selectedStructure]
      : selectedStructure;
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: `📝 ${structLabel}`,
    });
    generateLyrics(selectedStructure);
  }, [addMessage, generateLyrics]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    });

    // Always use free chat for direct messages
    // This allows users to directly request lyrics generation without going through steps
    // AI will determine if it needs more info or can generate immediately
    await processFreechat(userMessage);
  }, [inputValue, addMessage, processFreechat]);

  const regenerateLyrics = useCallback(() => {
    generateLyrics(structure);
  }, [structure, generateLyrics]);

  const applyLyrics = useCallback(() => {
    if (generatedLyrics) {
      onLyricsGenerated(generatedLyrics);
      
      if (onStyleGenerated) {
        const genreLabel = GENRES.find(g => g.value === genre)?.label || genre;
        const moodLabels = mood.map(m => MOODS.find(mo => mo.value === m)?.label || m).join(', ');
        const style = `${genreLabel}, ${moodLabels}, ${theme}`.slice(0, 200);
        onStyleGenerated(style);
      }
      
      handleClose();
    }
  }, [generatedLyrics, genre, mood, theme, onLyricsGenerated, onStyleGenerated]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Скопировано');
  }, [generatedLyrics]);

  const handleSaveToLibrary = useCallback(async () => {
    if (!generatedLyrics || !user) {
      toast.error('Войдите в аккаунт для сохранения');
      return;
    }

    setIsSaving(true);
    try {
      const genreLabel = GENRES.find(g => g.value === genre)?.label || genre || 'Общий';
      const moodLabels = mood.map(m => MOODS.find(mo => mo.value === m)?.label || m);
      const templateName = theme 
        ? `${theme.slice(0, 50)}${theme.length > 50 ? '...' : ''}`
        : `Текст песни (${genreLabel})`;

      const { error } = await supabase.from('prompt_templates').insert({
        user_id: user.id,
        name: templateName,
        template_text: generatedLyrics,
        tags: [genreLabel, ...moodLabels].filter(Boolean),
        is_public: false,
      });

      if (error) throw error;

      setSaved(true);
      toast.success('Сохранено в библиотеку шаблонов');
    } catch (err) {
      logger.error('Error saving template', { error: err });
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  }, [generatedLyrics, user, genre, mood, theme]);

  const handleClose = useCallback(() => {
    setMessages([]);
    setTheme('');
    setGenre(initialGenre || projectContext?.genre || '');
    setMood(initialMood || (projectContext?.mood ? [projectContext.mood] : []));
    setStructure('standard');
    setGeneratedLyrics('');
    setSaved(false);
    setFreeformMode(false);
    onClose();
  }, [initialGenre, initialMood, projectContext, onClose]);

  const continueConversation = useCallback(() => {
    addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Хотите что-то изменить или создать новый текст?',
      options: [
        { label: '✏️ Изменить', value: 'modify', action: 'freeform' },
        { label: '🆕 Новый текст', value: 'new', action: 'setTheme' },
      ],
    });
  }, [addMessage]);

  // Fetch context-based AI recommendations
  const fetchContextRecommendations = useCallback(async () => {
    if (!projectContext && !trackContext) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'context_recommendations',
          context: {
            projectContext: projectContext ? {
              title: projectContext.projectTitle,
              genre: projectContext.genre,
              mood: projectContext.mood,
              concept: projectContext.concept,
              existingTracks: projectContext.existingTracks,
            } : undefined,
            trackContext: trackContext ? {
              title: trackContext.title,
              position: trackContext.position,
              stylePrompt: trackContext.stylePrompt,
            } : undefined,
            currentLyrics: generatedLyrics || undefined,
          },
        },
      });

      if (error) throw error;
      
      // Parse recommendations from response
      if (data?.lyrics) {
        try {
          const recs = JSON.parse(data.lyrics);
          if (Array.isArray(recs)) {
            return recs;
          }
        } catch {
          // If parsing fails, return empty
        }
      }
    } catch (err) {
      logger.error('Error fetching recommendations', { error: err });
    }
    return [];
  }, [projectContext, trackContext, generatedLyrics]);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    copied,
    saved,
    isSaving,
    scrollRef,
    userScrolling,
    genre,
    mood,
    structure,
    generatedLyrics,
    freeformMode,
    handleQuickOption,
    handleGenreSelect,
    handleMoodSelect,
    confirmMood,
    handleStructureSelect,
    handleSendMessage,
    regenerateLyrics,
    applyLyrics,
    handleCopy,
    handleSaveToLibrary,
    handleClose,
    continueConversation,
    fetchContextRecommendations,
  };
}
