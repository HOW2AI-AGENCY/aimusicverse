import { describe, it, expect } from "vitest";
import { ok, err, isOk, isErr, map } from "@/lib/result";

describe("result", () => {
  it("ok creates success result", () => {
    const r = ok(42);
    expect(r).toEqual({ kind: "ok", value: 42 });
  });

  it("err creates failure result", () => {
    const e = new Error("fail");
    const r = err(e);
    expect(r).toEqual({ kind: "err", error: e });
  });

  it("isOk returns true for ok", () => {
    expect(isOk(ok("hello"))).toBe(true);
  });

  it("isOk returns false for err", () => {
    expect(isOk(err(new Error("x")))).toBe(false);
  });

  it("isErr returns true for err", () => {
    expect(isErr(err(new Error("x")))).toBe(true);
  });

  it("isErr returns false for ok", () => {
    expect(isErr(ok(1))).toBe(false);
  });

  it("map transforms ok value", () => {
    const r = ok(2);
    expect(map(r, (v) => v * 3)).toEqual({ kind: "ok", value: 6 });
  });

  it("map passes err through unchanged", () => {
    const e = new Error("no");
    const r = err(e);
    expect(map(r, (v: number) => v * 3)).toEqual({ kind: "err", error: e });
  });
});
