/**
 * Settings Page State Hook
 * 
 * Centralizes form state, profile updates, and notification toggles.
 * Separates business logic from UI presentation.
 * 
 * @returns Form state, handlers, and loading states
 * 
 * @example
 * ```tsx
 * const settings = useSettingsPage();
 * 
 * // Use form state
 * <Input value={settings.firstName} onChange={e => settings.setFirstName(e.target.value)} />
 * 
 * // Save profile
 * <Button onClick={settings.saveProfile}>Save</Button>
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { notify } from '@/lib/notifications';

export function useSettingsPage() {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { settings: notificationSettings, updateSettings, isLoading: settingsLoading, isUpdating } = useNotificationSettings();
  
  // Keyboard-aware behavior for iOS keyboard adaptation
  const { createFocusHandler, getContainerStyle } = useKeyboardAware();

  // Telegram BackButton
  const { shouldShowUIButton } = useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    let mounted = true;
    
    const initializeForm = () => {
      if (profile && !isInitialized && mounted) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setIsPublic(profile.is_public || false);
        setIsInitialized(true);
      }
    };
    
    initializeForm();
    
    return () => {
      mounted = false;
    };
  }, [profile, isInitialized]);

  // Save profile handler
  const saveProfile = useCallback(async () => {
    hapticFeedback('light');
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName || undefined,
        is_public: isPublic,
      });
      notify.success('Профиль сохранён');
    } catch (error) {
      notify.error('Ошибка сохранения');
    }
  }, [firstName, lastName, isPublic, hapticFeedback, updateProfile]);

  // Notification toggle handler
  const toggleNotification = useCallback((key: string, value: boolean) => {
    hapticFeedback('light');
    updateSettings({ [key]: value });
  }, [hapticFeedback, updateSettings]);

  // Privacy toggle handler
  const togglePrivacy = useCallback((value: boolean) => {
    hapticFeedback('light');
    setIsPublic(value);
    updateProfile.mutate({ is_public: value });
  }, [hapticFeedback, updateProfile]);

  // Avatar upload handler
  const updateAvatar = useCallback((url: string | null) => {
    updateProfile.mutate({ photo_url: url });
  }, [updateProfile]);

  // Navigation handlers
  const navigateTo = useCallback((path: string) => {
    hapticFeedback('light');
    navigate(path);
  }, [hapticFeedback, navigate]);

  return {
    // Profile data
    profile,
    profileLoading,
    
    // Form state
    firstName,
    setFirstName,
    lastName,
    setLastName,
    isPublic,
    setIsPublic,
    
    // Notification settings
    notificationSettings,
    settingsLoading,
    isUpdating,
    
    // Actions
    saveProfile,
    toggleNotification,
    togglePrivacy,
    updateAvatar,
    updateSettings,
    navigateTo,
    
    // Loading states
    isSaving: updateProfile.isPending,
    
    // Keyboard handling
    createFocusHandler,
    getContainerStyle,
    
    // Haptic
    hapticFeedback,
  };
}
