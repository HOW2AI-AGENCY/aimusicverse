// Shared helpers for edge-function authorization tests.
// Loads env from the project's .env file with allowEmptyValues so unrelated
// example-only VITE_* keys don't fail the test bootstrap.
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

await load({ export: true, allowEmptyValues: true, examplePath: null });

export const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
export const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export function functionUrl(name: string): string {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL not set for auth guard tests");
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${name}`;
}

export async function callNoAuth(name: string, body: unknown = {}): Promise<Response> {
  const res = await fetch(functionUrl(name), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await res.text(); // Consume body to avoid Deno resource leak.
  return res;
}

export async function callWithAnonJwt(name: string, body: unknown = {}): Promise<Response> {
  const res = await fetch(functionUrl(name), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Anon key is a valid JWT but has no user (`sub`) — used to test admin gating.
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  await res.text();
  return res;
}
