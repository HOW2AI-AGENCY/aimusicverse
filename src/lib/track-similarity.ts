/**
 * Track Similarity Algorithm
 * Feature: Sprint 32 - US-007 Personalized Recommendations
 *
 * Calculates similarity between tracks based on style, mood, and tags
 */

import type { Track, TrackVersion } from '@/integrations/supabase/types/track';

/**
 * Similarity score (0-1, higher = more similar)
 */
export type SimilarityScore = number;

/**
 * Track with similarity score
 */
export interface SimilarTrack extends Track {
  similarity: SimilarityScore;
}

/**
 * Calculate similarity between two tracks
 *
 * Weights:
 * - Style match: 40%
 * - Mood match: 30%
 * - Tag overlap: 30%
 */
export function calculateSimilarity(
  trackA: Track,
  trackB: Track
): SimilarityScore {
  let score = 0;

  // Style match (40% weight)
  if (trackA.style && trackB.style) {
    const styleA = trackA.style.toLowerCase();
    const styleB = trackB.style.toLowerCase();

    // Exact match
    if (styleA === styleB) {
      score += 0.4;
    } else if (styleA.includes(styleB) || styleB.includes(styleA)) {
      // Partial match (e.g., "Pop Rock" matches "Pop")
      score += 0.2;
    }
  }

  // Mood match (30% weight)
  if (trackA.mood && trackB.mood) {
    const moodA = trackA.mood.toLowerCase();
    const moodB = trackB.mood.toLowerCase();

    if (moodA === moodB) {
      score += 0.3;
    } else if (moodA.includes(moodB) || moodB.includes(moodA)) {
      score += 0.15;
    }
  }

  // Tag overlap (30% weight)
  const tagsA = new Set((trackA.tags || []).map(t => t.toLowerCase()));
  const tagsB = new Set((trackB.tags || []).map(t => t.toLowerCase()));

  if (tagsA.size > 0 && tagsB.size > 0) {
    const intersection = [...tagsA].filter(t => tagsB.has(t));
    const union = new Set([...tagsA, ...tagsB]);

    if (union.size > 0) {
      const jaccardIndex = intersection.length / union.size;
      score += jaccardIndex * 0.3;
    }
  }

  return Math.min(score, 1); // Cap at 1.0
}

/**
 * Find similar tracks
 */
export function findSimilarTracks(
  targetTrack: Track,
  candidates: Track[],
  options: {
    minSimilarity?: number;
    maxResults?: number;
    excludeIds?: string[];
  } = {}
): SimilarTrack[] {
  const {
    minSimilarity = 0.3,
    maxResults = 10,
    excludeIds = [],
  } = options;

  const excludeSet = new Set([...excludeIds, targetTrack.id]);

  // Calculate similarity for all candidates
  const similar = candidates
    .filter(track => !excludeSet.has(track.id))
    .map(track => ({
      ...track,
      similarity: calculateSimilarity(targetTrack, track),
    }))
    .filter(track => track.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  return similar;
}

/**
 * Get recommended style/mood combos based on track
 */
export function getRecommendedCombinations(track: Track): Array<{
  style: string;
  mood: string;
  reason: string;
}> {
  const recommendations: Array<{
    style: string;
    mood: string;
    reason: string;
  }> = [];

  const style = track.style?.toLowerCase() || '';
  const mood = track.mood?.toLowerCase() || '';

  // Based on style
  if (style.includes('pop')) {
    recommendations.push({
      style: 'Pop',
      mood: 'Energetic',
      reason: 'Похожий стиль с другой энергетикой',
    });
    recommendations.push({
      style: 'Synth-pop',
      mood: 'Chill',
      reason: 'Поп с расслабленным настроением',
    });
  }

  if (style.includes('rock')) {
    recommendations.push({
      style: 'Alternative Rock',
      mood: 'Energetic',
      reason: 'Рок с современным звучанием',
    });
    recommendations.push({
      style: 'Acoustic',
      mood: 'Chill',
      reason: 'Рок в акустическом варианте',
    });
  }

  if (style.includes('electronic') || style.includes('edm') || style.includes('house')) {
    recommendations.push({
      style: 'Techno',
      mood: 'Energetic',
      reason: 'Электронная музыка с новым ритмом',
    });
    recommendations.push({
      style: 'Chillwave',
      mood: 'Chill',
      reason: 'Расслабленная электроника',
    });
  }

  if (style.includes('hip') || style.includes('rap')) {
    recommendations.push({
      style: 'Trap',
      mood: 'Energetic',
      reason: 'Хип-хоп с современным битом',
    });
    recommendations.push({
      style: 'Lo-Fi',
      mood: 'Chill',
      reason: 'Расслабленный хип-хоп',
    });
  }

  if (style.includes('lofi') || style.includes('chill')) {
    recommendations.push({
      style: 'Jazz',
      mood: 'Chill',
      reason: 'Джаз в расслабленном стиле',
    });
    recommendations.push({
      style: 'Ambient',
      mood: 'Chill',
      reason: 'Эмбиент для релаксации',
    });
  }

  // Based on mood
  if (mood.includes('energetic') || mood.includes('happy')) {
    recommendations.push({
      style: 'Dance',
      mood: 'Energetic',
      reason: 'Танцевальный трек для поднятия настроения',
    });
  }

  if (mood.includes('chill') || mood.includes('sad') || mood.includes('melancholic')) {
    recommendations.push({
      style: 'Ballad',
      mood: 'Emotional',
      reason: 'Эмоциональная баллада',
    });
  }

  // Fallback recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      style: 'Pop',
      mood: 'Energetic',
      reason: 'Популярный стиль',
    });
    recommendations.push({
      style: 'Electronic',
      mood: 'Chill',
      reason: 'Современная электроника',
    });
  }

  return recommendations.slice(0, 4);
}

