import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Languages, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface AIOption {
  title: string;
  value: string;
  explanation: string;
  tone: string;
}

interface AIActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  field?: string;
  onApply: (updates: Record<string, string | number | boolean | null>) => void;
}

export function AIActionsDialog({ open, onOpenChange, projectId, field, onApply }: AIActionsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<AIOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [mode, setMode] = useState<"menu" | "options" | "translate">("menu");

  const handleGetOptions = async () => {
    if (!field) return;

    setIsLoading(true);
    setMode("options");

    try {
      const { data, error } = await supabase.functions.invoke("project-ai-actions", {
        body: {
          action: "improve_options",
          projectId,
          field,
        },
      });

      if (error) throw error;

      setOptions(data.result.options || []);
    } catch (error) {
      logger.error("Error getting AI options", error);
      toast.error("Ошибка получения вариантов улучшений");
      setMode("menu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyOption = async () => {
    if (selectedOption === null || !field) return;

    const option = options[selectedOption];
    setIsLoading(true);

    try {
      onApply({ [field]: option.value });
      toast.success("Улучшение применено");
      onOpenChange(false);
      resetState();
    } catch (error) {
      logger.error("Error applying option", error);
      toast.error("Ошибка применения улучшения");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (language: "en" | "ru") => {
    setIsLoading(true);
    setMode("translate");

    try {
      const { data, error } = await supabase.functions.invoke("project-ai-actions", {
        body: {
          action: "translate",
          projectId,
          language,
        },
      });

      if (error) throw error;

      onApply(data.result);
      toast.success(`Проект переведен на ${language === "en" ? "английский" : "русский"}`);
      onOpenChange(false);
      resetState();
    } catch (error) {
      logger.error("Error translating", error);
      toast.error("Ошибка перевода");
      setMode("menu");
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setMode("menu");
    setOptions([]);
    setSelectedOption(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Actions
          </DialogTitle>
        </DialogHeader>

        {mode === "menu" && (
          <div className="space-y-4">
            {!field && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Перевод проекта
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleTranslate("en")}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    🇬🇧 На английский
                  </Button>
                  <Button
                    onClick={() => handleTranslate("ru")}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    🇷🇺 На русский
                  </Button>
                </div>
              </div>
            )}

            {field && (
              <div>
                <h3 className="font-semibold mb-2">Улучшить поле: {field}</h3>
                <Button onClick={handleGetOptions} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Генерация вариантов...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Получить варианты улучшений
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === "options" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setMode("menu")} className="mb-2">
              ← Назад
            </Button>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedOption === index
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedOption(index)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{option.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {option.tone}
                          </Badge>
                        </div>
                        {selectedOption === index && <Check className="w-5 h-5 text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{option.explanation}</p>
                      <div className="text-sm bg-muted p-2 rounded">{option.value}</div>
                    </div>
                  ))}
                </div>

                <Button onClick={handleApplyOption} disabled={selectedOption === null || isLoading} className="w-full">
                  Применить выбранный вариант
                </Button>
              </>
            )}
          </div>
        )}

        {mode === "translate" && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Перевод проекта...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
