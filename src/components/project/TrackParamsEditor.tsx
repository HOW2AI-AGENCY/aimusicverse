import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Gauge, Zap, Mic, Volume2, Link } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface TrackParams {
  bpm_target?: number | null;
  key_signature?: string | null;
  energy_level?: number | null;
  vocal_style?: string | null;
  instrumental_only?: boolean;
  reference_url?: string | null;
}

interface TrackParamsEditorProps {
  params: TrackParams;
  onChange: (params: TrackParams) => void;
  compact?: boolean;
}

const KEY_SIGNATURES = [
  "C",
  "Cm",
  "C#",
  "C#m",
  "D",
  "Dm",
  "D#",
  "D#m",
  "E",
  "Em",
  "F",
  "Fm",
  "F#",
  "F#m",
  "G",
  "Gm",
  "G#",
  "G#m",
  "A",
  "Am",
  "A#",
  "A#m",
  "B",
  "Bm",
];

const VOCAL_STYLES = [
  { value: "auto", label: "Авто", icon: "🎤" },
  { value: "male", label: "Мужской", icon: "👨" },
  { value: "female", label: "Женский", icon: "👩" },
  { value: "duet", label: "Дуэт", icon: "👫" },
  { value: "choir", label: "Хор", icon: "🎶" },
  { value: "rap", label: "Рэп", icon: "🎙️" },
];

export const TrackParamsEditor = memo(function TrackParamsEditor({
  params,
  onChange,
  compact = false,
}: TrackParamsEditorProps) {
  const handleChange = <K extends keyof TrackParams>(key: K, value: TrackParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* BPM Target */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <Gauge className="w-3.5 h-3.5 text-primary" />
          BPM (темп)
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={60}
            max={200}
            value={params.bpm_target || ""}
            onChange={(e) => handleChange("bpm_target", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="120"
            className={cn("w-20", compact && "h-8 text-sm")}
          />
          <Slider
            value={[params.bpm_target || 120]}
            onValueChange={([value]) => handleChange("bpm_target", value)}
            min={60}
            max={200}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{params.bpm_target || 120}</span>
        </div>
      </div>

      {/* Key Signature */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <Music className="w-3.5 h-3.5 text-primary" />
          Тональность
        </Label>
        <Select
          value={params.key_signature || "auto"}
          onValueChange={(value) => handleChange("key_signature", value === "auto" ? null : value)}
        >
          <SelectTrigger className={cn(compact && "h-8 text-sm")}>
            <SelectValue placeholder="Выбрать тональность" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Авто</SelectItem>
            {KEY_SIGNATURES.map((key) => (
              <SelectItem key={key} value={key}>
                {key} {key.includes("m") ? "(минор)" : "(мажор)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Energy Level */}
      <div className="space-y-2">
        <Label className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Уровень энергии
          </span>
          <Badge variant="outline" className="text-xs">
            {params.energy_level || 5}/10
          </Badge>
        </Label>
        <Slider
          value={[params.energy_level || 5]}
          onValueChange={([value]) => handleChange("energy_level", value)}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Спокойный</span>
          <span>Энергичный</span>
        </div>
      </div>

      {/* Vocal Style */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <Mic className="w-3.5 h-3.5 text-primary" />
          Стиль вокала
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {VOCAL_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => handleChange("vocal_style", style.value)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs transition-all",
                params.vocal_style === style.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <span>{style.icon}</span>
              <span>{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Instrumental Only */}
      <div className="flex items-center justify-between py-2">
        <Label className="flex items-center gap-2 text-sm cursor-pointer">
          <Volume2 className="w-3.5 h-3.5 text-primary" />
          Только инструментал
        </Label>
        <Switch
          checked={params.instrumental_only || false}
          onCheckedChange={(checked) => handleChange("instrumental_only", checked)}
        />
      </div>

      {/* Reference URL */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <Link className="w-3.5 h-3.5 text-primary" />
          Референс (URL)
        </Label>
        <Input
          value={params.reference_url || ""}
          onChange={(e) => handleChange("reference_url", e.target.value || null)}
          placeholder="https://youtube.com/watch?v=..."
          className={cn(compact && "h-8 text-sm")}
        />
        <p className="text-[10px] text-muted-foreground">Ссылка на референсный трек для стиля</p>
      </div>
    </div>
  );
});
