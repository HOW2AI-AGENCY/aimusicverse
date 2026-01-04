/**
 * export-midi - Edge Function to generate MIDI file from notes array
 * 
 * Takes an array of notes with pitch, startTime, duration, velocity
 * and returns a valid MIDI file as base64
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MidiNote {
  pitch: number;      // 0-127
  startTime: number;  // in seconds
  duration: number;   // in seconds
  velocity: number;   // 0-127
  channel?: number;   // 0-15, default 0
}

interface ExportRequest {
  notes: MidiNote[];
  bpm?: number;
  timeSignature?: string;
  trackName?: string;
}

// Variable-length quantity encoding for MIDI
function writeVarLen(value: number): number[] {
  const result: number[] = [];
  let v = value;
  
  result.unshift(v & 0x7f);
  v >>= 7;
  
  while (v > 0) {
    result.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  
  return result;
}

// Write a 16-bit big-endian value
function writeInt16(value: number): number[] {
  return [(value >> 8) & 0xff, value & 0xff];
}

// Write a 32-bit big-endian value
function writeInt32(value: number): number[] {
  return [
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ];
}

// Generate MIDI file from notes
function generateMidi(
  notes: MidiNote[],
  bpm: number = 120,
  timeSignature: string = '4/4',
  trackName: string = 'Piano Roll Export'
): Uint8Array {
  const ticksPerBeat = 480; // Standard resolution
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  
  // Parse time signature
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const denominatorPower = Math.log2(denominator);
  
  // Sort notes by start time
  const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);
  
  // Build track data
  const trackEvents: number[] = [];
  
  // Track name meta event
  const nameBytes = new TextEncoder().encode(trackName);
  trackEvents.push(0x00); // Delta time
  trackEvents.push(0xff, 0x03, nameBytes.length); // Meta event: track name
  trackEvents.push(...nameBytes);
  
  // Tempo meta event
  trackEvents.push(0x00); // Delta time
  trackEvents.push(0xff, 0x51, 0x03); // Meta event: tempo
  trackEvents.push(
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff
  );
  
  // Time signature meta event
  trackEvents.push(0x00); // Delta time
  trackEvents.push(0xff, 0x58, 0x04); // Meta event: time signature
  trackEvents.push(numerator, denominatorPower, 24, 8);
  
  // Convert notes to MIDI events
  interface MidiEvent {
    tick: number;
    type: 'on' | 'off';
    pitch: number;
    velocity: number;
    channel: number;
  }
  
  const events: MidiEvent[] = [];
  
  for (const note of sortedNotes) {
    const startTick = Math.round(note.startTime * ticksPerBeat * (bpm / 60));
    const endTick = startTick + Math.round(note.duration * ticksPerBeat * (bpm / 60));
    const channel = note.channel ?? 0;
    
    events.push({
      tick: startTick,
      type: 'on',
      pitch: note.pitch,
      velocity: note.velocity,
      channel,
    });
    
    events.push({
      tick: endTick,
      type: 'off',
      pitch: note.pitch,
      velocity: 0,
      channel,
    });
  }
  
  // Sort events by tick, with note-offs before note-ons at same tick
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type === 'off' && b.type === 'on') return -1;
    if (a.type === 'on' && b.type === 'off') return 1;
    return 0;
  });
  
  // Write events with delta times
  let lastTick = 0;
  for (const event of events) {
    const deltaTick = event.tick - lastTick;
    lastTick = event.tick;
    
    const deltaBytes = writeVarLen(deltaTick);
    trackEvents.push(...deltaBytes);
    
    if (event.type === 'on') {
      trackEvents.push(0x90 | event.channel); // Note on
      trackEvents.push(event.pitch);
      trackEvents.push(event.velocity);
    } else {
      trackEvents.push(0x80 | event.channel); // Note off
      trackEvents.push(event.pitch);
      trackEvents.push(0);
    }
  }
  
  // End of track meta event
  trackEvents.push(0x00); // Delta time
  trackEvents.push(0xff, 0x2f, 0x00); // End of track
  
  // Build complete MIDI file
  const midiData: number[] = [];
  
  // Header chunk
  midiData.push(...[0x4d, 0x54, 0x68, 0x64]); // "MThd"
  midiData.push(...writeInt32(6)); // Header length
  midiData.push(...writeInt16(0)); // Format type 0
  midiData.push(...writeInt16(1)); // Number of tracks
  midiData.push(...writeInt16(ticksPerBeat)); // Ticks per beat
  
  // Track chunk
  midiData.push(...[0x4d, 0x54, 0x72, 0x6b]); // "MTrk"
  midiData.push(...writeInt32(trackEvents.length)); // Track length
  midiData.push(...trackEvents);
  
  return new Uint8Array(midiData);
}

// Base64 encode
function base64Encode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { notes, bpm = 120, timeSignature = '4/4', trackName = 'Exported Track' }: ExportRequest = await req.json();
    
    console.log('[export-midi] Generating MIDI:', {
      notesCount: notes?.length || 0,
      bpm,
      timeSignature,
    });
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No notes provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate notes
    const validNotes = notes.filter(n => 
      typeof n.pitch === 'number' &&
      typeof n.startTime === 'number' &&
      typeof n.duration === 'number' &&
      typeof n.velocity === 'number' &&
      n.pitch >= 0 && n.pitch <= 127 &&
      n.velocity >= 0 && n.velocity <= 127
    );
    
    if (validNotes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid notes found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate MIDI
    const midiData = generateMidi(validNotes, bpm, timeSignature, trackName);
    const base64Data = base64Encode(midiData);
    
    console.log('[export-midi] Generated MIDI file:', {
      bytes: midiData.length,
      validNotes: validNotes.length,
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        data: base64Data,
        mimeType: 'audio/midi',
        filename: `${trackName.replace(/[^a-zA-Z0-9]/g, '_')}.mid`,
        notesCount: validNotes.length,
        duration: Math.max(...validNotes.map(n => n.startTime + n.duration)),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[export-midi] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to export MIDI';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
