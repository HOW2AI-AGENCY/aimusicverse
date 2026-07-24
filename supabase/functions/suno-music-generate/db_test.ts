// Unit tests for markFailure DB helper — verifies both tables get updated with the same error.
// Run: deno test supabase/functions/suno-music-generate/db_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { markFailure } from "./db.ts";

function makeStub() {
  const updates: Array<{ table: string; patch: Record<string, unknown>; id: string }> = [];
  return {
    updates,
    from(table: string) {
      return {
        update(patch: Record<string, unknown>) {
          return {
            eq(_col: string, id: string) {
              updates.push({ table, patch, id });
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  };
}

Deno.test("markFailure writes failed status to generation_tasks and tracks", async () => {
  const stub = makeStub();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await markFailure(stub as any, "task-1", "track-1", "boom");
  assertEquals(stub.updates.length, 2);
  assertEquals(stub.updates[0].table, "generation_tasks");
  assertEquals(stub.updates[0].patch.status, "failed");
  assertEquals(stub.updates[0].patch.error_message, "boom");
  assertEquals(stub.updates[0].id, "task-1");
  assertEquals(stub.updates[1].table, "tracks");
  assertEquals(stub.updates[1].patch.status, "failed");
  assertEquals(stub.updates[1].id, "track-1");
});
