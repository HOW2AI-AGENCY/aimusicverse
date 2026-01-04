/**
 * Error classes and utilities export
 * Phase 4: Enhanced with Result type, severity levels, and recovery strategies
 */

export {
  // Error codes and severity
  ErrorCode,
  ErrorSeverity,
  RecoveryStrategy,
  
  // Error classes
  AppError,
  NetworkError,
  APIError,
  ValidationError,
  AudioError,
  GenerationError,
  InsufficientCreditsError,
  StorageError,
  
  // Type utilities
  type ErrorMetadata,
  type Result,
  
  // Helper functions
  ok,
  err,
  tryCatch,
  tryCatchSync,
  toAppError,
  isErrorType,
  hasErrorCode,
  retryWithBackoff,
} from './AppError';
