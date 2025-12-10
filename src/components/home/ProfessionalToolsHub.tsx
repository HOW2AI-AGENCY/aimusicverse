import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { 
  Wand2, Guitar, Music2, Piano, Scissors, 
  FileMusic, Sparkles, Mic, Waves, Sliders
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

const professionalTools = [
  {
    id: 'creative-tools',
    title: 'Creative Tools',
    description: 'Chord Detection, Tab Editor, Melody Mixer',
    icon: Wand2,
    path: '/creative-tools',
    color: 'from-pink-500 via-purple-500 to-indigo-500',
    iconColor: 'text-pink-400',
    bgColor: 'bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10',
    borderColor: 'border-pink-500/20 hover:border-pink-500/40',
    features: ['Real-time Chords', 'Tab Editor', 'Melody Mixer'],
  },
  {
    id: 'stem-studio',
    title: 'Stem Studio',
    description: 'Профессиональное разделение и микширование',
    icon: Scissors,
    path: '/library?tab=stems',
    color: 'from-cyan-500 via-blue-500 to-indigo-500',
    iconColor: 'text-cyan-400',
    bgColor: 'bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10',
    borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
    features: ['Stem Separation', 'EQ & Effects', 'Mix Export'],
  },
  {
    id: 'midi-transcription',
    title: 'MIDI Transcription',
    description: 'Конвертация в MIDI и табулатуры',
    icon: FileMusic,
    path: '/library',
    color: 'from-green-500 via-emerald-500 to-teal-500',
    iconColor: 'text-green-400',
    bgColor: 'bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10',
    borderColor: 'border-green-500/20 hover:border-green-500/40',
    features: ['Audio → MIDI', 'Sheet Music', 'Guitar Tabs'],
  },
  {
    id: 'ai-analysis',
    title: 'AI Audio Analysis',
    description: 'Анализ BPM, Key, Genre, Mood',
    icon: Sparkles,
    path: '/library',
    color: 'from-amber-500 via-orange-500 to-red-500',
    iconColor: 'text-amber-400',
    bgColor: 'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10',
    borderColor: 'border-amber-500/20 hover:border-amber-500/40',
    features: ['BPM Detection', 'Key Finder', 'Mood Analysis'],
  },
];

export function ProfessionalToolsHub() {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const handleToolClick = (path: string) => {
    hapticFeedback?.('light');
    navigate(path);
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10">
            <Sliders className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Профессиональные инструменты</h2>
            <p className="text-sm text-muted-foreground">
              Полный набор для работы с музыкой
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="hidden sm:flex">
          Pro Tools
        </Badge>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {professionalTools.map((tool, index) => {
          const Icon = tool.icon;
          
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "group cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden border-2 touch-manipulation",
                  tool.borderColor,
                  tool.bgColor
                )}
                onClick={() => handleToolClick(tool.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <motion.div
                      className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        `bg-gradient-to-br ${tool.color}`,
                        "group-hover:scale-110 transition-transform"
                      )}
                      whileHover={{ rotate: 5 }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-base leading-tight">
                          {tool.title}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                        >
                          PRO
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {tool.description}
                      </p>

                      {/* Features Pills */}
                      <div className="flex flex-wrap gap-1">
                        {tool.features.map((feature) => (
                          <Badge
                            key={feature}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-5 font-normal"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hover shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* View All Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="outline"
          className="w-full h-auto py-3"
          onClick={() => {
            hapticFeedback?.('light');
            navigate('/professional-studio');
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Открыть профессиональную студию</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </Button>
      </motion.div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground text-center">
          Все инструменты включены в вашу подписку
        </p>
      </motion.div>
    </section>
  );
}
