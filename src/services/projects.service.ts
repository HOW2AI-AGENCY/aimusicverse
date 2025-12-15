/**
 * Projects Service
 * Business logic for music project operations
 */

import * as projectsApi from '@/api/projects.api';

export type { ProjectRow, ProjectTrackRow } from '@/api/projects.api';

export type ProjectType = 'single' | 'ep' | 'album' | 'ost' | 'background_music' | 'jingle' | 'compilation' | 'mixtape';

export const PROJECT_TYPES: Record<ProjectType, { label: string; description: string; trackCount: string }> = {
  single: { label: 'Сингл', description: '1-2 трека', trackCount: '1-2' },
  ep: { label: 'EP', description: '3-6 треков', trackCount: '3-6' },
  album: { label: 'Альбом', description: '7-15+ треков', trackCount: '7-15' },
  ost: { label: 'Саундтрек', description: 'Музыка для видео/игр', trackCount: '5-20' },
  background_music: { label: 'Фоновая музыка', description: 'Ambient, лаунж', trackCount: '5-10' },
  jingle: { label: 'Джингл', description: 'Короткий рекламный трек', trackCount: '1-3' },
  compilation: { label: 'Компиляция', description: 'Сборник треков', trackCount: '10-20' },
  mixtape: { label: 'Микстейп', description: 'Свободный формат', trackCount: '5-15' },
};

/**
 * Create a new project with default public visibility based on subscription
 */
export async function createProject(
  userId: string,
  title: string,
  projectType: ProjectType,
  options?: {
    genre?: string;
    mood?: string;
    description?: string;
  }
): Promise<projectsApi.ProjectRow> {
  // Check premium status for default visibility
  const isPremium = await projectsApi.checkPremiumStatus(userId);
  
  return projectsApi.createProject({
    user_id: userId,
    title,
    project_type: projectType,
    genre: options?.genre || null,
    mood: options?.mood || null,
    description: options?.description || null,
    is_public: !isPremium, // Free users create public by default
  });
}

/**
 * Generate AI project concept
 */
export async function generateConcept(params: {
  projectType: string;
  genre?: string;
  mood?: string;
  targetAudience?: string;
  theme?: string;
  artistPersona?: string;
}): Promise<{
  concept: string;
  suggestedTracks: Array<{ title: string; description: string }>;
  moodBoard: string[];
}> {
  const data = await projectsApi.generateProjectConcept(params);
  return data as {
    concept: string;
    suggestedTracks: Array<{ title: string; description: string }>;
    moodBoard: string[];
  };
}

/**
 * Get project progress statistics
 */
export async function getProjectProgress(projectId: string): Promise<{
  totalTracks: number;
  completedTracks: number;
  progressPercent: number;
}> {
  const tracks = await projectsApi.fetchProjectTracks(projectId);
  const totalTracks = tracks.length;
  const completedTracks = tracks.filter(t => t.track_id !== null).length;
  const progressPercent = totalTracks > 0 ? Math.round((completedTracks / totalTracks) * 100) : 0;
  
  return { totalTracks, completedTracks, progressPercent };
}
