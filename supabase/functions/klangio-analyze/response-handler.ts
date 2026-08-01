import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { API_BASE } from "./request-builder.ts";
import { fetchAndUploadFile, uploadFallbackMidi, getContentType } from "./file-uploader.ts";
import { generateMidiFromNotes } from "./midi.ts";
import { corsHeaders } from "../_shared/cors.ts";

const logger = createLogger("klangio-analyze:response");

export interface ModeHandler {
  handle(
    supabase: SupabaseClient,
    jobId: string,
    apiKey: string,
    userId: string,
    logId: string | null,
    startTime: number,
    generatedFormats: string[],
  ): Promise<Response>;
}

/** Notes extraction: parse JSON response into normalized notes array. */
function extractNotes(transcriptionData: any): {
  notes: any[];
  bpm: number;
  key: string | null;
  timeSignature: string | null;
} {
  let notes: any[] = [];
  let bpm = 120;
  let key: string | null = null;
  let timeSignature: string | null = null;
  let musicInfo: any = {};

  if (transcriptionData.notes && Array.isArray(transcriptionData.notes)) {
    notes = transcriptionData.notes.map((n: any) => ({
      pitch: n.pitch ?? n.midi ?? n.note ?? 60,
      startTime: n.start_time ?? n.startTime ?? n.time ?? n.onset ?? 0,
      endTime:
        n.end_time ?? n.endTime ?? n.offset ?? (n.start_time ?? n.startTime ?? n.time ?? 0) + (n.duration ?? 0.5),
      duration: n.duration ?? 0.5,
      velocity: n.velocity ?? n.loudness ?? 80,
      noteName: n.note_name ?? n.noteName ?? null,
    }));
  } else if (transcriptionData.events && Array.isArray(transcriptionData.events)) {
    notes = transcriptionData.events
      .filter((e: any) => e.type === "note" || e.pitch)
      .map((n: any) => ({
        pitch: n.pitch ?? n.midi ?? 60,
        startTime: n.start ?? n.onset ?? n.time ?? 0,
        endTime: n.end ?? n.offset ?? (n.start ?? n.time ?? 0) + (n.duration ?? 0.5),
        duration: n.duration ?? 0.5,
        velocity: n.velocity ?? 80,
        noteName: null,
      }));
  } else if (transcriptionData.Parts && Array.isArray(transcriptionData.Parts)) {
    musicInfo = transcriptionData.MusicInfo || {};
    bpm = musicInfo.Tempo || 120;
    timeSignature = musicInfo.TimeSignature || null;
    const beatsPerMeasure = (() => {
      const n = parseInt((timeSignature || "4/4").split("/")[0] || "4", 10);
      return isFinite(n) && n > 0 ? n : 4;
    })();
    const measureSeconds = beatsPerMeasure * (60 / bpm);

    let currentMeasureIndex = 0;
    for (const part of transcriptionData.Parts) {
      if (!part.Measures) continue;
      currentMeasureIndex = 0;
      for (const measure of part.Measures) {
        const measureStart = currentMeasureIndex * measureSeconds;
        if (!measure.Voices) {
          currentMeasureIndex++;
          continue;
        }
        for (const voice of measure.Voices) {
          if (!voice.Notes) continue;
          let offset = 0;
          for (const note of voice.Notes) {
            const validMidi = (note.Midi || []).filter((m: number) => m > 0);
            const durInMeasures = note.Duration || 0.25;
            const durSeconds = durInMeasures * measureSeconds;
            const start = measureStart + offset * measureSeconds;
            for (const midi of validMidi) {
              notes.push({
                pitch: midi,
                startTime: start,
                endTime: start + durSeconds,
                duration: durSeconds,
                velocity: note.Velocity || 80,
                noteName: null,
              });
            }
            offset += durInMeasures;
          }
        }
        currentMeasureIndex++;
      }
    }

    if (musicInfo.Tempo) bpm = musicInfo.Tempo;
    if (musicInfo.TimeSignature) timeSignature = musicInfo.TimeSignature;
    if (musicInfo.Key !== undefined) {
      const keyNames = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab"];
      key = keyNames[musicInfo.Key] || `Key ${musicInfo.Key}`;
    }
  }

  return { notes, bpm, key, timeSignature };
}

