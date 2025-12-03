import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Music, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGenerate } from '@/hooks/useGenerate';

interface SimpleModeProps {
  onBack: () => void;
}

const EXAMPLES = [
  'Энергичный поп-трек о летнем приключении',
  'Спокойный джаз для вечернего отдыха',
  'Рок-баллада с мощными гитарами',
  'Электронная музыка с глубоким басом',
  'Романтическая песня о любви',
];

export const SimpleMode = ({ onBack }: SimpleModeProps) => {
  const [prompt, setPrompt] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  
  const { mutate: generate, isPending } = useGenerate();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    generate({
      mode: 'simple',
      prompt: prompt.trim(),
      instrumental,
    }, {
      onSuccess: () => {
        setPrompt('');
        onBack();
      },
    });
  };

  const handleExample = (example: string) => {
    setPrompt(example);
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
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Music className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Простой режим</h2>
            <p className="text-sm text-muted-foreground">
              Опишите желаемую музыку одной фразой
            </p>
          </div>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-2">
            <Label htmlFor="prompt">Описание трека</Label>
            <Textarea
              id="prompt"
              placeholder="Например: Энергичный поп-трек о летнем приключении с женским вокалом"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Чем детальнее описание, тем лучше результат
            </p>
          </div>

          {/* Examples */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Примеры:</Label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-3"
                  onClick={() => handleExample(example)}
                  disabled={isPending}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          {/* Instrumental Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="instrumental">Инструментал</Label>
              <p className="text-xs text-muted-foreground">
                Без вокала
              </p>
            </div>
            <Switch
              id="instrumental"
              checked={instrumental}
              onCheckedChange={setInstrumental}
              disabled={isPending}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isPending}
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
