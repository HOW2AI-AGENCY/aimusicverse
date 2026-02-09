// ProfileHeader Component - Sprint 011 Task T021
// Displays profile avatar, banner, name, username, and verification badge

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { VerificationBadge } from './VerificationBadge';
import type { ProfileExtended } from '@/types/profile';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';
import { glass } from '@/lib/glass';

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
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Banner Image - Responsive */}
      <div className="relative h-28 sm:h-36 lg:h-44 bg-gradient-to-br from-primary/20 to-primary/10">
        {profile.bannerUrl ? (
          <LazyImage
            src={profile.bannerUrl}
            alt={`${displayName}'s banner`}
            className="h-full w-full object-cover"
            width={1200}
            height={176}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/10" />
        )}
        
        {/* Edit Button (Own Profile Only) */}
        {isOwnProfile && onEditClick && (
          <button
            onClick={onEditClick}
            className={cn(
              "absolute right-3 top-3 lg:right-4 lg:top-4 rounded-lg px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium transition-all hover:bg-background hover:scale-105 min-h-[36px] lg:min-h-[40px]",
              glass.light
            )}
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Info - Responsive */}
      <div className="relative px-4 pb-4 lg:px-6 lg:pb-6">
        {/* Avatar - Overlapping banner */}
        <div className="-mt-10 lg:-mt-14 mb-2 lg:mb-3">
          <Avatar className="h-20 w-20 lg:h-28 lg:w-28 border-3 lg:border-4 border-background shadow-lg">
            <AvatarImage
              src={profile.avatarUrl || profile.photoUrl}
              alt={displayName}
            />
            <AvatarFallback className="text-xl lg:text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Name and Username */}
        <div className="space-y-0.5 lg:space-y-1">
          <div className="flex items-center gap-1.5 lg:gap-2">
            <h1 className="text-lg lg:text-2xl font-bold">{displayName}</h1>
            {profile.isVerified && <VerificationBadge />}
          </div>
          {profile.username && (
            <p className="text-xs lg:text-sm text-muted-foreground">
              @{profile.username}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
