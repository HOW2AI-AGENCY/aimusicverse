/**
 * MusicXML Parser Hook
 * Parses MusicXML files and extracts musical data
 */

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'MusicXmlParser' });

export interface ParsedNote {
  pitch: string;
  octave: number;
  duration: number;
  type: string;
  voice: number;
  staff: number;
  startTime: number;
  // Additional fields for compatibility with NoteInput
  midiPitch?: number;
}

export interface ParsedMeasure {
  number: number;
  notes: ParsedNote[];
}

export interface ParsedMusicXml {
  title: string | null;
  composer: string | null;
  measures: ParsedMeasure[];
  parts: Array<{ id: string; name: string; measures: ParsedMeasure[] }>;
  notes: ParsedNote[];
  duration: number;
  bpm: number | null;
  keySignature: string | null;
  timeSignature: { numerator: number; denominator: number } | null;
  partNames: string[];
}

// Helper to convert pitch string + octave to MIDI number
const PITCH_MAP: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

export function pitchToMidi(pitch: string, octave: number): number {
  const basePitch = pitch.charAt(0).toUpperCase();
  const modifier = pitch.length > 1 ? pitch.charAt(1) : '';
  let semitone = PITCH_MAP[basePitch] ?? 0;
  
  if (modifier === '#') semitone += 1;
  else if (modifier === 'b') semitone -= 1;
  
  // MIDI: C4 = 60
  return (octave + 1) * 12 + semitone;
}

export function useMusicXmlParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedXml, setParsedXml] = useState<ParsedMusicXml | null>(null);

  const parseMusicXmlFromUrl = useCallback(async (xmlUrl: string): Promise<ParsedMusicXml | null> => {
    setIsLoading(true);
    setError(null);

    try {
      log.info('Fetching MusicXML file', { xmlUrl });

      const response = await fetch(xmlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch MusicXML: ${response.status}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid MusicXML format');
      }

      // Extract title and composer
      const title = xmlDoc.querySelector('work > work-title')?.textContent ||
                   xmlDoc.querySelector('movement-title')?.textContent || null;
      const composer = xmlDoc.querySelector('identification > creator[type="composer"]')?.textContent || null;

      // Extract BPM from sound element
      let bpm: number | null = null;
      const soundEl = xmlDoc.querySelector('direction > sound[tempo]');
      if (soundEl) {
        bpm = parseFloat(soundEl.getAttribute('tempo') || '') || null;
      }

      // Extract key signature
      let keySignature: string | null = null;
      const keyEl = xmlDoc.querySelector('attributes > key');
      if (keyEl) {
        const fifths = parseInt(keyEl.querySelector('fifths')?.textContent || '0', 10);
        const mode = keyEl.querySelector('mode')?.textContent || 'major';
        const keyNames = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
        const flatKeyNames = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
        if (fifths >= 0) {
          keySignature = `${keyNames[fifths] || 'C'} ${mode}`;
        } else {
          keySignature = `${flatKeyNames[-fifths] || 'C'} ${mode}`;
        }
      }

      // Extract time signature
      let timeSignature: { numerator: number; denominator: number } | null = null;
      const timeEl = xmlDoc.querySelector('attributes > time');
      if (timeEl) {
        const beats = parseInt(timeEl.querySelector('beats')?.textContent || '4', 10);
        const beatType = parseInt(timeEl.querySelector('beat-type')?.textContent || '4', 10);
        timeSignature = { numerator: beats, denominator: beatType };
      }

      // Parse parts
      const partElements = xmlDoc.querySelectorAll('part');
      const parts: ParsedMusicXml['parts'] = [];
      const allNotes: ParsedNote[] = [];
      const partNames: string[] = [];
      let currentTime = 0;
      let maxDuration = 0;

      partElements.forEach((partEl) => {
        const partId = partEl.getAttribute('id') || '';
        const partName = xmlDoc.querySelector(`part-list > score-part[id="${partId}"] > part-name`)?.textContent || partId;
        partNames.push(partName);
        
        const measures: ParsedMeasure[] = [];
        const measureElements = partEl.querySelectorAll('measure');
        let measureTime = 0;
        
        measureElements.forEach((measureEl) => {
          const measureNumber = parseInt(measureEl.getAttribute('number') || '0', 10);
          const notes: ParsedNote[] = [];
          
          // Parse notes in measure
          const noteElements = measureEl.querySelectorAll('note');
          noteElements.forEach((noteEl) => {
            const pitchEl = noteEl.querySelector('pitch > step');
            const pitch = pitchEl?.textContent || '';
            const octave = parseInt(noteEl.querySelector('pitch > octave')?.textContent || '4', 10);
            const duration = parseInt(noteEl.querySelector('duration')?.textContent || '1', 10);
            const type = noteEl.querySelector('type')?.textContent || 'quarter';
            const voice = parseInt(noteEl.querySelector('voice')?.textContent || '1', 10);
            const staff = parseInt(noteEl.querySelector('staff')?.textContent || '1', 10);
            const isChord = noteEl.querySelector('chord') !== null;

            if (pitch) {
              const noteStartTime = isChord ? measureTime : measureTime;
              const midiPitch = pitchToMidi(pitch, octave);
              
              const note: ParsedNote = {
                pitch,
                octave,
                duration,
                type,
                voice,
                staff,
                startTime: noteStartTime,
                midiPitch,
              };
              notes.push(note);
              allNotes.push(note);
              
              if (!isChord) {
                measureTime += duration / 256; // Rough timing
              }
            }
          });

          measures.push({ number: measureNumber, notes });
        });

        maxDuration = Math.max(maxDuration, measureTime);
        parts.push({ id: partId, name: partName, measures });
      });

      const result: ParsedMusicXml = {
        title,
        composer,
        measures: parts[0]?.measures || [],
        parts,
        notes: allNotes,
        duration: maxDuration || 60, // Default duration
        bpm,
        keySignature,
        timeSignature,
        partNames,
      };

      setParsedXml(result);
      log.info('MusicXML parsed successfully', { title, partsCount: parts.length, notesCount: allNotes.length });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      log.error('Failed to parse MusicXML', { error: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedXml(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    parseMusicXmlFromUrl,
    parsedXml,
    isLoading,
    error,
    reset,
  };
}
