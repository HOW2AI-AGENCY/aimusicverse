/**
 * ExtendTrackDialog — продление трека через Suno `/api/v1/generate/extend`.
 *
 * Оформление — единая оболочка формы генерации (GenerateModal), как в RemixTrackDialog.
 *
 * Контракт Suno (docs.sunoapi.org/suno-api/extend-music):
 *  - defaultParamFlag = true  → кастомные параметры: обязательны prompt, style, title, continueAt;
 *  - defaultParamFlag = false → берутся параметры оригинала, нужен только audioId;
 *  - prompt для вокального трека = текст (лирика) продолжения; модель должна совпадать с оригиналом.
 */
import { useEffect, useMemo, useState } from "react";
import { GenerateModal } from "@/components/generate-form/primitives/GenerateModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ChevronDown, Sparkles } from "@/lib/icons";
import { toast } from "sonner";
import { Track } from "@/types/track";
import { formatTime } from "@/lib/player-utils";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useExtendProgress } from "@/hooks/generation/useExtendProgress";
import { GenerationProgressBar } from "@/components/generation/GenerationProgressBar";
import { useNavigate } from "react-router";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { PromptValidationAlert } from "@/components/generate-form/PromptValidationAlert";
import { validatePromptForGeneration } from "@/lib/errorHandling";
import { LazyImage } from "@/components/ui/lazy-image";
import { useExtendMusic } from "@/hooks/studio/useExtendMusic";
import { SUNO_MODELS } from "@/constants/sunoModels";
import { ECONOMY } from "@/lib/economy";

interface ExtendTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  activeAudioUrl?: string;
}

/** Лимиты Suno на длину полей, зависят от модели. */
const limitsForModel = (model: string) => ({
  prompt: model === "V4" ? 3000 : 5000,
  style: model === "V4" ? 200 : 1000,
  title: model === "V4" || model === "V4_5ALL" ? 80 : 100,
});

