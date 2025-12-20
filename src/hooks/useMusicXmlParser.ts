/**
 * Hook for parsing MusicXML files from URL and extracting notes
 * Parses standard MusicXML format and converts to note array for visualization
 */
import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'MusicXmlParser' });

export interface ParsedMusicXmlNote {
  pitch: number;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
  noteName: string;
  track: number;
  voice: number;
  staff: number;
}

interface ParsedMusicXml {
  notes: ParsedMusicXmlNote[];
  duration: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number } | null;
  keySignature: string | null;
  partNames: string[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_TO_MIDI_BASE: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

function stepAlterOctaveToMidi(step: string, alter: number, octave: number): number {
  const baseNote = NOTE_TO_MIDI_BASE[step.toUpperCase()] || 0;
  return (octave + 1) * 12 + baseNote + alter;
}

function parseKeySignature(fifths: number, mode: string): string {
  const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  const minorKeys = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];
  const flatMajorKeys = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  const flatMinorKeys = ['A', 'D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'];
  
  const isMinor = mode?.toLowerCase() === 'minor';
  
  if (fifths >= 0) {
    const keys = isMinor ? minorKeys : majorKeys;
    return keys[Math.min(fifths, keys.length - 1)] + (isMinor ? 'm' : '');
  } else {
    const keys = isMinor ? flatMinorKeys : flatMajorKeys;
    return keys[Math.min(Math.abs(fifths), keys.length - 1)] + (isMinor ? 'm' : '');
  }
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

      const notes: ParsedMusicXmlNote[] = [];
      const partNames: string[] = [];
      let bpm = 120;
      let timeSignature: { numerator: number; denominator: number } | null = null;
      let keySignature: string | null = null;
      let divisions = 1; // divisions per quarter note

      // Get part names from part-list
      const partList = xmlDoc.querySelector('part-list');
      if (partList) {
        const scoreParts = partList.querySelectorAll('score-part');
        scoreParts.forEach(sp => {
          const name = sp.querySelector('part-name')?.textContent || 'Unknown';
          partNames.push(name);
        });
      }

      // Parse each part
      const parts = xmlDoc.querySelectorAll('part');
      let globalTime = 0;
      
      parts.forEach((part, partIndex) => {
        let currentTime = 0;
        const measures = part.querySelectorAll('measure');

        measures.forEach((measure) => {
          // Get attributes (divisions, time signature, key signature, tempo)
          const attributes = measure.querySelector('attributes');
          if (attributes) {
            const divElem = attributes.querySelector('divisions');
            if (divElem?.textContent) {
              divisions = parseInt(divElem.textContent, 10) || 1;
            }

            const timeElem = attributes.querySelector('time');
            if (timeElem) {
              const beats = parseInt(timeElem.querySelector('beats')?.textContent || '4', 10);
              const beatType = parseInt(timeElem.querySelector('beat-type')?.textContent || '4', 10);
              timeSignature = { numerator: beats, denominator: beatType };
            }

            const keyElem = attributes.querySelector('key');
            if (keyElem) {
              const fifths = parseInt(keyElem.querySelector('fifths')?.textContent || '0', 10);
              const mode = keyElem.querySelector('mode')?.textContent || 'major';
              keySignature = parseKeySignature(fifths, mode);
            }
          }

          // Get tempo from direction/sound
          const directions = measure.querySelectorAll('direction');
          directions.forEach(dir => {
            const sound = dir.querySelector('sound');
            if (sound?.getAttribute('tempo')) {
              bpm = parseFloat(sound.getAttribute('tempo') || '120');
            }
            // Also check metronome
            const metronome = dir.querySelector('metronome');
            if (metronome) {
              const perMinute = metronome.querySelector('per-minute')?.textContent;
              if (perMinute) {
                bpm = parseFloat(perMinute) || bpm;
              }
            }
          });

          // Parse notes in this measure
          const noteElements = measure.querySelectorAll('note');
          noteElements.forEach(noteElem => {
            // Check if this is a rest
            if (noteElem.querySelector('rest')) {
              const durationElem = noteElem.querySelector('duration');
              if (durationElem?.textContent) {
                const durDivisions = parseInt(durationElem.textContent, 10);
                if (!noteElem.querySelector('chord')) {
                  currentTime += (durDivisions / divisions) * (60 / bpm);
                }
              }
              return;
            }

            // Get pitch
            const pitchElem = noteElem.querySelector('pitch');
            if (!pitchElem) return;

            const step = pitchElem.querySelector('step')?.textContent || 'C';
            const alter = parseInt(pitchElem.querySelector('alter')?.textContent || '0', 10);
            const octave = parseInt(pitchElem.querySelector('octave')?.textContent || '4', 10);
            const midiPitch = stepAlterOctaveToMidi(step, alter, octave);

            // Get duration
            const durationElem = noteElem.querySelector('duration');
            const durDivisions = durationElem?.textContent ? parseInt(durationElem.textContent, 10) : divisions;
            const durationSec = (durDivisions / divisions) * (60 / bpm);

            // Get voice and staff
            const voice = parseInt(noteElem.querySelector('voice')?.textContent || '1', 10);
            const staff = parseInt(noteElem.querySelector('staff')?.textContent || '1', 10);

            // Get dynamics/velocity
            const dynamics = noteElem.querySelector('dynamics');
            let velocity = 80;
            if (dynamics) {
              const dynamicType = dynamics.firstElementChild?.tagName.toLowerCase();
              const dynamicMap: Record<string, number> = {
                'pppp': 20, 'ppp': 30, 'pp': 45, 'p': 60,
                'mp': 70, 'mf': 85, 'f': 100, 'ff': 112,
                'fff': 120, 'ffff': 127
              };
              velocity = dynamicMap[dynamicType || ''] || 80;
            }

            // Check if chord (starts at same time as previous note)
            const isChord = noteElem.querySelector('chord') !== null;
            const startTime = isChord ? currentTime : currentTime;

            notes.push({
              pitch: midiPitch,
              startTime,
              endTime: startTime + durationSec,
              duration: durationSec,
              velocity,
              noteName: midiToNoteName(midiPitch),
              track: partIndex,
              voice,
              staff,
            });

            // Advance time only if not a chord
            if (!isChord) {
              currentTime += durationSec;
            }
          });

          // Handle forward/backup elements
          const forwards = measure.querySelectorAll('forward');
          forwards.forEach(fwd => {
            const dur = parseInt(fwd.querySelector('duration')?.textContent || '0', 10);
            currentTime += (dur / divisions) * (60 / bpm);
          });

          const backups = measure.querySelectorAll('backup');
          backups.forEach(bkp => {
            const dur = parseInt(bkp.querySelector('duration')?.textContent || '0', 10);
            currentTime -= (dur / divisions) * (60 / bpm);
          });
        });

        globalTime = Math.max(globalTime, currentTime);
      });

      // Sort notes by start time
      notes.sort((a, b) => a.startTime - b.startTime);

      const totalDuration = notes.length > 0 
        ? Math.max(...notes.map(n => n.endTime))
        : globalTime;

      const result: ParsedMusicXml = {
        notes,
        duration: totalDuration,
        bpm,
        timeSignature,
        keySignature,
        partNames,
      };

      log.info('MusicXML parsed successfully', {
        noteCount: notes.length,
        duration: totalDuration,
        bpm,
        keySignature,
        parts: partNames.length,
      });

      setParsedXml(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('Failed to parse MusicXML', { error: message });
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedXml(null);
    setError(null);
  }, []);

  return {
    parseMusicXmlFromUrl,
    parsedXml,
    isLoading,
    error,
    reset,
  };
}
