import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from '@/hooks/useTracksOptimized';
import { AlertTriangle, Flag, Loader2 } from 'lucide-react';

const REPORT_REASONS = [
  { value: 'copyright', label: 'Нарушение авторских прав' },
  { value: 'inappropriate', label: 'Неприемлемый контент' },
  { value: 'spam', label: 'Спам или мошенничество' },
  { value: 'hate', label: 'Разжигание ненависти' },
  { value: 'other', label: 'Другое' },
];

interface ReportTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function ReportTrackDialog({ open, onOpenChange, track }: ReportTrackDialogProps) {
  const isMobile = useIsMobile();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Выберите причину жалобы');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходима авторизация');
        return;
      }

      const { error } = await supabase
        .from('moderation_reports')
        .insert({
          reporter_id: user.id,
          entity_type: 'track',
          entity_id: track.id,
          reported_user_id: track.user_id,
          reason,
          details: details || null,
        });

      if (error) throw error;

      toast.success('Жалоба отправлена. Мы рассмотрим её в ближайшее время.');
      onOpenChange(false);
      setReason('');
      setDetails('');
    } catch (error: any) {
      console.error('Report error:', error);
      toast.error('Не удалось отправить жалобу');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Пожаловаться на трек "{track.title || 'Без названия'}"
        </p>
      </div>

      <div className="space-y-3">
        <Label>Причина жалобы *</Label>
        <RadioGroup value={reason} onValueChange={setReason}>
          {REPORT_REASONS.map((r) => (
            <div key={r.value} className="flex items-center space-x-2">
              <RadioGroupItem value={r.value} id={r.value} />
              <Label htmlFor={r.value} className="font-normal cursor-pointer">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">Дополнительная информация</Label>
        <Textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Опишите проблему подробнее..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Отмена
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting || !reason}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Flag className="h-4 w-4 mr-2" />
          )}
          Отправить
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Пожаловаться
            </DrawerTitle>
            <DrawerDescription>
              Сообщите о нарушении правил сообщества
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Пожаловаться
          </DialogTitle>
          <DialogDescription>
            Сообщите о нарушении правил сообщества
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
