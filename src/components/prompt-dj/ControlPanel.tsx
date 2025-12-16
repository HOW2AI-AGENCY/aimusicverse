import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { KEY_OPTIONS, SCALE_OPTIONS, DURATION_OPTIONS } from '@/lib/prompt-dj-presets';
import type { GlobalSettings } from '@/hooks/usePromptDJ';

interface ControlPanelProps {
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
}

export function ControlPanel({ settings, onUpdate }: ControlPanelProps) {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="p-4 space-y-4">
        {/* BPM */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">BPM</Label>
            <span className="text-sm font-mono text-muted-foreground">{settings.bpm}</span>
          </div>
          <Slider
            value={[settings.bpm]}
            onValueChange={([bpm]) => onUpdate({ bpm })}
            min={60}
            max={180}
            step={1}
          />
        </div>

        {/* Key & Scale */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Тональность</Label>
            <Select
              value={settings.key}
              onValueChange={(key) => onUpdate({ key })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEY_OPTIONS.map((key) => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Лад</Label>
            <Select
              value={settings.scale}
              onValueChange={(scale) => onUpdate({ scale })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALE_OPTIONS.map((scale) => (
                  <SelectItem key={scale.id} value={scale.id}>{scale.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Density */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Плотность</Label>
            <span className="text-xs text-muted-foreground">
              {settings.density < 0.3 ? 'Разреженно' : 
               settings.density > 0.7 ? 'Насыщенно' : 'Средне'}
            </span>
          </div>
          <Slider
            value={[settings.density]}
            onValueChange={([density]) => onUpdate({ density })}
            min={0}
            max={1}
            step={0.05}
          />
        </div>

        {/* Brightness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Яркость</Label>
            <span className="text-xs text-muted-foreground">
              {settings.brightness < 0.3 ? 'Тёплый' : 
               settings.brightness > 0.7 ? 'Яркий' : 'Нейтральный'}
            </span>
          </div>
          <Slider
            value={[settings.brightness]}
            onValueChange={([brightness]) => onUpdate({ brightness })}
            min={0}
            max={1}
            step={0.05}
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Длительность</Label>
          <ToggleGroup
            type="single"
            value={String(settings.duration)}
            onValueChange={(val) => val && onUpdate({ duration: Number(val) })}
            className="justify-start"
          >
            {DURATION_OPTIONS.map((opt) => (
              <ToggleGroupItem 
                key={opt.value} 
                value={String(opt.value)} 
                size="sm"
                className="h-8 px-3"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
}
