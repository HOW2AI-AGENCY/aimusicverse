/**
 * CreatorToolsSection - Interactive cards for main creator tools
 * Voice Recording, Guitar, Lyrics, MIDI
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

interface CreatorToolsSectionProps {
  onRecordClick?: () => void;
  className?: string;
}

const TOOLS = [
  {
    id: 'voice',
    icon: Mic,
    title: 'Запись голоса',
    description: 'Запиши идею или мелодию голосом',
    gradient: 'from-red-500/20 to-orange-500/20',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    action: 'record',
  },
  {
    id: 'guitar',
    icon: Guitar,
    title: 'Гитара и аккорды',
    description: 'Играй — AI распознает аккорды',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    link: '/guitar-studio',
  },
  {
    id: 'lyrics',
    icon: FileText,
    title: 'Тексты песен',
    description: 'AI помощник для написания лирики',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    link: '/lyrics-studio',
  },
  {
    id: 'midi',
    icon: Music2,
    title: 'MIDI и ноты',
    description: 'Транскрибируй музыку в ноты',
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
    <section className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Инструменты для музыкантов
          </h2>
          <p className="text-xs text-muted-foreground">
            Записывай, играй, пиши — AI поможет на каждом шаге
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {TOOLS.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleToolClick(tool)}
            className={cn(
              'relative overflow-hidden rounded-xl p-3 sm:p-4 text-left',
              'bg-gradient-to-br border border-border/50',
              'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
              'transition-all duration-200 group',
              tool.gradient
            )}
          >
            {/* Icon */}
            <div className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3',
              'transition-transform duration-200 group-hover:scale-110',
              tool.iconBg
            )}>
              <tool.icon className={cn('w-5 h-5 sm:w-6 sm:h-6', tool.iconColor)} />
            </div>

            {/* Content */}
            <h3 className="text-sm sm:text-base font-medium text-foreground mb-0.5 sm:mb-1">
              {tool.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {tool.description}
            </p>

            {/* Arrow indicator */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
});
