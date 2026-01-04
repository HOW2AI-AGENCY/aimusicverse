/**
 * Reference Manager Service
 * Centralized management of audio references from all sources
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  UnifiedAudioReference,
  ReferenceSource,
  ReferenceMode,
  AudioAnalysis,
  ReferenceContext,
  ACTIVE_REFERENCE_KEY,
  REFERENCE_EXPIRY_MS,
} from './types';

class ReferenceManagerService {
  private static instance: ReferenceManagerService;
  private listeners: Set<(ref: UnifiedAudioReference | null) => void> = new Set();

  private constructor() {
    // Cleanup expired references on init
    this.cleanupExpired();
  }

  static getInstance(): ReferenceManagerService {
    if (!ReferenceManagerService.instance) {
      ReferenceManagerService.instance = new ReferenceManagerService();
    }
    return ReferenceManagerService.instance;
  }

  /**
   * Subscribe to active reference changes
   */
  subscribe(callback: (ref: UnifiedAudioReference | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(ref: UnifiedAudioReference | null): void {
    this.listeners.forEach(cb => cb(ref));
  }

  /**
   * Get the currently active reference
   */
  getActive(): UnifiedAudioReference | null {
    try {
      const stored = sessionStorage.getItem(ACTIVE_REFERENCE_KEY);
      if (!stored) return null;

      const ref: UnifiedAudioReference = JSON.parse(stored);
      
      // Check expiry
      if (ref.expiresAt && Date.now() > ref.expiresAt) {
        this.clearActive();
        return null;
      }

      return ref;
    } catch (error) {
      logger.error('Failed to get active reference', { error });
      return null;
    }
  }

  /**
   * Set the active reference
   */
  setActive(reference: UnifiedAudioReference): void {
    try {
      // Add expiry if not set
      const refWithExpiry: UnifiedAudioReference = {
        ...reference,
        expiresAt: reference.expiresAt || Date.now() + REFERENCE_EXPIRY_MS,
      };

      sessionStorage.setItem(ACTIVE_REFERENCE_KEY, JSON.stringify(refWithExpiry));
      this.notifyListeners(refWithExpiry);
      
      logger.info('Active reference set', { 
        source: reference.source, 
        mode: reference.intendedMode 
      });
    } catch (error) {
      logger.error('Failed to set active reference', { error });
    }
  }

  /**
   * Clear the active reference
   */
  clearActive(): void {
    try {
      sessionStorage.removeItem(ACTIVE_REFERENCE_KEY);
      this.notifyListeners(null);
      logger.info('Active reference cleared');
    } catch (error) {
      logger.error('Failed to clear active reference', { error });
    }
  }

  /**
   * Create reference from file upload
   */
  async createFromUpload(
    file: File,
    mode?: ReferenceMode
  ): Promise<UnifiedAudioReference> {
    const audioUrl = URL.createObjectURL(file);
    const duration = await this.calculateDuration(audioUrl);

    const reference: UnifiedAudioReference = {
      id: crypto.randomUUID(),
      source: 'upload',
      audioUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      durationSeconds: duration,
      intendedMode: mode,
      createdAt: Date.now(),
      analysisStatus: 'pending',
    };

    this.setActive(reference);
    return reference;
  }

  /**
   * Create reference from recording blob
   */
  async createFromRecording(
    blob: Blob,
    fileName?: string,
    mode?: ReferenceMode
  ): Promise<UnifiedAudioReference> {
    const audioUrl = URL.createObjectURL(blob);
    const duration = await this.calculateDuration(audioUrl);

    const reference: UnifiedAudioReference = {
      id: crypto.randomUUID(),
      source: 'record',
      audioUrl,
      fileName: fileName || `recording-${Date.now()}.webm`,
      fileSize: blob.size,
      mimeType: blob.type,
      durationSeconds: duration,
      intendedMode: mode,
      createdAt: Date.now(),
      analysisStatus: 'pending',
    };

    this.setActive(reference);
    return reference;
  }

  /**
   * Create reference from cloud storage (reference_audio table)
   */
  createFromCloud(
    data: {
      id: string;
      fileUrl: string;
      fileName: string;
      fileSize?: number;
      mimeType?: string;
      durationSeconds?: number;
      genre?: string;
      mood?: string;
      bpm?: number;
      tempo?: string;
      energy?: string;
      vocalStyle?: string;
      styleDescription?: string;
      transcription?: string;
      instruments?: string[];
    },
    mode?: ReferenceMode
  ): UnifiedAudioReference {
    const reference: UnifiedAudioReference = {
      id: crypto.randomUUID(),
      dbId: data.id,
      source: 'cloud',
      audioUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      durationSeconds: data.durationSeconds,
      analysis: {
        genre: data.genre,
        mood: data.mood,
        bpm: data.bpm,
        tempo: data.tempo,
        energy: data.energy,
        vocalStyle: data.vocalStyle,
        styleDescription: data.styleDescription,
        transcription: data.transcription,
        instruments: data.instruments,
      },
      analysisStatus: data.styleDescription || data.genre ? 'completed' : 'pending',
      intendedMode: mode,
      createdAt: Date.now(),
    };

    this.setActive(reference);
    return reference;
  }

  /**
   * Create reference from stem studio
   */
  createFromStem(
    data: {
      audioUrl: string;
      stemType: string;
      trackId?: string;
      trackTitle?: string;
      lyrics?: string;
      style?: string;
      action?: string;
    },
    mode?: ReferenceMode
  ): UnifiedAudioReference {
    const reference: UnifiedAudioReference = {
      id: crypto.randomUUID(),
      source: 'stem',
      audioUrl: data.audioUrl,
      fileName: `${data.stemType}-stem.mp3`,
      context: {
        stemType: data.stemType,
        originalTrackId: data.trackId,
        originalTitle: data.trackTitle,
        action: data.action,
      },
      analysis: data.lyrics || data.style ? {
        transcription: data.lyrics,
        styleDescription: data.style,
      } : undefined,
      intendedMode: mode,
      createdAt: Date.now(),
    };

    this.setActive(reference);
    return reference;
  }

  /**
   * Create reference from creative tools (drums, dj)
   */
  createFromCreativeTool(
    source: 'drums' | 'dj',
    audioUrl: string,
    options?: {
      prompt?: string;
      tags?: string;
      bpm?: number;
    }
  ): UnifiedAudioReference {
    const reference: UnifiedAudioReference = {
      id: crypto.randomUUID(),
      source,
      audioUrl,
      fileName: `${source}-${Date.now()}.mp3`,
      analysis: {
        styleDescription: options?.prompt || options?.tags,
        bpm: options?.bpm,
      },
      context: options?.prompt ? { prompt: options.prompt } : undefined,
      createdAt: Date.now(),
    };

    this.setActive(reference);
    return reference;
  }

  /**
   * Create reference from guitar recording/analysis
   */
  createFromGuitar(
    data: {
      audioUrl: string;
      bpm?: number;
      chordProgression?: string[];
      styleDescription?: string;
      tags?: string[];
    }
  ): UnifiedAudioReference {
    const reference: UnifiedAudioReference = {
      id: crypto.randomUUID(),
      source: 'guitar',
      audioUrl: data.audioUrl,
      fileName: `guitar-${Date.now()}.mp3`,
      analysis: {
        bpm: data.bpm,
        styleDescription: data.styleDescription,
      },
      context: {
        chordProgression: data.chordProgression,
        tags: data.tags?.join(', '),
      },
      createdAt: Date.now(),
    };

    this.setActive(reference);
    return reference;
  }

  /**
   * Create reference from existing track
   */
  createFromTrack(
    track: {
      id: string;
      audioUrl: string;
      title?: string;
      lyrics?: string;
      style?: string;
      duration?: number;
    },
    mode?: ReferenceMode
  ): UnifiedAudioReference {
    const reference: UnifiedAudioReference = {
      id: crypto.randomUUID(),
      source: 'track',
      audioUrl: track.audioUrl,
      fileName: `${track.title || 'track'}.mp3`,
      durationSeconds: track.duration,
      context: {
        originalTrackId: track.id,
        originalTitle: track.title,
      },
      analysis: {
        transcription: track.lyrics,
        styleDescription: track.style,
      },
      intendedMode: mode,
      createdAt: Date.now(),
    };

    this.setActive(reference);
    return reference;
  }

  /**
   * Update analysis data for active reference
   */
  updateAnalysis(analysis: AudioAnalysis): void {
    const active = this.getActive();
    if (!active) return;

    const updated: UnifiedAudioReference = {
      ...active,
      analysis: { ...active.analysis, ...analysis },
      analysisStatus: 'completed',
    };

    this.setActive(updated);
  }

  /**
   * Save current reference to database
   */
  async persistToDatabase(userId: string): Promise<string | null> {
    const active = this.getActive();
    if (!active) return null;

    try {
      // If already has dbId, return it
      if (active.dbId) return active.dbId;

      // For blob URLs, we need to upload first
      if (active.audioUrl.startsWith('blob:')) {
        const response = await fetch(active.audioUrl);
        const blob = await response.blob();
        
        const fileName = `${userId}/${active.id}-${active.fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('reference-audio')
          .upload(fileName, blob, { contentType: active.mimeType || 'audio/mpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('reference-audio')
          .getPublicUrl(fileName);

        active.audioUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('reference_audio')
        .insert({
          user_id: userId,
          file_name: active.fileName,
          file_url: active.audioUrl,
          file_size: active.fileSize,
          mime_type: active.mimeType,
          duration_seconds: active.durationSeconds,
          source: active.source,
          genre: active.analysis?.genre,
          mood: active.analysis?.mood,
          bpm: active.analysis?.bpm,
          tempo: active.analysis?.tempo,
          energy: active.analysis?.energy,
          has_vocals: active.analysis?.hasVocals,
          has_instrumentals: active.analysis?.hasInstrumentals,
          vocal_style: active.analysis?.vocalStyle,
          style_description: active.analysis?.styleDescription,
          transcription: active.analysis?.transcription,
          instruments: active.analysis?.instruments,
          analysis_status: active.analysisStatus || 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update active with dbId
      this.setActive({ ...active, dbId: data.id });

      return data.id;
    } catch (error) {
      logger.error('Failed to persist reference to database', { error });
      return null;
    }
  }

  /**
   * Calculate audio duration from URL
   */
  private calculateDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = url;
      audio.onloadedmetadata = () => {
        const dur = audio.duration;
        if (isNaN(dur) || !isFinite(dur)) {
          resolve(0);
        } else {
          resolve(dur);
        }
      };
      audio.onerror = () => resolve(0);
    });
  }

  /**
   * Cleanup expired references and legacy storage keys
   */
  private cleanupExpired(): void {
    // Legacy keys to migrate/cleanup
    const legacyKeys = [
      'cloudAudioReference',
      'stem_audio_reference',
      'audioReferenceFromDrums',
      'audioReferenceFromDJ',
      'drumPatternForDJ',
    ];

    legacyKeys.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  }
}

// Export singleton instance
export const ReferenceManager = ReferenceManagerService.getInstance();
