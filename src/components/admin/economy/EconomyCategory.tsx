/**
 * Economy config category with collapsible items
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EconomyConfigItem } from "./EconomyConfigItem";
import type { EconomyConfigItem as ConfigItem } from "@/hooks/admin/useEconomyConfig";

interface EconomyCategoryProps {
  id: string;
  label: string;
  icon: string;
  items: ConfigItem[];
  onSave: (key: string, value: number) => void;
  isSaving?: boolean;
  defaultExpanded?: boolean;
  defaultValues?: Record<string, number>;
}

export function EconomyCategory({
  id,
  label,
  icon,
  items,
  onSave,
  isSaving,
  defaultExpanded = false,
  defaultValues,
}: EconomyCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Count how many items have changed from defaults
  const changedCount = defaultValues
    ? items.filter((item) => defaultValues[item.key] !== item.value).length
    : 0;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors",
          "hover:bg-accent/50 active:bg-accent",
          "min-h-[56px]" // Touch-friendly
        )}
      >
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">
            {items.length} параметров
            {changedCount > 0 && (
              <span className="text-amber-500 ml-2">
                • {changedCount} изменено
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t px-2 py-2 space-y-1.5 bg-muted/30">
          {items.map((item) => (
            <EconomyConfigItem
              key={item.key}
              configKey={item.key}
              value={item.value}
              description={item.description}
              updatedAt={item.updated_at}
              onSave={(value) => onSave(item.key, value)}
              isSaving={isSaving}
              defaultValue={defaultValues?.[item.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
