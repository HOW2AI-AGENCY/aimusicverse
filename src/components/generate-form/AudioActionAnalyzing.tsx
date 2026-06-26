import { Sparkles } from "@/lib/icons";
import { Progress } from "@/components/ui/progress";

const ANALYSIS_STEPS = [
  "Загружаем аудио...",
  "Анализируем стиль...",
  "Определяем жанр и настроение...",
  "Завершаем анализ...",
];

interface AudioActionAnalyzingProps {
  analysisStep: number;
  analysisProgress: number;
}

export function AudioActionAnalyzing({ analysisStep, analysisProgress }: AudioActionAnalyzingProps) {
  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-center">
        <div className="relative">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 px-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{ANALYSIS_STEPS[analysisStep]}</span>
          <span className="text-primary font-medium">{Math.round(analysisProgress)}%</span>
        </div>
        <Progress value={analysisProgress} className="h-2" />
      </div>

      <p className="text-xs text-center text-muted-foreground">Это может занять 10-30 секунд</p>
    </div>
  );
}
