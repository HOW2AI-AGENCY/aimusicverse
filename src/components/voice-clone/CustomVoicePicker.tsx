import { Mic2 } from 'lucide-react';
import { useCustomVoices, type CustomVoice } from '@/hooks/voice/useCustomVoices';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  value?: string | null;
  onChange: (voiceId: string | null) => void;
}

export function CustomVoicePicker({ value, onChange }: Props) {
  const { voices, isLoading } = useCustomVoices();
  const ready = voices.filter((v: CustomVoice) => v.voice_id && v.status === 'ready' && v.is_available);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium flex items-center gap-1"><Mic2 className="h-3 w-3" />Кастомный голос</label>
      <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
        <SelectTrigger><SelectValue placeholder="Без кастомного голоса" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Без кастомного голоса</SelectItem>
          {isLoading && <SelectItem value="loading" disabled>Загрузка…</SelectItem>}
          {ready.map((v) => (
            <SelectItem key={v.voice_id!} value={v.voice_id!}>{v.voice_name}</SelectItem>
          ))}
          {!isLoading && ready.length === 0 && <SelectItem value="empty" disabled>Нет готовых голосов</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );
}
