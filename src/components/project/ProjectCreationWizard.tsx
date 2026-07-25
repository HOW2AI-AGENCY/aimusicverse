import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Wand2,
  Music,
  Check,
  Loader2,
  ChevronRight,
  ArrowLeft,
  ListMusic,
  FileText,
  Lock,
  Globe,
} from "@/lib/icons";
import { useProjects } from "@/hooks/useProjects";
import { useProjectTracks } from "@/hooks/useProjectTracks";
import { useAuth } from "@/hooks/useAuth";
import { checkPremiumStatus, invokeProjectAi, invokeGenerateCoverImage, updateProjectFields } from "@/api/projects.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "@/lib/motion";
import { EASE_SPRING, EASE_OUT } from "@/lib/motion-presets";
import { logger } from "@/lib/logger";

const fieldContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: EASE_OUT },
};

interface ProjectCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = "details" | "creating" | "tracklist" | "complete";

const PROJECT_TYPES = [
  { value: "single", label: "Сингл", tracks: "1-2", icon: "🎵" },
  { value: "ep", label: "EP", tracks: "3-6", icon: "💿" },
  { value: "album", label: "Альбом", tracks: "7-15", icon: "📀" },
  { value: "ost", label: "OST", tracks: "5-20", icon: "🎬" },
  { value: "mixtape", label: "Микстейп", tracks: "5-15", icon: "🎤" },
];

const GENRES = [
  "Hip-Hop",
  "Pop",
  "Rock",
  "Electronic",
  "R&B",
  "Jazz",
  "Trap",
  "House",
  "Techno",
  "Ambient",
  "Metal",
  "Folk",
];

const MOODS = [
  "Энергичное",
  "Спокойное",
  "Меланхоличное",
  "Радостное",
  "Мотивирующее",
  "Расслабляющее",
  "Мрачное",
  "Эйфоричное",
];

