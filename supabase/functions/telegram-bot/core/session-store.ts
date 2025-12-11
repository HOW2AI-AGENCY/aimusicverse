/**
 * In-memory session store for Telegram bot user states
 * Used to track pending audio upload requests
 */

export type AudioUploadMode = 'cover' | 'extend' | 'upload';

export interface PendingUpload {
  mode: AudioUploadMode;
  createdAt: number;
  prompt?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
  // For selecting from existing uploads
  selectedReferenceId?: string;
}

export interface UserSession {
  pendingUpload?: PendingUpload;
  lastActivity: number;
  // Track last message for context
  lastCommand?: string;
  conversationContext?: 'awaiting_audio' | 'awaiting_selection' | 'awaiting_prompt' | null;
}

// Simple in-memory store (resets on function cold start)
// For production, consider using Redis or database storage
const sessions = new Map<number, UserSession>();

// Session expiry time (15 minutes)
const SESSION_EXPIRY_MS = 15 * 60 * 1000;

/**
 * Get or create user session
 */
export function getSession(telegramUserId: number): UserSession {
  let session = sessions.get(telegramUserId);
  
  if (!session) {
    session = { lastActivity: Date.now() };
    sessions.set(telegramUserId, session);
  }
  
  return session;
}

/**
 * Set pending audio upload for user
 */
export function setPendingUpload(
  telegramUserId: number, 
  mode: AudioUploadMode,
  options: Partial<Omit<PendingUpload, 'mode' | 'createdAt'>> = {}
): void {
  const session = getSession(telegramUserId);
  session.pendingUpload = {
    mode,
    createdAt: Date.now(),
    ...options,
  };
  session.lastActivity = Date.now();
  session.conversationContext = 'awaiting_audio';
  sessions.set(telegramUserId, session);
}

/**
 * Get and clear pending upload (consume it)
 */
export function consumePendingUpload(telegramUserId: number): PendingUpload | null {
  const session = getSession(telegramUserId);
  const pending = session.pendingUpload;
  
  if (!pending) return null;
  
  // Check if expired
  if (Date.now() - pending.createdAt > SESSION_EXPIRY_MS) {
    session.pendingUpload = undefined;
    session.conversationContext = null;
    return null;
  }
  
  // Clear the pending upload
  session.pendingUpload = undefined;
  session.lastActivity = Date.now();
  session.conversationContext = null;
  
  return pending;
}

/**
 * Check if user has pending upload
 */
export function hasPendingUpload(telegramUserId: number): boolean {
  const session = getSession(telegramUserId);
  const pending = session.pendingUpload;
  
  if (!pending) return false;
  
  // Check expiry
  if (Date.now() - pending.createdAt > SESSION_EXPIRY_MS) {
    session.pendingUpload = undefined;
    session.conversationContext = null;
    return false;
  }
  
  return true;
}

/**
 * Get pending upload without consuming it
 */
export function getPendingUpload(telegramUserId: number): PendingUpload | null {
  const session = getSession(telegramUserId);
  const pending = session.pendingUpload;
  
  if (!pending) return null;
  
  // Check if expired
  if (Date.now() - pending.createdAt > SESSION_EXPIRY_MS) {
    session.pendingUpload = undefined;
    session.conversationContext = null;
    return null;
  }
  
  return pending;
}

/**
 * Update pending upload options
 */
export function updatePendingUpload(
  telegramUserId: number,
  updates: Partial<Omit<PendingUpload, 'mode' | 'createdAt'>>
): void {
  const session = getSession(telegramUserId);
  if (session.pendingUpload) {
    session.pendingUpload = {
      ...session.pendingUpload,
      ...updates,
    };
    session.lastActivity = Date.now();
  }
}

/**
 * Set conversation context
 */
export function setConversationContext(
  telegramUserId: number,
  context: UserSession['conversationContext']
): void {
  const session = getSession(telegramUserId);
  session.conversationContext = context;
  session.lastActivity = Date.now();
}

/**
 * Get conversation context
 */
export function getConversationContext(telegramUserId: number): UserSession['conversationContext'] {
  const session = getSession(telegramUserId);
  return session.conversationContext;
}

/**
 * Set last command
 */
export function setLastCommand(telegramUserId: number, command: string): void {
  const session = getSession(telegramUserId);
  session.lastCommand = command;
  session.lastActivity = Date.now();
}

/**
 * Get last command
 */
export function getLastCommand(telegramUserId: number): string | undefined {
  const session = getSession(telegramUserId);
  return session.lastCommand;
}

/**
 * Clear all expired sessions (cleanup)
 */
export function cleanupSessions(): void {
  const now = Date.now();
  
  for (const [userId, session] of sessions.entries()) {
    // Remove sessions inactive for more than 1 hour
    if (now - session.lastActivity > 60 * 60 * 1000) {
      sessions.delete(userId);
    }
  }
}

/**
 * Cancel pending upload
 */
export function cancelPendingUpload(telegramUserId: number): boolean {
  const session = sessions.get(telegramUserId);
  if (session?.pendingUpload) {
    session.pendingUpload = undefined;
    session.conversationContext = null;
    return true;
  }
  return false;
}
