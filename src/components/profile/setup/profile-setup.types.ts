import type { SocialLinks } from "@/types/profile";

export interface ProfileSetupData {
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: "producer" | "musician" | "listener" | "";
  genres: string[];
  socialLinks: SocialLinks;
  bannerUrl: string;
}
