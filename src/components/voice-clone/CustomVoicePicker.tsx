import { useEffect, useRef, useState } from "react";
import { Mic2, CheckCircle2, Loader2, ChevronRight } from "@/lib/icons";
import { useCustomVoices, type CustomVoice } from "@/hooks/voice/useCustomVoices";
import { cn } from "@/lib/utils";
import { getLastVoice, rememberLastVoice } from "@/api/voice-clone.api";
import { VoiceCloneWizard } from "./VoiceCloneWizard";

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

/**
 * Compact voice field. Selection AND creation both live in a single panel
 * (VoiceCloneWizard): the user either picks an existing ready voice or records
 * a new one without leaving the window.
 */
export function CustomVoicePicker({ value, onChange }: Props) {
  const { voices, isLoading } = useCustomVoices();
  const [panelOpen, setPanelOpen] = useState(false);
  const [disclaimerTrigger, setDisclaimerTrigger] = useState(0);

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

  const selectedPending =
    value && !ready.some((v) => v.voice_id === value) ? (voices.find((v) => v.voice_id === value) ?? null) : null;
  const selected = value ? (ready.find((v) => v.voice_id === value) ?? selectedPending) : null;
  const isActive = !!selected;
  const isPending = !!selectedPending;
  const pendingRelative = isPending ? formatRelative(selectedPending?.created_at) : "";

  const select = (next: string | null) => {
    restoredRef.current = true;
    rememberLastVoice(next);
    onChange(next);
    // Occasional reminder (max once per 7 days) that cloning copies timbre/style
    if (next) setDisclaimerTrigger((n) => n + 1);
  };


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

      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        data-testid="custom-voice-picker-trigger"
        aria-label={isActive ? `Выбран голос ${selected?.voice_name}` : "Кастомный голос не выбран"}
        className={cn(
          "w-full flex items-center gap-2 h-11 px-3 rounded-xl border bg-muted/30 text-left text-sm transition-colors",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          isActive && "border-primary/60 ring-1 ring-primary/30 bg-primary/5",
          isPending && "border-amber-500/50 ring-1 ring-amber-500/20 bg-amber-500/5",
        )}
      >
        <span className="flex-1 truncate">{selected ? selected.voice_name : "Без кастомного голоса"}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

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

      {panelOpen && (
        <VoiceCloneWizard
          open={panelOpen}
          onOpenChange={setPanelOpen}
          selectedVoiceId={value ?? null}
          onSelectVoice={select}
          onComplete={(voiceId) => select(voiceId)}
        />
      )}
    </div>
  );
}
