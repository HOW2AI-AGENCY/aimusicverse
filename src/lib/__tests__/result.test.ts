/**
 * Tests for the Result<T, E> discriminated union.
 *
 * Result is the canonical "no exceptions, no double-channel encoding" return
 * shape used at the service layer. Callers pattern-match on `kind` via the
 * `isOk` / `isErr` type guards and transform values with `map` (value-side),
 * `mapErr` (error-side), and `andThen` (monadic chaining that may itself
 * fail).
 */
import { describe, expect, it } from "vitest";

import { andThen, err, isErr, isOk, map, mapErr, ok, type Result } from "@/lib/result";

describe("Result<T, E>", () => {
  it("ok wraps a success", () => {
    const r = ok(42);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    if (isOk(r)) {
      expect(r.value).toBe(42);
    }
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
    if (isOk(r)) {
      expect(r.value).toBe(6);
    }
  });

  it("map passes through an err unchanged", () => {
    const e = new Error("kept");
    const r: Result<number, Error> = map(err<number, Error>(e), (x) => x * 3);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error).toBe(e);
      expect(r.error.message).toBe("kept");
    }
  });

  it("andThen chains a computation that itself returns a Result", () => {
    const r = andThen(ok(2), (x) => (x > 0 ? ok(x * 3) : err(new Error("non-positive"))));
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.value).toBe(6);
    }
  });

  it("andThen propagates the err branch from the chained function", () => {
    const failure = err(new Error("downstream"));
    const r = andThen(ok(-1), (x) => (x > 0 ? ok(x * 3) : err(new Error("non-positive"))));
    // sanity: also exercise the inner-RResult path with a pre-built err
    const r2 = andThen(ok(5), () => failure);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.message).toBe("non-positive");
    }
    expect(isErr(r2)).toBe(true);
    if (isErr(r2)) {
      expect(r2.error).toBe(failure.error);
    }
  });

  it("andThen passes through an outer err without invoking the function", () => {
    const e = new Error("outer");
    let invoked = false;
    const r = andThen(err<number, Error>(e), () => {
      invoked = true;
      return ok(99);
    });
    expect(isErr(r)).toBe(true);
    expect(invoked).toBe(false);
    if (isErr(r)) {
      expect(r.error).toBe(e);
    }
  });

  it("mapErr transforms the error side", () => {
    const original = new Error("raw");
    const r = mapErr(err(original), (e) => ({
      code: "E_RAW",
      cause: e.message,
    }));
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.code).toBe("E_RAW");
      expect(r.error.cause).toBe("raw");
    }
  });

  it("mapErr leaves an ok value untouched", () => {
    const r = mapErr(ok(7), () => "should-not-run");
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.value).toBe(7);
    }
  });
});
