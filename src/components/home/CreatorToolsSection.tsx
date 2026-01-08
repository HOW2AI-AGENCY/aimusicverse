/**
 * CreatorToolsSection - Interactive cards for main creator tools
 * Voice Recording, Guitar, Lyrics, MIDI
 * Mobile-optimized with larger touch targets and better descriptions
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Guitar, 
  FileText, 
  Music2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreatorToolsSectionProps {
  onRecordClick?: () => void;
  className?: string;
}

const TOOLS = [
  {
    id: 'voice',
    icon: Mic,
    title: 'Запись голоса',
    shortTitle: 'Голос',
    description: 'Запиши идею или мелодию голосом',
    tooltip: 'Записывайте вокал или напевайте мелодию — AI добавит инструментал',
    gradient: 'from-red-500/20 to-orange-500/20',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    action: 'record',
  },
  {
    id: 'guitar',
    icon: Guitar,
    title: 'Гитара и аккорды',
    shortTitle: 'Гитара',
    description: 'Играй — AI распознает аккорды',
    tooltip: 'Играйте на гитаре в реальном времени, AI распознает аккорды и создаст аранжировку',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    link: '/guitar-studio',
  },
  {
    id: 'lyrics',
    icon: FileText,
    title: 'Тексты песен',
    shortTitle: 'Тексты',
    description: 'AI помощник для написания лирики',
    tooltip: 'Создавайте тексты песен с AI-ассистентом — рифмы, структура, перевод',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    link: '/lyrics-studio',
  },
  {
    id: 'midi',
    icon: Music2,
    title: 'MIDI и ноты',
    shortTitle: 'MIDI',
    description: 'Транскрибируй музыку в ноты',
    tooltip: 'Загрузите аудио — AI транскрибирует его в MIDI и нотную запись',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    link: '/music-lab',
  },
];

export const CreatorToolsSection = memo(function CreatorToolsSection({
  onRecordClick,
  className,
}: CreatorToolsSectionProps) {
  const navigate = useNavigate();

  const handleToolClick = (tool: typeof TOOLS[0]) => {
    if (tool.action === 'record' && onRecordClick) {
      onRecordClick();
    } else if (tool.link) {
      navigate(tool.link);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <section className={cn('space-y-4', className)}>
        {/* Section Header - improved hierarchy */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
              Инструменты
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Записывай, играй, пиши — AI поможет на каждом шаге
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {TOOLS.map((tool, index) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleToolClick(tool)}
                  aria-label={tool.tooltip}
                  className={cn(
                    // Touch-friendly minimum height - 100px on mobile, 120px on desktop
                    'relative overflow-hidden rounded-xl p-3.5 sm:p-4 text-left',
                    'min-h-[100px] sm:min-h-[120px]',
                    'bg-gradient-to-br border border-border/50',
                    'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                    'transition-all duration-200 group active:scale-[0.98]',
                    tool.gradient
                  )}
                >
                  {/* Icon - larger touch target area */}
                  <div className={cn(
                    // Larger icons on mobile - 44px minimum
                    'w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px]',
                    'rounded-xl flex items-center justify-center mb-2.5 sm:mb-3',
                    'transition-transform duration-200 group-hover:scale-110',
                    tool.iconBg
                  )}>
                    <tool.icon className={cn('w-5 h-5 sm:w-6 sm:h-6', tool.iconColor)} />
                  </div>

                  {/* Content - better text sizing */}
                  <h3 className="text-sm sm:text-base font-medium text-foreground mb-0.5 sm:mb-1">
                    <span className="sm:hidden">{tool.shortTitle}</span>
                    <span className="hidden sm:inline">{tool.title}</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px] text-center">
                {tool.tooltip}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </section>
    </TooltipProvider>
  );
});