/**
 * Generate suggested prompts based on track
 */
export function generatePromptSuggestions(track: Track): string[] {
  const style = track.style || '';
  const mood = track.mood || '';
  const tags = track.tags || [];

  const suggestions: string[] = [];

  // Based on style
  if (style) {
    suggestions.push(`Another ${style} track with ${mood || 'energetic'} mood`);
  }

  // Based on mood
  if (mood) {
    suggestions.push(`${style || 'Music'} with ${mood} vibes and modern production`);
  }

  // Based on tags
  if (tags.length > 0) {
    const topTags = tags.slice(0, 3).join(', ');
    suggestions.push(`${style || 'Track'} featuring ${topTags}`);
  }

  // Creative variations
  suggestions.push(`${style || 'Music'} remix with ${mood || 'epic'} feel`);
  suggestions.push(`Similar to ${style || 'this track'} but with ${mood === 'energetic' ? 'chill' : 'energetic'} mood`);

  return suggestions.slice(0, 4);
}

/**
 * Cluster tracks by similarity
 */
export function clusterTracksBySimilarity(
  tracks: Track[],
  threshold: number = 0.5
): Map<string, SimilarTrack[]> {
  const clusters = new Map<string, SimilarTrack[]>();

  for (const track of tracks) {
    // Find if this track belongs to any existing cluster
    let foundCluster = false;

    for (const [clusterId, clusterTracks] of clusters.entries()) {
      const clusterSimilarity = clusterTracks.reduce((sum, t) => sum + calculateSimilarity(track, t), 0) / clusterTracks.length;

      if (clusterSimilarity >= threshold) {
        clusterTracks.push({ ...track, similarity: clusterSimilarity });
        foundCluster = true;
        break;
      }
    }

    // Create new cluster if no match found
    if (!foundCluster) {
      clusters.set(track.id, [{ ...track, similarity: 1 }]);
    }
  }

  return clusters;
}

/**
 * Explain similarity score
 */
export function explainSimilarity(trackA: Track, trackB: Track): string {
  const similarity = calculateSimilarity(trackA, trackB);
  const reasons: string[] = [];

  if (trackA.style === trackB.style) {
    reasons.push(`стиль "${trackA.style}"`);
  }

  if (trackA.mood === trackB.mood) {
    reasons.push(`настроение "${trackA.mood}"`);
  }

  const tagsA = new Set(trackA.tags || []);
  const tagsB = new Set(trackB.tags || []);
  const commonTags = [...tagsA].filter(t => tagsB.has(t));

  if (commonTags.length > 0) {
    reasons.push(`теги: ${commonTags.slice(0, 3).join(', ')}`);
  }

  if (reasons.length === 0) {
    return 'Похожий трек';
  }

  return `Похоже на ваш трек по ${reasons.join(', ')}`;
}
