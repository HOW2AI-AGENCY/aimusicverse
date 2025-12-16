import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import type { PromptChannel, GlobalSettings } from '@/hooks/usePromptDJ';

interface QuickPreset {
  id: string;
  name: string;
  emoji: string;
  channels: Partial<Record<string, { value: string; weight: number; enabled: boolean }>>;
  settings?: Partial<GlobalSettings>;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'chill-lofi',
    name: 'Chill Lo-Fi',
    emoji: '🌙',
    channels: {
      genre: { value: 'lofi', weight: 1.5, enabled: true },
      instrument: { value: 'piano', weight: 1, enabled: true },
      mood: { value: 'melancholic', weight: 1.2, enabled: true },
    },
    settings: { bpm: 75, key: 'C', scale: 'minor', density: 0.4, brightness: 0.3 },
  },
  {
    id: 'edm-banger',
    name: 'EDM Banger',
    emoji: '🔥',
    channels: {
      genre: { value: 'edm', weight: 1.5, enabled: true },
      instrument: { value: 'synth', weight: 1.2, enabled: true },
      mood: { value: 'energetic', weight: 1.5, enabled: true },
    },
    settings: { bpm: 128, key: 'F', scale: 'minor', density: 0.8, brightness: 0.7 },
  },
  {
    id: 'trap-dark',
    name: 'Dark Trap',
    emoji: '🖤',
    channels: {
      genre: { value: 'trap', weight: 1.5, enabled: true },
      instrument: { value: 'bass', weight: 1.3, enabled: true },
      mood: { value: 'dark', weight: 1.4, enabled: true },
    },
    settings: { bpm: 140, key: 'G', scale: 'minor', density: 0.6, brightness: 0.4 },
  },
  {
    id: 'pop-uplifting',
    name: 'Pop Uplifting',
    emoji: '✨',
    channels: {
      genre: { value: 'pop', weight: 1.3, enabled: true },
      instrument: { value: 'guitar', weight: 1, enabled: true },
      mood: { value: 'uplifting', weight: 1.5, enabled: true },
    },
    settings: { bpm: 115, key: 'C', scale: 'major', density: 0.6, brightness: 0.6 },
  },
  {
    id: 'synthwave-retro',
    name: 'Synthwave',
    emoji: '🌆',
    channels: {
      genre: { value: 'synthwave', weight: 1.5, enabled: true },
      instrument: { value: 'synth', weight: 1.4, enabled: true },
      mood: { value: 'nostalgic', weight: 1.2, enabled: true },
    },
    settings: { bpm: 100, key: 'A', scale: 'minor', density: 0.5, brightness: 0.6 },
  },
  {
    id: 'ambient-space',
    name: 'Space Ambient',
    emoji: '🌌',
    channels: {
      genre: { value: 'ambient', weight: 1.5, enabled: true },
      instrument: { value: 'pad', weight: 1.3, enabled: true },
      mood: { value: 'dreamy', weight: 1.4, enabled: true },
    },
    settings: { bpm: 70, key: 'D', scale: 'minor', density: 0.3, brightness: 0.4 },
  },
  {
    id: 'funk-groove',
    name: 'Funky Groove',
    emoji: '🕺',
    channels: {
      genre: { value: 'funk', weight: 1.5, enabled: true },
      instrument: { value: 'bass', weight: 1.3, enabled: true },
      mood: { value: 'groovy', weight: 1.4, enabled: true },
    },
    settings: { bpm: 110, key: 'E', scale: 'minor', density: 0.7, brightness: 0.5 },
  },
  {
    id: 'cinematic-epic',
    name: 'Epic Cinematic',
    emoji: '🎬',
    channels: {
      genre: { value: 'cinematic', weight: 1.5, enabled: true },
      instrument: { value: 'orchestra', weight: 1.4, enabled: true },
      mood: { value: 'epic', weight: 1.5, enabled: true },
    },
    settings: { bpm: 90, key: 'D', scale: 'minor', density: 0.6, brightness: 0.5 },
  },
];

interface QuickPresetsProps {
  onApply: (
    channelUpdates: Array<{ id: string; updates: Partial<PromptChannel> }>,
    settingsUpdates?: Partial<GlobalSettings>
  ) => void;
  disabled?: boolean;
}

export function QuickPresets({ onApply, disabled }: QuickPresetsProps) {
  const handlePresetClick = (preset: QuickPreset) => {
    const channelUpdates = Object.entries(preset.channels).map(([id, updates]) => ({
      id,
      updates: updates as Partial<PromptChannel>,
    }));

    onApply(channelUpdates, preset.settings);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>Быстрые пресеты</span>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {QUICK_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => handlePresetClick(preset)}
              className="shrink-0 h-8 px-3 text-xs gap-1.5"
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
