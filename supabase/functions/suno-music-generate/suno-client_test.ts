// Unit tests for suno-music-generate retry client (rate-limit, 402, fallback, exhaustion).
// Run: deno test supabase/functions/suno-music-generate/suno-client_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callSunoWithRetry } from "./suno-client.ts";
import { createScopedLogger } from "./log.ts";

// Minimal supabase stub — captures inserts, no-ops the rest.
function makeSupabaseStub() {
  const inserts: Array<{ table: string; row: unknown }> = [];
  return {
    inserts,
    from(table: string) {
      return {
        insert: (row: unknown) => {
          inserts.push({ table, row });
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.test("callSunoWithRetry: success on first try", async () => {
  const supabase = makeSupabaseStub();
  const fetchImpl = ((_url: string, _init?: RequestInit) =>
    Promise.resolve(jsonResponse(200, { code: 200, data: { taskId: "t-1" } }))) as typeof fetch;

  const result = await callSunoWithRetry({
    sunoApiKey: "k",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as any,
    userId: "u",
    payload: { prompt: "p" },
    initialModel: "V4_5ALL",
    logger: createScopedLogger("test-1"),
    fetchImpl,
  });

  assertEquals(result.success, true);
  assertEquals(result.retryCount, 0);
  assertEquals(result.currentModel, "V4_5ALL");
  assertEquals(supabase.inserts.length, 1); // one api_usage_logs row
});

Deno.test("callSunoWithRetry: 429 exhausts retries and reports rate-limit status", async () => {
  const supabase = makeSupabaseStub();
  let calls = 0;
  const fetchImpl = ((_url: string, _init?: RequestInit) => {
    calls++;
    return Promise.resolve(jsonResponse(429, { code: 429, msg: "rate limit exceeded" }));
  }) as typeof fetch;

  const result = await callSunoWithRetry({
    sunoApiKey: "k",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as any,
    userId: "u",
    payload: {},
    initialModel: "V4_5ALL",
    logger: createScopedLogger("test-429"),
    maxRetries: 2,
    fetchImpl,
  });

  assertEquals(result.success, false);
  assertEquals(result.lastStatus, 429);
  assertEquals(calls, 3); // initial + 2 retries
  assertEquals(supabase.inserts.length, 3);
});

Deno.test("callSunoWithRetry: 402 is non-transient and does NOT retry", async () => {
  const supabase = makeSupabaseStub();
  let calls = 0;
  const fetchImpl = ((_url: string, _init?: RequestInit) => {
    calls++;
    return Promise.resolve(jsonResponse(402, { code: 402, msg: "insufficient credits" }));
  }) as typeof fetch;

  const result = await callSunoWithRetry({
    sunoApiKey: "k",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as any,
    userId: "u",
    payload: {},
    initialModel: "V4_5ALL",
    logger: createScopedLogger("test-402"),
    maxRetries: 3,
    fetchImpl,
  });

  assertEquals(result.success, false);
  assertEquals(result.lastStatus, 402);
  assertEquals(calls, 1);
});

Deno.test("callSunoWithRetry: model error triggers fallback then succeeds", async () => {
  const supabase = makeSupabaseStub();
  const seenModels: string[] = [];
  const fetchImpl = ((_url: string, init?: RequestInit) => {
    const body = JSON.parse((init?.body as string) ?? "{}");
    seenModels.push(body.model);
    if (seenModels.length === 1) {
      return Promise.resolve(jsonResponse(200, { code: 500, msg: "model error - please try another" }));
    }
    return Promise.resolve(jsonResponse(200, { code: 200, data: { taskId: "t-fb" } }));
  }) as typeof fetch;

  const result = await callSunoWithRetry({
    sunoApiKey: "k",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as any,
    userId: "u",
    payload: {},
    initialModel: "V4_5ALL",
    logger: createScopedLogger("test-fb"),
    fetchImpl,
  });

  assertEquals(result.success, true);
  assertEquals(seenModels.length >= 2, true);
  // Fallback happened
  assertEquals(seenModels[0] !== result.currentModel, true);
});

Deno.test("callSunoWithRetry: network error retries until maxRetries", async () => {
  const supabase = makeSupabaseStub();
  let calls = 0;
  const fetchImpl = ((_url: string, _init?: RequestInit) => {
    calls++;
    return Promise.reject(new Error("network unreachable"));
  }) as typeof fetch;

  const result = await callSunoWithRetry({
    sunoApiKey: "k",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as any,
    userId: "u",
    payload: {},
    initialModel: "V4_5ALL",
    logger: createScopedLogger("test-net"),
    maxRetries: 1,
    fetchImpl,
  });

  assertEquals(result.success, false);
  assertEquals(result.lastStatus, null);
  assertEquals(calls, 2); // initial + 1 retry
});
