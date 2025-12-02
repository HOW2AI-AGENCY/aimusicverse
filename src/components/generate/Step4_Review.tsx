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
    <div>
      <h2 className="text-xl font-bold mb-4">Проверьте и создайте</h2>
      <Card>
        <CardHeader>
          <CardTitle>{info?.title || "Без названия"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Стиль:</h3>
            <div className="flex flex-wrap gap-2">
              {style?.genres?.map((g: string) => (
                <Badge key={g}>{g}</Badge>
              ))}
              {style?.moods?.map((m: string) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Текст:</h3>
            <pre className="text-xs bg-muted p-2 rounded-md max-h-40 overflow-y-auto">
              {info?.lyrics || "Нет текста"}
            </pre>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Назад
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Сгенерировать
        </Button>
      </div>
    </div>
  );
};
