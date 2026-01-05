import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { 
  Sparkles, Music, Mic2, FileMusic, Layers, 
  ListMusic, Wand2, ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface QuickTool {
  id: string;
  icon: typeof Sparkles;
  label: string;
  shortLabel: string;
  description: string;
  path?: string;
  action?: () => void;
  gradient: string;
  iconColor: string;
}

interface QuickToolsBarProps {
  onGenerateClick: () => void;
  className?: string;
}

export const QuickToolsBar = memo(function QuickToolsBar({
  onGenerateClick,
  className,
}: QuickToolsBarProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const tools: QuickTool[] = [
    {
      id: 'generate',
      icon: Sparkles,
      label: 'Создать трек',
      shortLabel: 'Создать',
      description: 'AI генерация',
      action: onGenerateClick,
      gradient: 'from-primary/20 to-generate/10',
      iconColor: 'text-primary',
    },
    {
      id: 'lyrics',
      icon: FileMusic,
      label: 'Написать текст',
      shortLabel: 'Текст',
      description: 'AI лирика',
      path: '/lyrics-workspace',
      gradient: 'from-violet-500/20 to-purple-500/10',
      iconColor: 'text-violet-400',
    },
    {
      id: 'stems',
      icon: Layers,
      label: 'Разделить трек',
      shortLabel: 'Стемы',
      description: 'Vocal/инструментал',
      path: '/stem-studio',
      gradient: 'from-emerald-500/20 to-teal-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'cover',
      icon: Mic2,
      label: 'Сделать кавер',
      shortLabel: 'Кавер',
      description: 'Другой голос',
      path: '/generate?mode=cover',
      gradient: 'from-orange-500/20 to-amber-500/10',
      iconColor: 'text-orange-400',
    },
    {
      id: 'playlists',
      icon: ListMusic,
      label: 'Плейлисты',
      shortLabel: 'Плейлисты',
      description: 'Коллекции',
      path: '/playlists',
      gradient: 'from-cyan-500/20 to-blue-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'studio',
      icon: Wand2,
      label: 'Студия',
      shortLabel: 'Студия',
      description: 'Редактирование',
      path: '/studio',
      gradient: 'from-rose-500/20 to-pink-500/10',
      iconColor: 'text-rose-400',
    },
  ];

  const handleClick = (tool: QuickTool) => {
    hapticFeedback?.('light');
    if (tool.action) {
      tool.action();
    } else if (tool.path) {
      navigate(tool.path);
    }
  };

  return (
    <section className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Инструменты</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/music-lab')}
          className="text-xs text-muted-foreground hover:text-primary gap-1 rounded-xl h-7 px-2"
        >
          Music Lab
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Tools Scroll */}
      <ScrollArea className="-mx-3">
        <div className="flex gap-2 px-3 pb-2">
          {tools.map((tool, index) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(tool)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl",
                "bg-gradient-to-br border border-border/50",
                "hover:border-primary/30 transition-all duration-200",
                "min-w-[72px] sm:min-w-[80px]",
                tool.gradient
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-background/60 backdrop-blur-sm"
              )}>
                <tool.icon className={cn("w-5 h-5", tool.iconColor)} />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center line-clamp-1">
                {tool.shortLabel}
              </span>
            </motion.button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
});
