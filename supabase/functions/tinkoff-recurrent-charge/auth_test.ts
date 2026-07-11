import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callNoAuth, callWithAnonJwt } from "../_shared/auth-test-utils.ts";

Deno.test("tinkoff-recurrent-charge rejects unauthenticated requests", async () => {
  const res = await callNoAuth("tinkoff-recurrent-charge", {});
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});

Deno.test("tinkoff-recurrent-charge rejects non-admin JWTs", async () => {
  const res = await callWithAnonJwt("tinkoff-recurrent-charge", {});
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});
