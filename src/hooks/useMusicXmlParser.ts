/**
 * MusicXML Parser Hook
 * Parses MusicXML files and extracts musical data with proper timing calculation
 * 
 * Key fixes:
 * - Uses <divisions> from MusicXML for accurate timing (not fixed /256)
 * - Handles <rest> elements to maintain correct timing
 * - Supports <chord> elements (notes played simultaneously)
 * - Calculates duration in SECONDS (not ticks)
 * - Supports <alter> for sharps/flats
 * - Extracts tempo from <sound tempo="..."> or <metronome>
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'MusicXmlParser' });

export interface ParsedNote {
  pitch: string;        // Step: C, D, E, F, G, A, B
  alter: number;        // -1 flat, 0 natural, +1 sharp
  octave: number;
  duration: number;     // Duration in SECONDS
  type: string;         // quarter, eighth, etc.
  voice: number;
  staff: number;
  startTime: number;    // Start time in SECONDS
  midiPitch: number;    // MIDI pitch number (0-127)
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
  duration: number;     // Total duration in SECONDS
  bpm: number | null;
  keySignature: string | null;
  timeSignature: { numerator: number; denominator: number } | null;
  partNames: string[];
}

// Helper to convert pitch string + octave + alter to MIDI number
const PITCH_MAP: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

export function pitchToMidi(pitch: string, octave: number, alter: number = 0): number {
  const basePitch = pitch.charAt(0).toUpperCase();
  let semitone = PITCH_MAP[basePitch] ?? 0;
  semitone += alter;
  // MIDI: C4 = 60
  return (octave + 1) * 12 + semitone;
}

export function useMusicXmlParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedXml, setParsedXml] = useState<ParsedMusicXml | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  const parseMusicXmlFromUrl = useCallback(async (xmlUrl: string): Promise<ParsedMusicXml | null> => {
    // Prevent re-parsing same URL
    if (lastUrlRef.current === xmlUrl && parsedXml) {
      log.info('Returning cached parsed MusicXML', { xmlUrl });
      return parsedXml;
    }

    setIsLoading(true);
    setError(null);

    try {
      log.info('Fetching MusicXML file', { xmlUrl });

      const response = await fetch(xmlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch MusicXML: ${response.status}`);
      }

      let xmlText = await response.text();
      
      // Strip BOM if present
      xmlText = xmlText.replace(/^\uFEFF/, '').trimStart();
      
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

      // Extract BPM from sound element or metronome
      let bpm: number | null = null;
      
      // Try <sound tempo="...">
      const soundEl = xmlDoc.querySelector('direction > sound[tempo]');
      if (soundEl) {
        bpm = parseFloat(soundEl.getAttribute('tempo') || '') || null;
      }
      
      // Try <metronome><per-minute>
      if (!bpm) {
        const perMinuteEl = xmlDoc.querySelector('direction-type > metronome > per-minute');
        if (perMinuteEl) {
          bpm = parseFloat(perMinuteEl.textContent || '') || null;
        }
      }
      
      // Default BPM
      if (!bpm) bpm = 120;

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

      // Calculate timing constants
      const secondsPerBeat = 60 / bpm;

      // Parse parts
      const partElements = xmlDoc.querySelectorAll('part');
      const parts: ParsedMusicXml['parts'] = [];
      const allNotes: ParsedNote[] = [];
      const partNames: string[] = [];
      let globalMaxTime = 0;

      partElements.forEach((partEl) => {
        const partId = partEl.getAttribute('id') || '';
        const partName = xmlDoc.querySelector(`part-list > score-part[id="${partId}"] > part-name`)?.textContent || partId;
        partNames.push(partName);
        
        const measures: ParsedMeasure[] = [];
        const measureElements = partEl.querySelectorAll('measure');
        
        // Track current time in seconds (across all measures)
        let currentTimeSeconds = 0;
        // Default divisions (will be updated from <attributes>)
        let divisions = 1;
        
        measureElements.forEach((measureEl) => {
          const measureNumber = parseInt(measureEl.getAttribute('number') || '0', 10);
          const notes: ParsedNote[] = [];
          
          // Check for divisions update in this measure
          const divisionsEl = measureEl.querySelector('attributes > divisions');
          if (divisionsEl) {
            divisions = parseInt(divisionsEl.textContent || '1', 10) || 1;
          }
          
          // Calculate seconds per division
          // In MusicXML, divisions = number of divisions per quarter note
          // So: secondsPerDivision = secondsPerBeat / divisions (assuming beat = quarter note)
          const secondsPerDivision = secondsPerBeat / divisions;
          
          // Track time within measure (for detecting chord vs sequential)
          let measureTimeOffset = 0;
          let previousNonChordDuration = 0;
          
          // Parse notes and rests in measure
          const noteElements = measureEl.querySelectorAll('note');
          
          noteElements.forEach((noteEl) => {
            const isRest = noteEl.querySelector('rest') !== null;
            const isChord = noteEl.querySelector('chord') !== null;
            const durationDivisions = parseInt(noteEl.querySelector('duration')?.textContent || '1', 10);
            const durationSeconds = Math.max(0.02, durationDivisions * secondsPerDivision);
            
            // For chord notes, don't advance time; use same start as previous note
            if (!isChord) {
              // Advance time by previous note's duration
              measureTimeOffset += previousNonChordDuration;
              previousNonChordDuration = durationSeconds;
            }
            
            if (!isRest) {
              const pitchEl = noteEl.querySelector('pitch');
              if (pitchEl) {
                const step = pitchEl.querySelector('step')?.textContent || 'C';
                const octave = parseInt(pitchEl.querySelector('octave')?.textContent || '4', 10);
                const alterEl = pitchEl.querySelector('alter');
                const alter = alterEl ? parseInt(alterEl.textContent || '0', 10) : 0;
                
                const type = noteEl.querySelector('type')?.textContent || 'quarter';
                const voice = parseInt(noteEl.querySelector('voice')?.textContent || '1', 10);
                const staff = parseInt(noteEl.querySelector('staff')?.textContent || '1', 10);
                
                const midiPitch = pitchToMidi(step, octave, alter);
                const startTimeSeconds = currentTimeSeconds + measureTimeOffset;
                
                const note: ParsedNote = {
                  pitch: step,
                  alter,
                  octave,
                  duration: durationSeconds,
                  type,
                  voice,
                  staff,
                  startTime: startTimeSeconds,
                  midiPitch,
                };
                
                notes.push(note);
                allNotes.push(note);
                
                // Track max end time
                const endTime = startTimeSeconds + durationSeconds;
                if (endTime > globalMaxTime) {
                  globalMaxTime = endTime;
                }
              }
            }
          });
          
          // After processing all notes in measure, advance currentTimeSeconds by measure duration
          // The measure duration is the sum of all non-chord note durations
          currentTimeSeconds += measureTimeOffset + previousNonChordDuration;

          measures.push({ number: measureNumber, notes });
        });

        parts.push({ id: partId, name: partName, measures });
      });

      // Final duration is the maximum end time across all notes
      const totalDuration = globalMaxTime > 0 ? globalMaxTime : 60;

      const result: ParsedMusicXml = {
        title,
        composer,
        measures: parts[0]?.measures || [],
        parts,
        notes: allNotes,
        duration: totalDuration,
        bpm,
        keySignature,
        timeSignature,
        partNames,
      };

      setParsedXml(result);
      lastUrlRef.current = xmlUrl;
      
      log.info('MusicXML parsed successfully', { 
        title, 
        partsCount: parts.length, 
        notesCount: allNotes.length,
        duration: totalDuration,
        bpm,
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      log.error('Failed to parse MusicXML', { error: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [parsedXml]);

  const reset = useCallback(() => {
    setParsedXml(null);
    setError(null);
    setIsLoading(false);
    lastUrlRef.current = null;
  }, []);

  return {
    parseMusicXmlFromUrl,
    parsedXml,
    isLoading,
    error,
    reset,
  };
}
