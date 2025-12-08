import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { ChatMessage, QuickOption } from './types';
import { GENRES, MOODS, STRUCTURE_MAP, INITIAL_MESSAGE_OPTIONS } from './constants';

interface UseLyricsChatOptions {
  open: boolean;
  initialGenre?: string;
  initialMood?: string[];
  initialLanguage?: 'ru' | 'en';
  onLyricsGenerated: (lyrics: string) => void;
  onStyleGenerated?: (style: string) => void;
  onClose: () => void;
}

export function useLyricsChat({
  open,
  initialGenre,
  initialMood,
  initialLanguage = 'ru',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState(initialGenre || '');
  const [mood, setMood] = useState<string[]>(initialMood || []);
  const [language] = useState<'ru' | 'en'>(initialLanguage);
  const [structure, setStructure] = useState('standard');
  const [generatedLyrics, setGeneratedLyrics] = useState('');

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const initConversation = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Привет! 👋 Я помогу создать текст песни. О чём будет песня?',
        options: INITIAL_MESSAGE_OPTIONS,
      },
    ]);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      initConversation();
    }
  }, [open, messages.length, initConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

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
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        setMessages(prev => prev.filter(m => !m.id.startsWith('loading-')));
        
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: '🎉 Готово! Вот текст вашей песни:',
          component: 'lyrics-preview',
          data: { lyrics: data.lyrics },
        });
      }
    } catch (err) {
      logger.error('Error generating lyrics', { error: err });
      setMessages(prev => prev.filter(m => !m.id.startsWith('loading-')));
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '😔 Не удалось сгенерировать текст. Попробуем ещё раз?',
        options: [{ label: '🔄 Попробовать снова', value: 'retry' }],
      });
    } finally {
      setIsLoading(false);
    }
  }, [theme, genre, mood, language, addMessage]);

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
        
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ Обновлённый текст:',
          component: 'lyrics-preview',
          data: { lyrics: data.lyrics },
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

  const handleQuickOption = useCallback(async (option: QuickOption) => {
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
    });

    if (!theme) {
      setTheme(option.value);
      askForGenre();
    }
  }, [theme, addMessage, askForGenre]);

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

    if (!theme) {
      setTheme(userMessage);
      askForGenre();
    } else if (generatedLyrics) {
      await modifyLyrics(userMessage);
    }
  }, [inputValue, theme, generatedLyrics, addMessage, askForGenre, modifyLyrics]);

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
    setGenre(initialGenre || '');
    setMood(initialMood || []);
    setStructure('standard');
    setGeneratedLyrics('');
    setSaved(false);
    onClose();
  }, [initialGenre, initialMood, onClose]);

  const continueConversation = useCallback(() => {
    addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Хотите что-то изменить или создать новый текст?',
      options: [
        { label: '✏️ Изменить', value: 'modify' },
        { label: '🆕 Новый текст', value: 'new' },
      ],
    });
  }, [addMessage]);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    copied,
    saved,
    isSaving,
    scrollRef,
    genre,
    mood,
    structure,
    generatedLyrics,
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
  };
}
