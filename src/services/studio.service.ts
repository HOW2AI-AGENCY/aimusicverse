/**
 * Studio Service Layer
 * Business logic for studio operations
 */

import * as studioApi from '@/api/studio.api';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface SectionBounds {
  start: number;
  end: number;
}

export interface DetectedSection {
  label: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental' | 'unknown';
  start: number;
  end: number;
  lyrics?: string;
}

export interface ReplacedSection {
  start: number;
  end: number;
  taskId: string;
  createdAt: string;
  audioUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ============= Section Detection Business Logic =============

export function inferSectionType(
  position: number, 
  total: number, 
  duration: number,
  label?: string
): DetectedSection['type'] {
  // Check label first
  if (label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('intro')) return 'intro';
    if (lowerLabel.includes('verse')) return 'verse';
    if (lowerLabel.includes('chorus') || lowerLabel.includes('hook')) return 'chorus';
    if (lowerLabel.includes('bridge')) return 'bridge';
    if (lowerLabel.includes('outro') || lowerLabel.includes('end')) return 'outro';
    if (lowerLabel.includes('instrumental') || lowerLabel.includes('solo')) return 'instrumental';
  }

  // Infer from position
  if (position === 0 && duration < 15) return 'intro';
  if (position === total - 1 && duration < 20) return 'outro';
  if (position % 2 === 0) return 'verse';
  return 'chorus';
}

export function getSectionColor(type: DetectedSection['type']): string {
  const colors: Record<DetectedSection['type'], string> = {
    intro: 'hsl(var(--chart-1))',
    verse: 'hsl(var(--chart-2))',
    chorus: 'hsl(var(--chart-3))',
    bridge: 'hsl(var(--chart-4))',
    outro: 'hsl(var(--chart-5))',
    instrumental: 'hsl(var(--muted-foreground))',
    unknown: 'hsl(var(--muted-foreground))',
  };
  return colors[type] || colors.unknown;
}

export function createFallbackSections(duration: number): DetectedSection[] {
  if (duration <= 0) return [];

  const sections: DetectedSection[] = [];
  
  // Short tracks (< 60s): simple structure
  if (duration < 60) {
    const introDuration = Math.min(10, duration * 0.1);
    const outroDuration = Math.min(10, duration * 0.1);
    const mainDuration = duration - introDuration - outroDuration;
    
    if (introDuration > 3) {
      sections.push({ label: 'Intro', type: 'intro', start: 0, end: introDuration });
    }
    
    sections.push({ 
      label: 'Main', 
      type: 'verse', 
      start: introDuration, 
      end: introDuration + mainDuration 
    });
    
    if (outroDuration > 3) {
      sections.push({ 
        label: 'Outro', 
        type: 'outro', 
        start: duration - outroDuration, 
        end: duration 
      });
    }
    
    return sections;
  }

  // Standard song structure
  const introDuration = Math.min(15, duration * 0.08);
  const outroDuration = Math.min(20, duration * 0.1);
  const bodyDuration = duration - introDuration - outroDuration;
  
  // Intro
  sections.push({ label: 'Intro', type: 'intro', start: 0, end: introDuration });
  
  // Body sections (verse-chorus pattern)
  const sectionDuration = bodyDuration / 4;
  let currentTime = introDuration;
  
  sections.push({ 
    label: 'Verse 1', 
    type: 'verse', 
    start: currentTime, 
    end: currentTime + sectionDuration 
  });
  currentTime += sectionDuration;
  
  sections.push({ 
    label: 'Chorus', 
    type: 'chorus', 
    start: currentTime, 
    end: currentTime + sectionDuration 
  });
  currentTime += sectionDuration;
  
  sections.push({ 
    label: 'Verse 2', 
    type: 'verse', 
    start: currentTime, 
    end: currentTime + sectionDuration 
  });
  currentTime += sectionDuration;
  
  sections.push({ 
    label: 'Final Chorus', 
    type: 'chorus', 
    start: currentTime, 
    end: duration - outroDuration 
  });
  
  // Outro
  sections.push({ 
    label: 'Outro', 
    type: 'outro', 
    start: duration - outroDuration, 
    end: duration 
  });
  
  return sections;
}

// ============= Replaced Sections Parsing =============

