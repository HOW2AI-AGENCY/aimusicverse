import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BeatData {
  time: number;
  beatNumber: number;
}

interface BeatAnalysis {
  beats: BeatData[];
  bpm: number;
  timeSignature: string;
  downbeats: number[];
  totalDuration: number;
}

function parseBeatOutput(output: string): BeatData[] {
  const lines = output.trim().split('\n');
  const beats: BeatData[] = [];
  
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const time = parseFloat(parts[0]);
      const beatNumber = parseInt(parts[1], 10);
      if (!isNaN(time) && !isNaN(beatNumber)) {
        beats.push({ time, beatNumber });
      }
    }
  }
  
  return beats;
}

function calculateBPM(beats: BeatData[]): number {
  if (beats.length < 2) return 120;
  
  // Calculate intervals between consecutive beats
  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    const interval = beats[i].time - beats[i - 1].time;
    if (interval > 0.1 && interval < 2) {
      intervals.push(interval);
    }
  }
  
  if (intervals.length === 0) return 120;
  
  // Use median for robustness
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  
  const bpm = Math.round(60 / medianInterval);
  return Math.max(40, Math.min(240, bpm));
}

function detectTimeSignature(beats: BeatData[]): string {
  if (beats.length < 8) return '4/4';
  
  // Count how often we see beat number 1 (downbeat)
  const maxBeatNumber = Math.max(...beats.map(b => b.beatNumber));
  
  if (maxBeatNumber === 3) return '3/4';
  if (maxBeatNumber === 6) return '6/8';
  if (maxBeatNumber === 2) return '2/4';
  return '4/4';
}

function getDownbeats(beats: BeatData[]): number[] {
  return beats
    .filter(b => b.beatNumber === 1)
    .map(b => b.time);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not configured');
    }

    const replicate = new Replicate({ auth: REPLICATE_API_KEY });
    
    const { audio_url, constant_tempo = false, use_dbn = false } = await req.json();
    console.log('Detecting beats:', { audio_url, constant_tempo, use_dbn });

    if (!audio_url) {
      throw new Error('audio_url is required');
    }

    // Run beat detection model - use prediction API for more stable versioning
    let output: string;
    try {
      const prediction = await replicate.predictions.create({
        model: "xavriley/beat_this",
        input: {
          audio: audio_url,
          constant_tempo,
          use_dbn,
        },
      });
      
      // Wait for prediction to complete
      let result = prediction;
      while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await replicate.predictions.get(prediction.id);
      }
      
      if (result.status === 'failed') {
        throw new Error(result.error || 'Beat detection failed');
      }
      
      output = result.output as string;
    } catch (beatError: any) {
      console.error('Beat detection error:', beatError);
      // Fallback: return empty beats with estimated values
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            beats: [],
            bpm: 120,
            timeSignature: '4/4',
            downbeats: [],
            totalDuration: 0,
          },
          raw_output: '',
          fallback: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Raw beat output:', output.substring(0, 500));

    // Parse the output
    const beats = parseBeatOutput(output);
    const bpm = calculateBPM(beats);
    const timeSignature = detectTimeSignature(beats);
    const downbeats = getDownbeats(beats);
    const totalDuration = beats.length > 0 ? beats[beats.length - 1].time : 0;

    const analysis: BeatAnalysis = {
      beats,
      bpm,
      timeSignature,
      downbeats,
      totalDuration,
    };

    console.log('Beat analysis complete:', { 
      beatsCount: beats.length, 
      bpm, 
      timeSignature,
      downbeatsCount: downbeats.length 
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        raw_output: output,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in detect-beats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
