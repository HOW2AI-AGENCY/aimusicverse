import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { PrivacyLevel } from '@/types/profile';

interface PrivacySettingsData {
  privacy_level: PrivacyLevel;
  track_visibility: PrivacyLevel;
  comment_permissions: 'everyone' | 'followers' | 'off';
  show_activity: boolean;
}

export function PrivacySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<PrivacySettingsData | null>(null);

  // Fetch current privacy settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['privacy-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_level, privacy_settings')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const privacySettings = (data.privacy_settings as any) || {};
      
      return {
        privacy_level: data.privacy_level || 'public',
        track_visibility: privacySettings.track_visibility || 'public',
        comment_permissions: privacySettings.comment_permissions || 'everyone',
        show_activity: privacySettings.show_activity !== false,
      } as PrivacySettingsData;
    },
    enabled: !!user?.id,
  });

  // Update privacy settings mutation
  const updateMutation = useMutation({
    mutationFn: async (newSettings: PrivacySettingsData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_level: newSettings.privacy_level,
          privacy_settings: {
            track_visibility: newSettings.track_visibility,
            comment_permissions: newSettings.comment_permissions,
            show_activity: newSettings.show_activity,
          },
        })
        .eq('id', user.id);

      if (error) throw error;
      return newSettings;
    },
    onMutate: async (newSettings) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['privacy-settings', user?.id] });
      const previous = queryClient.getQueryData(['privacy-settings', user?.id]);
      queryClient.setQueryData(['privacy-settings', user?.id], newSettings);
      return { previous };
    },
    onError: (err, newSettings, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['privacy-settings', user?.id], context.previous);
      }
      toast.error('Failed to update privacy settings');
      console.error('Privacy settings update error:', err);
    },
    onSuccess: () => {
      toast.success('Privacy settings updated');
      queryClient.invalidateQueries({ queryKey: ['privacy-settings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const currentSettings = localSettings || settings;

  const handleSave = () => {
    if (!currentSettings) return;
    updateMutation.mutate(currentSettings);
  };

  const updateLocalSetting = <K extends keyof PrivacySettingsData>(
    key: K,
    value: PrivacySettingsData[K]
  ) => {
    setLocalSettings((prev) => ({
      ...(prev || settings || {} as PrivacySettingsData),
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentSettings) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Failed to load privacy settings
      </div>
    );
  }

  const hasChanges = localSettings !== null;

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Control who can see your profile, tracks, and activity
        </p>
      </div>

      {/* Profile Visibility */}
      <div className="space-y-2">
        <Label htmlFor="profile-visibility">Profile Visibility</Label>
        <Select
          value={currentSettings.privacy_level}
          onValueChange={(value) => updateLocalSetting('privacy_level', value as PrivacyLevel)}
        >
          <SelectTrigger id="profile-visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public - Anyone can view</SelectItem>
            <SelectItem value="followers">Followers Only - Only followers can view</SelectItem>
            <SelectItem value="private">Private - Only you can view</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Controls who can see your profile information
        </p>
      </div>

      {/* Track Visibility */}
      <div className="space-y-2">
        <Label htmlFor="track-visibility">Track Visibility</Label>
        <Select
          value={currentSettings.track_visibility}
          onValueChange={(value) => updateLocalSetting('track_visibility', value as PrivacyLevel)}
        >
          <SelectTrigger id="track-visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public - Anyone can listen</SelectItem>
            <SelectItem value="followers">Followers Only - Only followers can listen</SelectItem>
            <SelectItem value="private">Private - Only you can listen</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Controls who can view and play your tracks
        </p>
      </div>

      {/* Comment Permissions */}
      <div className="space-y-2">
        <Label htmlFor="comment-permissions">Comment Permissions</Label>
        <Select
          value={currentSettings.comment_permissions}
          onValueChange={(value) =>
            updateLocalSetting('comment_permissions', value as 'everyone' | 'followers' | 'off')
          }
        >
          <SelectTrigger id="comment-permissions">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="everyone">Everyone - Anyone can comment</SelectItem>
            <SelectItem value="followers">Followers Only - Only followers can comment</SelectItem>
            <SelectItem value="off">Off - Comments disabled</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Controls who can comment on your tracks
        </p>
      </div>

      {/* Show Activity */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="show-activity">Show Activity</Label>
          <p className="text-xs text-muted-foreground">
            Allow others to see your likes and comments
          </p>
        </div>
        <Switch
          id="show-activity"
          checked={currentSettings.show_activity}
          onCheckedChange={(checked) => updateLocalSetting('show_activity', checked)}
        />
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocalSettings(null)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
