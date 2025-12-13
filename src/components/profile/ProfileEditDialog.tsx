// ProfileEditDialog Component - Sprint 011 Task T026
// Form for editing profile: display name, bio, avatar, banner, social links, privacy

import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateProfile } from '@/hooks/profile/useUpdateProfile';
import { useCurrentProfile } from '@/hooks/profile/useProfile';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 500;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10MB

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { data: profile, isLoading } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const { hapticFeedback } = useTelegram();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'followers' | 'private'>(
    profile?.privacyLevel || 'public'
  );
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile?.avatarUrl);
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(profile?.bannerUrl);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [bannerFile, setBannerFile] = useState<File | undefined>();
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    profile?.socialLinks || {}
  );

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Avatar image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Avatar must be an image file');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BANNER_SIZE) {
      toast.error('Banner image must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Banner must be an image file');
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSocialLinkChange = (platform: string, url: string) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: url,
    }));
  };

  const handleSave = async () => {
    hapticFeedback('medium');

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      toast.error(`Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`);
      return;
    }

    if (bio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
      return;
    }

    try {
      await updateProfile.mutateAsync({
        displayName,
        bio,
        avatarFile,
        bannerFile,
        socialLinks,
        privacyLevel,
      });

      toast.success('Profile updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  };

  const bioCharsRemaining = MAX_BIO_LENGTH - bio.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Customize your artist profile and privacy settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
              {bannerPreview && (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
              >
                <Upload className="w-6 h-6 text-white" />
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x400px, max 10MB
            </p>
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full bg-muted overflow-hidden">
                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Click to upload</p>
                <p>Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              placeholder="Your artist name"
            />
            <p className="text-xs text-muted-foreground text-right">
              {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Tell your story..."
              rows={4}
              className="resize-none"
            />
            <p
              className={`text-xs text-right ${
                bioCharsRemaining < 50 ? 'text-orange-500' : 'text-muted-foreground'
              }`}
            >
              {bioCharsRemaining} characters remaining
            </p>
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <Label>Social Links</Label>
            <div className="space-y-2">
              {['instagram', 'twitter', 'soundcloud', 'youtube'].map((platform) => (
                <Input
                  key={platform}
                  value={socialLinks[platform] || ''}
                  onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                  placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                  type="url"
                />
              ))}
            </div>
          </div>

          {/* Privacy Level */}
          <div className="space-y-2">
            <Label htmlFor="privacy">Privacy</Label>
            <Select value={privacyLevel} onValueChange={(v: any) => setPrivacyLevel(v)}>
              <SelectTrigger id="privacy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                <SelectItem value="followers">Followers Only - Only followers can see</SelectItem>
                <SelectItem value="private">Private - Only you can see</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={updateProfile.isPending || isLoading}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
