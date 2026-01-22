/**
 * Single economy config item with inline editing
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONFIG_LABELS } from "@/hooks/admin/useEconomyConfig";
import { formatDistanceToNow, ru } from "@/lib/date-utils";

interface EconomyConfigItemProps {
  configKey: string;
  value: number;
  description: string | null;
  updatedAt: string | null;
  onSave: (value: number) => void;
  isSaving?: boolean;
  defaultValue?: number;
}

export function EconomyConfigItem({
  configKey,
  value,
  description,
  updatedAt,
  onSave,
  isSaving,
  defaultValue,
}: EconomyConfigItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  
  // Reset edit value when actual value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  const label = CONFIG_LABELS[configKey] || configKey;
  const hasChanged = defaultValue !== undefined && value !== defaultValue;

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(numValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleReset = () => {
    if (defaultValue !== undefined) {
      onSave(defaultValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors min-h-[56px]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{label}</span>
          {hasChanged && (
            <span className="text-xs text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
              изменено
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {description}
          </p>
        )}
        {updatedAt && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ru })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {isEditing ? (
          <>
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-20 h-9 text-center text-sm"
              min="0"
              step="1"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <div
              onClick={() => setIsEditing(true)}
              className={cn(
                "min-w-[60px] h-9 px-3 flex items-center justify-center rounded-md cursor-pointer transition-colors",
                "bg-primary/10 text-primary font-mono text-sm font-medium",
                "hover:bg-primary/20"
              )}
            >
              {value}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {hasChanged && defaultValue !== undefined && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleReset}
                className="h-9 w-9 text-muted-foreground hover:text-amber-500"
                title={`Сбросить к ${defaultValue}`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
