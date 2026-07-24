// Unit tests for suno-music-generate error classification + retry logic.
// Run: deno test supabase/functions/suno-music-generate/errors_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  classifyErrorCode,
  getUserFriendlyError,
  isRetriableModelError,
  isTransientError,
  NON_RETRIABLE_ERROR_CODES,
} from "./errors.ts";

Deno.test("getUserFriendlyError maps known substrings (case-insensitive)", () => {
  assertEquals(
    getUserFriendlyError("Artist name not allowed"),
    "Нельзя использовать имена известных артистов. Измените описание.",
  );
  assertEquals(
    getUserFriendlyError("MODEL ERROR: retry"),
    "Ошибка модели AI. Пробуем другую модель...",
  );
  assertEquals(getUserFriendlyError("Something else"), "Something else");
});

Deno.test("classifyErrorCode routes each family to a stable code", () => {
  assertEquals(classifyErrorCode("artist name violation"), "ARTIST_NAME_NOT_ALLOWED");
  assertEquals(classifyErrorCode("Copyrighted lyrics"), "COPYRIGHTED_CONTENT");
  assertEquals(classifyErrorCode("Malformed lyrics"), "MALFORMED_LYRICS");
  assertEquals(classifyErrorCode("Voice unavailable"), "VOICE_UNAVAILABLE");
  assertEquals(classifyErrorCode("Random"), "GENERATION_FAILED");
});

Deno.test("NON_RETRIABLE_ERROR_CODES cover permanent content-policy failures", () => {
  for (const code of ["ARTIST_NAME_NOT_ALLOWED", "COPYRIGHTED_CONTENT", "MALFORMED_LYRICS", "VOICE_UNAVAILABLE"]) {
    assertEquals(NON_RETRIABLE_ERROR_CODES.includes(code), true, code);
  }
  assertEquals(NON_RETRIABLE_ERROR_CODES.includes("GENERATION_FAILED"), false);
});

Deno.test("isRetriableModelError picks up model/audio/malformed markers", () => {
  assertEquals(isRetriableModelError("model error"), true);
  assertEquals(isRetriableModelError("Audio generation failed"), true);
  assertEquals(isRetriableModelError("malformed lyrics"), true);
  assertEquals(isRetriableModelError("artist name"), false);
});

Deno.test("isTransientError treats 429 and 5xx and network keywords as retriable", () => {
  assertEquals(isTransientError(429, ""), true);
  assertEquals(isTransientError(500, ""), true);
  assertEquals(isTransientError(503, ""), true);
  assertEquals(isTransientError(400, "timeout while calling"), true);
  assertEquals(isTransientError(400, "econnreset"), true);
  assertEquals(isTransientError(400, "bad payload"), false);
  assertEquals(isTransientError(null, "network unreachable"), false);
});
