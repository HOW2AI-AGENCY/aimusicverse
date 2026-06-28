import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickCreatePreset } from "@/constants/quickCreatePresets";
import { Play } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/genreMoodIcons";

interface PresetCardProps {
  preset: QuickCreatePreset;
  onSelect: (preset: QuickCreatePreset) => void;
  isSelected?: boolean;
  className?: string;
}

export function PresetCard({ preset, onSelect, isSelected, className }: PresetCardProps) {
  const Icon = getCategoryIcon(preset.category);
  // Strip leading emoji from preset.name if present (e.g. "🎸 Rock Guitar Track")
  const cleanName = preset.name.replace(/^[^\p{L}\p{N}]+/u, "").trim();

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 hover:shadow-lg",
        "hover:scale-[1.02] active:scale-95",
        isSelected && "ring-2 ring-primary border-primary",
        className,
      )}
      onClick={() => onSelect(preset)}
    >
      <div className="w-12 h-12 mb-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{cleanName || preset.name}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{preset.description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {preset.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
      <Button
        size="sm"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(preset);
        }}
      >
        <Play className="h-4 w-4 mr-2" />
        Создать трек
      </Button>
    </Card>
  );
}
