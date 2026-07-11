/**
 * Structured audit logging for edge function authorization events.
 *
 * Emits a single JSON line per event so that logs can be filtered/queried
 * (e.g. in Supabase edge function logs) by `tag=AUDIT` or by fields such as
 * `functionName`, `userId`, `authMethod`, or `outcome`.
 *
 * This is intentionally dependency-free (no DB writes) so it cannot fail the
 * request path. For persisted analytics use `apiLogger`/`content_audit_log`.
 */

export type AuthMethod = "service_role" | "user_jwt" | "admin_jwt" | "none";
export type AuditOutcome = "allowed" | "denied";

export interface AuditEvent {
  functionName: string;
  action: string;
  outcome: AuditOutcome;
  authMethod: AuthMethod;
  userId?: string | null;
  status?: number;
  reason?: string;
  meta?: Record<string, unknown>;
}

export function auditLog(event: AuditEvent): void {
  const payload = {
    tag: "AUDIT",
    ts: new Date().toISOString(),
    ...event,
  };
  // Single-line JSON: keeps logs greppable and machine-parseable.
  try {
    console.log(JSON.stringify(payload));
  } catch {
    console.log(`AUDIT ${event.functionName} ${event.action} ${event.outcome}`);
  }
}

/**
 * Derive the auth method label from an `authorize()` result-like object.
 */
export function authMethodOf(
  auth: { isService?: boolean; isAdmin?: boolean; user?: { id: string } | null } | null,
): AuthMethod {
  if (!auth) return "none";
  if (auth.isService) return "service_role";
  if (auth.isAdmin) return "admin_jwt";
  if (auth.user) return "user_jwt";
  return "none";
}