export async function handleTranscription(
  supabase: SupabaseClient,
  jobId: string,
  apiKey: string,
  userId: string,
  logId: string | null,
  startTime: number,
  generatedFormats: string[],
): Promise<Response> {
  // Fetch JSON notes
  let notes: any[] = [];
  let bpm = 120;
  let key: string | null = null;
  let timeSignature: string | null = null;
  const fetchErrors: Record<string, string> = {};
  const files: Record<string, string> = {};

  const jsonResp = await fetch(`${API_BASE}/job/${jobId}/json`, { headers: { "kl-api-key": apiKey } });
  if (jsonResp.ok) {
    const td = await jsonResp.json();
    const extracted = extractNotes(td);
    notes = extracted.notes;
    bpm = extracted.bpm;
    key = extracted.key;
    timeSignature = extracted.timeSignature;
  } else {
    const txt = await jsonResp.text();
    fetchErrors["json"] = `${jsonResp.status}: ${txt}`;
  }

  // Wait 3s for files to be ready
  await new Promise((r) => setTimeout(r, 3000));

  // Fetch each format
  for (const fmt of generatedFormats) {
    if (fmt === "json") continue;
    const result = await fetchAndUploadFile(supabase, userId, jobId, fmt, apiKey);
    if ("url" in result) files[fmt] = result.url;
    else fetchErrors[fmt] = result.error;
  }

  // Fallback MIDI from notes
  if (!files["midi"] && notes.length > 0) {
    try {
      const midiData = generateMidiFromNotes(notes, bpm);
      const url = await uploadFallbackMidi(supabase, userId, jobId, midiData);
      if (url) files["midi"] = url;
    } catch (e) {
      logger.error("Failed to generate fallback MIDI", e);
    }
  }

  // Update log
  if (logId) {
    await supabase
      .from("klangio_analysis_logs")
      .update({
        status: "completed",
        files,
        notes_count: notes.length,
        fetch_errors: fetchErrors,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      })
      .eq("id", logId);
  }

  return new Response(
    JSON.stringify({
      success: true,
      job_id: jobId,
      mode: "transcription",
      status: "completed",
      available_formats: Object.keys(files),
      files,
      notes,
      bpm,
      key,
      time_signature: timeSignature,
      fetch_errors: fetchErrors,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export async function handleBeatTracking(
  supabase: SupabaseClient,
  jobId: string,
  apiKey: string,
  _userId: string,
  logId: string | null,
  startTime: number,
  _generatedFormats: string[],
): Promise<Response> {
  const jsonResp = await fetch(`${API_BASE}/job/${jobId}/json`, { headers: { "kl-api-key": apiKey } });

  if (!jsonResp.ok) {
    return new Response(JSON.stringify({ success: false, error: `Beat fetch failed: ${jsonResp.status}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const beatData = await jsonResp.json();
  let beats = beatData.beats || [];
  let downbeats = beatData.downbeats || [];
  let bpm = beatData.bpm || beatData.tempo;

  if (!bpm && beats.length >= 2) {
    const intervals = [];
    for (let i = 1; i < Math.min(beats.length, 20); i++) intervals.push(beats[i] - beats[i - 1]);
    if (intervals.length > 0)
      bpm = Math.round(60 / (intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length));
  }

  if (logId) {
    await supabase
      .from("klangio_analysis_logs")
      .update({
        status: "completed",
        beats_count: beats.length,
        bpm,
        raw_response: beatData,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      })
      .eq("id", logId);
  }

  return new Response(
    JSON.stringify({ success: true, job_id: jobId, mode: "beat-tracking", status: "completed", beats, downbeats, bpm }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export async function handleChordRecognition(
  supabase: SupabaseClient,
  jobId: string,
  apiKey: string,
  _userId: string,
  logId: string | null,
  startTime: number,
  _generatedFormats: string[],
): Promise<Response> {
  const jsonResp = await fetch(`${API_BASE}/job/${jobId}/json`, { headers: { "kl-api-key": apiKey } });

  if (!jsonResp.ok) {
    return new Response(JSON.stringify({ success: false, error: `Chord fetch failed: ${jsonResp.status}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const chordData = await jsonResp.json();
  let chords: any[] = [];

  if (Array.isArray(chordData.chords)) {
    chords = chordData.chords.map((c: any) => {
      if (Array.isArray(c)) {
        return {
          chord: c[2] || c[0],
          startTime: typeof c[0] === "number" ? c[0] : parseFloat(c[0]) || 0,
          endTime: typeof c[1] === "number" ? c[1] : parseFloat(c[1]) || 0,
        };
      }
      return {
        chord: c.chord || c.name || c.label || "N",
        startTime: c.start_time ?? c.time ?? c.start ?? 0,
        endTime: c.end_time ?? c.end ?? (c.start_time ? c.start_time + 2 : 2),
      };
    });
  }

  const key = chordData.key || chordData.detected_key || null;
  const strumming = chordData.strumming?.length
    ? chordData.strumming.map((s: any) => ({
        time: s.time || s.timestamp || 0,
        direction: s.direction === "up" || s.direction === "U" ? "U" : "D",
      }))
    : [];

  if (logId) {
    await supabase
      .from("klangio_analysis_logs")
      .update({
        status: "completed",
        chords_count: chords.length,
        key_detected: key,
        raw_response: chordData,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      })
      .eq("id", logId);
  }

  return new Response(
    JSON.stringify({
      success: true,
      job_id: jobId,
      mode: "chord-recognition",
      status: "completed",
      chords,
      key,
      strumming,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
