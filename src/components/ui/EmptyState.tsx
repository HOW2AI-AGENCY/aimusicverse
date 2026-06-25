/**
 * @deprecated Use `UnifiedEmptyState` from `@/components/ui/unified-empty-state`.
 * Thin compatibility shim. Removed in Phase 10 of `docs/UI_AUDIT.md`.
 */
import { memo, type ReactNode } from "react";
import type { LucideIcon } from "@/lib/icons";
import { Music2, Search, Library, Mic2 } from "@/lib/icons";
import { UnifiedEmptyState } from "@/components/ui/unified-empty-state";

type EmptyStateVariant = "search" | "library" | "tracks" | "projects" | "lyrics" | "custom";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon | ReactNode;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  secondaryAction?: { label: string; onClick: () => void };
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}

const variantDefaults: Record<
  Exclude<EmptyStateVariant, "custom">,
  { icon: LucideIcon; title: string; description: string }
> = {
  search: { icon: Search, title: "Ничего не найдено", description: "Попробуйте изменить поисковый запрос или фильтры" },
  library: { icon: Library, title: "Библиотека пуста", description: "Создайте свой первый трек с помощью AI" },
  tracks: { icon: Music2, title: "Нет треков", description: "Здесь будут отображаться ваши музыкальные треки" },
  projects: { icon: Library, title: "Нет проектов", description: "Создайте свой первый проект" },
  lyrics: { icon: Mic2, title: "Нет текстов", description: "Создайте свой первый текст" },
};

export const EmptyState = memo(function EmptyState({
  variant = "custom",
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  children,
}: EmptyStateProps) {
  const preset = variant !== "custom" ? variantDefaults[variant] : null;
  return (
    <UnifiedEmptyState
      type="custom"
      icon={icon ?? preset?.icon}
      title={title ?? preset?.title}
      description={description ?? preset?.description}
      action={action}
      secondaryAction={secondaryAction}
      size={size}
      className={className}
    >
      {children}
    </UnifiedEmptyState>
  );
});

export default EmptyState;
