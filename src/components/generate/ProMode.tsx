import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGenerate } from '@/hooks/useGenerate';

interface ProModeProps {
  onBack: () => void;
}

const MODELS = [
  { id: 'V4_5ALL', name: 'V4.5 (Рекомендуется)' },
  { id: 'V4', name: 'V4' },
  { id: 'V3_5', name: 'V3.5' },
];

export const ProMode = ({ onBack }: ProModeProps) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [negativeTags, setNegativeTags] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [vocalGender, setVocalGender] = useState<'male' | 'female' | ''>('');
  const [styleWeight, setStyleWeight] = useState([50]);
  const [model, setModel] = useState('V4_5ALL');

  const { mutate: generate, isPending } = useGenerate();

  const handleGenerate = () => {
    if (!prompt.trim() || !style.trim()) return;

    generate({
      mode: 'custom',
      prompt: prompt.trim(),
      title: title.trim() || undefined,
      style: style.trim(),
      negativeTags: negativeTags.trim() || undefined,
      instrumental,
      vocalGender: vocalGender || undefined,
      styleWeight: styleWeight[0],
      model,
    }, {
      onSuccess: () => {
        setPrompt('');
        setStyle('');
        setTitle('');
        setNegativeTags('');
        onBack();
      },
    });
  };

  return (
    <motion.div
      className="p-3 sm:p-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 sm:mb-6 min-h-[44px] touch-manipulation hover:bg-muted active:scale-95 transition-all"
        aria-label="Вернуться к выбору режима"
        disabled={isPending}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к выбору режима
      </Button>

      <Card className="p-6 sm:p-8 space-y-6">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Star className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Профи режим</h2>
            <p className="text-sm text-muted-foreground">
              Полный контроль над параметрами генерации
            </p>
          </div>
        </motion.div>

        <motion.div
          className="space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Название трека (опционально)</Label>
            <Input
              id="title"
              placeholder="Название вашего трека"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Style - Required */}
          <div className="space-y-2">
            <Label htmlFor="style" className="text-destructive-foreground">
              Стиль <span className="text-destructive">*</span>
            </Label>
            <Input
              id="style"
              placeholder="Pop, Rock, Electronic, Jazz..."
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Укажите жанр и стилистические особенности
            </p>
          </div>

          {/* Prompt/Lyrics - Required */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Текст / Описание <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="prompt"
              placeholder={instrumental ? "Опишите инструментальную композицию..." : "Введите текст песни или описание..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {instrumental ? 'Опишите желаемое звучание' : 'Текст песни или подробное описание'}
            </p>
          </div>

          {/* Negative Tags */}
          <div className="space-y-2">
            <Label htmlFor="negativeTags">Исключить (опционально)</Label>
            <Input
              id="negativeTags"
              placeholder="autotune, distortion, noise..."
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Теги через запятую, которые нужно исключить
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Модель</Label>
            <Select value={model} onValueChange={setModel} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instrumental Toggle */}
          <div className="flex items-center justify-between py-2 border-t pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="instrumental">Инструментал</Label>
              <p className="text-xs text-muted-foreground">Без вокала</p>
            </div>
            <Switch
              id="instrumental"
              checked={instrumental}
              onCheckedChange={setInstrumental}
              disabled={isPending}
            />
          </div>

          {/* Vocal Gender - Only if not instrumental */}
          {!instrumental && (
            <div className="space-y-2">
              <Label>Тип вокала</Label>
              <Select 
                value={vocalGender} 
                onValueChange={(v) => setVocalGender(v as 'male' | 'female' | '')}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Авто" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Авто</SelectItem>
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Style Weight Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Влияние стиля</Label>
              <span className="text-sm text-muted-foreground">{styleWeight[0]}%</span>
            </div>
            <Slider
              value={styleWeight}
              onValueChange={setStyleWeight}
              min={0}
              max={100}
              step={5}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Насколько сильно стиль влияет на результат
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || !style.trim() || isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Создать трек
              </>
            )}
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
};
