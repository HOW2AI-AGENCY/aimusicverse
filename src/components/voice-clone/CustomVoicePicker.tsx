import { Mic2, CheckCircle2, Loader2 } from "@/lib/icons";
import { useCustomVoices, type CustomVoice } from "@/hooks/voice/useCustomVoices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  value?: string | null;
  onChange: (voiceId: string | null) => void;
}

export function CustomVoicePicker({ value, onChange }: Props) {
  const { voices, isLoading } = useCustomVoices();
  const ready = voices.filter((v: CustomVoice) => v.voice_id && v.status === "ready" && v.is_available);

  // Always include the currently-selected voice, even if it's still processing,
  // so the user's selection persists after VoiceCloneWizard completes.
  const selectedPending =
    value && !ready.some((v) => v.voice_id === value)
      ? voices.find((v) => v.voice_id === value) ?? null
      : null;

  const items = selectedPending ? [selectedPending, ...ready] : ready;
  const selected = value ? items.find((v) => v.voice_id === value) : null;
  const isActive = !!selected;
  const isPending = !!selectedPending;

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium flex items-center gap-1">
        <Mic2 className={cn("h-3 w-3", isActive && "text-primary")} />
        Кастомный голос
        {isActive && !isPending && (
          <span className="ml-auto inline-flex items-center gap-1 text-primary text-[10px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            активен
          </span>
        )}
        {isPending && (
          <span className="ml-auto inline-flex items-center gap-1 text-amber-500 text-[10px] font-semibold">
            <Loader2 className="h-3 w-3 animate-spin" />
            готовится
          </span>
        )}
      </label>
      <Select value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? null : v)}>
        <SelectTrigger
          className={cn(isActive && "border-primary/60 ring-1 ring-primary/30 bg-primary/5")}
          aria-label={isActive ? `Выбран голос ${selected?.voice_name}` : "Кастомный голос не выбран"}
        >
          <SelectValue placeholder="Без кастомного голоса" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Без кастомного голоса</SelectItem>
          {isLoading && (
            <SelectItem value="loading" disabled>
              Загрузка…
            </SelectItem>
          )}
          {items.map((v) => {
            const pending = v.status !== "ready" || !v.is_available;
            return (
              <SelectItem key={v.voice_id!} value={v.voice_id!}>
                <span className="inline-flex items-center gap-2">
                  {v.voice_name}
                  {pending && (
                    <span className="text-[10px] text-amber-500 inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      готовится
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
          {!isLoading && items.length === 0 && (
            <SelectItem value="empty" disabled>
              Нет готовых голосов
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {isActive && selected && !isPending && (
        <p className="text-[11px] text-muted-foreground">
          Голос «{selected.voice_name}» будет применён к вокалу при генерации.
        </p>
      )}
      {isPending && selected && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Голос «{selected.voice_name}» ещё обрабатывается. Он будет применён, когда статус станет «готов».
        </p>
      )}
    </div>
  );
}
