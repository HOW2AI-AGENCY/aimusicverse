/**
 * Hook to initialize PromptDJ channels from reference audio analysis
 * Maps analysis data (genre, mood, energy, instruments) to DJ channel settings
 */

import { useMemo } from 'react';
import type { PromptChannel, GlobalSettings } from './usePromptDJEnhanced';

export interface ReferenceAnalysisForDJ {
  genre?: string | null;
  mood?: string | null;
  energy?: string | null;
  instruments?: string[] | null;
  vocalStyle?: string | null;
  bpm?: number | null;
  hasVocals?: boolean | null;
}

interface PromptDJInitialState {
  channels: PromptChannel[];
  settings: GlobalSettings;
}

// Map energy strings to weight values
function energyToWeight(energy: string | null | undefined): number {
  if (!energy) return 0.5;
  const lower = energy.toLowerCase();
  if (lower.includes('high') || lower.includes('intense') || lower.includes('explosive')) return 0.9;
  if (lower.includes('medium') || lower.includes('moderate')) return 0.6;
  if (lower.includes('low') || lower.includes('calm') || lower.includes('relaxed')) return 0.3;
  return 0.5;
}

// Normalize genre to PromptDJ preset value
function normalizeGenre(genre: string | null | undefined): string {
  if (!genre) return '';
  const lower = genre.toLowerCase();
  
  const genreMap: Record<string, string> = {
    'pop': 'Pop',
    'rock': 'Rock',
    'hip hop': 'Hip-Hop',
    'hip-hop': 'Hip-Hop',
    'hiphop': 'Hip-Hop',
    'rap': 'Hip-Hop',
    'electronic': 'Electronic',
    'edm': 'EDM',
    'house': 'House',
    'techno': 'Electronic',
    'jazz': 'Jazz',
    'ambient': 'Ambient',
    'classical': 'Classical',
    'lo-fi': 'Lo-Fi',
    'lofi': 'Lo-Fi',
    'r&b': 'R&B',
    'rnb': 'R&B',
    'trap': 'Trap',
    'metal': 'Rock',
    'indie': 'Pop',
    'folk': 'Acoustic',
    'country': 'Acoustic',
  };

  for (const [key, value] of Object.entries(genreMap)) {
    if (lower.includes(key)) return value;
  }
  
  // Return original if no match
  return genre.charAt(0).toUpperCase() + genre.slice(1);
}

