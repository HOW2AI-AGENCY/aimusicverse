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
      {/* Banner Image - Compact */}
      <div className="relative h-28 sm:h-36 bg-gradient-to-br from-primary/20 to-primary/10">
        {profile.bannerUrl ? (
          <LazyImage
            src={profile.bannerUrl}
            alt={`${displayName}'s banner`}
            className="h-full w-full object-cover"
            width={1200}
            height={144}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/10" />
        )}
        
        {/* Edit Button (Own Profile Only) */}
        {isOwnProfile && onEditClick && (
          <button
            onClick={onEditClick}
            className="absolute right-3 top-3 rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-background min-h-[36px]"
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Info - Compact */}
      <div className="relative px-4 pb-4">
        {/* Avatar - Overlapping banner */}
        <div className="-mt-10 mb-2">
          <Avatar className="h-20 w-20 border-3 border-background">
            <AvatarImage
              src={profile.avatarUrl || profile.photoUrl}
              alt={displayName}
            />
            <AvatarFallback className="text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name and Username */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold">{displayName}</h1>
            {profile.isVerified && <VerificationBadge />}
          </div>
          {profile.username && (
            <p className="text-xs text-muted-foreground">
              @{profile.username}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
