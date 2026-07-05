/**
 * Studio API Layer
 * Re-exports from decomposed modules (Sprint 051)
 * Original: 953 LOC → 4 modules
 *
 * Modules:
 * - studio-tracks.api.ts: Track versions, stems, source track, stem separation
 * - studio-generation.api.ts: Generation tasks, section replacement, mashup/persona
 * - studio-transcription.api.ts: Stem transcriptions, MIDI export, transcription lookups
 * - studio-realtime.api.ts: Realtime subscriptions, replacement tasks, studio projects
 */
export * from "./studio";
