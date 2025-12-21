/**
 * TagBadge - Displays a tag with category icon and color
 * 
 * Supports:
 * - Single tags with category-based colors and icons
 * - Compound tags displayed as a gradient badge
 * - Delete button for removing tags
 */

import { X, Mic, Guitar, Volume2, Heart, Sliders, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TAG_CATEGORIES, getTagDefinition, type TagCategory } from '@/lib/lyrics/constants';

// Icon map for categories
const CATEGORY_ICONS: Record<TagCategory, React.ElementType> = {
  vocal: Mic,
  instrument: Guitar,
  dynamic: Volume2,
  mood: Heart,
  production: Sliders,
  structure: Layers,
};

interface TagBadgeProps {
  tag: string;
  category?: TagCategory;
  onRemove?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, category, onRemove, className, size = 'sm' }: TagBadgeProps) {
  // Auto-detect category if not provided
  const resolvedCategory = category || getTagDefinition(tag)?.category || 'mood';
  const categoryInfo = TAG_CATEGORIES[resolvedCategory];
  const Icon = CATEGORY_ICONS[resolvedCategory];

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 pr-1 font-normal transition-colors",
        size === 'sm' ? "text-xs h-6" : "text-sm h-7",
        categoryInfo.colorClass,
        "text-white border-0",
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5")} />
      <span>{tag}</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full bg-white/20 hover:bg-white/30 ml-0.5",
            size === 'sm' ? "h-4 w-4" : "h-5 w-5"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className={cn(size === 'sm' ? "w-2.5 h-2.5" : "w-3 h-3")} />
        </Button>
      )}
    </Badge>
  );
}

interface CompoundTagBadgeProps {
  tags: string[];
  onRemove?: () => void;
  className?: string;
}

export function CompoundTagBadge({ tags, onRemove, className }: CompoundTagBadgeProps) {
  if (tags.length === 0) return null;
  
  if (tags.length === 1) {
    return <TagBadge tag={tags[0]} onRemove={onRemove} className={className} />;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs gap-1 pr-1 font-normal",
        "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20",
        "border-primary/30 text-foreground",
        className
      )}
    >
      <Layers className="w-3 h-3 text-primary" />
      <span>[{tags.join(', ')}]</span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 rounded-full hover:bg-primary/20 ml-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-2.5 h-2.5" />
        </Button>
      )}
    </Badge>
  );
}

interface TagListProps {
  tags: string[];
  onRemoveTag?: (tag: string) => void;
  className?: string;
  showCompound?: boolean;
}

export function TagList({ tags, onRemoveTag, className, showCompound = false }: TagListProps) {
  if (tags.length === 0) return null;

  // If showCompound and more than one tag, display as compound
  if (showCompound && tags.length > 1) {
    return (
      <div className={cn("flex flex-wrap gap-1", className)}>
        <CompoundTagBadge 
          tags={tags} 
          onRemove={onRemoveTag ? () => tags.forEach(t => onRemoveTag(t)) : undefined} 
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map(tag => (
        <TagBadge
          key={tag}
          tag={tag}
          onRemove={onRemoveTag ? () => onRemoveTag(tag) : undefined}
        />
      ))}
    </div>
  );
}
