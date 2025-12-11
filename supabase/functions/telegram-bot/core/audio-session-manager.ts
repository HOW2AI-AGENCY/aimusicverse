/**
 * Unified Audio Session Manager
 * Prevents infinite loops and coordinates all audio processing workflows
 */

import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('audio-session-manager');

export type AudioSessionType = 
  | 'guitar_analysis'
  | 'midi_transcription' 
  | 'analyze'
  | 'upload'
  | 'cover'
  | 'extend'
  | 'recognize';

export interface AudioSession {
  type: AudioSessionType;
  userId: number;
  chatId: number;
  createdAt: number;
  lastProcessedFileId?: string; // For deduplication
  processingFileId?: string; // Currently processing
  metadata?: Record<string, unknown>;
}

// Session storage
const activeSessions = new Map<number, AudioSession>();
const processedFiles = new Map<string, number>(); // fileId -> timestamp

// Constants
const SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const FILE_DEDUP_MS = 60 * 1000; // 1 minute for file deduplication
const MAX_CONCURRENT_PROCESSING = 3; // Max concurrent audio processing per user

/**
 * Check if user has an active audio session
 */
export function hasActiveSession(userId: number): boolean {
  const session = activeSessions.get(userId);
  if (!session) return false;
  
  // Check expiry
  if (Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
    activeSessions.delete(userId);
    return false;
  }
  
  return true;
}

/**
 * Get active session
 */
export function getActiveSession(userId: number): AudioSession | null {
  if (!hasActiveSession(userId)) return null;
  return activeSessions.get(userId) || null;
}

/**
 * Create new audio session
 */
export function createSession(
  userId: number,
  chatId: number,
  type: AudioSessionType,
  metadata?: Record<string, unknown>
): AudioSession {
  // Clean up old session if exists
  const existingSession = activeSessions.get(userId);
  if (existingSession) {
    logger.info('Replacing existing session', { 
      userId, 
      oldType: existingSession.type, 
      newType: type 
    });
  }
  
  const session: AudioSession = {
    type,
    userId,
    chatId,
    createdAt: Date.now(),
    metadata,
  };
  
  activeSessions.set(userId, session);
  logger.info('Created audio session', { userId, type });
  
  return session;
}

/**
 * Check if file was recently processed (deduplication)
 */
export function wasFileRecentlyProcessed(fileId: string): boolean {
  const timestamp = processedFiles.get(fileId);
  if (!timestamp) return false;
  
  // Check if within dedup window
  if (Date.now() - timestamp > FILE_DEDUP_MS) {
    processedFiles.delete(fileId);
    return false;
  }
  
  return true;
}

/**
 * Mark file as processed
 */
export function markFileProcessed(fileId: string, userId: number): void {
  processedFiles.set(fileId, Date.now());
  
  const session = activeSessions.get(userId);
  if (session) {
    session.lastProcessedFileId = fileId;
  }
  
  logger.debug('Marked file as processed', { fileId, userId });
}

/**
 * Start processing a file
 */
export function startProcessingFile(fileId: string, userId: number): boolean {
  // Check if file is already being processed
  if (wasFileRecentlyProcessed(fileId)) {
    logger.warn('File already processed recently', { fileId, userId });
    return false;
  }
  
  const session = activeSessions.get(userId);
  if (!session) {
    logger.warn('No active session for user', { userId });
    return false;
  }
  
  // Check if already processing a file
  if (session.processingFileId) {
    logger.warn('User already processing a file', { 
      userId, 
      processingFileId: session.processingFileId 
    });
    return false;
  }
  
  session.processingFileId = fileId;
  logger.info('Started processing file', { fileId, userId, type: session.type });
  
  return true;
}

/**
 * Complete file processing
 */
export function completeFileProcessing(fileId: string, userId: number): void {
  const session = activeSessions.get(userId);
  if (session && session.processingFileId === fileId) {
    session.processingFileId = undefined;
    markFileProcessed(fileId, userId);
    logger.info('Completed file processing', { fileId, userId });
  }
}

/**
 * Clear session
 */
export function clearSession(userId: number): void {
  const session = activeSessions.get(userId);
  if (session) {
    logger.info('Cleared audio session', { userId, type: session.type });
    activeSessions.delete(userId);
  }
}

/**
 * Update session metadata
 */
export function updateSessionMetadata(
  userId: number, 
  metadata: Record<string, unknown>
): void {
  const session = activeSessions.get(userId);
  if (session) {
    session.metadata = { ...session.metadata, ...metadata };
  }
}

/**
 * Get session type
 */
export function getSessionType(userId: number): AudioSessionType | null {
  const session = activeSessions.get(userId);
  return session?.type || null;
}

/**
 * Check if user can process more files (rate limiting)
 */
export function canProcessMoreFiles(userId: number): boolean {
  const session = activeSessions.get(userId);
  if (!session) return true;
  
  // If currently processing, don't allow more
  if (session.processingFileId) {
    return false;
  }
  
  return true;
}

/**
 * Cleanup expired sessions and processed files
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleanedSessions = 0;
  let cleanedFiles = 0;
  
  // Clean sessions
  for (const [userId, session] of activeSessions.entries()) {
    if (now - session.createdAt > SESSION_EXPIRY_MS) {
      activeSessions.delete(userId);
      cleanedSessions++;
    }
  }
  
  // Clean processed files
  for (const [fileId, timestamp] of processedFiles.entries()) {
    if (now - timestamp > FILE_DEDUP_MS * 2) {
      processedFiles.delete(fileId);
      cleanedFiles++;
    }
  }
  
  if (cleanedSessions > 0 || cleanedFiles > 0) {
    logger.info('Cleaned up expired data', { 
      sessions: cleanedSessions, 
      files: cleanedFiles 
    });
  }
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  activeSessions: number;
  processedFiles: number;
  sessionsByType: Record<string, number>;
} {
  const sessionsByType: Record<string, number> = {};
  
  for (const session of activeSessions.values()) {
    sessionsByType[session.type] = (sessionsByType[session.type] || 0) + 1;
  }
  
  return {
    activeSessions: activeSessions.size,
    processedFiles: processedFiles.size,
    sessionsByType,
  };
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}