export async function fetchReplacedSections(trackId: string): Promise<ReplacedSection[]> {
  const [tasksResult, logsResult] = await Promise.all([
    studioApi.fetchReplacedSectionTasks(trackId),
    studioApi.fetchSectionReplacementLogs(trackId),
  ]);

  if (tasksResult.error || logsResult.error) {
    logger.error('Error fetching replaced sections', tasksResult.error || logsResult.error);
    return [];
  }

  const { data: tasks } = tasksResult;
  const { startedLogs, completedLogs } = logsResult;

  const sections: ReplacedSection[] = [];
  
  for (const task of tasks || []) {
    const matchingStartLog = startedLogs?.find((log) => {
      const metadata = log.metadata as { taskId?: string } | null;
      return metadata?.taskId === task.suno_task_id;
    });

    const startMetadata = matchingStartLog?.metadata as { 
      infillStartS?: number; 
      infillEndS?: number;
    } | null;
    
    if (startMetadata?.infillStartS !== undefined && startMetadata?.infillEndS !== undefined) {
      let audioUrl: string | undefined;
      
      const matchingCompletedLog = completedLogs?.find((log) => {
        const metadata = log.metadata as { taskId?: string } | null;
        return metadata?.taskId === task.suno_task_id;
      });
      
      audioUrl = (matchingCompletedLog?.track_versions as { audio_url?: string } | null)?.audio_url;
      
      if (!audioUrl && task.status === 'completed' && task.audio_clips) {
        try {
          const clips = typeof task.audio_clips === 'string' 
            ? JSON.parse(task.audio_clips) 
            : task.audio_clips;
          audioUrl = clips?.[0]?.source_audio_url || clips?.[0]?.audio_url;
        } catch {
          // Ignore parse errors
        }
      }

      sections.push({
        start: startMetadata.infillStartS,
        end: startMetadata.infillEndS,
        taskId: task.id,
        createdAt: task.created_at || '',
        audioUrl,
        status: task.status as ReplacedSection['status'],
      });
    }
  }

  return sections;
}

// ============= Section Replacement =============

export async function replaceSection(params: {
  trackId: string;
  taskId: string;
  audioId: string;
  section: SectionBounds;
  prompt: string;
  tags?: string[];
  lyrics?: string;
}): Promise<{ taskId: string | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { taskId: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await studioApi.invokeReplaceSection({
      trackId: params.trackId,
      userId: user.id,
      taskId: params.taskId,
      audioId: params.audioId,
      startTime: params.section.start,
      endTime: params.section.end,
      prompt: params.prompt,
      tags: params.tags,
      lyrics: params.lyrics,
    });

    if (error) {
      return { taskId: null, error: new Error(error.message) };
    }

    return { taskId: data?.taskId || null, error: null };
  } catch (err) {
    logger.error('Error in replaceSection', err);
    return { taskId: null, error: err as Error };
  }
}

// ============= Stem Separation =============

export async function separateStems(
  trackId: string,
  audioId: string,
  audioUrl: string,
  mode: 'simple' | 'detailed'
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: new Error('Not authenticated') };
    }

    const { error } = await studioApi.invokeStemSeparation({
      trackId,
      audioId,
      audioUrl,
      mode,
      userId: user.id,
    });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    logger.error('Error in separateStems', err);
    return { success: false, error: err as Error };
  }
}

// ============= Version Management =============

export async function switchToVersion(
  trackId: string, 
  versionId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await studioApi.setPrimaryVersion(trackId, versionId);
  
  if (error) {
    logger.error('Error switching version', error);
    return { success: false, error: new Error(error.message) };
  }
  
  return { success: true, error: null };
}

// ============= Activity Logging =============

export async function logStudioActivity(
  trackId: string,
  activityType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await studioApi.logTrackActivity({
      trackId,
      userId: user.id,
      changeType: activityType,
      changedBy: 'studio',
      metadata,
    });
  } catch (err) {
    logger.warn('Failed to log studio activity', { error: err });
  }
}

// ============= Validation =============

export function validateSectionBounds(
  section: SectionBounds, 
  duration: number,
  maxSectionDuration?: number
): { valid: boolean; error?: string } {
  if (section.start < 0) {
    return { valid: false, error: 'Start time cannot be negative' };
  }
  
  if (section.end > duration) {
    return { valid: false, error: 'End time exceeds track duration' };
  }
  
  if (section.start >= section.end) {
    return { valid: false, error: 'Start time must be before end time' };
  }
  
  const sectionDuration = section.end - section.start;
  
  if (sectionDuration < 5) {
    return { valid: false, error: 'Section must be at least 5 seconds' };
  }
  
  if (maxSectionDuration && sectionDuration > maxSectionDuration) {
    return { valid: false, error: `Section cannot exceed ${Math.round(maxSectionDuration)} seconds` };
  }
  
  return { valid: true };
}
