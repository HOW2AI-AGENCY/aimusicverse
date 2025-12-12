// ProfileBio Component - Sprint 011 Task T023
// Renders profile bio with "Read more" expansion for long text

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ProfileBioProps {
  bio?: string;
  maxLength?: number;
}

export function ProfileBio({ bio, maxLength = 150 }: ProfileBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!bio) {
    return null;
  }

  const shouldTruncate = bio.length > maxLength;
  const displayBio = !shouldTruncate || isExpanded
    ? bio
    : `${bio.slice(0, maxLength)}...`;

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {displayBio}
      </p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-sm text-primary hover:text-primary/80"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </Button>
      )}
    </div>
  );
}
