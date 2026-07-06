/**
 * Unit tests for projects.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchUserProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  countUserProjects,
  checkPremiumStatus,
  fetchProjectTracks,
  generateProjectConcept,
  updateProjectFields,
  updateProjectCover,
  updateProjectBanner,
  invokeProjectAi,
  invokeGenerateCoverImage,
  invokeGenerateProjectMedia,
} from "@/api/projects.api";

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
const mockFunctions = supabase.functions as unknown as { invoke: ReturnType<typeof vi.fn> };

function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "order", "limit", "single", "maybeSingle"]) {
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

beforeEach(() => vi.clearAllMocks());

describe("projects.api", () => {
  describe("fetchUserProjects", () => {
    it("fetches projects for user", async () => {
      const projects = [{ id: "p1", name: "My Project" }];
      mockFrom.mockReturnValue(chainMock({ data: projects, error: null }));
      const res = await fetchUserProjects("u1");
      expect(res).toEqual(projects);
    });

    it("returns empty array when null", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchUserProjects("u1")).toEqual([]);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      await expect(fetchUserProjects("u1")).rejects.toThrow("fail");
    });
  });

  describe("fetchProjectById", () => {
    it("fetches single project", async () => {
      const project = { id: "p1", name: "Test" };
      mockFrom.mockReturnValue(chainMock({ data: project, error: null }));
      expect(await fetchProjectById("p1")).toEqual(project);
    });

    it("returns null when not found", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchProjectById("nonexistent")).toBeNull();
    });
  });

  describe("createProject", () => {
    it("creates and returns project", async () => {
      const project = { id: "p1", name: "New", user_id: "u1" };
      mockFrom.mockReturnValue(chainMock({ data: project, error: null }));
      const res = await createProject({ name: "New", user_id: "u1" });
      expect(res).toEqual(project);
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "insert fail" } }));
      await expect(createProject({ name: "X", user_id: "u1" })).rejects.toThrow("insert fail");
    });
  });

  describe("updateProject", () => {
    it("updates and returns project", async () => {
      const updated = { id: "p1", name: "Updated" };
      mockFrom.mockReturnValue(chainMock({ data: updated, error: null }));
      expect(await updateProject("p1", { name: "Updated" })).toEqual(updated);
    });
  });

  describe("deleteProject", () => {
    it("deletes without error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(deleteProject("p1")).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "delete fail" } }));
      await expect(deleteProject("p1")).rejects.toThrow("delete fail");
    });
  });

  describe("countUserProjects", () => {
    it("returns count", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: 5 }));
      expect(await countUserProjects("u1")).toBe(5);
    });

    it("returns 0 when null count", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null, count: null }));
      expect(await countUserProjects("u1")).toBe(0);
    });
  });

  describe("checkPremiumStatus", () => {
    it("returns true when premium", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });
      expect(await checkPremiumStatus("u1")).toBe(true);
    });

    it("returns false on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });
      expect(await checkPremiumStatus("u1")).toBe(false);
    });

    it("returns false when not premium", async () => {
      mockRpc.mockResolvedValue({ data: false, error: null });
      expect(await checkPremiumStatus("u1")).toBe(false);
    });
  });

  describe("fetchProjectTracks", () => {
    it("fetches tracks for project", async () => {
      const tracks = [{ id: "t1", project_id: "p1" }];
      mockFrom.mockReturnValue(chainMock({ data: tracks, error: null }));
      expect(await fetchProjectTracks("p1")).toEqual(tracks);
    });

    it("returns empty array when null", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      expect(await fetchProjectTracks("p1")).toEqual([]);
    });
  });

  describe("generateProjectConcept", () => {
    it("invokes project-ai edge function", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { concept: "rock ballad" }, error: null });
      const res = await generateProjectConcept({ projectType: "single", genre: "rock" });
      expect(res).toEqual({ concept: "rock ballad" });
      expect(mockFunctions.invoke).toHaveBeenCalledWith("project-ai", {
        body: { action: "concept", projectType: "single", genre: "rock" },
      });
    });

    it("throws on error", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "ai failed" } });
      await expect(generateProjectConcept({ projectType: "single" })).rejects.toThrow("ai failed");
    });
  });

  describe("updateProjectFields", () => {
    it("updates arbitrary fields", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(updateProjectFields("p1", { name: "New" })).resolves.toBeUndefined();
    });

    it("throws on error", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "update fail" } }));
      await expect(updateProjectFields("p1", { name: "X" })).rejects.toThrow("update fail");
    });
  });

  describe("updateProjectCover", () => {
    it("updates cover URL", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(updateProjectCover("p1", "cover.png")).resolves.toBeUndefined();
    });

    it("clears cover URL", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(updateProjectCover("p1", null)).resolves.toBeUndefined();
    });
  });

  describe("updateProjectBanner", () => {
    it("updates banner fields", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      await expect(
        updateProjectBanner("p1", { bannerUrl: "banner.png", bannerPrompt: "sunset" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("invokeProjectAi", () => {
    it("invokes project-ai with payload", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { result: "ok" }, error: null });
      const res = await invokeProjectAi({ action: "generate", genre: "pop" });
      expect(res.data).toEqual({ result: "ok" });
      expect(res.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: null, error: { message: "ai fail" } });
      const res = await invokeProjectAi({ action: "test" });
      expect(res.data).toBeNull();
      expect(res.error?.message).toBe("ai fail");
    });
  });

  describe("invokeGenerateCoverImage", () => {
    it("invokes generate-cover-image", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { imageUrl: "cover.png" }, error: null });
      const res = await invokeGenerateCoverImage({ prompt: "sunset" });
      expect(res.data?.imageUrl).toBe("cover.png");
    });
  });

  describe("invokeGenerateProjectMedia", () => {
    it("invokes generate-project-media", async () => {
      mockFunctions.invoke.mockResolvedValue({ data: { mediaUrl: "banner.png" }, error: null });
      const res = await invokeGenerateProjectMedia({ type: "banner" });
      expect(res.data?.mediaUrl).toBe("banner.png");
    });
  });
});
