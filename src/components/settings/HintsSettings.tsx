/**
 * Hints Settings Component
 *
 * Управление системой контекстных подсказок
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useContextualHints, CONTEXTUAL_HINTS } from "@/hooks/useContextualHints";
import { Lightbulb, RotateCcw, Eye, EyeOff, Sparkles, Timer, Target } from "@/lib/icons";
import { toast } from "sonner";
import { motion } from "@/lib/motion";
import { hintColors } from "@/lib/design-colors";

const categoryLabels = {
  model: "Модели AI",
  "ai-feature": "AI Функции",
  project: "Проекты",
  artist: "AI Артисты",
  social: "Социальные",
  advanced: "Продвинутые",
  tip: "Советы",
};

const categoryColors = hintColors;

export function HintsSettings() {
  const { availableHints, visitCount, resetAllHints, canShowHint, getNextHint } = useContextualHints();

  const handleReset = () => {
    if (confirm("Вы уверены? Все подсказки будут сброшены и начнут показываться снова.")) {
      resetAllHints();
      toast.success("Подсказки сброшены", {
        description: "Теперь вы снова увидите все подсказки",
      });
    }
  };

  const handleTestNext = () => {
    const next = getNextHint();
    if (next) {
      toast.info("Следующая подсказка", {
        description: next.title,
        duration: 4000,
      });
    } else {
      toast.info("Нет доступных подсказок", {
        description: "Все подсказки уже показаны или недоступны на текущей странице",
      });
    }
  };

  const groupedHints = CONTEXTUAL_HINTS.reduce(
    (acc, hint) => {
      if (!acc[hint.category]) {
        acc[hint.category] = [];
      }
      acc[hint.category].push(hint);
      return acc;
    },
    {} as Record<string, typeof CONTEXTUAL_HINTS>,
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Система подсказок
          </CardTitle>
          <CardDescription>Контекстные подсказки помогают изучать возможности платформы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{visitCount}</div>
              <div className="text-xs text-muted-foreground">Посещений</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{availableHints.length}</div>
              <div className="text-xs text-muted-foreground">Доступно подсказок</div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestNext} className="flex-1 gap-2">
              <Eye className="w-4 h-4" />
              Посмотреть следующую
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1 gap-2">
              <RotateCcw className="w-4 h-4" />
              Сбросить все
            </Button>
          </div>

          <Separator />

          {/* Hints by Category */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Все подсказки ({CONTEXTUAL_HINTS.length})
            </h4>

            {Object.entries(groupedHints).map(([category, hints]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={categoryColors[category as keyof typeof categoryColors]}>
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {hints.length} {hints.length === 1 ? "подсказка" : "подсказок"}
                  </span>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  {hints.map((hint) => {
                    const isAvailable = canShowHint(hint);
                    return (
                      <div key={hint.id} className="flex items-start gap-2 text-sm">
                        {isAvailable ? (
                          <Eye className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs leading-relaxed">{hint.title}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed">{hint.description}</div>
                          {hint.action && <div className="text-xs text-primary/70 mt-1">→ {hint.action.label}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <Lightbulb className="inline w-3.5 h-3.5 mr-1 align-text-bottom" aria-hidden /> Подсказки показываются
              автоматически на соответствующих страницах
            </p>
            <p>
              <Timer className="inline w-3.5 h-3.5 mr-1 align-text-bottom" aria-hidden /> Между показами соблюдается
              интервал (cooldown)
            </p>
            <p>
              <Target className="inline w-3.5 h-3.5 mr-1 align-text-bottom" aria-hidden /> Приоритетные подсказки
              показываются первыми
            </p>
            <p>
              <Eye className="inline w-3.5 h-3.5 mr-1 align-text-bottom" aria-hidden /> Зелёная иконка = подсказка
              готова к показу
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
