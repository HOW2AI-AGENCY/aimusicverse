import { motion } from '@/lib/motion';
import { Instagram, Globe, Music2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProfileSetupStepProps } from './types';
import type { SocialLinks } from '@/types/profile';

type ProfileSetupStep3SocialProps = Omit<ProfileSetupStepProps, 'userId'>;

// Custom icons for platforms
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const SoundCloudIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.054-.048-.1-.098-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.21-1.308-.21-1.319c-.01-.057-.054-.094-.09-.094zm1.83-1.229c-.06 0-.12.045-.12.104l-.21 2.563.21 2.458c0 .06.06.105.12.105.074 0 .12-.045.135-.105l.24-2.458-.24-2.563c-.015-.06-.061-.104-.135-.104zm.705-.405c-.075 0-.135.045-.15.105l-.194 2.97.194 2.548c.015.06.075.105.15.105.074 0 .149-.045.149-.105l.24-2.548-.24-2.97c0-.06-.075-.105-.149-.105zm.855-.104c-.09 0-.15.06-.165.119l-.18 3.075.18 2.563c.015.075.075.119.165.119.09 0 .165-.044.165-.119l.21-2.563-.21-3.075c0-.06-.075-.119-.165-.119zm.84-.329c-.09 0-.165.06-.18.134l-.165 3.404.165 2.563c.015.074.09.134.18.134.09 0 .18-.06.18-.134l.195-2.563-.195-3.404c0-.074-.09-.134-.18-.134zm.855-.27c-.105 0-.18.075-.195.149l-.149 3.674.149 2.548c.015.09.09.149.195.149.09 0 .18-.06.195-.149l.165-2.548-.165-3.674c-.015-.074-.105-.149-.195-.149z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
  { key: 'twitter', label: 'X (Twitter)', icon: TwitterIcon, placeholder: '@username' },
  { key: 'soundcloud', label: 'SoundCloud', icon: SoundCloudIcon, placeholder: 'soundcloud.com/...' },
  { key: 'youtube', label: 'YouTube', icon: YouTubeIcon, placeholder: 'youtube.com/@...' },
  { key: 'spotify', label: 'Spotify', icon: SpotifyIcon, placeholder: 'Ссылка на профиль' },
  { key: 'website', label: 'Сайт', icon: Globe, placeholder: 'https://...' },
] as const;

export function ProfileSetupStep3Social({ data, onUpdate }: ProfileSetupStep3SocialProps) {
  const updateSocialLink = (key: keyof SocialLinks, value: string) => {
    onUpdate({
      socialLinks: {
        ...data.socialLinks,
        [key]: value,
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Добавьте ссылки на свои профили в соцсетях (опционально)
      </p>

      <div className="space-y-3">
        {SOCIAL_FIELDS.map(field => {
          const Icon = field.icon;
          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key} className="flex items-center gap-2 text-xs">
                <Icon />
                {field.label}
              </Label>
              <Input
                id={field.key}
                value={data.socialLinks[field.key] || ''}
                onChange={(e) => updateSocialLink(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-9 text-sm"
              />
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
        💡 Ссылки на соцсети помогут другим пользователям найти вас и подписаться
      </div>
    </motion.div>
  );
}
