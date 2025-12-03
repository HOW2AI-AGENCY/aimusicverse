import { create } from 'zustand';

export interface PlanTrackContext {
  planTrackId: string;
  planTrackTitle: string;
  stylePrompt: string | null;
  notes: string | null;
  recommendedTags: string[] | null;
  projectId: string;
  projectGenre?: string | null;
  projectMood?: string | null;
  projectLanguage?: string | null;
}

interface PlanTrackStore {
  planTrackContext: PlanTrackContext | null;
  setPlanTrackContext: (context: PlanTrackContext | null) => void;
  clearPlanTrackContext: () => void;
}

export const usePlanTrackStore = create<PlanTrackStore>((set) => ({
  planTrackContext: null,
  setPlanTrackContext: (context) => set({ planTrackContext: context }),
  clearPlanTrackContext: () => set({ planTrackContext: null }),
}));
