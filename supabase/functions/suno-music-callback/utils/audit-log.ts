/**
 * Audit log utility — posts to audit-log edge function.
 * ponytail: extracted from index.ts so handlers can share it.
 */

import { createLogger } from "../../_shared/logger.ts";

const logger = createLogger("audit-log");

export interface AuditEntry {
  entityType: "track" | "project" | "artist" | "lyrics" | "cover" | "reference_audio";
  entityId: string;
  userId: string;
  actorType: "user" | "ai" | "system";
  aiModelUsed?: string;
  actionType: string;
  actionCategory?: string;
  contentUrl?: string;
  promptUsed?: string;
  inputMetadata?: Record<string, unknown>;
  outputMetadata?: Record<string, unknown>;
  chainId?: string;
}

export async function logAuditAction(supabaseUrl: string, supabaseKey: string, entry: AuditEntry): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/audit-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      logger.warn("Audit log failed", { status: response.status });
    }
  } catch (error) {
    logger.warn("Audit log error", { error: String(error) });
  }
}
