import type { MidiEvent } from "./types.ts";

// Generate MIDI file from notes array (fallback when API doesn't return MIDI)
export function generateMidiFromNotes(notes: any[], bpm: number = 120): Uint8Array {
  // Standard MIDI File format (SMF Type 0)
  const ticksPerBeat = 480;
  const tempo = Math.round(60000000 / bpm); // microseconds per beat

  // Sort notes by start time
  const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);

  // Convert time in seconds to ticks
  const secondsToTicks = (seconds: number) => Math.round(seconds * ticksPerBeat * (bpm / 60));

  // Build track data
  const trackEvents: Array<{ delta: number; data: number[] }> = [];

  // Tempo event (FF 51 03 + 3-byte tempo)
  trackEvents.push({
    delta: 0,
    data: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff],
  });

  // Convert notes to MIDI events (note on/off pairs)
  const midiEvents: MidiEvent[] = [];

  for (const note of sortedNotes) {
    const startTick = secondsToTicks(note.startTime);
    const endTick = secondsToTicks(note.endTime);
    const pitch = Math.min(127, Math.max(0, note.pitch));
    const velocity = Math.min(127, Math.max(1, note.velocity || 80));

    midiEvents.push({ tick: startTick, type: "on", pitch, velocity });
    midiEvents.push({ tick: endTick, type: "off", pitch, velocity: 0 });
  }

  // Sort by tick time
  midiEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    // Note offs before note ons at same tick
    return a.type === "off" ? -1 : 1;
  });

  // Convert to track events with delta times
  let lastTick = 0;
  for (const event of midiEvents) {
    const delta = event.tick - lastTick;
    lastTick = event.tick;

    const status = event.type === "on" ? 0x90 : 0x80; // Channel 0
    trackEvents.push({
      delta,
      data: [status, event.pitch, event.velocity],
    });
  }

  // End of track event
  trackEvents.push({
    delta: 0,
    data: [0xff, 0x2f, 0x00],
  });

  // Build track chunk
  const trackData: number[] = [];
  for (const event of trackEvents) {
    trackData.push(...encodeVLQ(event.delta));
    trackData.push(...event.data);
  }

  // Header chunk: MThd
  const header = [
    0x4d,
    0x54,
    0x68,
    0x64, // "MThd"
    0x00,
    0x00,
    0x00,
    0x06, // chunk length (6)
    0x00,
    0x00, // format type 0
    0x00,
    0x01, // 1 track
    (ticksPerBeat >> 8) & 0xff,
    ticksPerBeat & 0xff, // ticks per beat
  ];

  // Track chunk: MTrk
  const trackLength = trackData.length;
  const track = [
    0x4d,
    0x54,
    0x72,
    0x6b, // "MTrk"
    (trackLength >> 24) & 0xff,
    (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff,
    trackLength & 0xff,
    ...trackData,
  ];

  return new Uint8Array([...header, ...track]);
}

// Encode variable-length quantity
function encodeVLQ(value: number): number[] {
  if (value === 0) return [0];
  const bytes: number[] = [];
  let v = value;
  bytes.unshift(v & 0x7f);
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}
