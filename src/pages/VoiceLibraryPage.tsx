import { useState } from 'react';
import { Mic2, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomVoices, type CustomVoice } from '@/hooks/voice/useCustomVoices';
import { VoiceCloneWizard } from '@/components/voice-clone/VoiceCloneWizard';

function statusBadge(v: CustomVoice) {
  if (v.status === 'ready') return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />готов</Badge>;
  if (v.status === 'failed') return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />ошибка</Badge>;
  return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{v.status}</Badge>;
}

export default function VoiceLibraryPage() {
  const { voices, isLoading, deleteVoice, isDeleting } = useCustomVoices();
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Mic2 className="h-6 w-6" />Голоса</h1>
          <p className="text-sm text-muted-foreground">Создавайте кастомные голоса и используйте их в генерации</p>
        </div>
        <Button onClick={() => setWizardOpen(true)}><Plus className="mr-2 h-4 w-4" />Новый голос</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Загрузка…</p>}

      {!isLoading && voices.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Mic2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>У вас пока нет кастомных голосов</p>
          <Button className="mt-4" onClick={() => setWizardOpen(true)}>Создать первый</Button>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {voices.map((v) => (
          <Card key={v.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{v.voice_name}</h3>
                {v.description && <p className="text-xs text-muted-foreground truncate">{v.description}</p>}
              </div>
              {statusBadge(v)}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {v.language && <div>Язык: {v.language}</div>}
              {v.voice_id && <div className="truncate">ID: {v.voice_id}</div>}
              <div>Использован: {v.usage_count} раз</div>
            </div>
            {v.error_message && <p className="text-xs text-destructive">{v.error_message}</p>}
            <Button size="sm" variant="ghost" disabled={isDeleting}
              onClick={() => { if (confirm(`Удалить голос «${v.voice_name}»?`)) deleteVoice(v.id); }}>
              <Trash2 className="mr-2 h-3 w-3" />Удалить
            </Button>
          </Card>
        ))}
      </div>

      <VoiceCloneWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
