import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callNoAuth } from "../_shared/auth-test-utils.ts";

Deno.test("suno-separate-vocals rejects unauthenticated requests", async () => {
  const res = await callNoAuth("suno-separate-vocals", { taskId: "x", audioId: "y" });
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});
