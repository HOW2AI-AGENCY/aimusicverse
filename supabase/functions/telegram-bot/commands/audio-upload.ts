/**
 * Audio upload commands for creating covers and extending tracks via Telegram bot
 *
 * Barrel file re-exporting from split modules for backward compatibility.
 * External callers should import from the specific sub-module when possible.
 */

export {
  handleCoverCommand,
  handleExtendCommand,
  handleCancelCommand,
  checkUploadPending,
} from "./audio-upload-commands.ts";

export { handleCancelUploadCallback, handleAudioActionCallback } from "./audio-upload-callbacks.ts";

export { processGenerationWithReference, processAddVocalsInstrumental } from "./audio-upload-processors.ts";

export { getFileInfo, parseAudioOptions, getAudioUploadHelp } from "./audio-upload-utils.ts";
