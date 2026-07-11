import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFire = vi.fn();

vi.mock("canvas-confetti", () => ({ default: mockFire }));

import { confetti } from "@/lib/confetti";

describe("confetti", () => {
  beforeEach(() => {
    mockFire.mockClear();
  });

  it("triggers dynamic import and fires on first call", async () => {
    confetti({ particleCount: 50 });
    await vi.waitFor(() => {
      expect(mockFire).toHaveBeenCalled();
    });
  });

  it("uses cached function on second call", async () => {
    confetti();
    confetti();
    await vi.waitFor(() => {
      expect(mockFire).toHaveBeenCalledTimes(2);
    });
  });
});
