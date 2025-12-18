/**
 * Project Template Selector - pre-configured project templates
 */
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Disc3, Album, Music, Headphones, Film, Radio, Sparkles } from 'lucide-react';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  trackCount: number;
  genre?: string;
  mood?: string;
  concept?: string;
  tags?: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'rock-album',
    name: 'Рок Альбом',
    description: '10 треков с гитарным звучанием',
    icon: <Album className="w-5 h-5" />,
    trackCount: 10,
    genre: 'Rock',
    mood: 'energetic, powerful',
    concept: 'Classic rock album with powerful guitar riffs and emotional ballads',
    tags: ['rock', 'guitar', 'drums', 'bass'],
  },
  {
    id: 'pop-ep',
    name: 'Pop EP',
    description: '5 хитовых треков',
    icon: <Disc3 className="w-5 h-5" />,
    trackCount: 5,
    genre: 'Pop',
    mood: 'upbeat, catchy',
    concept: 'Modern pop EP with catchy hooks and radio-friendly production',
    tags: ['pop', 'synth', 'vocals', 'catchy'],
  },
  {
    id: 'electronic-single',
    name: 'Electronic Single',
    description: '3 версии трека',
    icon: <Headphones className="w-5 h-5" />,
    trackCount: 3,
    genre: 'Electronic',
    mood: 'energetic, futuristic',
    concept: 'Electronic single with original, extended and radio edit versions',
    tags: ['electronic', 'edm', 'synth', 'bass'],
  },
  {
    id: 'indie-ep',
    name: 'Indie EP',
    description: '6 атмосферных треков',
    icon: <Music className="w-5 h-5" />,
    trackCount: 6,
    genre: 'Indie',
    mood: 'dreamy, atmospheric',
    concept: 'Atmospheric indie EP with acoustic elements and introspective lyrics',
    tags: ['indie', 'acoustic', 'atmospheric', 'dreamy'],
  },
  {
    id: 'soundtrack',
    name: 'Саундтрек',
    description: '8 кинематографичных композиций',
    icon: <Film className="w-5 h-5" />,
    trackCount: 8,
    genre: 'Cinematic',
    mood: 'epic, emotional',
    concept: 'Cinematic soundtrack with orchestral arrangements and emotional themes',
    tags: ['cinematic', 'orchestra', 'epic', 'emotional'],
  },
  {
    id: 'lofi-mixtape',
    name: 'Lo-Fi Микстейп',
    description: '12 чилл-треков',
    icon: <Radio className="w-5 h-5" />,
    trackCount: 12,
    genre: 'Lo-Fi',
    mood: 'chill, relaxed',
    concept: 'Relaxing lo-fi beats perfect for studying and concentration',
    tags: ['lofi', 'chill', 'beats', 'ambient'],
  },
];

interface ProjectTemplateSelectorProps {
  onSelect: (template: ProjectTemplate) => void;
  selectedId?: string;
  className?: string;
}

export function ProjectTemplateSelector({ 
  onSelect, 
  selectedId,
  className 
}: ProjectTemplateSelectorProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {PROJECT_TEMPLATES.map((template, index) => (
        <motion.button
          key={template.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(template)}
          className={cn(
            'relative p-3 rounded-xl text-left transition-all',
            'border bg-card hover:bg-accent/50',
            selectedId === template.id 
              ? 'border-primary ring-2 ring-primary/20' 
              : 'border-border/50 hover:border-primary/30'
          )}
        >
          <div className="flex items-start gap-2.5">
            <div className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
              selectedId === template.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-primary/10 text-primary'
            )}>
              {template.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{template.name}</h4>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {template.description}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                  {template.trackCount} треков
                </span>
                {template.genre && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {template.genre}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {selectedId === template.id && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
            >
              <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
