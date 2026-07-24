// Audio Flamingo 3 style analysis
import type { AnalysisResult } from "./types.ts";

const FIELD_ORDER = [
  "VOCALS", "INSTRUMENTAL", "LANGUAGE", "GENRE", "SUB_GENRE", "MOOD",
  "ENERGY", "TEMPO", "BPM_ESTIMATE", "VOCAL_STYLE", "INSTRUMENTS",
  "PRODUCTION_STYLE", "STYLE_PROMPT",
];

function parseField(text: string, field: string): string | null {
  const fieldIndex = FIELD_ORDER.indexOf(field);
  const remainingFields = FIELD_ORDER.slice(fieldIndex + 1);
  let pattern: string;
  if (remainingFields.length > 0) {
    const nextFieldsPattern = remainingFields.join("|");
    pattern = `${field}:\\s*(.+?)(?=\\s*(?:${nextFieldsPattern}):|$)`;
  } else {
    pattern = `${field}:\\s*(.+)$`;
  }
  const regex = new RegExp(pattern, "is");
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim().replace(/\s+/g, " ");
  }
  return null;
}

const FLAMINGO_PROMPT = `Analyze this audio track comprehensively.
Answer in EXACTLY this format:

VOCALS: YES or NO (is there singing, rapping, or spoken vocals?)
INSTRUMENTAL: YES or NO (is there significant instrumental music?)
LANGUAGE: the language of vocals, or N/A if no vocals
GENRE: the primary music genre
SUB_GENRE: secondary genre or style
MOOD: the emotional mood
ENERGY: HIGH, MEDIUM, or LOW
TEMPO: FAST, MEDIUM, or SLOW
BPM_ESTIMATE: estimated beats per minute (number)
VOCAL_STYLE: describe the vocal characteristics (gender, style, technique) or N/A
INSTRUMENTS: comma-separated list of instruments heard
PRODUCTION_STYLE: describe the production style (lo-fi, polished, vintage, modern, etc.)
STYLE_PROMPT: write a detailed style description suitable for AI music generation (max 200 chars)

Be precise. If you hear ANY human voice singing/rapping, VOCALS: YES`;

export function emptyAnalysis(hasVocals = false, hasInstrumental = true): AnalysisResult {
  return {
    hasVocals, hasInstrumental,
    language: "unknown", genre: null, subGenre: null, mood: null,
    energy: null, tempo: null, bpmEstimate: null, vocalStyle: null,
    instruments: [], productionStyle: null, stylePrompt: null, fullResponse: "",
  };
}

export async function runFlamingoAnalysis(
  replicate: any,
  audioInput: string,
): Promise<AnalysisResult> {
  console.log("🔍 Running Audio Flamingo 3 analysis...");
  try {
    const flamingoOutput = (await replicate.run(
      "zsxkib/audio-flamingo-3:2856d42f07154766b0cc0f3554fb425d7c3422ae77269264fbe0c983ac759fef",
      {
        input: {
          audio: audioInput,
          prompt: "Analyze this audio",
          system_prompt: FLAMINGO_PROMPT,
          enable_thinking: false,
          temperature: 0.1,
          max_length: 1024,
        },
      },
    )) as string;

    console.log("📊 Flamingo output:", flamingoOutput);

    const vocalsRaw = parseField(flamingoOutput, "VOCALS") || "";
    const instrumentalRaw = parseField(flamingoOutput, "INSTRUMENTAL") || "";
    const hasVocals = /yes/i.test(vocalsRaw) || /singing|singer|rapper|vocal|voice|lyrics/i.test(flamingoOutput);
    const hasInstrumental = /yes/i.test(instrumentalRaw) ||
      /instrumental|instruments|guitar|piano|drums|bass|synth/i.test(flamingoOutput);

    const bpmStr = parseField(flamingoOutput, "BPM_ESTIMATE");
    const bpmEstimate = bpmStr ? parseInt(bpmStr.replace(/\D/g, "")) || null : null;

    const instrumentsStr = parseField(flamingoOutput, "INSTRUMENTS");
    const instruments = instrumentsStr
      ? instrumentsStr.split(",").map((i) => i.trim()).filter(Boolean)
      : [];

    const stylePrompt = parseField(flamingoOutput, "STYLE_PROMPT");

    const result: AnalysisResult = {
      hasVocals,
      hasInstrumental,
      language: parseField(flamingoOutput, "LANGUAGE") || "unknown",
      genre: parseField(flamingoOutput, "GENRE"),
      subGenre: parseField(flamingoOutput, "SUB_GENRE"),
      mood: parseField(flamingoOutput, "MOOD"),
      energy: parseField(flamingoOutput, "ENERGY"),
      tempo: parseField(flamingoOutput, "TEMPO"),
      bpmEstimate,
      vocalStyle: parseField(flamingoOutput, "VOCAL_STYLE"),
      instruments,
      productionStyle: parseField(flamingoOutput, "PRODUCTION_STYLE"),
      stylePrompt,
      fullResponse: flamingoOutput,
    };

    console.log("✅ Analysis complete:", {
      hasVocals: result.hasVocals,
      hasInstrumental: result.hasInstrumental,
      genre: result.genre,
    });
    return result;
  } catch (analysisError) {
    console.error("❌ Audio Flamingo failed:", analysisError);
    return emptyAnalysis(false, true);
  }
}

export function analysisFromExistingRef(existingRef: any): AnalysisResult {
  return {
    hasVocals: existingRef.has_vocals ?? existingRef.metadata?.audio_type !== "instrumental",
    hasInstrumental: existingRef.has_instrumentals ?? true,
    language: existingRef.detected_language || "unknown",
    genre: existingRef.genre,
    subGenre: null,
    mood: existingRef.mood,
    energy: existingRef.energy,
    tempo: existingRef.tempo,
    bpmEstimate: existingRef.bpm,
    vocalStyle: existingRef.vocal_style,
    instruments: existingRef.instruments || [],
    productionStyle: null,
    stylePrompt: existingRef.style_description,
    fullResponse: "",
  };
}
