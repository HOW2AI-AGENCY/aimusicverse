import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { callNoAuth, callWithAnonJwt } from "../_shared/auth-test-utils.ts";

Deno.test("tinkoff-create-bot-payment rejects unauthenticated requests", async () => {
  const res = await callNoAuth("tinkoff-create-bot-payment", {
    productCode: "x",
    telegramId: 1,
  });
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});

Deno.test("tinkoff-create-bot-payment rejects anon JWTs (service-role only)", async () => {
  const res = await callWithAnonJwt("tinkoff-create-bot-payment", {
    productCode: "x",
    telegramId: 1,
  });
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});
