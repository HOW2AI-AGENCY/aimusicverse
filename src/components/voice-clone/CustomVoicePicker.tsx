import { useEffect, useRef } from "react";
import { Mic2, CheckCircle2, Loader2 } from "@/lib/icons";
import { useCustomVoices, type CustomVoice } from "@/hooks/voice/useCustomVoices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getLastVoice, rememberLastVoice } from "@/api/voice-clone.api";

interface Props {
  value?: string | null;
  onChange: (voiceId: string | null) => void;
}

function formatRelative(iso?: string | null): string {
  if (!iso) return "";
  const dt = new Date(iso).getTime();
  if (!Number.isFinite(dt)) return "";
  const diff = Date.now() - dt;
  if (diff < 60_000) return "только что";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export function CustomVoicePicker({ value, onChange }: Props) {
  const { voices, isLoading } = useCustomVoices();
  const ready = voices.filter((v: CustomVoice) => v.voice_id && v.status === "ready" && v.is_available);

  // Restore the voice the user last generated with (once, when nothing is selected yet).
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || value || isLoading) return;
    const last = getLastVoice();
    if (last && ready.some((v) => v.voice_id === last)) {
      restoredRef.current = true;
      onChange(last);
    }
  }, [value, isLoading, ready, onChange]);

  // Always include the currently-selected voice, even if it's still processing,
  // so the user's selection persists after VoiceCloneWizard completes.
  const selectedPending =
    value && !ready.some((v) => v.voice_id === value) ? (voices.find((v) => v.voice_id === value) ?? null) : null;

  const items = selectedPending ? [selectedPending, ...ready] : ready;
  const selected = value ? items.find((v) => v.voice_id === value) : null;
  const isActive = !!selected;
  const isPending = !!selectedPending;
  const pendingRelative = isPending ? formatRelative(selectedPending?.created_at) : "";

  return (
    <div className="space-y-1" data-testid="custom-voice-picker">
      <label className="text-xs font-medium flex items-center gap-1">
        <Mic2 className={cn("h-3 w-3", isActive && "text-primary")} />
        Кастомный голос
        {isActive && !isPending && (
          <span className="ml-auto inline-flex items-center gap-1 text-primary text-[0.625rem] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            активен
          </span>
        )}
        {isPending && (
          <span className="ml-auto inline-flex items-center gap-1 text-amber-500 text-[0.625rem] font-semibold">
            <Loader2 className="h-3 w-3 animate-spin" />
            готовится
          </span>
        )}
      </label>
      <Select value={value ?? "none"} onValueChange={(v) => {
          const next = v === "none" ? null : v;
          restoredRef.current = true;
          rememberLastVoice(next);
          onChange(next);
        }}>
        <SelectTrigger
          className={cn(
            isActive && "border-primary/60 ring-1 ring-primary/30 bg-primary/5",
            isPending && "border-amber-500/50 ring-1 ring-amber-500/20 bg-amber-500/5",
          )}
          aria-label={isActive ? `Выбран голос ${selected?.voice_name}` : "Кастомный голос не выбран"}
          data-testid="custom-voice-picker-trigger"
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
            // Pending items are non-selectable in the list (because they aren't usable yet),
            // BUT if the currently-active value is this pending voice, we keep it visible
            // and selectable so the form's selection survives re-opens.
            const keepEnabled = v.voice_id === value;
            return (
              <SelectItem
                key={v.voice_id!}
                value={v.voice_id!}
                disabled={pending && !keepEnabled}
                data-testid="custom-voice-option"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="truncate max-w-[180px]">{v.voice_name}</span>
                  {pending && (
                    <span className="text-[0.625rem] text-amber-500 inline-flex items-center gap-1">
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
        <p className="text-[0.6875rem] text-muted-foreground">
          Голос «{selected.voice_name}» будет применён к вокалу при генерации.
        </p>
      )}
      {isPending && selected && (
        <p className="text-[0.6875rem] text-amber-600 dark:text-amber-400">
          Голос «{selected.voice_name}» ещё обрабатывается{pendingRelative ? ` · создан ${pendingRelative}` : ""}. Выбор
          сохранён — он подключится автоматически, как только статус станет «готов».
        </p>
      )}
    </div>
  );
}
