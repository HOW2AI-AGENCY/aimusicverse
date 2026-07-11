import { describe, it, expect, vi } from "vitest";
import { dispatchOpenGenerateSheet, listenOpenGenerateSheet, OPEN_GENERATE_SHEET_EVENT } from "@/lib/events";

describe("events", () => {
  it("dispatchOpenGenerateSheet fires CustomEvent", () => {
    const handler = vi.fn();
    window.addEventListener(OPEN_GENERATE_SHEET_EVENT, handler);
    dispatchOpenGenerateSheet();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
    window.removeEventListener(OPEN_GENERATE_SHEET_EVENT, handler);
  });

  it("listenOpenGenerateSheet calls callback on event", () => {
    const cb = vi.fn();
    const unsubscribe = listenOpenGenerateSheet(cb);
    dispatchOpenGenerateSheet();
    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("unsubscribe removes listener", () => {
    const cb = vi.fn();
    const unsubscribe = listenOpenGenerateSheet(cb);
    unsubscribe();
    dispatchOpenGenerateSheet();
    expect(cb).not.toHaveBeenCalled();
  });
});