export function ProjectCreationWizard({ open, onOpenChange }: ProjectCreationWizardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProject, isCreating } = useProjects();
  const isMobile = useIsMobile();

  // Form state
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("album");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [description, setConcept] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [language, setLanguage] = useState<"ru" | "en">("ru");

  // Wizard state
  const [step, setStep] = useState<WizardStep>("details");
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedTracksCount, setGeneratedTracksCount] = useState(0);
  const [autoGenerateTracklist, setAutoGenerateTracklist] = useState(true);

  // For tracklist generation
  const { generateTracklist, isGenerating, tracks } = useProjectTracks(createdProjectId || undefined);

  // Check premium status
  useEffect(() => {
    if (user) {
      checkPremiumStatus(user.id).then((isPremium) => {
        setIsPremiumUser(isPremium);
        setIsPublic(!isPremium);
      });
    }
  }, [user]);

  // Watch for tracks being added
  useEffect(() => {
    if (tracks && tracks.length > 0 && step === "tracklist") {
      setGeneratedTracksCount(tracks.length);
      setProgress(Math.min(90 + tracks.length * 2, 100));

      if (!isGenerating && tracks.length > 0) {
        setStep("complete");
        setProgress(100);
        setStatusMessage(`Создано ${tracks.length} треков`);
      }
    }
  }, [tracks, step, isGenerating]);

  const resetForm = useCallback(() => {
    setTitle("");
    setProjectType("album");
    setGenre("");
    setMood("");
    setConcept("");
    setStep("details");
    setCreatedProjectId(null);
    setProgress(0);
    setStatusMessage("");
    setGeneratedTracksCount(0);
    setAutoGenerateTracklist(true);
    setLanguage("ru");
  }, []);

  const handleClose = useCallback(() => {
    if (step === "complete" && createdProjectId) {
      navigate(`/projects/${createdProjectId}`);
    }
    onOpenChange(false);
    setTimeout(resetForm, 300);
  }, [step, createdProjectId, navigate, onOpenChange, resetForm]);

  const handleCreateProject = async () => {
    if (!title.trim()) {
      toast.error("Введите название проекта");
      return;
    }

    setStep("creating");
    setProgress(10);
    setStatusMessage("Создание проекта...");

    try {
      // Create project
      createProject(
        {
          title,
          project_type: projectType as "single" | "ep" | "album",
          genre: genre || null,
          mood: mood || null,
          description: description || null,
          status: "draft",
          is_public: isPublic,
          language,
        },
        {
          onSuccess: async (data) => {
            setCreatedProjectId(data.id);
            setProgress(30);
            setStatusMessage("Проект создан!");

            if (autoGenerateTracklist) {
              // Generate full project with AI
              setTimeout(async () => {
                setStep("tracklist");
                setProgress(40);
                setStatusMessage("AI анализирует концепцию...");

                try {
                  // Step 1: Generate the full project
                  setProgress(50);
                  setStatusMessage("AI создаёт трек-лист...");

                  const { data: aiResult, error } = await invokeProjectAi({
                    action: "full-project",
                    projectId: data.id,
                    projectType,
                    genre: genre || undefined,
                    mood: mood || undefined,
                    theme: description || undefined,
                    trackCount: getRecommendedTrackCount(projectType),
                    language,
                  });

                  if (error) {
                    logger.error("Project AI error", error);
                    throw new Error(error.message || "Ошибка AI генерации");
                  }

                  // Check for partial errors
                  if (aiResult?.data?.error) {
                    logger.warn("AI parsing error", { error: aiResult.data.error });
                    toast.error("AI не смог полностью обработать запрос");
                    setStep("complete");
                    setProgress(100);
                    return;
                  }

                  const aiData = aiResult?.data;

                  // Step 2: Update project with AI-generated data
                  if (aiData) {
                    setProgress(70);
                    setStatusMessage("Сохранение концепции...");

                    const {
                      concept,
                      visualAesthetic,
                      coverPrompt,
                      title: aiTitle,
                      description: aiDescription,
                    } = aiData;

                    // Save all AI-generated fields
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Partial update payload built field-by-field; type is loose by design
                    const updateData: Record<string, any> = {};
                    if (concept) updateData.concept = concept;
                    if (visualAesthetic) updateData.visual_aesthetic = visualAesthetic;
                    if (coverPrompt) updateData.cover_prompt = coverPrompt;
                    if (!description && aiDescription) updateData.description = aiDescription;

                    if (Object.keys(updateData).length > 0) {
                      try {
                        await updateProjectFields(data.id, updateData);
                      } catch (updateError) {
                        logger.warn("Failed to update project with AI data", { error: updateError });
                      }
                    }

                    // Step 3: Auto-generate cover if coverPrompt is available
                    if (coverPrompt) {
                      setProgress(85);
                      setStatusMessage("Генерация обложки...");

                      try {
                        const { data: coverData, error: coverError } = await invokeGenerateCoverImage({
                          projectId: data.id,
                          prompt: coverPrompt,
                          title: aiTitle || title,
                          genre: genre || undefined,
                          mood: mood || undefined,
                        });

                        if (!coverError && coverData?.url) {
                          logger.info("Cover generated successfully", { url: coverData.url });
                          toast.success("Обложка создана!");
                        }
                      } catch (coverErr) {
                        logger.warn("Cover generation failed, continuing...", { error: String(coverErr) });
                        // Don't fail the whole process if cover fails
                      }
                    }

                    // Log success metrics
                    logger.info("Project generation complete", {
                      projectId: data.id,
                      tracksGenerated: aiData.insertedCount || aiData.tracks?.length || 0,
                      hasCover: !!coverPrompt,
                    });
                  }

                  setProgress(95);
                  setStatusMessage("Финализация...");

                  // Wait for real-time to update
                  setTimeout(() => {
                    setStep("complete");
                    setProgress(100);
                    setStatusMessage("Проект готов!");
                  }, 800);
                } catch (error: unknown) {
                  logger.error("Error generating full project", error);
                  const errorMsg = error instanceof Error ? error.message : String(error);
                  const errorMessage = errorMsg.includes("429")
                    ? "Превышен лимит AI запросов"
                    : errorMsg.includes("402")
                      ? "Необходимо пополнить баланс"
                      : "Ошибка генерации";
                  toast.error(errorMessage);
                  setStep("complete");
                  setProgress(100);
                  setStatusMessage("Проект создан (без AI трек-листа)");
                }
              }, 500);
            } else {
              setStep("complete");
              setProgress(100);
              setStatusMessage("Проект готов!");
            }
          },
          onError: (error) => {
            logger.error("Project creation error", error);
            toast.error("Ошибка создания проекта");
            setStep("details");
          },
        },
      );
    } catch (error) {
      logger.error("Create project error", error);
      toast.error("Ошибка создания проекта");
      setStep("details");
    }
  };

  const getRecommendedTrackCount = (type: string): number => {
    switch (type) {
      case "single":
        return 2;
      case "ep":
        return 5;
      case "album":
        return 10;
      case "ost":
        return 8;
      case "mixtape":
        return 8;
      default:
        return 8;
    }
  };

  const selectedType = PROJECT_TYPES.find((t) => t.value === projectType);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className={cn("w-full overflow-y-auto", isMobile ? "max-w-full" : "sm:max-w-lg")}>
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            {/* Pure CSS opacity pulse — a JS-driven rotate+scale loop here was an
                always-on cost for a purely decorative flourish */}
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            Новый проект
          </SheetTitle>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {/* Step: Details */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <motion.div variants={fieldContainer} initial="hidden" animate="show" className="space-y-4">
                {/* Title */}
                <motion.div variants={fieldItem} className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Мой новый альбом..."
                    className="bg-background"
                    autoFocus
                  />
                </motion.div>

                {/* Project Type Cards */}
                <motion.div variants={fieldItem} className="space-y-2">
                  <Label>Тип проекта</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROJECT_TYPES.map((type) => {
                      const selected = projectType === type.value;
                      return (
                        <motion.button
                          key={type.value}
                          type="button"
                          onClick={() => setProjectType(type.value)}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            "relative p-3 rounded-lg border-2 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5",
                            selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                          )}
                        >
                          <AnimatePresence>
                            {selected && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.4 }}
                                transition={EASE_SPRING}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.6)]"
                              >
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{type.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.tracks} треков</div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Genre & Mood */}
                <motion.div variants={fieldItem} className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Жанр</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Выберите..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Настроение</Label>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Выберите..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                {/* Language */}
                <motion.div variants={fieldItem} className="space-y-2">
                  <Label>Язык</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={language === "ru" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLanguage("ru")}
                      className="flex-1 transition-transform active:scale-95"
                    >
                      🇷🇺 Русский
                    </Button>
                    <Button
                      type="button"
                      variant={language === "en" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLanguage("en")}
                      className="flex-1 transition-transform active:scale-95"
                    >
                      🇬🇧 English
                    </Button>
                  </div>
                </motion.div>

                {/* Concept */}
                <motion.div variants={fieldItem} className="space-y-2">
                  <Label>Концепция / Тема</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="О чём будет ваш проект..."
                    rows={3}
                    className="bg-background resize-none"
                  />
                </motion.div>

                {/* Auto-generate tracklist toggle */}
                <motion.div
                  variants={fieldItem}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <ListMusic className="w-5 h-5 text-primary" />
                    <div>
                      <Label className="cursor-pointer">AI Трек-лист</Label>
                      <p className="text-xs text-muted-foreground">Автоматически создать структуру альбома</p>
                    </div>
                  </div>
                  <Switch checked={autoGenerateTracklist} onCheckedChange={setAutoGenerateTracklist} />
                </motion.div>

                {/* Privacy toggle */}
                {isPremiumUser && (
                  <motion.div
                    variants={fieldItem}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {isPublic ? (
                        <Globe className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-orange-500" />
                      )}
                      <div>
                        <Label className="cursor-pointer">{isPublic ? "Публичный" : "Приватный"}</Label>
                        <p className="text-xs text-muted-foreground">{isPublic ? "Виден всем" : "Только для вас"}</p>
                      </div>
                    </div>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  </motion.div>
                )}

                {/* Create Button */}
                <motion.div variants={fieldItem}>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!title.trim() || isCreating}
                    className="w-full gap-2 transition-transform active:scale-[0.98]"
                    size="lg"
                  >
                    Создать проект
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Step: Creating / Tracklist / Complete */}
          {(step === "creating" || step === "tracklist" || step === "complete") && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 py-8"
            >
              {/* Progress visualization */}
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <motion.div
                  key={step}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={EASE_SPRING}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center",
                    step === "complete" ? "bg-green-500/20" : "bg-primary/20",
                  )}
                >
                  {step === "complete" ? (
                    <motion.div
                      initial={{ rotate: -30, scale: 0.5 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ ...EASE_SPRING, delay: 0.1 }}
                    >
                      <Check className="w-10 h-10 text-green-500" />
                    </motion.div>
                  ) : step === "tracklist" ? (
                    <ListMusic className="w-10 h-10 text-primary animate-pulse" />
                  ) : (
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  )}
                </motion.div>

                {/* Title */}
                <div>
                  <h3 className="text-xl font-semibold">
                    {step === "complete"
                      ? "Проект создан!"
                      : step === "tracklist"
                        ? "Генерация трек-листа"
                        : "Создание проекта"}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">{statusMessage}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
                </div>

                {/* Project info */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">{selectedType?.label}</Badge>
                  {genre && <Badge variant="outline">{genre}</Badge>}
                  {mood && <Badge variant="outline">{mood}</Badge>}
                </div>

                {/* Track count during generation */}
                {step === "tracklist" && generatedTracksCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Music className="w-4 h-4 text-primary" />
                    <span>Создано треков: {generatedTracksCount}</span>
                  </motion.div>
                )}

                {/* Complete info */}
                {step === "complete" && tracks && tracks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm space-y-2 mt-4"
                  >
                    <div className="text-sm font-medium text-left">Трек-лист:</div>
                    <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                      {tracks.slice(0, 10).map((track, idx) => (
                        <div key={track.id} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-5">{idx + 1}.</span>
                          <span className="truncate">{track.title}</span>
                        </div>
                      ))}
                      {tracks.length > 10 && (
                        <div className="text-xs text-muted-foreground">и ещё {tracks.length - 10}...</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {step === "complete" ? (
                  <>
                    <Button onClick={handleClose} className="w-full gap-2" size="lg">
                      <Music className="w-4 h-4" />
                      Открыть проект
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        setTimeout(resetForm, 300);
                      }}
                      className="w-full"
                    >
                      Создать ещё один
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">Пожалуйста, подождите...</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
