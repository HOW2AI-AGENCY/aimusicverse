import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Clock, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { typographyClass } from "@/lib/design-tokens";

interface RecentPage {
  path: string;
  label: string;
  timestamp: number;
}

const STORAGE_KEY = "musicverse_recent_pages";
const MAX_ITEMS = 5;

function loadRecent(): RecentPage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function trackPageVisit(path: string, label: string): void {
  try {
    const recent = loadRecent().filter((p) => p.path !== path);
    recent.unshift({ path, label, timestamp: Date.now() });
    if (recent.length > MAX_ITEMS) recent.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {
    // unavailable
  }
}

function mapLabel(path: string, defaultLabel: string): string {
  const known: Record<string, string> = {
    "/studio-v2": "Студия",
    "/lyrics-studio": "Lyrics AI",
    "/guitar-studio": "Гитара",
    "/community": "Сообщество",
    "/artists": "AI-артисты",
    "/blog": "Блог",
    "/settings": "Настройки",
    "/admin": "Админ",
    "/rewards": "Награды",
    "/analytics": "Статистика",
  };
  return known[path] ?? defaultLabel;
}

interface RecentlyUsedSectionProps {
  className?: string;
}

export function RecentlyUsedSection({ className }: RecentlyUsedSectionProps) {
  const navigate = useNavigate();
  const pages = useMemo(() => {
    return loadRecent()
      .map((p) => ({ ...p, label: mapLabel(p.path, p.label) }))
      .filter((p) => p.label.length > 0);
  }, []);

  if (pages.length === 0) return null;

  return (
    <div className={cn("px-1", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span
          className={cn(
            "text-[0.6875rem] font-medium tracking-wide uppercase text-muted-foreground/50",
            typographyClass.caption,
          )}
        >
          Недавнее
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pages.map((page) => (
          <button
            key={page.path}
            onClick={() => navigate(page.path)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
              "bg-muted/60 hover:bg-muted transition-colors",
              "text-xs font-medium text-foreground/80 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            )}
          >
            {page.label}
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          </button>
        ))}
      </div>
    </div>
  );
}
