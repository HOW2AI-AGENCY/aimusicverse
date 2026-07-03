import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disc, ArrowRight } from "@/lib/icons";

export type AudioMode = "cover" | "extend";

const MODE_CONFIG = {
  cover: { icon: Disc, label: "Кавер", desc: "Новая версия в другом стиле" },
  extend: { icon: ArrowRight, label: "Расширить", desc: "Продолжить композицию" },
} as const;

interface AudioActionModeTabsSectionProps {
  mode: AudioMode;
  onModeChange: (mode: AudioMode) => void;
}

/** Cover/extend mode picker shown once the reference audio has been analyzed. */
export function AudioActionModeTabsSection({ mode, onModeChange }: AudioActionModeTabsSectionProps) {
  return (
    <>
      <div className="text-center text-xs text-muted-foreground mb-2">Выберите действие:</div>
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as AudioMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          {(["cover", "extend"] as const).map((m) => {
            const cfg = MODE_CONFIG[m];
            const Icon = cfg.icon;
            return (
              <TabsTrigger
                key={m}
                value={m}
                className="flex items-center gap-2 text-sm data-[state=active]:bg-primary/10"
              >
                <Icon className="w-4 h-4" />
                <span>{cfg.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <p className="text-xs text-muted-foreground text-center">{MODE_CONFIG[mode].desc}</p>
    </>
  );
}
