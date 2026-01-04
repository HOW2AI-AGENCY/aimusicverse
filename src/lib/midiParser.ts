/**
 * Simple MIDI parser for visualization
 */

import { Midi } from '@tonejs/midi';

export interface ParsedNote {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
}

export interface ParsedMidi {
  notes: ParsedNote[];
  duration: number;
  bpm?: number;
}

export async function parseMidiFromUrl(url: string): Promise<ParsedMidi | null> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    
    const notes: ParsedNote[] = [];
    let maxEndTime = 0;
    
    for (const track of midi.tracks) {
      for (const note of track.notes) {
        const endTime = note.time + note.duration;
        notes.push({
          pitch: note.midi,
          startTime: note.time,
          endTime,
          velocity: Math.round(note.velocity * 127),
        });
        maxEndTime = Math.max(maxEndTime, endTime);
      }
    }
    
    // Sort by start time
    notes.sort((a, b) => a.startTime - b.startTime);
    
    return {
      notes,
      duration: maxEndTime,
      bpm: midi.header.tempos[0]?.bpm,
    };
  } catch (error) {
    console.error('Failed to parse MIDI:', error);
    return null;
  }
}
