import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Globe, Music, Palette, FileText, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  description?: string | null;
  concept?: string | null;
  genre?: string | null;
  mood?: string | null;
  language?: string | null;
  status?: string | null;
  target_audience?: string | null;
}

interface ProjectInfoCardProps {
  project: Project;
  onEdit?: () => void;
  compact?: boolean;
}

const LANGUAGE_MAP: Record<string, { flag: string; name: string }> = {
  ru: { flag: '🇷🇺', name: 'Русский' },
  en: { flag: '🇬🇧', name: 'English' },
  es: { flag: '🇪🇸', name: 'Español' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
  fr: { flag: '🇫🇷', name: 'Français' },
  zh: { flag: '🇨🇳', name: '中文' },
  ja: { flag: '🇯🇵', name: '日本語' },
  ko: { flag: '🇰🇷', name: '한국어' },
};

export function ProjectInfoCard({ project, onEdit, compact = false }: ProjectInfoCardProps) {
  const language = project.language ? LANGUAGE_MAP[project.language] : null;
  const hasMetadata = project.genre || project.mood || language;
  const hasContent = project.description || project.concept || project.target_audience;
  
  if (!hasMetadata && !hasContent) {
    return null;
  }

  return (
    <div className={cn(
      "rounded-xl bg-card/50 border border-border/50 transition-colors hover:bg-card/70",
      compact ? "p-2.5" : "p-3"
    )}>
      {/* Badges Row */}
      {hasMetadata && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {language && (
            <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5">
              <span>{language.flag}</span>
              {!compact && <span>{language.name}</span>}
            </Badge>
          )}
          {project.genre && (
            <Badge variant="secondary" className="text-xs gap-1 px-2 py-0.5">
              <Music className="w-3 h-3" />
              {project.genre}
            </Badge>
          )}
          {project.mood && (
            <Badge variant="secondary" className="text-xs gap-1 px-2 py-0.5">
              <Palette className="w-3 h-3" />
              {project.mood}
            </Badge>
          )}
        </div>
      )}

      {/* Description */}
      {!compact && project.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {project.description}
        </p>
      )}

      {/* Concept */}
      {!compact && project.concept && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground/80 mb-2">
          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p className="italic line-clamp-2">
            "{project.concept}"
          </p>
        </div>
      )}

      {/* Target Audience */}
      {!compact && project.target_audience && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
          <Target className="w-3.5 h-3.5 shrink-0" />
          <span>Аудитория: {project.target_audience}</span>
        </div>
      )}

      {/* Edit Button */}
      {onEdit && !compact && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Edit className="w-3 h-3 mr-1" />
            Редактировать
          </Button>
        </div>
      )}
    </div>
  );
}
