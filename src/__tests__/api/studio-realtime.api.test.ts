/**
 * Unit tests for studio/studio-realtime.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchReplacementTasks,
  fetchStudioProject,
  createStudioProject,
  updateStudioProject,
  deleteStudioProject,
  fetchTrackStemsMinimal,
} from "@/api/studio/studio-realtime.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
const mockSupabaseChannel = supabase.channel as unknown as ReturnType<typeof vi.fn>;
const mockRemoveChannel = supabase.removeChannel as unknown as ReturnType<typeof vi.fn>;

function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "order",
    "limit",
    "single",
    "maybeSingle",
    "abortSignal",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single.mockReturnValue(Promise.resolve(result));
  chain.maybeSingle.mockReturnValue(Promise.resolve(result));
  const thenable = { ...chain };
  thenable.then = (resolve: (v: unknown) => void) => resolve(result);
  for (const m of Object.keys(chain)) {
    if (m !== "then") chain[m].mockReturnValue(thenable);
  }
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseChannel.mockReturnValue(mockChannel);
  mockRemoveChannel.mockResolvedValue(undefined);
});

describe("studio-realtime.api", () => {
  describe("fetchReplacementTasks", () => {
    it("fetches replacement tasks", async () => {
      const tasks = [{ id: "rt1", status: "completed", generation_mode: "replace_section" }];
      mockFrom.mockReturnValue(chainMock({ data: tasks, error: null }));
      const res = await fetchReplacementTasks("t1");
      expect(res).toEqual(tasks);
    });

    it("returns empty array on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      const res = await fetchReplacementTasks("t1");
      expect(res).toEqual([]);
    });

    it("returns empty array when no data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchReplacementTasks("t1");
      expect(res).toEqual([]);
    });
  });

  describe("fetchStudioProject", () => {
    it("fetches project by ID", async () => {
      const project = { id: "p1", name: "My Project" };
      mockFrom.mockReturnValue(chainMock({ data: project, error: null }));
      const res = await fetchStudioProject("p1");
      expect(res.data).toEqual(project);
    });
  });

  describe("createStudioProject", () => {
    it("creates project from camelCase params", async () => {
      const project = { id: "p1", name: "New", user_id: "u1" };
      mockFrom.mockReturnValue(chainMock({ data: project, error: null }));
      const res = await createStudioProject({ userId: "u1", name: "New" });
      expect(res.data).toEqual(project);
    });

    it("creates project from raw params", async () => {
      const project = { id: "p1", name: "Raw" };
      mockFrom.mockReturnValue(chainMock({ data: project, error: null }));
      const res = await createStudioProject({ user_id: "u1", name: "Raw" });
      expect(res.data).toEqual(project);
    });
  });

  describe("updateStudioProject", () => {
    it("updates project", async () => {
      const updated = { id: "p1", name: "Updated" };
      mockFrom.mockReturnValue(chainMock({ data: updated, error: null }));
      const res = await updateStudioProject("p1", { name: "Updated" });
      expect(res.data).toEqual(updated);
    });
  });

  describe("deleteStudioProject", () => {
    it("deletes project", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await deleteStudioProject("p1");
      expect(res.error).toBeNull();
    });
  });

  describe("fetchTrackStemsMinimal", () => {
    it("fetches minimal stem data", async () => {
      const stems = [{ stem_type: "vocals", audio_url: "vocals.mp3" }];
      mockFrom.mockReturnValue(chainMock({ data: stems, error: null }));
      const res = await fetchTrackStemsMinimal("t1");
      expect(res).toEqual(stems);
    });

    it("returns empty array when null data", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await fetchTrackStemsMinimal("t1");
      expect(res).toEqual([]);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      await expect(fetchTrackStemsMinimal("t1")).rejects.toThrow();
    });
  });
});
