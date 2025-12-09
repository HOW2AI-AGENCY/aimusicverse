import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle,
  ChevronRight,
  Sparkles,
  Music2,
  Layers,
  Settings,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpTopic {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  articles: { title: string; url?: string }[];
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'Как создать первый трек?',
    answer: 'Нажмите на кнопку "+" в нижней навигации или "Создать трек" на главной странице. Опишите желаемый стиль музыки и нажмите "Сгенерировать".',
    category: 'generation'
  },
  {
    id: '2',
    question: 'Что такое версии A/B?',
    answer: 'При генерации создаются 2 варианта трека (A и B). Вы можете переключаться между ними и выбрать лучший.',
    category: 'tracks'
  },
  {
    id: '3',
    question: 'Как разделить трек на стемы?',
    answer: 'Откройте трек → меню "Ещё" → "Разделить на стемы". Это разделит трек на вокал, ударные, бас и другие инструменты.',
    category: 'studio'
  },
  {
    id: '4',
    question: 'Как добавить трек в плейлист?',
    answer: 'Откройте меню трека → "Добавить в плейлист" → выберите существующий или создайте новый.',
    category: 'playlists'
  },
  {
    id: '5',
    question: 'Как поделиться треком?',
    answer: 'Откройте меню трека → "Поделиться". Вы можете отправить ссылку, скопировать её или поделиться в Telegram историях.',
    category: 'sharing'
  },
  {
    id: '6',
    question: 'Что такое кредиты?',
    answer: 'Кредиты — это валюта для генерации треков. Вы получаете их ежедневно при входе, за достижения и активность.',
    category: 'credits'
  },
];

const helpTopics: HelpTopic[] = [
  {
    id: 'generation',
    icon: Sparkles,
    title: 'Генерация музыки',
    description: 'Создание треков с помощью AI',
    articles: [
      { title: 'Быстрый старт: первый трек за 60 секунд' },
      { title: 'Продвинутые настройки генерации' },
      { title: 'Использование референсов и AI-артистов' },
    ]
  },
  {
    id: 'studio',
    icon: Layers,
    title: 'Stem Studio',
    description: 'Работа со стемами и микширование',
    articles: [
      { title: 'Разделение трека на стемы' },
      { title: 'Микширование и эффекты' },
      { title: 'Экспорт готового микса' },
    ]
  },
  {
    id: 'tracks',
    icon: Music2,
    title: 'Управление треками',
    description: 'Библиотека и плейлисты',
    articles: [
      { title: 'Организация библиотеки' },
      { title: 'Создание плейлистов' },
      { title: 'Версии и история изменений' },
    ]
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Настройки',
    description: 'Профиль и предпочтения',
    articles: [
      { title: 'Настройка уведомлений' },
      { title: 'Telegram интеграция' },
      { title: 'Приватность и безопасность' },
    ]
  },
];

function HelpCenterContent({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по справке..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick FAQ */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Частые вопросы
            </h3>
            <div className="space-y-2">
              {filteredFaq.slice(0, 5).map((item) => (
                <motion.div
                  key={item.id}
                  initial={false}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">{item.question}</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      expandedFaq === item.id && "rotate-90"
                    )} />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-3 pb-3 text-sm text-muted-foreground">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Help Topics */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Темы справки
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {helpTopics.map((topic) => (
                <motion.button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <topic.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{topic.title}</p>
                    <p className="text-xs text-muted-foreground">{topic.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Video Tutorials */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Видео-уроки
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {['Быстрый старт', 'Stem Studio', 'AI-артисты'].map((title, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-40 rounded-xl border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{title}</p>
                    <p className="text-[10px] text-muted-foreground">2 мин</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Support */}
          <section className="pb-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Нужна помощь?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Напишите нам в Telegram
              </p>
              <Button size="sm" variant="outline">
                Связаться с поддержкой
              </Button>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Topic Detail Drawer */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute inset-0 bg-background z-10"
          >
            <div className="flex items-center gap-3 p-4 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTopic(null)}
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <div className="flex items-center gap-2">
                <selectedTopic.icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{selectedTopic.title}</h3>
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-57px)]">
              <div className="p-4 space-y-2">
                {selectedTopic.articles.map((article, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{article.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HelpCenter({ open, onOpenChange }: HelpCenterProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Справка
            </DrawerTitle>
          </DrawerHeader>
          <HelpCenterContent onClose={() => onOpenChange(false)} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Справка
          </DialogTitle>
        </DialogHeader>
        <HelpCenterContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
