import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Music2, Wand2, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

const MIDI_MODELS = [
  {
    id: 'bytedance-piano',
    name: 'Piano HD',
    description: 'Высокоточная транскрипция пианино с педалями',
    badge: 'NEW',
    speed: 'Средний',
  },
  {
    id: 'mt3',
    name: 'Omnizart',
    description: 'Мультиинструментальная транскрипция (барабаны, бас, гитара)',
    badge: 'Рекомендуется',
    speed: 'Средний',
  },
  {
    id: 'drums',
    name: 'Drums',
    description: 'Специализация на барабанах и перкуссии',
    badge: 'NEW',
    speed: 'Быстрый',
  },
  {
    id: 'vocal',
    name: 'Vocal',
    description: 'Транскрипция вокальной мелодии',
    badge: 'NEW',
    speed: 'Быстрый',
  },
  {
    id: 'ismir2021',
    name: 'Piano',
    description: 'Специализированная транскрипция пианино',
    badge: null,
    speed: 'Средний',
  },
  {
    id: 'basic-pitch',
    name: 'Basic Pitch',
    description: 'Универсальная мелодическая транскрипция',
    badge: null,
    speed: 'Быстрый',
  },
];

export function MidiSettingsSection() {
  const { settings, updateSettings, isUpdating } = useNotificationSettings();
  
  const autoMidiEnabled = settings?.auto_midi_enabled ?? false;
  const autoMidiModel = settings?.auto_midi_model ?? 'basic-pitch';
  const autoMidiStemsOnly = settings?.auto_midi_stems_only ?? false;
  
  const selectedModel = MIDI_MODELS.find(m => m.id === autoMidiModel) || MIDI_MODELS[0];

  const handleToggleAutoMidi = (enabled: boolean) => {
    updateSettings({ auto_midi_enabled: enabled });
  };

  const handleChangeModel = (model: string) => {
    updateSettings({ auto_midi_model: model });
  };

  const handleToggleStemsOnly = (stemsOnly: boolean) => {
    updateSettings({ auto_midi_stems_only: stemsOnly });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="w-5 h-5" />
          MIDI транскрипция
          <Badge variant="secondary" className="ml-2">Новое</Badge>
        </CardTitle>
        <CardDescription>
          Автоматическое создание MIDI нот из треков
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto MIDI Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Автоматическая транскрипция
            </Label>
            <p className="text-sm text-muted-foreground">
              Создавать MIDI после каждой генерации трека
            </p>
          </div>
          <Switch
            checked={autoMidiEnabled}
            onCheckedChange={handleToggleAutoMidi}
            disabled={isUpdating}
          />
        </div>

        {autoMidiEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            <Separator />

            {/* Model Selection */}
            <div className="space-y-3">
              <Label className="text-base">Модель транскрипции</Label>
              <Select
                value={autoMidiModel}
                onValueChange={handleChangeModel}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите модель" />
                </SelectTrigger>
                <SelectContent>
                  {MIDI_MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.badge && (
                          <Badge variant="outline" className="text-xs">
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {selectedModel.description}
              </p>
            </div>

            <Separator />

            {/* Stems Only Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Только для стемов</Label>
                <p className="text-sm text-muted-foreground">
                  Транскрибировать только после разделения на стемы
                </p>
              </div>
              <Switch
                checked={autoMidiStemsOnly}
                onCheckedChange={handleToggleStemsOnly}
                disabled={isUpdating}
              />
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">О транскрипции</p>
                <p>
                  MIDI файлы позволяют редактировать ноты в любом DAW (FL Studio, 
                  Ableton, Logic Pro). Транскрипция занимает 30-60 секунд.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
