import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FormData {
  mode?: "generate" | "extend" | "cover";
  info?: {
    title?: string;
    style?: string;
    tags?: string;
    lyrics?: string;
  };
  style?: {
    genres?: string[];
    moods?: string[];
    tags?: string;
  };
}

interface Step4ReviewProps {
  formData: FormData;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const Step4Review = ({ formData, onBack, onSubmit, isLoading }: Step4ReviewProps) => {
  const { info, style } = formData;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
          Проверьте и создайте
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Убедитесь, что все данные верны перед генерацией</p>
      </div>
      <Card className="glass-card border-primary/20">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">{info?.title || "Без названия"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2">Стиль:</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {style?.genres?.map((g: string) => (
                <Badge key={g} className="text-xs">{g}</Badge>
              ))}
              {style?.moods?.map((m: string) => (
                <Badge key={m} variant="secondary" className="text-xs">
                  {m}
                </Badge>
              ))}
              {(!style?.genres?.length && !style?.moods?.length) && (
                <span className="text-xs text-muted-foreground">Не указано</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold mb-2">Текст:</h3>
            <pre className="text-[10px] sm:text-xs bg-muted/50 p-2.5 sm:p-3 rounded-md max-h-32 sm:max-h-40 overflow-y-auto font-mono">
              {info?.lyrics || "Нет текста"}
            </pre>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between pt-3 sm:pt-4 border-t border-border/50 gap-3">
        <Button 
          variant="outline" 
          onClick={onBack} 
          disabled={isLoading}
          size="lg"
          className="flex-1 sm:flex-initial min-h-[48px] touch-manipulation active:scale-95 transition-transform"
        >
          Назад
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isLoading}
          size="lg"
          className="flex-1 sm:flex-initial min-h-[48px] touch-manipulation active:scale-95 transition-transform gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Сгенерировать
        </Button>
      </div>
    </div>
  );
};
