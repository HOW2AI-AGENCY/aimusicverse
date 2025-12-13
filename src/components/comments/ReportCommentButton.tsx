// ReportCommentButton Component - Sprint 011 Task T090
// Report inappropriate comments with reason selection

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTelegram } from '@/contexts/TelegramContext';

interface ReportCommentButtonProps {
  commentId: string;
  commentAuthorId: string;
  className?: string;
  variant?: 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'spam',
    label: 'Спам',
    description: 'Нежелательная реклама или повторяющийся контент',
  },
  {
    value: 'harassment',
    label: 'Оскорбления',
    description: 'Оскорбительные или угрожающие высказывания',
  },
  {
    value: 'inappropriate',
    label: 'Неподобающий контент',
    description: 'Контент для взрослых или нарушение правил',
  },
  {
    value: 'other',
    label: 'Другое',
    description: 'Другая причина жалобы',
  },
];

/**
 * Report comment button with reason modal
 */
export function ReportCommentButton({
  commentId,
  commentAuthorId,
  className,
  variant = 'ghost',
  size = 'sm',
  showIcon = true,
}: ReportCommentButtonProps) {
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Cannot report own comments
      if (user.id === commentAuthorId) {
        throw new Error('Cannot report own comment');
      }

      const { error } = await supabase.from('moderation_reports').insert({
        reporter_id: user.id,
        entity_type: 'comment',
        entity_id: commentId,
        reported_user_id: commentAuthorId,
        reason,
        details: details.trim() || null,
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      hapticFeedback('success');
      toast.success('Жалоба отправлена', {
        description: 'Модераторы рассмотрят вашу жалобу в ближайшее время',
      });
      setShowDialog(false);
      setReason('spam');
      setDetails('');
    },
    onError: (error: any) => {
      console.error('Report error:', error);
      hapticFeedback('error');
      
      if (error.message === 'Cannot report own comment') {
        toast.error('Нельзя пожаловаться на свой комментарий');
      } else {
        toast.error('Не удалось отправить жалобу');
      }
    },
  });

  const handleReport = () => {
    if (!user) {
      toast.error('Войдите, чтобы отправить жалобу');
      return;
    }

    reportMutation.mutate();
  };

  // Don't show button for own comments
  if (user?.id === commentAuthorId) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          hapticFeedback('light');
          setShowDialog(true);
        }}
      >
        {showIcon && <Flag className="w-4 h-4" />}
        {size !== 'icon' && <span className="ml-2">Пожаловаться</span>}
      </Button>

      {/* Report Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пожаловаться на комментарий</DialogTitle>
            <DialogDescription>
              Выберите причину жалобы. Модераторы рассмотрят её в ближайшее время.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Reason Selection */}
            <div className="space-y-3">
              <Label>Причина жалобы</Label>
              <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
                {REPORT_REASONS.map((item) => (
                  <div key={item.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={item.value} id={item.value} className="mt-1" />
                    <Label
                      htmlFor={item.value}
                      className="flex-1 cursor-pointer leading-normal"
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="details">Дополнительная информация (необязательно)</Label>
              <Textarea
                id="details"
                placeholder="Опишите проблему подробнее..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{details.length}/500</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                hapticFeedback('light');
                setShowDialog(false);
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleReport} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? 'Отправка...' : 'Отправить жалобу'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
