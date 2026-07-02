/**
 * useAudioReferenceGeneration — TanStack Query mutation hooks for
 * the audio-reference generation flows (C3 Batch B).
 */
import { useMutation } from "@tanstack/react-query";
import {
  invokeAddVocalsToReference,
  invokeExtractLyricsFromStem,
  invokeTranscribeMidi,
  type AddReferenceMode,
  type AddVocalsParams,
  type ExtractLyricsParams,
  type TranscribeMidiParams,
  type TranscribeMidiResponse,
} from "@/services/audio-reference/generation.service";

export function useAddVocalsToReference() {
  return useMutation({
    mutationFn: ({ mode, params }: { mode: AddReferenceMode; params: AddVocalsParams }) =>
      invokeAddVocalsToReference(mode, params),
  });
}

export function useExtractLyricsFromStem() {
  return useMutation({
    mutationFn: (params: ExtractLyricsParams) => invokeExtractLyricsFromStem(params),
  });
}

export function useTranscribeMidi() {
  return useMutation<TranscribeMidiResponse, Error, TranscribeMidiParams>({
    mutationFn: (params) => invokeTranscribeMidi(params),
  });
}
