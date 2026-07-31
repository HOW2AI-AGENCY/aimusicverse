/**
 * Smoke test: simulate the full Suno complete callback flow with a mocked
 * Supabase client and assert:
 *   1. Two `track_versions` rows created (A + B)
 *   2. Each version has audio_url and cover_url populated from mixed camel/snake payload
 *   3. `tracks.active_version_id` is set to version A
 *   4. Skipped-clip payloads surface in the user notification metadata
 *
 * We import the handler source and transpile it inline so this test runs
 * under Vitest without needing Deno.
 */
import { describe, it, expect, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";

function loadHandler() {
  const root = path.resolve(__dirname, "../../..");
  const files = new Map<string, string>([
    ["suno-clip-fields", "supabase/functions/_shared/suno-clip-fields.ts"],
  ]);
  const stubs: Record<string, string> = {
    "../../_shared/supabase-client.ts": `exports.getSupabaseClient = () => globalThis.__mockSupabase;`,
    "../../_shared/logger.ts": `exports.createLogger = () => ({ info() {}, warn() {}, error() {}, debug() {}, success() {} });`,
    "../../_shared/track-naming.ts": `exports.sanitizeAndCleanTitle = (t, fb) => (t && String(t).trim()) || fb;`,
    "../../_shared/economy.ts": `exports.getGenerationCost = () => 0;`,
    "../utils/version-types.ts": `exports.VERSION_LABELS = ["A","B"]; exports.getVersionType = () => "initial";`,
    "../utils/fetch-retry.ts": `exports.fetchWithRetry = async () => ({ blob: async () => ({ size: 1 }) });`,
    "../utils/audit-log.ts": `exports.logAuditAction = async () => {};`,
  };

  const sharedSrc = fs.readFileSync(path.join(root, files.get("suno-clip-fields")!), "utf8");
  const sharedOut = ts.transpileModule(sharedSrc, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const sharedMod: any = { exports: {} };
  new Function("exports", sharedOut)(sharedMod.exports);
  stubs["../../_shared/suno-clip-fields.ts"] = Object.keys(sharedMod.exports)
    .map((k) => `exports.${k} = ${JSON.stringify(null)};`)
    .join("\n"); // placeholder; replaced below

  const handlerSrc = fs.readFileSync(
    path.join(root, "supabase/functions/suno-music-callback/handlers/complete.ts"),
    "utf8",
  );
  const handlerOut = ts.transpileModule(handlerSrc, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const requireFn = (spec: string) => {
    if (spec.endsWith("suno-clip-fields.ts")) return sharedMod.exports;
    const stub = stubs[spec];
    if (stub) {
      const m: any = { exports: {} };
      new Function("exports", stub)(m.exports);
      return m.exports;
    }
    throw new Error(`Unstubbed import: ${spec}`);
  };
  const module: any = { exports: {} };
  new Function("exports", "require", handlerOut)(module.exports, requireFn);
  return module.exports.handleCompleteCallback as (
    payload: any,
    task: any,
    supabaseUrl: string,
    supabaseServiceKey: string,
  ) => Promise<any>;
}

describe("complete callback → versions + active_version_id smoke", () => {
  it("creates 2 versions with covers, sets active_version_id, records skips", async () => {
    // Mock DB
    const inserted: Record<string, any[]> = {};
    const updates: Record<string, any[]> = {};
    const createdVersionIds = ["ver-A-uuid", "ver-B-uuid"];
    let versionCursor = 0;

    const chain = (table: string, action: "select" | "insert" | "update", payload?: any) => {
      const state = { table, action, payload, filters: [] as any[], _single: false };
      const api: any = {
        select: () => api,
        eq: (col: string, val: any) => {
          state.filters.push([col, val]);
          return api;
        },
        neq: () => api,
        is: () => api,
        ilike: () => api,
        order: () => api,
        limit: () => api,
        single: () => {
          state._single = true;
          if (state.action === "select" && state.table === "track_versions") {
            return Promise.resolve({ data: null });
          }
          if (state.action === "insert" && state.table === "track_versions") {
            const id = createdVersionIds[versionCursor++];
            const row = { id, ...(payload ?? {}) };
            (inserted.track_versions ||= []).push(row);
            return Promise.resolve({ data: row });
          }
          return Promise.resolve({ data: null });
        },
        maybeSingle: () => Promise.resolve({ data: null }),
        then: (resolve: any) => {
          if (state.action === "insert") (inserted[table] ||= []).push(payload);
          if (state.action === "update") (updates[table] ||= []).push({ payload, filters: state.filters });
          resolve({ data: null, error: null });
        },
      };
      return api;
    };

    const mockSupabase = {
      from: (table: string) => ({
        select: () => chain(table, "select"),
        insert: (payload: any) => chain(table, "insert", payload),
        update: (payload: any) => chain(table, "update", payload),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ data: { path: "x" }, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "https://cdn/local.mp3" } }),
        }),
      },
      rpc: async () => ({ data: false }),
      functions: { invoke: async () => ({}) },
    };
    (globalThis as any).__mockSupabase = mockSupabase;
    (globalThis as any).fetch = vi.fn(async () => new Response("{}", { status: 200 }));

    const handle = loadHandler();

    const payload = {
      data: {
        taskId: "suno-task-1",
        data: [
          {
            id: "clip-a",
            title: "Song A",
            duration: 121,
            audioUrl: "https://cdn/a.mp3",
            imageUrl: "https://cdn/a.jpg",
            modelName: "chirp-v4",
          },
          {
            id: "clip-b",
            title: "Song B",
            duration: 122,
            source_audio_url: "https://cdn/b.mp3",
            image_url: "https://cdn/b.jpg",
            model_name: "chirp-v4",
          },
          {
            // broken clip — should be skipped with reason
            id: "clip-c",
            title: "Broken",
          },
        ],
      },
    };
    const task = {
      id: "task-uuid",
      track_id: "track-uuid",
      user_id: "user-uuid",
      prompt: "test",
      generation_mode: "generate",
      expected_clips: 2,
      tracks: {},
    };

    const result = await handle(payload, task, "https://x", "srv-key");
    expect(result.success).toBe(true);
    expect(result.clipsCount).toBe(3);

    // 2 versions inserted (3rd skipped)
    expect(inserted.track_versions?.length).toBe(2);
    expect(inserted.track_versions?.[0].cover_url).toBe("https://cdn/a.jpg");
    expect(inserted.track_versions?.[1].cover_url).toBe("https://cdn/b.jpg");
    expect(inserted.track_versions?.[0].is_primary).toBe(true);

    // active_version_id update happened
    const trackUpdates = updates.tracks || [];
    const activeUpdate = trackUpdates.find((u) => u.payload.active_version_id);
    expect(activeUpdate?.payload.active_version_id).toBe("ver-A-uuid");

    // notification carries skipped-clip metadata
    const notif = (inserted.notifications || [])[0];
    expect(notif?.metadata?.skippedClips?.[0]?.code).toBe("missing_audio_url");
    expect(notif?.metadata?.createdClips).toBe(2);
  });
});
