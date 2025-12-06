import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, Send, Music, MessageCircle, Wand2, 
  Languages, Palette, RotateCcw, Copy, Check, X,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  icon?: React.ReactNode;
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
  { value: 'standard', label: 'Стандартная', desc: 'Куплет → Припев → Куплет → Припев → Бридж → Припев' },
  { value: 'simple', label: 'Простая', desc: 'Куплет → Припев → Куплет → Припев' },
  { value: 'extended', label: 'Расширенная', desc: 'Интро → 2 куплета → Припев → Куплет → Бридж → Аутро' },
];

export function LyricsChatAssistant({
  open,
  onOpenChange,
  onLyricsGenerated,
  onStyleGenerated,
  initialGenre,
  initialMood,
  initialLanguage = 'ru',
}: LyricsChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // State for lyrics creation
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState(initialGenre || '');
  const [mood, setMood] = useState<string[]>(initialMood || []);
  const [language, setLanguage] = useState<'ru' | 'en'>(initialLanguage);
  const [structure, setStructure] = useState('standard');
  const [generatedLyrics, setGeneratedLyrics] = useState('');

  // Initialize conversation
  useEffect(() => {
    if (open && messages.length === 0) {
      initConversation();
    }
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Привет! 👋 Я помогу создать текст песни. О чём будет песня?',
        options: [
          { label: 'Любовь и отношения', value: 'Песня о любви и отношениях' },
          { label: 'Мечты и цели', value: 'Песня о погоне за мечтой' },
          { label: 'Ночной город', value: 'Песня о ночном городе и его атмосфере' },
          { label: 'Свобода', value: 'Песня о свободе и независимости' },
        ],
      },
    ]);
  };

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleQuickOption = async (option: QuickOption) => {
    // Add user message
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
    });

    // Process based on current flow
    if (!theme) {
      setTheme(option.value);
      askForGenre();
    } else if (!genre) {
      setGenre(option.value);
      askForMood();
    } else if (mood.length === 0) {
      setMood([option.value]);
      askForStructure();
    } else if (!structure || structure === 'pending') {
      setStructure(option.value);
      generateLyrics(option.value);
    }
  };

  const askForGenre = () => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Отлично! В каком жанре?',
        component: 'genre',
      });
    }, 300);
  };

  const askForMood = () => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Какое настроение песни?',
        component: 'mood',
      });
    }, 300);
  };

  const askForStructure = () => {
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Выберите структуру:',
        component: 'structure',
      });
    }, 300);
  };

  const handleGenreSelect = (selectedGenre: string) => {
    setGenre(selectedGenre);
    const genreLabel = GENRES.find(g => g.value === selectedGenre)?.label || selectedGenre;
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: genreLabel,
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
    const moodLabels = mood.map(m => MOODS.find(mo => mo.value === m)?.label || m).join(', ');
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
      content: structLabel,
    });
    generateLyrics(selectedStructure);
  };

  const generateLyrics = async (selectedStructure: string) => {
    setIsLoading(true);
    
    addMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: '✨ Генерирую текст...',
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
        
        // Remove loading message and add result
        setMessages(prev => prev.filter(m => !m.content.includes('Генерирую')));
        
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Готово! Вот текст:',
          component: 'lyrics-preview',
          data: { lyrics: data.lyrics },
        });
      }
    } catch (err) {
      console.error('Error generating lyrics:', err);
      setMessages(prev => prev.filter(m => !m.content.includes('Генерирую')));
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Ошибка генерации. Попробуйте ещё раз.',
        options: [{ label: 'Попробовать снова', value: 'retry' }],
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

    // If no theme yet, use input as theme
    if (!theme) {
      setTheme(userMessage);
      askForGenre();
    } else if (generatedLyrics) {
      // User wants to modify lyrics
      await modifyLyrics(userMessage);
    }
  };

  const modifyLyrics = async (instruction: string) => {
    setIsLoading(true);
    
    addMessage({
      id: Date.now().toString(),
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
        setMessages(prev => prev.filter(m => !m.content.includes('Изменяю')));
        
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Обновлённый текст:',
          component: 'lyrics-preview',
          data: { lyrics: data.lyrics },
        });
      }
    } catch (err) {
      console.error('Error modifying lyrics:', err);
      setMessages(prev => prev.filter(m => !m.content.includes('Изменяю')));
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
      
      // Generate style if callback provided
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

  const handleClose = () => {
    setMessages([]);
    setTheme('');
    setGenre(initialGenre || '');
    setMood(initialMood || []);
    setStructure('standard');
    setGeneratedLyrics('');
    onOpenChange(false);
  };

  const renderComponent = (msg: ChatMessage) => {
    switch (msg.component) {
      case 'genre':
        return (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {GENRES.map((g) => (
              <Button
                key={g.value}
                variant={genre === g.value ? 'default' : 'outline'}
                size="sm"
                className="justify-start gap-2"
                onClick={() => handleGenreSelect(g.value)}
              >
                <span>{g.emoji}</span>
                {g.label}
              </Button>
            ))}
          </div>
        );

      case 'mood':
        return (
          <div className="space-y-3 mt-3">
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <Badge
                  key={m.value}
                  variant={mood.includes(m.value) ? 'default' : 'outline'}
                  className="cursor-pointer py-1.5 px-3"
                  onClick={() => handleMoodSelect(m.value)}
                >
                  {m.emoji} {m.label}
                </Badge>
              ))}
            </div>
            {mood.length > 0 && (
              <Button size="sm" onClick={confirmMood} className="gap-1">
                Продолжить <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        );

      case 'structure':
        return (
          <div className="space-y-2 mt-3">
            {STRUCTURES.map((s) => (
              <Button
                key={s.value}
                variant="outline"
                className="w-full flex-col items-start h-auto py-3 px-4"
                onClick={() => handleStructureSelect(s.value)}
              >
                <span className="font-medium">{s.label}</span>
                <span className="text-xs text-muted-foreground font-normal">{s.desc}</span>
              </Button>
            ))}
          </div>
        );

      case 'lyrics-preview':
        return (
          <div className="mt-3 space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {msg.data?.lyrics}
              </pre>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>
              <Button size="sm" variant="outline" onClick={regenerateLyrics} className="gap-1" disabled={isLoading}>
                <RotateCcw className="h-3 w-3" />
                Перегенерировать
              </Button>
              <Button size="sm" onClick={applyLyrics} className="gap-1">
                <Check className="h-3 w-3" />
                Применить
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Напишите, что изменить (например: "сделай припев короче" или "добавь больше рифм")
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Lyrics Assistant
          </DialogTitle>
        </DialogHeader>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    
                    {/* Quick options */}
                    {msg.options && msg.role === 'assistant' && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {msg.options.map((opt) => (
                          <Button
                            key={opt.value}
                            size="sm"
                            variant="secondary"
                            className="text-xs"
                            onClick={() => handleQuickOption(opt)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {/* Interactive components */}
                    {msg.component && renderComponent(msg)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 pt-2 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={generatedLyrics ? 'Что изменить в тексте...' : 'Введите тему песни...'}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
