import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { NoteType } from "@/types/studio-entities";
import { cn } from "@/lib/utils";
import { NoteFilters, NOTE_TYPES } from "./types";

interface NoteFilterPanelProps {
  filters: NoteFilters;
  onFilterChange: (filters: NoteFilters) => void;
  onReset: () => void;
}

export const NoteFilterPanel = ({ filters, onFilterChange, onReset }: NoteFilterPanelProps) => {
  const haptic = useHapticFeedback();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Тип</label>
          <Select
            value={filters.type}
            onValueChange={(v) => {
              haptic.tap();
              onFilterChange({ ...filters, type: v as NoteType | "all" });
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {NOTE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className={cn("flex items-center gap-2", type.color)}>
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Статус</label>
          <Select
            value={filters.resolved}
            onValueChange={(v) => {
              haptic.tap();
              onFilterChange({ ...filters, resolved: v as NoteFilters["resolved"] });
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="unresolved">Нерешённые</SelectItem>
              <SelectItem value="resolved">Решённые</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onReset}>
        Сбросить фильтры
      </Button>
    </motion.div>
  );
};
