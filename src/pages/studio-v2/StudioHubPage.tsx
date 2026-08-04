import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listStudioProjects } from "@/api/studio";
import { queryKeys } from "@/lib/queryKeys";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Music2, Clock, Layers, MoreVertical, Trash2, Activity, Disc3 } from "@/lib/icons";
import { formatDistanceToNow, ru } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useStudioProject } from "@/hooks/studio/useStudioProject";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { getTelegramHeaderPaddingTop } from "@/lib/telegramSafeArea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudioTrack } from "@/stores/useUnifiedStudioStore";
import { Section, sectionTokens } from "@/components/layout/Section";

interface StudioProjectRow {
  id: string;
  name: string;
  description: string | null;
  bpm: number | null;
  tracks: StudioTrack[] | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  opened_at: string | null;
}

const STATUS_META = {
  draft: { label: "Черновик", dot: "bg-slate-400", className: "border-slate-400/30 text-slate-300 bg-slate-400/10" },
  mixing: { label: "Сведение", dot: "bg-blue-400", className: "border-blue-400/30 text-blue-300 bg-blue-400/10" },
  mastering: {
    label: "Мастеринг",
    dot: "bg-purple-400",
    className: "border-purple-400/30 text-purple-300 bg-purple-400/10",
  },
  completed: {
    label: "Готово",
    dot: "bg-emerald-400",
    className: "border-emerald-400/30 text-emerald-300 bg-emerald-400/10",
  },
  archived: { label: "Архив", dot: "bg-zinc-500", className: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10" },
} as const;

const COVER_GRADIENTS = [
  "from-violet-500 to-fuchsia-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-rose-500",
  "from-pink-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-red-600",
];

function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

export default function StudioHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { deleteProject, isLoading: isDeleting } = useStudioProject();

  // Telegram BackButton - navigate to home
  useTelegramBackButton({
    visible: true,
    fallbackPath: "/",
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: queryKeys.studio.projects,
    queryFn: listStudioProjects,
    staleTime: 30_000,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deleteProject(deleteId);
    if (success) {
      queryClient.setQueryData<StudioProjectRow[]>(queryKeys.studio.projects, (prev) =>
        (prev ?? []).filter((p) => p.id !== deleteId),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.studio.projects });
    }
    setDeleteId(null);
  };


  const getTrackCount = (tracks: StudioTrack[] | null) => {
    if (!tracks || !Array.isArray(tracks)) return 0;
    return tracks.length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Telegram safe area */}
      <header
        className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{
          paddingTop: getTelegramHeaderPaddingTop(),
        }}
      >
        <div
          className={cn(
            "mx-auto flex h-14 items-center justify-between",
            sectionTokens.shellMaxWidth,
            sectionTokens.containerPadding,
          )}
        >
          <h1 className="text-lg font-semibold">Студия v2</h1>
          <Button size="sm" onClick={() => navigate("/studio-v2/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Новый проект
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto py-6",
          sectionTokens.shellMaxWidth,
          sectionTokens.containerPadding,
          sectionTokens.blockGap,
        )}
      >
        <Section
          sectionId="studio-projects"
          eyebrow="Студия"
          title="Ваши проекты"
          subtitle="Откройте существующий проект или создайте новый"
          density="auto"
          maxWidth="full"
          headerRight={
            <Button size="sm" variant="outline" onClick={() => navigate("/studio-v2/new")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Новый
            </Button>
          }
        >
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[104px] rounded-xl" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Music2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Нет проектов</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Создайте первый проект студии для работы с треками и сведения
              </p>
              <Button onClick={() => navigate("/studio-v2/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Создать проект
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => {
                const trackCount = getTrackCount(project.tracks);
                const status = (project.status || "draft") as keyof typeof STATUS_META;
                const meta = STATUS_META[status] ?? STATUS_META.draft;
                const cover = COVER_GRADIENTS[hashIndex(project.id, COVER_GRADIENTS.length)];
                const initials = (project.name || "?").trim().slice(0, 2).toUpperCase();
                const updated = project.opened_at || project.updated_at;

                return (
                  <Card
                    key={project.id}
                    className="group relative cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/60 hover:shadow-lg hover:-translate-y-0.5"
                    onClick={() => navigate(`/studio-v2/project/${project.id}`)}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Cover swatch */}
                      <div
                        className={cn(
                          "relative flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-inner",
                          cover,
                        )}
                      >
                        <span className="font-bold text-2xl tracking-tight drop-shadow">{initials}</span>
                        <Disc3 className="absolute bottom-1 right-1 h-3.5 w-3.5 opacity-60" />
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-semibold text-sm leading-tight truncate flex-1">{project.name}</h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1 -mr-1 opacity-60 group-hover:opacity-100"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(project.id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {project.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{project.description}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 italic mt-0.5">Без описания</p>
                        )}

                        {/* Status + meta chips */}
                        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                          <Badge
                            variant="outline"
                            className={cn("h-5 px-1.5 text-[0.625rem] font-medium gap-1 border", meta.className)}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                            {meta.label}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground">
                            <Layers className="h-3 w-3" />
                            {trackCount}
                          </span>
                          {project.bpm ? (
                            <span className="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground">
                              <Activity className="h-3 w-3" />
                              {project.bpm}
                            </span>
                          ) : null}
                          {updated ? (
                            <span className="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground ml-auto">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(updated), { addSuffix: false, locale: ru })}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные проекта будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
