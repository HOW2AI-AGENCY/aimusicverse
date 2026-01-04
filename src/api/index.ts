/**
 * API Layer Index
 * Re-exports all API modules for easy importing
 */

export * from './tracks.api';
export * from './credits.api';
export * from './playlists.api';
export * from './projects.api';
export * from './artists.api';
export * from './studio.api';
export * from './admin.api';
export * from './analytics.api';
export * from './generation.api';
// Note: analysis.api exports GuitarRecording which conflicts with studio.api
// Import directly from analysis.api when needed
export { 
  fetchTrackAnalysis,
  createAudioAnalysis,
  uploadAudioForAnalysis,
  createTempAnalysisTrack,
  deleteTempAnalysisTrack,
  invokeMidiTranscription,
  saveGuitarRecording,
  type AudioAnalysis,
} from './analysis.api';
