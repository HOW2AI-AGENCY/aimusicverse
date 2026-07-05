/**
 * Studio Service Layer
 * Re-exports from decomposed modules (Sprint 051)
 * Original: 1137 LOC → 4 modules (~300 LOC each)
 *
 * Modules:
 * - studio-sections.service.ts: Section detection, parsing, replacement, validation
 * - studio-stems.service.ts: Source track, stems, transcription, MIDI export
 * - studio-operations.service.ts: Version mgmt, activity, track ops, mashup/persona
 * - studio-realtime.service.ts: Telegram, generation, realtime subscriptions
 */
export * from "./studio";
