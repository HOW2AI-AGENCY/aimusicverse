// SocialLinks Component - Sprint 011 Task T024
// Displays social media links with icons

import { Instagram, Twitter, Music2, Youtube, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SocialLinks as Links } from '@/types/profile';

interface SocialLinksProps {
  links: Links;
}

const SOCIAL_ICONS = {
  instagram: { icon: Instagram, label: 'Instagram', color: 'hover:text-pink-500' },
  twitter: { icon: Twitter, label: 'Twitter', color: 'hover:text-blue-400' },
  soundcloud: { icon: Music2, label: 'SoundCloud', color: 'hover:text-orange-500' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'hover:text-red-500' },
  spotify: { icon: Music2, label: 'Spotify', color: 'hover:text-green-500' },
  website: { icon: Globe, label: 'Website', color: 'hover:text-blue-500' },
};

export function SocialLinks({ links }: SocialLinksProps) {
  const hasAnyLinks = Object.values(links).some(link => link);

  if (!hasAnyLinks) {
    return null;
  }

  const handleLinkClick = (url: string) => {
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(links).map(([platform, url]) => {
        if (!url) return null;

        const config = SOCIAL_ICONS[platform as keyof Links];
        if (!config) return null;

        const Icon = config.icon;

        return (
          <Button
            key={platform}
            variant="ghost"
            size="sm"
            onClick={() => handleLinkClick(url)}
            className={`h-9 w-9 p-0 transition-colors ${config.color}`}
            aria-label={`Visit ${config.label}`}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
