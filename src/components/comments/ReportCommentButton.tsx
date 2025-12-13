import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import { toast } from 'sonner';
import { Flag, Loader2 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ReportCommentButtonProps {
  commentId: string;
  commentAuthorId: string;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'other';

interface ReportData {
  entity_type: 'comment';
  entity_id: string;
  reason: ReportReason;
  description?: string;
}

export function ReportCommentButton({
  commentId,
  commentAuthorId,
  variant = 'ghost',
  size = 'sm',
  className,
}: ReportCommentButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');

  // Report comment mutation
  const reportMutation = useMutation({
    mutationFn: async (reportData: ReportData) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Insert with conflict handling (relies on unique constraint)
      const { error } = await supabase
        .from('moderation_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: commentAuthorId,
          entity_type: reportData.entity_type,
          entity_id: reportData.entity_id,
          reason: reportData.reason,
          description: reportData.description,
          status: 'pending',
        });

      // Check if error is due to unique constraint violation
      if (error) {
        if (error.code === '23505') { // Postgres unique violation code
          throw new Error('You have already reported this comment');
        }
        throw error;
      }
    },
    onSuccess: () => {
      triggerHapticFeedback('success');
      toast.success('Report submitted. Thank you for helping keep our community safe.');
      setShowDialog(false);
      setReason('spam');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
    },
    onError: (error: any) => {
      triggerHapticFeedback('error');
      if (error.message.includes('already reported')) {
        toast.error('You have already reported this comment');
      } else {
        toast.error('Failed to submit report');
      }
      console.error('Report comment error:', error);
    },
  });

  const handleSubmit = () => {
    if (reason === 'other' && !description.trim()) {
      toast.error('Please provide additional details');
      return;
    }

    if (description.length > 500) {
      toast.error('Description must be less than 500 characters');
      return;
    }

    reportMutation.mutate({
      entity_type: 'comment',
      entity_id: commentId,
      reason,
      description: description.trim() || undefined,
    });
  };

  // Don't show button for own comments
  if (!user || commentAuthorId === user.id) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        className={className}
      >
        <Flag className="h-4 w-4 mr-2" />
        Report
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this comment. Reports are reviewed by our moderation team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Report Reason */}
            <div className="space-y-3">
              <Label>Reason for reporting</Label>
              <RadioGroup value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spam" id="spam" />
                  <Label htmlFor="spam" className="font-normal cursor-pointer">
                    Spam or misleading content
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harassment" id="harassment" />
                  <Label htmlFor="harassment" className="font-normal cursor-pointer">
                    Harassment or bullying
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate_content" id="inappropriate" />
                  <Label htmlFor="inappropriate" className="font-normal cursor-pointer">
                    Inappropriate or offensive content
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">
                    Other (please specify below)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Additional details {reason === 'other' && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="description"
                placeholder={
                  reason === 'other'
                    ? 'Please describe the issue...'
                    : 'Optional: Provide more context...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={reportMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={reportMutation.isPending}>
              {reportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
