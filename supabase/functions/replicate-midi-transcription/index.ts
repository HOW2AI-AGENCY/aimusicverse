import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";
import { corsHeaders } from "../_shared/cors.ts";
import { getSupabaseClient } from "../telegram-bot/core/supabase-client.ts";

/** Note structure for MIDI */
interface MidiNote {
  pitch: number;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });

    const { audioUrl, trackId, recordingId, stemId, model = 'basic-pitch' } = await req.json();

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: "audioUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[replicate-midi] Starting transcription for: ${audioUrl}`);
    console.log(`[replicate-midi] Model: ${model}`);

    const supabase = getSupabaseClient();

    let output: any;
    let notes: MidiNote[] = [];
    let midiUrl: string | null = null;

    // Use Basic Pitch model - no duration limit, high quality polyphonic transcription
    // https://replicate.com/spotify/basic-pitch
    console.log("[replicate-midi] Using Spotify Basic Pitch model");
    
    output = await replicate.run(
      "spotify/basic-pitch:df03c8fb52fd91d84a0e25aa33d2c2f8a40d7e1c4e28f0d53e3b95c019bd1e59",
      {
        input: {
          audio_file: audioUrl,
          // Output options for Basic Pitch
          save_midi: true,
          sonify_midi: false, // Don't need audio playback
          save_model_outputs: true, // Get note data
          save_notes: true, // Get CSV note data
        },
      }
    );

    console.log("[replicate-midi] Basic Pitch output:", JSON.stringify(output).slice(0, 2000));

    // Parse Basic Pitch output
    // Output format: { midi: "url", model_outputs: "url", notes: "url" }
    if (output) {
      if (typeof output === 'string') {
        // Direct MIDI URL
        midiUrl = output;
      } else if (output.midi) {
        midiUrl = output.midi;
      }

      // Try to parse notes from CSV output
      if (output.notes) {
        try {
          console.log("[replicate-midi] Fetching notes CSV from:", output.notes);
          const notesResponse = await fetch(output.notes);
          if (notesResponse.ok) {
            const notesCsv = await notesResponse.text();
            notes = parseNotesCsv(notesCsv);
            console.log(`[replicate-midi] Parsed ${notes.length} notes from CSV`);
          }
        } catch (e) {
          console.error("[replicate-midi] Failed to parse notes CSV:", e);
        }
      }

      // If no notes from CSV, try model_outputs (NPZ format with note data)
      if (notes.length === 0 && output.model_outputs) {
        console.log("[replicate-midi] Notes CSV empty, will rely on MIDI file");
      }
    }

    if (!midiUrl) {
      throw new Error("No MIDI output received from Basic Pitch");
    }

    console.log(`[replicate-midi] MIDI URL: ${midiUrl}`);
    console.log(`[replicate-midi] Notes count: ${notes.length}`);

    // Download and upload MIDI to Supabase storage
    let uploadedMidiUrl: string | null = null;
    try {
      const midiResponse = await fetch(midiUrl);
      if (midiResponse.ok) {
        const midiBlob = await midiResponse.blob();
        const timestamp = Date.now();
        const fileName = `midi/basic-pitch-${stemId || trackId || 'audio'}-${timestamp}.mid`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-assets')
          .upload(fileName, midiBlob, {
            contentType: 'audio/midi',
            cacheControl: '31536000',
          });

        if (uploadError) {
          console.error('[replicate-midi] Upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('project-assets')
            .getPublicUrl(fileName);
          uploadedMidiUrl = publicUrl;
          console.log(`[replicate-midi] Uploaded MIDI to: ${uploadedMidiUrl}`);
        }
      }
    } catch (e) {
      console.error('[replicate-midi] Failed to upload MIDI:', e);
    }

    // If we have a trackId or recordingId, save the result to the database
    if (recordingId) {
      const { error: updateError } = await supabase
        .from("guitar_recordings")
        .update({
          midi_url: uploadedMidiUrl || midiUrl,
          analysis_status: { status: "completed", progress: 100 },
          notes: notes.length > 0 ? notes : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordingId);

      if (updateError) {
        console.error("[replicate-midi] Error updating guitar_recordings:", updateError);
      }
    }

    // Log the transcription
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id;
    }

    if (userId) {
      await supabase.from("klangio_analysis_logs").insert({
        user_id: userId,
        mode: "transcription",
        model: "basic-pitch",
        audio_url: audioUrl,
        status: "completed",
        files: { midi: uploadedMidiUrl || midiUrl },
        notes_count: notes.length,
        completed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        midiUrl: uploadedMidiUrl || midiUrl,
        files: {
          midi: uploadedMidiUrl || midiUrl,
        },
        notes,
        notes_count: notes.length,
        model: "basic-pitch",
        message: "Full-length MIDI transcription completed successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[replicate-midi] Transcription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Transcription failed";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Parse Basic Pitch notes CSV format
// Format: start_time_s,end_time_s,pitch_midi,velocity,pitch_bend
function parseNotesCsv(csv: string): MidiNote[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return []; // Need header + at least one note
  
  const notes: MidiNote[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 4) continue;
    
    const startTime = parseFloat(parts[0]);
    const endTime = parseFloat(parts[1]);
    const pitch = parseInt(parts[2], 10);
    const velocity = Math.min(127, Math.max(1, Math.round(parseFloat(parts[3]) * 127)));
    
    if (!isNaN(startTime) && !isNaN(endTime) && !isNaN(pitch)) {
      notes.push({
        pitch,
        startTime,
        endTime,
        duration: endTime - startTime,
        velocity,
      });
    }
  }
  
  // Sort by start time
  notes.sort((a, b) => a.startTime - b.startTime);
  
  return notes;
}
