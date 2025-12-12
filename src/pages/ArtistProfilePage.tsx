// ArtistProfilePage Component - Sprint 011 Task T030
// Artist profile view with header, stats, bio, social links, and tracks

import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileBio } from '@/components/profile/ProfileBio';
import { SocialLinks } from '@/components/profile/SocialLinks';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { useProfile } from '@/hooks/profile/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from '@/lib/motion';
import { VirtualizedTrackList } from '@/components/library/VirtualizedTrackList';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ArtistProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(userId || '');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = user?.id === userId;

  // Fetch user's tracks
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['user-tracks', userId, isOwnProfile],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('tracks')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['completed', 'streaming_ready'])
        .order('created_at', { ascending: false });

      // Only show public tracks if not own profile
      if (!isOwnProfile) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tracks:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!userId,
  });

  if (profileLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 pb-24">
        <Skeleton className="w-full h-48 mb-4" />
        <Skeleton className="w-full h-32 mb-4" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">
            This profile does not exist or is private.
          </p>
        </div>
      </div>
    );
  }

  // Check privacy settings
  if (!isOwnProfile && profile.privacyLevel === 'private') {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Private Profile</h2>
          <p className="text-muted-foreground">
            This profile is private and cannot be viewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Profile Header with Banner and Avatar */}
        <ProfileHeader profile={profile} />

        {/* Edit Button - Only visible on own profile */}
        {isOwnProfile && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}

        {/* Profile Stats */}
        <ProfileStats
          stats={profile.stats}
          userId={userId || ''}
        />

        {/* Bio */}
        {profile.bio && <ProfileBio bio={profile.bio} />}

        {/* Social Links */}
        {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
          <SocialLinks socialLinks={profile.socialLinks} />
        )}

        {/* Tracks Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">
            {isOwnProfile ? 'Your Tracks' : 'Tracks'}
          </h2>
          {tracksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-24" />
              ))}
            </div>
          ) : tracks && tracks.length > 0 ? (
            <VirtualizedTrackList
              tracks={tracks}
              emptyMessage={
                isOwnProfile
                  ? 'You haven't created any tracks yet'
                  : 'No public tracks available'
              }
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {isOwnProfile
                ? 'You haven't created any tracks yet'
                : 'No public tracks available'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Profile Dialog */}
      <ProfileEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </div>
  );
}

export default ArtistProfilePage;
