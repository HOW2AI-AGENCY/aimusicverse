// Backward-compat re-export from old path
// ponytail: move imports to @/hooks/audio/useStudioAudio when convenient
export {
  registerStudioAudio,
  unregisterStudioAudio,
  pauseAllStudioAudio,
  getActiveAudioSource,
  onAudioStateChange,
  useStudioAudio,
} from "@/hooks/audio/useStudioAudio";
