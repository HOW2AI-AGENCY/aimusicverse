import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Loader2, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface UploadCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const UploadCoverDialog = ({ open, onOpenChange, projectId }: UploadCoverDialogProps) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [customMode, setCustomMode] = useState(true);
  const [instrumental, setInstrumental] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("V4_5ALL");
  const [negativeTags, setNegativeTags] = useState("");
  const [vocalGender, setVocalGender] = useState<"m" | "f" | undefined>();
  const [styleWeight, setStyleWeight] = useState(0.65);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.65);
  const [audioWeight, setAudioWeight] = useState(0.65);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('audio')) {
        toast.error('Пожалуйста, выберите аудио файл');
        return;
      }
      setAudioFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      toast.error('Выберите аудио файл');
      return;
    }

    if (customMode) {
      if (!style) {
        toast.error('Укажите стиль музыки');
        return;
      }
      if (!instrumental && !prompt) {
        toast.error('Укажите текст для вокальной композиции');
        return;
      }
    } else {
      if (!prompt) {
        toast.error('Укажите описание');
        return;
      }
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      
      reader.onload = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('suno-upload-cover', {
            body: {
              audioFile: {
                name: audioFile.name,
                type: audioFile.type,
                data: reader.result,
              },
              customMode,
              instrumental,
              prompt: prompt || undefined,
              style: customMode ? style : undefined,
              title: customMode ? title : undefined,
              model,
              negativeTags: negativeTags || undefined,
              vocalGender,
              styleWeight,
              weirdnessConstraint,
              audioWeight,
              projectId,
            },
          });

          if (error) throw error;

          if (data.code === 429) {
            toast.error('Недостаточно кредитов на SunoAPI');
            return;
          }

          if (data.code === 430) {
            toast.error('Слишком частые запросы, попробуйте позже');
            return;
          }

          toast.success('Создание кавера начато', {
            description: 'Это может занять несколько минут',
          });

          onOpenChange(false);
          
          // Reset form
          setAudioFile(null);
          setPrompt("");
          setStyle("");
          setTitle("");
          setNegativeTags("");
        } catch (error) {
          logger.error('Cover creation error', { error });
          toast.error('Не удалось создать кавер');
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Не удалось прочитать файл');
        setIsLoading(false);
      };
    } catch (error) {
      logger.error('Cover creation error', { error });
      toast.error('Не удалось создать кавер');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Создать кавер аудио
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Загрузить аудио файл</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={isLoading}
                className="flex-1"
              />
              {audioFile && (
                <span className="text-sm text-muted-foreground">
                  {audioFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Максимум 8 минут (1 минута для V4_5ALL)
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Модель</Label>
            <Select value={model} onValueChange={setModel} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="V4">V4</SelectItem>
                <SelectItem value="V4_5">V4.5</SelectItem>
                <SelectItem value="V4_5PLUS">V4.5 Plus</SelectItem>
                <SelectItem value="V4_5ALL">V4.5 All</SelectItem>
                <SelectItem value="V5">V5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Mode */}
          <div className="flex items-center justify-between">
            <Label>Кастомный режим</Label>
            <Switch checked={customMode} onCheckedChange={setCustomMode} disabled={isLoading} />
          </div>

          {/* Instrumental */}
          <div className="flex items-center justify-between">
            <Label>Инструментальная композиция</Label>
            <Switch checked={instrumental} onCheckedChange={setInstrumental} disabled={isLoading} />
          </div>

          {/* Prompt */}
          {(!customMode || !instrumental) && (
            <div className="space-y-2">
              <Label>
                {customMode ? 'Текст (будет использован как лирика)' : 'Описание'}
              </Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  customMode
                    ? "Введите текст песни..."
                    : "Опишите желаемый результат..."
                }
                disabled={isLoading}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {customMode ? 'Максимум 5000 символов' : 'Максимум 500 символов'}
              </p>
            </div>
          )}

          {/* Style - only in custom mode */}
          {customMode && (
            <div className="space-y-2">
              <Label>Стиль</Label>
              <Input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Jazz, Classical, Electronic"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Максимум 1000 символов
              </p>
            </div>
          )}

          {/* Title - only in custom mode */}
          {customMode && (
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название трека"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Максимум 100 символов
              </p>
            </div>
          )}

          {/* Advanced Options */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Дополнительные настройки</h4>

            {/* Negative Tags */}
            <div className="space-y-2">
              <Label>Исключить стили</Label>
              <Input
                value={negativeTags}
                onChange={(e) => setNegativeTags(e.target.value)}
                placeholder="Heavy Metal, Upbeat Drums"
                disabled={isLoading}
              />
            </div>

            {/* Vocal Gender */}
            {!instrumental && (
              <div className="space-y-2">
                <Label>Пол вокала</Label>
                <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as "m" | "f")} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Не выбрано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Мужской</SelectItem>
                    <SelectItem value="f">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Style Weight */}
            <div className="space-y-2">
              <Label>Вес стиля: {styleWeight.toFixed(2)}</Label>
              <Slider
                value={[styleWeight]}
                onValueChange={([v]) => setStyleWeight(v)}
                min={0}
                max={1}
                step={0.01}
                disabled={isLoading}
              />
            </div>

            {/* Weirdness Constraint */}
            <div className="space-y-2">
              <Label>Креативность: {weirdnessConstraint.toFixed(2)}</Label>
              <Slider
                value={[weirdnessConstraint]}
                onValueChange={([v]) => setWeirdnessConstraint(v)}
                min={0}
                max={1}
                step={0.01}
                disabled={isLoading}
              />
            </div>

            {/* Audio Weight */}
            <div className="space-y-2">
              <Label>Влияние исходного аудио: {audioWeight.toFixed(2)}</Label>
              <Slider
                value={[audioWeight]}
                onValueChange={([v]) => setAudioWeight(v)}
                min={0}
                max={1}
                step={0.01}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !audioFile}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание кавера...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Создать кавер
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
