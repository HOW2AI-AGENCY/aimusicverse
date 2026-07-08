/**
 * Tests for the Result<T, E> discriminated union.
 */
import { describe, expect, it } from "vitest";
import { err, isErr, isOk, map, ok, type Result } from "@/lib/result";

describe("Result<T, E>", () => {
  it("ok wraps a success", () => {
    const r = ok(42);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    if (isOk(r)) expect(r.value).toBe(42);
  });

  it("err wraps an error", () => {
    const e = new Error("boom");
    const r = err(e);
    expect(isErr(r)).toBe(true);
    expect(isOk(r)).toBe(false);
    if (isErr(r)) {
      expect(r.error).toBe(e);
      expect(r.error.message).toBe("boom");
    }
  });

  it("map transforms the ok value", () => {
    const r = map(ok(2), (x) => x * 3);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value).toBe(6);
  });

  it("map passes through an err unchanged", () => {
    const e = new Error("kept");
    const r: Result<number, Error> = map(err<number, Error>(e), (x) => x * 3);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error).toBe(e);
  });
});
