/**
 * Unit tests for storage.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, deleteFile, listFiles, getPublicUrl } from "@/api/storage.api";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const mockStorage = supabase.storage as unknown as {
  from: ReturnType<typeof vi.fn>;
};

function createBucketMock(overrides: Record<string, unknown> = {}) {
  return {
    upload: vi.fn().mockResolvedValue({ data: { path: "test/file.mp3" }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/test/file.mp3" } }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    list: vi.fn().mockResolvedValue({ data: [{ name: "file.mp3" }], error: null }),
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("storage.api", () => {
  describe("uploadFile", () => {
    it("uploads file and returns publicUrl on success", async () => {
      const bucket = createBucketMock();
      mockStorage.from.mockReturnValue(bucket);
      const file = new Blob(["audio"], { type: "audio/mp3" });
      const res = await uploadFile({ bucket: "audio", path: "tracks/test.mp3", file });
      expect(res.error).toBeNull();
      expect(res.data?.publicUrl).toBe("https://cdn.example.com/test/file.mp3");
      expect(res.data?.path).toBe("test/file.mp3");
    });

    it("returns error on upload failure", async () => {
      const bucket = createBucketMock({
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: "upload failed" } }),
      });
      mockStorage.from.mockReturnValue(bucket);
      const file = new Blob(["audio"]);
      const res = await uploadFile({ bucket: "audio", path: "bad/path.mp3", file });
      expect(res.data).toBeNull();
      expect(res.error).toBeTruthy();
    });

    it("passes contentType and upsert options", async () => {
      const bucket = createBucketMock();
      mockStorage.from.mockReturnValue(bucket);
      const file = new Blob(["audio"]);
      await uploadFile({
        bucket: "avatars",
        path: "user1.png",
        file,
        contentType: "image/png",
        upsert: true,
      });
      expect(bucket.upload).toHaveBeenCalledWith("user1.png", file, {
        contentType: "image/png",
        upsert: true,
      });
    });
  });

  describe("deleteFile", () => {
    it("removes file and returns no error on success", async () => {
      const bucket = createBucketMock();
      mockStorage.from.mockReturnValue(bucket);
      const res = await deleteFile("audio", "tracks/old.mp3");
      expect(res.error).toBeNull();
      expect(bucket.remove).toHaveBeenCalledWith(["tracks/old.mp3"]);
    });

    it("returns error on failure", async () => {
      const bucket = createBucketMock({
        remove: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      });
      mockStorage.from.mockReturnValue(bucket);
      const res = await deleteFile("audio", "missing.mp3");
      expect(res.error).toBeTruthy();
    });
  });

  describe("listFiles", () => {
    it("lists files in folder", async () => {
      const bucket = createBucketMock();
      mockStorage.from.mockReturnValue(bucket);
      const res = await listFiles("audio", "tracks");
      expect(res.data).toEqual([{ name: "file.mp3" }]);
      expect(res.error).toBeNull();
    });

    it("returns error on failure", async () => {
      const bucket = createBucketMock({
        list: vi.fn().mockResolvedValue({ data: null, error: { message: "list failed" } }),
      });
      mockStorage.from.mockReturnValue(bucket);
      const res = await listFiles("audio", "bad-folder");
      expect(res.error).toBeTruthy();
    });
  });

  describe("getPublicUrl", () => {
    it("returns public URL string", () => {
      const bucket = createBucketMock();
      mockStorage.from.mockReturnValue(bucket);
      const url = getPublicUrl("audio", "tracks/song.mp3");
      expect(url).toBe("https://cdn.example.com/test/file.mp3");
      expect(bucket.getPublicUrl).toHaveBeenCalledWith("tracks/song.mp3");
    });
  });
});
