/**
 * TrackRemixToggle - Allow remix toggle for track owner
 */

import { memo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Lock, Unlock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackRemixToggleProps {
  trackId: string;
  allowRemix: boolean | null | undefined;
  isOwner: boolean;
  isPublic: boolean | null | undefined;
}

export const TrackRemixToggle = memo(function TrackRemixToggle({
  trackId,
  allowRemix,
  isOwner,
  isPublic,
}: TrackRemixToggleProps) {
  const queryClient = useQueryClient();
  
  const toggleRemixMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      const { error } = await supabase
        .from('tracks')
        .update({ allow_remix: newValue })
        .eq('id', trackId);
      if (error) throw error;
      return newValue;
    },
    onSuccess: (newValue) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success(newValue ? 'Ремикс разрешён' : 'Ремикс запрещён');
    },
    onError: () => {
      toast.error('Ошибка обновления настроек');
    },
  });

  // Only show for owner of public tracks
  if (!isOwner || !isPublic) return null;

  const isAllowed = allowRemix !== false;

  return (
    <>
      <Separator />
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-3">
          {isAllowed ? (
            <Unlock className="w-5 h-5 text-green-500" />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="allow-remix" className="text-sm font-medium">
              Разрешить ремиксы
            </Label>
            <p className="text-xs text-muted-foreground">
              Другие пользователи смогут создавать ремиксы
            </p>
          </div>
        </div>
        <Switch
          id="allow-remix"
          checked={isAllowed}
          onCheckedChange={(checked) => toggleRemixMutation.mutate(checked)}
          disabled={toggleRemixMutation.isPending}
        />
      </div>
    </>
  );
});
