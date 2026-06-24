/**
 * Services Layer Index
 * Re-exports all service modules
 */

// Core services
export * from './credits.service';
export * from './tracks.service';
export * from './playlists.service';
export * from './projects.service';
export * from './artists.service';
export * from './studio.service';
export * from './audio-reference';
export * from './admin.service';
export * from './generation.service';
export * from './analysis.service';
// Unified analysis - explicit exports to avoid naming conflicts
export { audioAnalysisService } from './unified-analysis';
export type { 
  UnifiedAnalysisResult,
  AnalysisRequest,
  AnalysisState,
  AnalysisStatus,
  AnalysisType,
  AnalysisProvider,
} from './unified-analysis';

// Analytics services (modular)
export * from './analytics';

// Payment services
export * from './starsPaymentService';
export * from './tinkoffPaymentService';
export * from './payment.service';

// Telegram services (consolidated)
export * from './telegram';

// Notification services
export * from './notificationManager';
