/**
 * Profile Setup Types
 * Extracted to prevent circular dependencies
 */

import type { SocialLinks } from '@/types/profile';

export interface ProfileSetupData {
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: 'producer' | 'musician' | 'listener' | '';
  genres: string[];
  socialLinks: SocialLinks;
  bannerUrl: string;
}

export interface ProfileSetupStepProps {
  data: ProfileSetupData;
  onUpdate: (updates: Partial<ProfileSetupData>) => void;
  userId?: string;
}