export const ExtendTrackDialog = ({ open, onOpenChange, track, activeAudioUrl }: ExtendTrackDialogProps) => {
  const navigate = useNavigate();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const extendProgress = useExtendProgress();
  const extendMusicMutation = useExtendMusic();

  const [useCustomParams, setUseCustomParams] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const duration = track.duration_seconds || 0;
  // Модель обязана совпадать с оригиналом (требование Suno).
  const model = useMemo(() => {
    const raw = track.suno_model || track.model_name || "V4_5ALL";
    return SUNO_MODELS[raw] ? raw : "V4_5ALL";
  }, [track.suno_model, track.model_name]);
  const limits = limitsForModel(model);
  const isInstrumental = track.is_instrumental === true || track.has_vocals === false;

  const [continueAt, setContinueAt] = useState(Math.max(1, duration || 60));
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(track.style || "");
  const [title, setTitle] = useState(`${track.title || "Трек"} (Extended)`);

  const [negativeTags, setNegativeTags] = useState("");
  const [vocalGender, setVocalGender] = useState<"m" | "f" | "auto">("auto");
  const [styleWeight, setStyleWeight] = useState(0.65);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.5);
  const [audioWeight, setAudioWeight] = useState(0.65);

  // Подставляем данные трека при каждом открытии
  useEffect(() => {
    if (!open) return;
    extendProgress.reset();
    setContinueAt(Math.max(1, duration || 60));
    setStyle(track.style || "");
    setTitle(`${track.title || "Трек"} (Extended)`);
    // Для вокального трека prompt = лирика продолжения: подставляем оригинальный текст,
    // чтобы модель продолжила песню связно. Для инструментала — описание из оригинала.
    setPrompt(isInstrumental ? track.prompt || "" : track.lyrics || track.prompt || "");
    setVocalGender(track.vocal_gender === "m" || track.vocal_gender === "f" ? track.vocal_gender : "auto");
    setStyleWeight(typeof track.style_weight === "number" ? track.style_weight : 0.65);
    setNegativeTags(track.negative_tags || "");
    setAdvancedOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, track.id]);

  const loading = extendProgress.status === "submitting";
  const hasSunoId = Boolean(track.suno_id);

  const handleExtend = async () => {
    if (!hasSunoId) {
      toast.error("Для продления нужен готовый трек Suno");
      return;
    }

    if (useCustomParams) {
      if (!prompt.trim()) {
        toast.error(isInstrumental ? "Укажите, как продолжить трек" : "Добавьте текст продолжения");
        return;
      }
      if (!style.trim()) {
        toast.error("Укажите стиль");
        return;
      }
      if (!title.trim()) {
        toast.error("Укажите название");
        return;
      }
      if (!continueAt || continueAt <= 0) {
        toast.error("Укажите момент продолжения");
        return;
      }
      if (prompt.length > limits.prompt || style.length > limits.style || title.length > limits.title) {
        toast.error("Превышена максимальная длина полей для выбранной модели");
        return;
      }

      const validation = validatePromptForGeneration(prompt, style);
      if (!validation.valid) {
        toast.error(validation.error, { description: validation.suggestion });
        return;
      }
    }

    extendProgress.setSubmitting();
    try {
      const { data, error } = await extendMusicMutation.mutateAsync({
        sourceTrackId: track.id,
        audioUrl: activeAudioUrl,
        // Suno: true = кастомные параметры, false = параметры оригинала
        defaultParamFlag: useCustomParams,
        continueAt: useCustomParams ? continueAt : undefined,
        prompt: useCustomParams ? prompt.trim() : undefined,
        style: useCustomParams ? style.trim() : undefined,
        title: useCustomParams ? title.trim() : undefined,
        model,
        negativeTags: useCustomParams && negativeTags.trim() ? negativeTags.trim() : undefined,
        vocalGender: useCustomParams && vocalGender !== "auto" ? vocalGender : undefined,
        styleWeight: useCustomParams ? styleWeight : undefined,
        weirdnessConstraint: useCustomParams ? weirdnessConstraint : undefined,
        audioWeight: useCustomParams ? audioWeight : undefined,
        projectId: track.project_id ?? undefined,
      });

      if (error) throw error;

      // Запрос принят — сразу закрываем окно, чтобы прогресс не выглядел "зависшим".
      // Дальнейший статус пользователь видит в библиотеке и глобальном индикаторе.
      extendProgress.reset();
      toast.success("Продление началось", {
        description: "Расширенный трек появится в библиотеке через 1–3 минуты",
      });
      onOpenChange(false);
    } catch (error) {
      logger.error("Extend error", { error });
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("429") || errorMessage.includes("credits")) {
        extendProgress.setError("Недостаточно кредитов");
      } else {
        extendProgress.setError(errorMessage || "Попробуйте ещё раз");
      }
    }
  };

  const handlePlayTrack = () => {
    if (extendProgress.completedTrack) {
      playTrack({
        id: extendProgress.completedTrack.id,
        title: extendProgress.completedTrack.title,
        audio_url: extendProgress.completedTrack.audio_url,
        cover_url: extendProgress.completedTrack.cover_url || undefined,
      } as Track);
    }
  };

  const handleOpenTrack = () => {
    if (extendProgress.completedTrack) {
      navigate(`/track/${extendProgress.completedTrack.id}`);
      onOpenChange(false);
    }
  };

  const counter = (value: string, max: number) => (
    <span
      className={cn(
        "text-[0.6875rem] tabular-nums",
        value.length > max ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {value.length}/{max}
    </span>
  );

  return (
    <GenerateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Продлить трек"
      description="Suno дописывает музыку с выбранного момента"
      icon={Plus}
      size="md"
      data-testid="extend-track-dialog"
      footer={
        <div className="space-y-1.5">
          <Button
            onClick={handleExtend}
            disabled={loading || extendProgress.isActive || !hasSunoId}
            className="h-11 w-full gap-2 font-semibold"
          >
            {loading || extendProgress.isActive ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {extendProgress.message || "Продление…"}
              </>
            ) : (
              <>
                Продлить трек
                <Badge variant="secondary" className="ml-1">
                  {ECONOMY.EXTEND_GENERATION_COST}
                </Badge>
              </>
            )}
          </Button>
          <p className="text-center text-[0.6875rem] text-muted-foreground">Обычно занимает 1–3 минуты</p>
        </div>
      }
    >
      {extendProgress.status !== "idle" && (
        <GenerationProgressBar
          status={extendProgress.status}
          progress={extendProgress.progress}
          message={extendProgress.message}
          error={extendProgress.error}
          completedTrack={extendProgress.completedTrack}
          onPlayTrack={handlePlayTrack}
          onOpenTrack={handleOpenTrack}
          onRetry={handleExtend}
          onDismiss={() => {
            extendProgress.reset();
            if (extendProgress.isCompleted) onOpenChange(false);
          }}
        />
      )}

      {!hasSunoId && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Продление доступно только для завершённых треков Suno.
        </p>
      )}

      {/* Источник */}
      <div className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
        {track.cover_url ? (
          <LazyImage
            src={track.cover_url}
            alt={track.title || ""}
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{track.title || "Без названия"}</p>
          <p className="truncate text-[0.6875rem] text-muted-foreground">
            {[track.style, formatTime(duration)].filter(Boolean).join(" • ")}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[0.6875rem]">
          {SUNO_MODELS[model]?.name || model}
        </Badge>
      </div>

      {/* Режим параметров */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="extend-custom" className="text-xs font-medium">
            Свои параметры
          </Label>
          <p className="text-[0.6875rem] text-muted-foreground">
            {useCustomParams ? "Задать текст, стиль и название" : "Использовать параметры оригинала"}
          </p>
        </div>
        <Switch id="extend-custom" checked={useCustomParams} onCheckedChange={setUseCustomParams} />
      </div>

      {useCustomParams ? (
        <>
          {/* Момент продолжения */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Продолжить с момента</Label>
              <span className="text-[0.6875rem] tabular-nums text-muted-foreground">{formatTime(continueAt)}</span>
            </div>
            <Slider
              value={[continueAt]}
              onValueChange={([v]) => setContinueAt(v)}
              min={1}
              max={Math.max(2, duration || 240)}
              step={1}
              aria-label="Момент продолжения"
            />
          </div>

          {/* Текст / описание продолжения */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="extend-prompt" className="text-xs font-medium">
                {isInstrumental ? "Как продолжить" : "Текст продолжения"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {counter(prompt, limits.prompt)}
            </div>
            <Textarea
              id="extend-prompt"
              placeholder={
                isInstrumental
                  ? "Добавить энергичную секцию с эпическим нарастанием"
                  : "[Verse]\nСтроки продолжения песни…"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={isInstrumental ? 3 : 6}
              className={cn("resize-none text-sm", !isInstrumental && "font-mono leading-relaxed")}
            />
            {!isInstrumental && (
              <div className="flex flex-wrap items-center gap-1.5">
                {track.lyrics && track.lyrics !== prompt && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[0.6875rem]"
                    onClick={() => setPrompt(track.lyrics || "")}
                  >
                    Вставить оригинальный текст
                  </Button>
                )}
                {["[Verse]", "[Chorus]", "[Bridge]", "[Outro]"].map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 font-mono text-[0.6875rem]"
                    onClick={() => setPrompt((p) => (p ? `${p.replace(/\s+$/, "")}\n\n${tag}\n` : `${tag}\n`))}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            )}
            <p className="text-[0.6875rem] text-muted-foreground">
              {isInstrumental
                ? "Опишите развитие: инструменты, динамика, настроение."
                : "Оригинальный текст задаёт контекст — допишите новые секции в конце."}
            </p>
            <PromptValidationAlert text={prompt} onApplyReplacement={(newText) => setPrompt(newText)} />
          </div>

          {/* Стиль */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="extend-style" className="text-xs font-medium">
                Стиль <span className="text-destructive">*</span>
              </Label>
              {counter(style, limits.style)}
            </div>
            <Textarea
              id="extend-style"
              placeholder="hip-hop, boom bap drums, soulful sample"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
            <PromptValidationAlert text={style} onApplyReplacement={(newText) => setStyle(newText)} />
          </div>

          {/* Название */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="extend-title" className="text-xs font-medium">
                Название <span className="text-destructive">*</span>
              </Label>
              {counter(title, limits.title)}
            </div>
            <Input
              id="extend-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Расширенные настройки */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-full justify-between px-3 text-xs font-medium">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Расширенные настройки
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              {!isInstrumental && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Пол вокала</Label>
                  <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as "m" | "f" | "auto")}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Автоматически</SelectItem>
                      <SelectItem value="m">Мужской</SelectItem>
                      <SelectItem value="f">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Схожесть с оригиналом</Label>
                  <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
                    {Math.round(audioWeight * 100)}%
                  </span>
                </div>
                <Slider
                  value={[audioWeight]}
                  onValueChange={([v]) => setAudioWeight(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  aria-label="Схожесть с оригиналом"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Влияние стиля</Label>
                  <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
                    {Math.round(styleWeight * 100)}%
                  </span>
                </div>
                <Slider
                  value={[styleWeight]}
                  onValueChange={([v]) => setStyleWeight(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  aria-label="Влияние стиля"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Креативность</Label>
                  <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
                    {Math.round(weirdnessConstraint * 100)}%
                  </span>
                </div>
                <Slider
                  value={[weirdnessConstraint]}
                  onValueChange={([v]) => setWeirdnessConstraint(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  aria-label="Креативность"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="extend-negative" className="text-xs font-medium">
                  Исключить (negative tags)
                </Label>
                <Input
                  id="extend-negative"
                  placeholder="например: distorted guitar"
                  value={negativeTags}
                  onChange={(e) => setNegativeTags(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      ) : (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          Трек будет продолжен с текстом, стилем и настройками оригинала. Момент продолжения выберет Suno — конец
          трека.
        </p>
      )}
    </GenerateModal>
  );
};
