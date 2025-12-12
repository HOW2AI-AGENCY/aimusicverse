// Profile Extended Types - Sprint 011 Task T012
// Extended profile types for social features

export type PrivacyLevel = 'public' | 'followers' | 'private';

export type VerificationStatus = 'none' | 'pending' | 'verified';

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  soundcloud?: string;
  youtube?: string;
  spotify?: string;
  website?: string;
}

export interface ProfileStats {
  followers: number;
  following: number;
  tracks: number;
  likesReceived: number;
}

export interface ProfileExtended {
  id: string;
  userId: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  photoUrl?: string;
  languageCode?: string;
  isVerified: boolean;
  isPublic: boolean;
  privacyLevel: PrivacyLevel;
  socialLinks: SocialLinks;
  stats: ProfileStats;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isPublic: boolean;
  privacyLevel: PrivacyLevel;
  socialLinks: SocialLinks;
}

export interface ProfileUpdateInput {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  is_public?: boolean;
  privacy_level?: PrivacyLevel;
  social_links?: SocialLinks;
}
