/**
 * User Journey State Hook
 * Tracks user's progression through the app for personalized experience
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type JourneyPhase = 'newcomer' | 'explorer' | 'creator' | 'pro';

interface UserJourneyState {
  // Journey flags
  isNewUser: boolean;
  hasGeneratedTrack: boolean;
  hasPlayedTrack: boolean;
  hasVisitedLibrary: boolean;
  hasVisitedStudio: boolean;
  hasVisitedProjects: boolean;
  completedOnboarding: boolean;
  completedQuickStart: boolean;
  
  // Session tracking
  sessionCount: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  
  // Actions
  markTrackGenerated: () => void;
  markTrackPlayed: () => void;
  markLibraryVisited: () => void;
  markStudioVisited: () => void;
  markProjectsVisited: () => void;
  markOnboardingCompleted: () => void;
  markQuickStartCompleted: () => void;
  incrementSession: () => void;
  resetJourney: () => void;
}

export const useUserJourneyStore = create<UserJourneyState>()(
  persist(
    (set, get) => ({
      isNewUser: true,
      hasGeneratedTrack: false,
      hasPlayedTrack: false,
      hasVisitedLibrary: false,
      hasVisitedStudio: false,
      hasVisitedProjects: false,
      completedOnboarding: false,
      completedQuickStart: false,
      sessionCount: 0,
      firstVisitAt: null,
      lastVisitAt: null,

      markTrackGenerated: () => set({ hasGeneratedTrack: true, isNewUser: false }),
      markTrackPlayed: () => set({ hasPlayedTrack: true }),
      markLibraryVisited: () => set({ hasVisitedLibrary: true }),
      markStudioVisited: () => set({ hasVisitedStudio: true }),
      markProjectsVisited: () => set({ hasVisitedProjects: true }),
      markOnboardingCompleted: () => set({ completedOnboarding: true }),
      markQuickStartCompleted: () => set({ completedQuickStart: true, isNewUser: false }),
      
      incrementSession: () => {
        const now = new Date().toISOString();
        set((state) => ({
          sessionCount: state.sessionCount + 1,
          firstVisitAt: state.firstVisitAt || now,
          lastVisitAt: now,
        }));
      },

      resetJourney: () => set({
        isNewUser: true,
        hasGeneratedTrack: false,
        hasPlayedTrack: false,
        hasVisitedLibrary: false,
        hasVisitedStudio: false,
        hasVisitedProjects: false,
        completedOnboarding: false,
        completedQuickStart: false,
        sessionCount: 0,
        firstVisitAt: null,
        lastVisitAt: null,
      }),
    }),
    {
      name: 'user-journey-state',
    }
  )
);

/**
 * Hook to get current journey phase based on user activity
 */
export function useUserJourneyState() {
  const store = useUserJourneyStore();
  const { user } = useAuth();

  // Increment session count on mount
  useEffect(() => {
    const lastIncrement = sessionStorage.getItem('journey-session-incremented');
    if (!lastIncrement) {
      store.incrementSession();
      sessionStorage.setItem('journey-session-incremented', 'true');
    }
  }, []);

  // Check if user has any tracks in DB (for returning users with cleared localStorage)
  useEffect(() => {
    if (user && store.isNewUser) {
      const checkUserTracks = async () => {
        const { count } = await supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .limit(1);
        
        if (count && count > 0) {
          store.markTrackGenerated();
        }
      };
      checkUserTracks();
    }
  }, [user, store.isNewUser]);

  // Calculate journey phase
  const journeyPhase: JourneyPhase = useMemo(() => {
    const { 
      hasGeneratedTrack, 
      hasVisitedStudio, 
      hasVisitedProjects,
      sessionCount 
    } = store;

    if (hasVisitedStudio && hasVisitedProjects && sessionCount > 10) {
      return 'pro';
    }
    if (hasGeneratedTrack && sessionCount > 3) {
      return 'creator';
    }
    if (hasGeneratedTrack || store.hasPlayedTrack) {
      return 'explorer';
    }
    return 'newcomer';
  }, [
    store.hasGeneratedTrack, 
    store.hasVisitedStudio, 
    store.hasVisitedProjects,
    store.hasPlayedTrack,
    store.sessionCount
  ]);

  // Should show quick start (new user who hasn't completed it)
  const shouldShowQuickStart = store.isNewUser && !store.completedQuickStart && !store.completedOnboarding;

  return {
    ...store,
    journeyPhase,
    shouldShowQuickStart,
    isFirstSession: store.sessionCount <= 1,
    isReturningUser: store.sessionCount > 1 && !store.hasGeneratedTrack,
  };
}
