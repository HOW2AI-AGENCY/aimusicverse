/**
 * ProjectDetailsCard - Comprehensive project info display
 * Shows all project metadata including visual style parameters
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Music,
  Palette,
  FileText,
  Target,
  Settings,
  Globe,
  Sparkles,
  Eye,
  Type,
  Image,
  Calendar,
  Users,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ProjectRow = Database["public"]["Tables"]["music_projects"]["Row"];

interface ProjectDetailsCardProps {
  project: ProjectRow;
  onEdit?: () => void;
  compact?: boolean;
  className?: string;
}

const LANGUAGE_MAP: Record<string, { flag: string; name: string }> = {
  ru: { flag: "🇷🇺", name: "Русский" },
  en: { flag: "🇬🇧", name: "English" },
  es: { flag: "🇪🇸", name: "Español" },
  de: { flag: "🇩🇪", name: "Deutsch" },
  fr: { flag: "🇫🇷", name: "Français" },
  zh: { flag: "🇨🇳", name: "中文" },
  ja: { flag: "🇯🇵", name: "日本語" },
  ko: { flag: "🇰🇷", name: "한국어" },
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  single: "Сингл",
  ep: "EP",
  album: "Альбом",
  ost: "Саундтрек",
  background_music: "Фоновая музыка",
  jingle: "Джингл",
  compilation: "Компиляция",
  mixtape: "Микстейп",
};

const IMAGE_STYLE_LABELS: Record<string, string> = {
  photorealistic: "Фотореализм",
  illustration: "Иллюстрация",
  "3d_render": "3D Рендер",
  anime: "Аниме",
  abstract: "Абстракция",
  minimalist: "Минимализм",
  vintage: "Винтаж",
  cyberpunk: "Киберпанк",
  watercolor: "Акварель",
  oil_painting: "Масло",
};

const TYPOGRAPHY_LABELS: Record<string, string> = {
  modern: "Современный",
  classic: "Классический",
  handwritten: "Рукописный",
  bold: "Жирный",
  minimal: "Минималистичный",
  grunge: "Гранж",
  elegant: "Элегантный",
  retro: "Ретро",
};

export function ProjectDetailsCard({ project, onEdit, compact = false, className }: ProjectDetailsCardProps) {
  const language = project.language ? LANGUAGE_MAP[project.language] : null;
  const colorPalette = project.color_palette as { primary?: string; secondary?: string; accent?: string } | null;
  const visualKeywords = project.visual_keywords as string[] | null;

  const hasBasicInfo = project.genre || project.mood || language || project.project_type;
  const hasVisualStyle = project.image_style || project.typography_style || colorPalette || visualKeywords?.length;
  const hasContent = project.description || project.concept || project.target_audience;

  if (!hasBasicInfo && !hasVisualStyle && !hasContent) {
    return null;
  }

  return (
    <div className={cn("rounded-xl bg-card/50 border border-border/50 divide-y divide-border/30", className)}>
      {/* Basic Info Section */}
      {hasBasicInfo && (
        <div className={cn(compact ? "p-2.5" : "p-3")}>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Music className="w-3.5 h-3.5" />
            <span className="font-medium">Основное</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {project.project_type && (
              <Badge variant="default" className="text-xs gap-1 px-2 py-0.5">
                {PROJECT_TYPE_LABELS[project.project_type] || project.project_type}
              </Badge>
            )}
            {language && (
              <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                <span>{language.flag}</span>
                {!compact && <span>{language.name}</span>}
              </Badge>
            )}
            {project.genre && (
              <Badge variant="secondary" className="text-xs gap-1 px-2 py-0.5">
                {project.genre}
              </Badge>
            )}
            {project.mood && (
              <Badge variant="secondary" className="text-xs gap-1 px-2 py-0.5">
                <Palette className="w-3 h-3" />
                {project.mood}
              </Badge>
            )}
            {project.key_signature && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                🎵 {project.key_signature}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Visual Style Section */}
      {hasVisualStyle && !compact && (
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-medium">Визуальный стиль</span>
          </div>

          <div className="space-y-2">
            {/* Style badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {project.image_style && (
                <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                  <Image className="w-3 h-3" />
                  {IMAGE_STYLE_LABELS[project.image_style] || project.image_style}
                </Badge>
              )}
              {project.typography_style && (
                <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
                  <Type className="w-3 h-3" />
                  {TYPOGRAPHY_LABELS[project.typography_style] || project.typography_style}
                </Badge>
              )}
            </div>

            {/* Color palette preview */}
            {colorPalette && (colorPalette.primary || colorPalette.secondary || colorPalette.accent) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Палитра:</span>
                <div className="flex items-center gap-1">
                  {colorPalette.primary && (
                    <div
                      className="w-5 h-5 rounded-full border border-border/50 shadow-sm"
                      style={{ backgroundColor: colorPalette.primary }}
                      title={`Primary: ${colorPalette.primary}`}
                    />
                  )}
                  {colorPalette.secondary && (
                    <div
                      className="w-5 h-5 rounded-full border border-border/50 shadow-sm"
                      style={{ backgroundColor: colorPalette.secondary }}
                      title={`Secondary: ${colorPalette.secondary}`}
                    />
                  )}
                  {colorPalette.accent && (
                    <div
                      className="w-5 h-5 rounded-full border border-border/50 shadow-sm"
                      style={{ backgroundColor: colorPalette.accent }}
                      title={`Accent: ${colorPalette.accent}`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Visual keywords */}
            {visualKeywords && visualKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {visualKeywords.slice(0, 6).map((keyword, i) => (
                  <span key={i} className="text-[0.625rem] px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground">
                    {keyword}
                  </span>
                ))}
                {visualKeywords.length > 6 && (
                  <span className="text-[0.625rem] text-muted-foreground/60">+{visualKeywords.length - 6}</span>
                )}
              </div>
            )}

            {/* Visual aesthetic description */}
            {project.visual_aesthetic && (
              <p className="text-xs text-muted-foreground/80 italic line-clamp-2">"{project.visual_aesthetic}"</p>
            )}
          </div>
        </div>
      )}

      {/* Content Section */}
      {hasContent && !compact && (
        <div className="p-3 space-y-2">
          {project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
          )}

          {project.concept && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground/80">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
              <p className="italic line-clamp-2">"{project.concept}"</p>
            </div>
          )}

          {project.target_audience && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Аудитория: {project.target_audience}</span>
            </div>
          )}

          {project.release_date && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Релиз: {new Date(project.release_date).toLocaleDateString("ru-RU")}</span>
            </div>
          )}
        </div>
      )}

      {/* Edit Button */}
      {onEdit && !compact && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-3 h-3 mr-1" />
            Настройки проекта
          </Button>
        </div>
      )}
    </div>
  );
}
