import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callNoAuth } from "../_shared/auth-test-utils.ts";

Deno.test("recognize-lyrics rejects unauthenticated requests", async () => {
  const res = await callNoAuth("recognize-lyrics", { audioUrl: "https://example.com/a.mp3" });
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});
