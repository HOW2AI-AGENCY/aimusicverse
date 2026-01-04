/**
 * SmartSuggestions - Context-aware AI suggestions for PromptDJ
 * Shows tips based on current settings and musical knowledge
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Lightbulb, X, Sparkles, Music, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PromptChannel, GlobalSettings } from '@/hooks/usePromptDJEnhanced';

interface SmartSuggestionsProps {
  channels: PromptChannel[];
  globalSettings: GlobalSettings;
  onApplySuggestion: (suggestion: Suggestion) => void;
  onDismiss: (id: string) => void;
  dismissedIds: Set<string>;
  className?: string;
}

interface Suggestion {
  id: string;
  type: 'tip' | 'enhance' | 'fix';
  icon: React.ReactNode;
  text: string;
  action?: {
    label: string;
    channelType?: string;
    value?: string;
    setting?: Partial<GlobalSettings>;
  };
}

// Musical knowledge base for suggestions
const SUGGESTIONS_RULES: Array<{
  condition: (channels: PromptChannel[], settings: GlobalSettings) => boolean;
  generate: (channels: PromptChannel[], settings: GlobalSettings) => Suggestion;
}> = [
  // Add bass for depth
  {
    condition: (channels, settings) => {
      const hasBass = channels.some(c => 
        c.enabled && c.value?.toLowerCase().includes('bass')
      );
      const hasHighEnergy = channels.some(c => 
        c.type === 'energy' && c.enabled && 
        (c.value?.toLowerCase().includes('high') || c.weight > 0.7)
      );
      return !hasBass && hasHighEnergy;
    },
    generate: () => ({
      id: 'add-bass',
      type: 'enhance',
      icon: <Music className="w-3.5 h-3.5" />,
      text: 'Добавьте бас для глубины и драйва',
      action: {
        label: 'Добавить',
        channelType: 'instrument',
        value: 'Bass',
      },
    }),
  },
  
  // Suggest tempo for dance music
  {
    condition: (channels, settings) => {
      const hasEDM = channels.some(c => 
        c.enabled && ['edm', 'house', 'techno', 'dance'].some(g => 
          c.value?.toLowerCase().includes(g)
        )
      );
      return hasEDM && (settings.bpm < 118 || settings.bpm > 132);
    },
    generate: (_, settings) => ({
      id: 'dance-bpm',
      type: 'tip',
      icon: <Zap className="w-3.5 h-3.5" />,
      text: settings.bpm < 118 
        ? 'Для танцевальной музыки рекомендуется 120-128 BPM'
        : 'Высокий BPM может звучать слишком быстро для EDM',
      action: {
        label: '124 BPM',
        setting: { bpm: 124 },
      },
    }),
  },
  
  // Lo-Fi suggestions
  {
    condition: (channels, settings) => {
      const hasLoFi = channels.some(c => 
        c.enabled && c.value?.toLowerCase().includes('lo-fi')
      );
      return hasLoFi && settings.bpm > 95;
    },
    generate: () => ({
      id: 'lofi-bpm',
      type: 'tip',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      text: 'Lo-Fi обычно звучит лучше на 70-90 BPM',
      action: {
        label: '85 BPM',
        setting: { bpm: 85 },
      },
    }),
  },
  
  // Cinematic suggestions
  {
    condition: (channels, settings) => {
      const hasCinematic = channels.some(c => 
        c.enabled && ['cinematic', 'epic', 'orchestral', 'film'].some(g => 
          c.value?.toLowerCase().includes(g)
        )
      );
      const hasStrings = channels.some(c => 
        c.enabled && c.value?.toLowerCase().includes('strings')
      );
      return hasCinematic && !hasStrings;
    },
    generate: () => ({
      id: 'cinematic-strings',
      type: 'enhance',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      text: 'Струнные добавят эпичности',
      action: {
        label: 'Добавить',
        channelType: 'instrument',
        value: 'Strings',
      },
    }),
  },
  
  // Empty mood warning
  {
    condition: (channels, _settings) => {
      const moodChannel = channels.find(c => c.type === 'mood');
      const hasAnyEnabled = channels.some(c => c.enabled && c.value);
      return Boolean(hasAnyEnabled && moodChannel && !moodChannel.value);
    },
    generate: () => ({
      id: 'add-mood',
      type: 'fix',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      text: 'Укажите настроение для лучшего результата',
      action: {
        label: 'Dreamy',
        channelType: 'mood',
        value: 'Dreamy',
      },
    }),
  },
  
  // Sparse density with high energy conflict
  {
    condition: (channels, settings) => {
      const hasHighEnergy = channels.some(c => 
        c.type === 'energy' && c.enabled && 
        (c.value?.toLowerCase().includes('high') || 
         c.value?.toLowerCase().includes('intense') ||
         c.weight > 0.8)
      );
      return hasHighEnergy && settings.density < 0.3;
    },
    generate: () => ({
      id: 'density-energy-conflict',
      type: 'tip',
      icon: <Zap className="w-3.5 h-3.5" />,
      text: 'Увеличьте плотность для высокой энергии',
      action: {
        label: 'Увеличить',
        setting: { density: 0.7 },
      },
    }),
  },
  
  // Minor key for dark mood
  {
    condition: (channels, settings) => {
      const hasDarkMood = channels.some(c => 
        c.type === 'mood' && c.enabled && 
        ['dark', 'sad', 'melancholic', 'mysterious'].some(m => 
          c.value?.toLowerCase().includes(m)
        )
      );
      return hasDarkMood && settings.scale === 'major';
    },
    generate: () => ({
      id: 'dark-minor',
      type: 'tip',
      icon: <Music className="w-3.5 h-3.5" />,
      text: 'Минорная гамма подчеркнёт тёмное настроение',
      action: {
        label: 'Минор',
        setting: { scale: 'minor' },
      },
    }),
  },
];

export const SmartSuggestions = memo(function SmartSuggestions({
  channels,
  globalSettings,
  onApplySuggestion,
  onDismiss,
  dismissedIds,
  className,
}: SmartSuggestionsProps) {
  // Generate applicable suggestions
  const suggestions = useMemo(() => {
    const results: Suggestion[] = [];
    
    for (const rule of SUGGESTIONS_RULES) {
      if (rule.condition(channels, globalSettings)) {
        const suggestion = rule.generate(channels, globalSettings);
        if (!dismissedIds.has(suggestion.id)) {
          results.push(suggestion);
        }
      }
    }
    
    // Limit to 2 suggestions max
    return results.slice(0, 2);
  }, [channels, globalSettings, dismissedIds]);
  
  if (suggestions.length === 0) return null;
  
  return (
    <div className={cn('space-y-1.5', className)}>
      <AnimatePresence mode="popLayout">
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg text-xs',
              suggestion.type === 'tip' && 'bg-blue-500/10 border border-blue-500/20',
              suggestion.type === 'enhance' && 'bg-purple-500/10 border border-purple-500/20',
              suggestion.type === 'fix' && 'bg-amber-500/10 border border-amber-500/20',
            )}
          >
            <div className={cn(
              'shrink-0',
              suggestion.type === 'tip' && 'text-blue-400',
              suggestion.type === 'enhance' && 'text-purple-400',
              suggestion.type === 'fix' && 'text-amber-400',
            )}>
              {suggestion.icon}
            </div>
            
            <span className="flex-1 text-muted-foreground">
              {suggestion.text}
            </span>
            
            {suggestion.action && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] shrink-0"
                onClick={() => onApplySuggestion(suggestion)}
              >
                {suggestion.action.label}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 opacity-50 hover:opacity-100"
              onClick={() => onDismiss(suggestion.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
