import { type FailureCategory } from "@/api/generation.api";
import type { ProjectRow } from "@/api/projects.api";
import type { ArtistRow } from "@/api/artists.api";
import type { TrackRow } from "@/api/tracks.api";

// Wizard mode removed for UX simplification - only 2 modes now
export type GenerationMode = "simple" | "custom";

export interface GenerateFormState {
  mode: GenerationMode;
  description: string;
  title: string;
  lyrics: string;
  style: string;
  hasVocals: boolean;
  model: string;
  negativeTags: string;
  vocalGender: "" | "m" | "f";
  styleWeight: number[];
  weirdnessConstraint: number[];
  audioWeight: number[];
  selectedProjectId?: string;
  selectedTrackId?: string;
  selectedArtistId?: string;
  audioFile: File | null;
  planTrackId?: string;
}

export interface UseGenerateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectId?: string;
  projects?: ProjectRow[];
  artists?: ArtistRow[];
  allTracks?: TrackRow[];
}

export function classifyFailure(error: unknown): FailureCategory {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (msg.includes("429") || msg.includes("rate") || msg.includes("limit")) return "rate_limit";
  if (msg.includes("content") || msg.includes("policy") || msg.includes("moderat")) return "content_policy";
  if (msg.includes("timeout") || msg.includes("timed out")) return "timeout";
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("cors")) return "network";
  if (msg.includes("valid") || msg.includes("required") || msg.includes("too long")) return "validation";
  if (msg.includes("edge function") || msg.includes("500") || msg.includes("502")) return "api_error";
  return "unknown";
}
