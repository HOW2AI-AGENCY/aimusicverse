/**
 * useProjectDetailData - Data fetching and computed values for ProjectDetail
 */

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTracks } from '@/hooks/useProjectTracks';
import { useProjectGeneratedTracks } from '@/hooks/useProjectGeneratedTracks';

export function useProjectDetailData() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { 
    tracks, 
    isLoading: tracksLoading, 
    reorderTracks, 
    generateTracklist, 
    isGenerating,
    updateTrack,
  } = useProjectTracks(id);
  const { tracks: generatedTracks } = useProjectGeneratedTracks(id);

  // Find project
  const project = useMemo(() => 
    projects?.find((p) => p.id === id), 
    [projects, id]
  );

  // Computed values
  const computed = useMemo(() => {
    const totalTracks = tracks?.length || 0;
    const tracksWithMaster = generatedTracks?.filter(t => t.is_master).length || 0;
    const completedTracks = tracks?.filter(t => t.status === 'completed').length || 0;
    const draftCount = tracks?.filter(t => t.status === 'draft' && !t.track_id).length || 0;
    const draftTracks = tracks?.filter(t => t.status === 'draft' && !t.track_id) || [];
    const isReadyToPublish = totalTracks > 0 && tracksWithMaster === totalTracks;
    const isPublished = project?.status === 'published';

    return {
      totalTracks,
      tracksWithMaster,
      completedTracks,
      draftCount,
      draftTracks,
      isReadyToPublish,
      isPublished,
    };
  }, [tracks, generatedTracks, project?.status]);

  return {
    // IDs
    projectId: id,
    
    // Data
    project,
    tracks,
    generatedTracks,
    
    // Computed values
    ...computed,
    
    // Loading states
    isLoading: projectsLoading,
    authLoading,
    tracksLoading,
    isGenerating,
    
    // Auth
    isAuthenticated,
    
    // Actions
    navigate,
    reorderTracks,
    generateTracklist,
    updateTrack,
  };
}
