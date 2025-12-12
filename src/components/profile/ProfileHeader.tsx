// ProfileHeader Component - Sprint 011 Task T021
// Displays profile avatar, banner, name, username, and verification badge

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { VerificationBadge } from './VerificationBadge';
import type { ProfileExtended } from '@/types/profile';
import { LazyImage } from '@/components/ui/lazy-image';

interface ProfileHeaderProps {
  profile: ProfileExtended;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
}

export function ProfileHeader({
  profile,
  isOwnProfile = false,
  onEditClick,
}: ProfileHeaderProps) {
  const displayName = profile.displayName || profile.firstName;
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden">
      {/* Banner Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/10">
        {profile.bannerUrl ? (
          <LazyImage
            src={profile.bannerUrl}
            alt={`${displayName}'s banner`}
            className="h-full w-full object-cover"
            width={1200}
            height={200}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/10" />
        )}
        
        {/* Edit Button (Own Profile Only) */}
        {isOwnProfile && onEditClick && (
          <button
            onClick={onEditClick}
            className="absolute right-4 top-4 rounded-lg bg-background/80 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-6">
        {/* Avatar - Overlapping banner */}
        <div className="-mt-16 mb-4">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage
              src={profile.avatarUrl || profile.photoUrl}
              alt={displayName}
            />
            <AvatarFallback className="text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name and Username */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {profile.isVerified && <VerificationBadge />}
          </div>
          {profile.username && (
            <p className="text-sm text-muted-foreground">
              @{profile.username}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
