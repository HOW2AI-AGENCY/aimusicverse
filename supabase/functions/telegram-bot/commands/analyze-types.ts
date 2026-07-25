/**
 * Analysis session storage for the /analyze command
 */

export interface AnalysisSession {
  referenceId: string;
  audioUrl: string;
  fileName: string;
  userId: string;
}

// Simple in-memory session storage
const analysisSessions = new Map<number, AnalysisSession>();

export function setAnalysisSession(telegramUserId: number, session: AnalysisSession): void {
  analysisSessions.set(telegramUserId, session);
}

export function getAnalysisSession(telegramUserId: number): AnalysisSession | undefined {
  return analysisSessions.get(telegramUserId);
}

export function clearAnalysisSession(telegramUserId: number): void {
  analysisSessions.delete(telegramUserId);
}
