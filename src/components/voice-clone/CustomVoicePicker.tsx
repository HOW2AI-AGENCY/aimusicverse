import { Mic2, CheckCircle2 } from 'lucide-react';
import { useCustomVoices, type CustomVoice } from '@/hooks/voice/useCustomVoices';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  value?: string | null;
  onChange: (voiceId: string | null) => void;
}

export function CustomVoicePicker({ value, onChange }: Props) {
  const { voices, isLoading } = useCustomVoices();
  const ready = voices.filter((v: CustomVoice) => v.voice_id && v.status === 'ready' && v.is_available);
  const selected = value ? ready.find((v) => v.voice_id === value) : null;
  const isActive = !!selected;

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium flex items-center gap-1">
        <Mic2 className={cn('h-3 w-3', isActive && 'text-primary')} />
        Кастомный голос
        {isActive && (
          <span className="ml-auto inline-flex items-center gap-1 text-primary text-[10px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            активен
          </span>
        )}
      </label>
      <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
        <SelectTrigger
          className={cn(
            isActive && 'border-primary/60 ring-1 ring-primary/30 bg-primary/5'
          )}
          aria-label={isActive ? `Выбран голос ${selected?.voice_name}` : 'Кастомный голос не выбран'}
        >
          <SelectValue placeholder="Без кастомного голоса" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Без кастомного голоса</SelectItem>
          {isLoading && <SelectItem value="loading" disabled>Загрузка…</SelectItem>}
          {ready.map((v) => (
            <SelectItem key={v.voice_id!} value={v.voice_id!}>{v.voice_name}</SelectItem>
          ))}
          {!isLoading && ready.length === 0 && <SelectItem value="empty" disabled>Нет готовых голосов</SelectItem>}
        </SelectContent>
      </Select>
      {isActive && selected && (
        <p className="text-[11px] text-muted-foreground">
          Голос «{selected.voice_name}» будет применён к вокалу при генерации.
        </p>
      )}
    </div>
  );
}

