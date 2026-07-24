// Stem separation via Demucs + lyrics via Whisper
import type { StemUrls } from "./types.ts";
import { normalizeLanguage } from "./types.ts";

export async function separateStems(
  replicate: any,
  audioUrl: string,
): Promise<{ stemUrls: StemUrls; status: string }> {
  console.log("🎛️ Initiating stem separation...");
  try {
    const demucsOutput = (await replicate.run("cjwbw/demucs", {
      input: {
        audio: audioUrl,
        stem: "none",
        model: "htdemucs",
        split: true,
        segment: 40,
      },
    })) as { vocals?: string; drums?: string; bass?: string; other?: string };

    console.log("✅ Demucs output:", Object.keys(demucsOutput || {}));

    if (!demucsOutput) return { stemUrls: {}, status: "failed" };

    const stemUrls: StemUrls = {
      vocal: demucsOutput.vocals,
      drums: demucsOutput.drums,
      bass: demucsOutput.bass,
      other: demucsOutput.other,
    };
    if (demucsOutput.other) stemUrls.instrumental = demucsOutput.other;

    return { stemUrls, status: "completed" };
  } catch (demucsError) {
    console.error("❌ Demucs failed:", demucsError);
    return { stemUrls: {}, status: "failed" };
  }
}

export async function transcribeVocalStem(
  replicate: any,
  vocalUrl: string,
  language: string,
): Promise<{ lyrics: string | null; method: string | null }> {
  console.log("🎤 Extracting lyrics from VOCAL STEM...");
  const whisperLanguage = normalizeLanguage(language);
  try {
    const whisperOutput = (await replicate.run(
      "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2",
      {
        input: {
          audio: vocalUrl,
          model: "large-v3",
          language: whisperLanguage,
          translate: false,
          temperature: 0,
          transcription: "plain text",
          no_speech_threshold: 0.6,
        },
      },
    )) as { transcription?: string; text?: string };

    const lyrics = whisperOutput?.transcription || whisperOutput?.text || null;
    console.log("✅ Lyrics extracted from vocal stem:", lyrics?.length, "chars");
    return { lyrics, method: "whisper-large-v3-from-vocal-stem" };
  } catch (whisperError) {
    console.error("❌ Whisper failed on vocal stem:", whisperError);
    return { lyrics: null, method: null };
  }
}
