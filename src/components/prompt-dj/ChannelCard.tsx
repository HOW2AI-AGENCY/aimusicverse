import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Music, Guitar, Heart, MessageSquare } from 'lucide-react';
import type { PromptChannel } from '@/hooks/usePromptDJ';
import { GENRE_PRESETS, INSTRUMENT_PRESETS, MOOD_PRESETS } from '@/lib/prompt-dj-presets';
import { cn } from '@/lib/utils';

interface ChannelCardProps {
  channel: PromptChannel;
  onUpdate: (updates: Partial<PromptChannel>) => void;
}

const CHANNEL_CONFIG = {
  genre: {
    label: 'Жанр',
    icon: Music,
    presets: GENRE_PRESETS,
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
  },
  instrument: {
    label: 'Инструменты',
    icon: Guitar,
    presets: INSTRUMENT_PRESETS,
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
  },
  mood: {
    label: 'Настроение',
    icon: Heart,
    presets: MOOD_PRESETS,
    color: 'from-pink-500/20 to-pink-600/10',
    borderColor: 'border-pink-500/30',
  },
  custom: {
    label: 'Свой текст',
    icon: MessageSquare,
    presets: [],
    color: 'from-green-500/20 to-green-600/10',
    borderColor: 'border-green-500/30',
  },
};

export function ChannelCard({ channel, onUpdate }: ChannelCardProps) {
  const config = CHANNEL_CONFIG[channel.type];
  const Icon = config.icon;

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300',
      channel.enabled ? config.borderColor : 'border-muted/50 opacity-60',
      'bg-gradient-to-br',
      channel.enabled ? config.color : 'from-muted/10 to-muted/5'
    )}>
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium text-sm">{config.label}</Label>
          </div>
          <Switch
            checked={channel.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
        </div>

        {/* Value selector */}
        {channel.type === 'custom' ? (
          <Input
            placeholder="Введите описание или скажите голосом..."
            value={channel.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            disabled={!channel.enabled}
            className="h-9 text-sm"
          />
        ) : (
          <Select
            value={channel.value}
            onValueChange={(value) => onUpdate({ value })}
            disabled={!channel.enabled}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Выберите..." />
            </SelectTrigger>
            <SelectContent>
              {config.presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Weight slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Вес</span>
            <span>{Math.round(channel.weight * 100)}%</span>
          </div>
          <Slider
            value={[channel.weight]}
            onValueChange={([weight]) => onUpdate({ weight })}
            min={0}
            max={2}
            step={0.1}
            disabled={!channel.enabled}
            className="w-full"
          />
        </div>

        {/* Deck assignment */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Дека</Label>
          <ToggleGroup
            type="single"
            value={channel.deck}
            onValueChange={(deck) => deck && onUpdate({ deck: deck as 'A' | 'B' | 'both' })}
            disabled={!channel.enabled}
            className="justify-start"
          >
            <ToggleGroupItem value="A" size="sm" className="h-7 px-3 text-xs">
              A
            </ToggleGroupItem>
            <ToggleGroupItem value="both" size="sm" className="h-7 px-3 text-xs">
              A+B
            </ToggleGroupItem>
            <ToggleGroupItem value="B" size="sm" className="h-7 px-3 text-xs">
              B
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
}
