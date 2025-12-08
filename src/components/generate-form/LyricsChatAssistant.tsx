import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, Send, RotateCcw, Copy, Check,
  ChevronRight, Loader2, Bookmark, BookmarkCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/lib/logger';

interface LyricsChatAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLyricsGenerated: (lyrics: string) => void;
  onStyleGenerated?: (style: string) => void;
  initialGenre?: string;
  initialMood?: string[];
  initialLanguage?: 'ru' | 'en';
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  options?: QuickOption[];
  component?: 'genre' | 'mood' | 'language' | 'structure' | 'lyrics-preview';
  data?: any;
}

interface QuickOption {
  label: string;
  value: string;
}

const GENRES = [
  { value: 'pop', label: 'Поп', emoji: '🎤' },
  { value: 'rock', label: 'Рок', emoji: '🎸' },
  { value: 'hip-hop', label: 'Хип-хоп', emoji: '🎧' },
  { value: 'electronic', label: 'Электроника', emoji: '🎹' },
  { value: 'r&b', label: 'R&B', emoji: '🎷' },
  { value: 'indie', label: 'Инди', emoji: '🌙' },
  { value: 'folk', label: 'Фолк', emoji: '🪕' },
  { value: 'jazz', label: 'Джаз', emoji: '🎺' },
];

const MOODS = [
  { value: 'romantic', label: 'Романтичное', emoji: '💕' },
  { value: 'energetic', label: 'Энергичное', emoji: '⚡' },
  { value: 'melancholic', label: 'Меланхоличное', emoji: '🌧️' },
  { value: 'happy', label: 'Радостное', emoji: '☀️' },
  { value: 'dark', label: 'Мрачное', emoji: '🌑' },
  { value: 'nostalgic', label: 'Ностальгическое', emoji: '📷' },
  { value: 'peaceful', label: 'Умиротворённое', emoji: '🕊️' },
  { value: 'epic', label: 'Эпичное', emoji: '🏔️' },
];

const STRUCTURES = [
  { value: 'standard', label: 'Стандартная', desc: 'Куплет → Припев → Куплет → Припев → Бридж' },
  { value: 'simple', label: 'Простая', desc: 'Куплет → Припев → Куплет → Припев' },
  { value: 'extended', label: 'Расширенная', desc: 'Интро → Куплеты → Бридж → Аутро' },
];

// Animation variants
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 500, damping: 30 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

const badgeVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  selected: { scale: 1.05, boxShadow: '0 0 0 2px hsl(var(--primary))' }
};

