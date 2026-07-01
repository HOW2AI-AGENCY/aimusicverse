/**
 * ProjectHeroSection — hero-блок с обложкой, кнопками навигации и генерации медиа.
 *
 * Извлечено из pages/ProjectDetail.tsx в Sprint 042 (god-page декомпозиция).
 * Адаптивный: на мобильном — full-width hero с градиентом, на десктопе — круглая обложка + sticky top bar.
 */

import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { ArrowLeft, Settings, Image, Music } from "@/lib/icons";
import type { useProjectDetailData } from "@/hooks/project/useProjectDetailData";

interface ProjectHeroSectionProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>["project"]>;
  isMobile: boolean;
  onNavigateBack: () => void;
  onOpenSettings: () => void;
  onOpenMediaGenerator: () => void;
}

export function ProjectHeroSection({
  project,
  isMobile,
  onNavigateBack,
  onOpenSettings,
  onOpenMediaGenerator,
}: ProjectHeroSectionProps) {
  if (isMobile) {
    return (
      <div className="relative">
        <div className="relative w-full aspect-[3/2]">
          {project.cover_url ? (
            <LazyImage src={project.cover_url} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary to-muted flex items-center justify-center">
              <Music className="w-14 h-14 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 z-10"
            style={{
              paddingTop:
                "calc(var(--tg-safe-area-inset-top, 44px) + var(--tg-content-safe-area-inset-top, 0px) + 0.5rem)",
            }}
          >
            <Button
              variant="secondary"
              size="icon"
              onClick={onNavigateBack}
              className="h-11 w-11 min-h-touch bg-background/70 backdrop-blur-md border-0 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="icon"
                onClick={onOpenMediaGenerator}
                className="h-11 w-11 min-h-touch bg-background/70 backdrop-blur-md border-0 shadow-lg"
              >
                <Image className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={onOpenSettings}
                className="h-11 w-11 min-h-touch bg-background/70 backdrop-blur-md border-0 shadow-lg"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="absolute inset-0 h-32 bg-gradient-to-b from-primary/10 to-background"
        style={{
          backgroundImage: project.cover_url ? `url(${project.cover_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(40px)",
          opacity: 0.4,
        }}
      />

      <div
        className="relative sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 pb-3"
        style={{
          paddingTop:
            "max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))",
        }}
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onNavigateBack} className="h-10 w-10 min-h-touch">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-semibold text-sm truncate flex-1 text-center mx-3">{project.title}</h1>
          <Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-10 w-10 min-h-touch">
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-3 pt-3 pb-4 px-4">
        <div className="relative group">
          <div className="w-44 h-44 rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-secondary to-muted ring-1 ring-white/10 transition-transform group-hover:scale-[1.02]">
            {project.cover_url ? (
              <img
                loading="lazy"
                decoding="async"
                src={project.cover_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-12 h-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-10 w-10 min-h-touch rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onOpenMediaGenerator}
          >
            <Image className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}
