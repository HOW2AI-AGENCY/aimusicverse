export interface PipelineRequest {
  audio_url: string;
  audio_base64?: string;
  user_id: string;
  file_name?: string;
  file_size?: number;
  duration_seconds?: number;
  source?: string;
  telegram_chat_id?: number;
  telegram_file_id?: string;
  telegram_message_id?: number;
  skip_stems?: boolean;
  skip_lyrics?: boolean;
  skip_analysis?: boolean;
  force_reprocess?: boolean;
  reference_id?: string;
  extract_lyrics_from_vocal?: boolean;
  action?: "analyze" | "stems" | "full" | "transcribe";
  user_classification?: {
    audio_type?: string;
    vocal_gender?: string;
  };
}

export interface StemUrls {
  vocal?: string;
  instrumental?: string;
  drums?: string;
  bass?: string;
  other?: string;
}

export interface AnalysisResult {
  hasVocals: boolean;
  hasInstrumental: boolean;
  language: string;
  genre: string | null;
  subGenre: string | null;
  mood: string | null;
  energy: string | null;
  tempo: string | null;
  bpmEstimate: number | null;
  vocalStyle: string | null;
  instruments: string[];
  productionStyle: string | null;
  stylePrompt: string | null;
  fullResponse: string;
}

// Maps full language names to ISO 639-1 codes for Whisper
const LANGUAGE_MAP: Record<string, string> = {
  russian: "ru", english: "en", spanish: "es", french: "fr", german: "de",
  italian: "it", portuguese: "pt", chinese: "zh", mandarin: "zh", cantonese: "zh",
  japanese: "ja", korean: "ko", arabic: "ar", hindi: "hi", turkish: "tr",
  polish: "pl", ukrainian: "uk", dutch: "nl", swedish: "sv", norwegian: "no",
  danish: "da", finnish: "fi", greek: "el", hebrew: "he", czech: "cs",
  romanian: "ro", hungarian: "hu", thai: "th", vietnamese: "vi", indonesian: "id",
  malay: "ms", filipino: "tl", tagalog: "tl", bengali: "bn", tamil: "ta",
  telugu: "te", marathi: "mr", gujarati: "gu", punjabi: "pa", urdu: "ur",
  persian: "fa", farsi: "fa", swahili: "sw",
};

export function normalizeLanguage(lang: string | null | undefined): string | undefined {
  if (!lang || lang === "unknown" || lang === "N/A" || lang === "n/a") return undefined;
  const lowerLang = lang.toLowerCase().trim();
  if (lowerLang.length === 2) return lowerLang;
  return LANGUAGE_MAP[lowerLang] || undefined;
}