export function LyricsChatAssistant({
  open,
  onOpenChange,
  onLyricsGenerated,
  onStyleGenerated,
  initialGenre,
  initialMood,
  initialLanguage = 'ru',
}: LyricsChatAssistantProps) {
  const isMobile = useIsMobile();
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
  const [language, setLanguage] = useState<'ru' | 'en'>(initialLanguage);
  const [structure, setStructure] = useState('standard');
  const [generatedLyrics, setGeneratedLyrics] = useState('');

  useEffect(() => {
    if (open && messages.length === 0) {
      initConversation();
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const initConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Привет! 👋 Я помогу создать текст песни. О чём будет песня?',
        options: [
          { label: '💕 Любовь', value: 'Песня о любви и отношениях' },
          { label: '✨ Мечты', value: 'Песня о погоне за мечтой' },
          { label: '🌃 Ночной город', value: 'Песня о ночном городе' },
          { label: '🦋 Свобода', value: 'Песня о свободе' },
        ],
      },
    ]);
  };

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleQuickOption = async (option: QuickOption) => {
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
    });

    if (!theme) {
      setTheme(option.value);
      askForGenre();
    }
  };

  const askForGenre = () => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Отлично! 🎵 Выберите жанр:',
        component: 'genre',
      });
    }, 400);
  };

  const askForMood = () => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Какое настроение? Можно выбрать несколько:',
        component: 'mood',
      });
    }, 400);
  };

  const askForStructure = () => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: '📝 Выберите структуру песни:',
        component: 'structure',
      });
    }, 400);
  };

  const handleGenreSelect = (selectedGenre: string) => {
    setGenre(selectedGenre);
    const genreData = GENRES.find(g => g.value === selectedGenre);
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: `${genreData?.emoji} ${genreData?.label}`,
    });
    askForMood();
  };

  const handleMoodSelect = (selectedMood: string) => {
    const newMood = mood.includes(selectedMood)
      ? mood.filter(m => m !== selectedMood)
      : [...mood, selectedMood];
    setMood(newMood);
  };

  const confirmMood = () => {
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
  };

  const handleStructureSelect = (selectedStructure: string) => {
    setStructure(selectedStructure);
    const structLabel = STRUCTURES.find(s => s.value === selectedStructure)?.label || selectedStructure;
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: `📝 ${structLabel}`,
    });
    generateLyrics(selectedStructure);
  };

  const generateLyrics = async (selectedStructure: string) => {
    setIsLoading(true);
    
    addMessage({
      id: 'loading-' + Date.now(),
      role: 'assistant',
      content: '✨ Создаю текст песни...',
    });

    try {
      const structureMap: Record<string, string> = {
        standard: 'Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus',
        simple: 'Verse 1, Chorus, Verse 2, Chorus',
        extended: 'Intro, Verse 1, Verse 2, Chorus, Verse 3, Bridge, Chorus, Outro',
      };

      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'generate',
          theme: theme,
          genre: genre || 'pop',
          mood: mood.join(', ') || 'romantic',
          language: language,
          structure: structureMap[selectedStructure] || structureMap.standard,
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
  };

  const handleSendMessage = async () => {
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
  };

  const modifyLyrics = async (instruction: string) => {
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
  };

  const regenerateLyrics = () => {
    generateLyrics(structure);
  };

  const applyLyrics = () => {
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
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Скопировано');
  };

  const handleSaveToLibrary = async () => {
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
  };

  const handleClose = () => {
    setMessages([]);
    setTheme('');
    setGenre(initialGenre || '');
    setMood(initialMood || []);
    setStructure('standard');
    setGeneratedLyrics('');
    setSaved(false);
    onOpenChange(false);
  };

  const renderComponent = (msg: ChatMessage) => {
    switch (msg.component) {
      case 'genre':
        return (
          <motion.div 
            className="grid grid-cols-2 gap-2 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {GENRES.map((g, index) => (
              <motion.div
                key={g.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.button
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    genre === g.value
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  )}
                  onClick={() => handleGenreSelect(g.value)}
                >
                  <span className="text-base">{g.emoji}</span>
                  <span>{g.label}</span>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        );

      case 'mood':
        return (
          <motion.div 
            className="space-y-3 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m, index) => (
                <motion.div
                  key={m.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <motion.button
                    variants={badgeVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    animate={mood.includes(m.value) ? "selected" : "idle"}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                      mood.includes(m.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 hover:bg-secondary text-foreground"
                    )}
                    onClick={() => handleMoodSelect(m.value)}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </motion.button>
                </motion.div>
              ))}
            </div>
            <AnimatePresence>
              {mood.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <motion.button
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                    onClick={confirmMood}
                  >
                    Продолжить
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 'structure':
        return (
          <motion.div 
            className="space-y-2 mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {STRUCTURES.map((s, index) => (
              <motion.div
                key={s.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.button
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  className={cn(
                    "w-full flex flex-col items-start text-left px-4 py-3 rounded-xl transition-all",
                    structure === s.value
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary/50 hover:bg-secondary"
                  )}
                  onClick={() => handleStructureSelect(s.value)}
                >
                  <span className="font-medium text-sm">{s.label}</span>
                  <span className={cn(
                    "text-xs mt-0.5",
                    structure === s.value ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {s.desc}
                  </span>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        );

      case 'lyrics-preview':
        return (
          <motion.div 
            className="mt-3 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div 
              className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 max-h-[200px] sm:max-h-[280px] overflow-y-auto shadow-inner"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                {msg.data?.lyrics}
              </pre>
            </motion.div>
            <div className="flex flex-wrap gap-2">
              <motion.button
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-colors"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </motion.button>
              <motion.button
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                  saved 
                    ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                    : "bg-secondary/50 hover:bg-secondary"
                )}
                onClick={handleSaveToLibrary}
                disabled={isSaving || saved}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                {saved ? 'Сохранено' : 'В библиотеку'}
              </motion.button>
              <motion.button
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={regenerateLyrics}
                disabled={isLoading}
              >
                <RotateCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                Заново
              </motion.button>
              <motion.button
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg"
                onClick={applyLyrics}
              >
                <Check className="h-3.5 w-3.5" />
                Применить
              </motion.button>
            </div>
            <p className="text-xs text-muted-foreground px-1">
              💡 Напишите, что изменить, или сохраните текст в библиотеку
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Chat Area */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <motion.div
                  className={cn(
                    'max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-2.5',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}
                  layout
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  
                  {msg.options && msg.role === 'assistant' && (
                    <motion.div 
                      className="flex flex-wrap gap-2 mt-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {msg.options.map((opt, index) => (
                        <motion.button
                          key={opt.value}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="px-3 py-1.5 bg-background/80 hover:bg-background rounded-full text-xs font-medium text-foreground transition-colors shadow-sm"
                          onClick={() => handleQuickOption(opt)}
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                  
                  {msg.component && renderComponent(msg)}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <motion.div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                          animate={{ 
                            y: [0, -4, 0],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 pt-2 border-t border-border/50 bg-background/80 backdrop-blur-sm safe-area-bottom">
        <motion.div 
          className="flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={generatedLyrics ? 'Что изменить...' : 'Напишите тему песни...'}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
            className="flex-1 bg-muted/50 border-border/50 focus:bg-background transition-colors rounded-xl"
          />
          <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
            <Button 
              size="icon" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="rounded-xl shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="pb-2 border-b border-border/50">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              AI Помощник
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            {chatContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            AI Lyrics Assistant
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {chatContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