// Normalize mood to PromptDJ preset value
function normalizeMood(mood: string | null | undefined): string {
  if (!mood) return '';
  const lower = mood.toLowerCase();
  
  const moodMap: Record<string, string> = {
    'happy': 'Happy',
    'sad': 'Sad',
    'calm': 'Calm',
    'energetic': 'Energetic',
    'dark': 'Dark',
    'epic': 'Epic',
    'dreamy': 'Dreamy',
    'romantic': 'Romantic',
    'aggressive': 'Aggressive',
    'mysterious': 'Mysterious',
    'uplifting': 'Uplifting',
    'melancholic': 'Sad',
    'chill': 'Calm',
    'relaxed': 'Calm',
    'intense': 'Aggressive',
    'powerful': 'Energetic',
    'peaceful': 'Calm',
    'groovy': 'Groovy',
  };

  for (const [key, value] of Object.entries(moodMap)) {
    if (lower.includes(key)) return value;
  }
  
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

// Normalize energy to preset value
function normalizeEnergy(energy: string | null | undefined): string {
  if (!energy) return 'Medium';
  const lower = energy.toLowerCase();
  
  if (lower.includes('high') || lower.includes('intense')) return 'High';
  if (lower.includes('low') || lower.includes('calm')) return 'Low';
  if (lower.includes('building')) return 'Building';
  if (lower.includes('drop')) return 'Dropping';
  
  return 'Medium';
}

// Normalize instrument to preset value
function normalizeInstrument(instrument: string | null | undefined): string {
  if (!instrument) return '';
  const lower = instrument.toLowerCase();
  
  const instrumentMap: Record<string, string> = {
    'piano': 'Piano',
    'guitar': 'Guitar',
    'synth': 'Synth',
    'synthesizer': 'Synth',
    'strings': 'Strings',
    'violin': 'Violin',
    'bass': 'Bass',
    'drums': 'Drums',
    'pad': 'Pads',
    'pads': 'Pads',
    'brass': 'Brass',
    'bell': 'Bells',
    'choir': 'Choir',
    'voice': 'Choir',
    'sax': 'Sax',
    'saxophone': 'Sax',
    'organ': 'Piano',
    'keys': 'Piano',
  };

  for (const [key, value] of Object.entries(instrumentMap)) {
    if (lower.includes(key)) return value;
  }
  
  return instrument.charAt(0).toUpperCase() + instrument.slice(1);
}

export function usePromptDJFromReference(reference: ReferenceAnalysisForDJ | null): PromptDJInitialState {
  return useMemo(() => {
    if (!reference) {
      return {
        channels: [],
        settings: { bpm: 120, key: 'C', scale: 'minor', density: 0.5, brightness: 0.5, duration: 20 },
      };
    }

    const channels: PromptChannel[] = [];
    
    // Genre channel
    const normalizedGenre = normalizeGenre(reference.genre);
    if (normalizedGenre) {
      channels.push({
        id: 'ch1',
        type: 'genre',
        value: normalizedGenre,
        weight: 0.8,
        enabled: true,
      });
    }

    // Instrument channel (first instrument)
    const primaryInstrument = reference.instruments?.[0];
    const normalizedInstrument = normalizeInstrument(primaryInstrument);
    if (normalizedInstrument) {
      channels.push({
        id: 'ch2',
        type: 'instrument',
        value: normalizedInstrument,
        weight: 0.7,
        enabled: true,
      });
    }

    // Mood channel
    const normalizedMood = normalizeMood(reference.mood);
    if (normalizedMood) {
      channels.push({
        id: 'ch3',
        type: 'mood',
        value: normalizedMood,
        weight: 0.7,
        enabled: true,
      });
    }

    // Energy channel
    const normalizedEnergy = normalizeEnergy(reference.energy);
    channels.push({
      id: 'ch4',
      type: 'energy',
      value: normalizedEnergy,
      weight: energyToWeight(reference.energy),
      enabled: !!reference.energy,
    });

    // Vocal channel (if has vocals)
    if (reference.hasVocals && reference.vocalStyle) {
      const vocalValue = reference.vocalStyle.toLowerCase().includes('male') ? 'Male' :
                         reference.vocalStyle.toLowerCase().includes('female') ? 'Female' :
                         reference.vocalStyle.toLowerCase().includes('rap') ? 'Rap' :
                         'Powerful';
      channels.push({
        id: 'ch8',
        type: 'vocal',
        value: vocalValue,
        weight: 0.6,
        enabled: true,
      });
    }

    // Secondary instrument (if available)
    if (reference.instruments && reference.instruments.length > 1) {
      const secondaryInstrument = normalizeInstrument(reference.instruments[1]);
      if (secondaryInstrument) {
        channels.push({
          id: 'ch7',
          type: 'instrument',
          value: secondaryInstrument,
          weight: 0.5,
          enabled: true,
        });
      }
    }

    // Settings
    const settings: GlobalSettings = {
      bpm: reference.bpm || 120,
      key: 'C', // Could be extracted from analysis if available
      scale: 'minor',
      density: reference.energy?.toLowerCase().includes('high') ? 0.7 : 0.5,
      brightness: reference.mood?.toLowerCase().includes('dark') ? 0.3 :
                  reference.mood?.toLowerCase().includes('bright') ? 0.7 : 0.5,
      duration: 20,
    };

    return { channels, settings };
  }, [reference]);
}
