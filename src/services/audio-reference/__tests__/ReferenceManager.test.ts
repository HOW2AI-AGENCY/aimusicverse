/**
 * ReferenceManager — Result<T,E> conversion tests.
 *
 * Verifies that the three methods with real failure paths
 * (`createFromUpload`, `createFromRecording`, `persistToDatabase`) return
 * `Result<T, ReferenceManagerError>` and that the throwing `try*()` wrappers
 * preserve the historical API.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOk, isErr } from "@/lib/result";

// Mock supabase so we can drive deterministic responses.
const storageUploadMock = vi.fn();
const storageGetPublicUrlMock = vi.fn();
const fromInsertSelectSingleMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => storageUploadMock(...args),
        getPublicUrl: (...args: unknown[]) => storageGetPublicUrlMock(...args),
      }),
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => fromInsertSelectSingleMock(),
        }),
      }),
    }),
  },
}));

import { ReferenceManager, ReferenceManagerError } from "../ReferenceManager";

function resetAll() {
  storageUploadMock.mockReset();
  storageGetPublicUrlMock.mockReset();
  fromInsertSelectSingleMock.mockReset();
  // Clear any persisted state from previous tests.
  sessionStorage.clear();
}

describe("ReferenceManager — Result<T,E> conversions", () => {
  beforeEach(() => {
    resetAll();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createFromUpload", () => {
    it("returns ok(reference) on success", async () => {
      // Stub Audio so jsdom doesn't hang on src assignment.
      const originalAudio = (globalThis as unknown as { Audio: unknown }).Audio;
      class StubAudio {
        public duration = 5;
        public onloadedmetadata: ((this: unknown, ev: unknown) => void) | null = null;
        public onerror: ((this: unknown, ev: unknown) => void) | null = null;
        set src(_v: string) {
          // Fire onerror immediately so calculateDuration resolves with 0.
          // Both paths in the production code resolve the promise.
          setTimeout(() => this.onerror?.call(this, {}), 0);
        }
      }
      (globalThis as unknown as { Audio: unknown }).Audio = StubAudio;

      const file = new File(["hello"], "test.wav", { type: "audio/wav" });
      const r = await ReferenceManager.createFromUpload(file);

      expect(isOk(r)).toBe(true);
      if (isOk(r)) {
        expect(r.value.fileName).toBe("test.wav");
        expect(r.value.source).toBe("upload");
      }

      (globalThis as unknown as { Audio: unknown }).Audio = originalAudio;
    });

    it("tryCreateFromUpload throws ReferenceManagerError on failure", async () => {
      // Force the duration probe to fail by mocking new Audio() to throw.
      class FailingAudio {
        set src(_v: string) {
          // throw on src assignment to simulate an immediate failure.
          throw new Error("audio unsupported");
        }
      }
      const originalAudio = (globalThis as unknown as { Audio: unknown }).Audio;
      (globalThis as unknown as { Audio: unknown }).Audio = FailingAudio;

      const file = new File(["x"], "broken.wav", { type: "audio/wav" });
      await expect(ReferenceManager.tryCreateFromUpload(file)).rejects.toBeInstanceOf(ReferenceManagerError);

      (globalThis as unknown as { Audio: unknown }).Audio = originalAudio;
    });
  });

  describe("createFromRecording", () => {
    it("returns ok(reference) on success", async () => {
      const originalAudio = (globalThis as unknown as { Audio: unknown }).Audio;
      class StubAudio {
        public duration = 3;
        public onloadedmetadata: ((this: unknown, ev: unknown) => void) | null = null;
        public onerror: ((this: unknown, ev: unknown) => void) | null = null;
        set src(_v: string) {
          setTimeout(() => this.onerror?.call(this, {}), 0);
        }
      }
      (globalThis as unknown as { Audio: unknown }).Audio = StubAudio;

      const blob = new Blob(["data"], { type: "audio/webm" });
      const r = await ReferenceManager.createFromRecording(blob, "rec.webm");

      expect(isOk(r)).toBe(true);
      if (isOk(r)) {
        expect(r.value.fileName).toBe("rec.webm");
        expect(r.value.source).toBe("record");
      }

      (globalThis as unknown as { Audio: unknown }).Audio = originalAudio;
    });

    it("tryCreateFromRecording throws on failure", async () => {
      class FailingAudio {
        set src(_v: string) {
          throw new Error("audio unsupported");
        }
      }
      const originalAudio = (globalThis as unknown as { Audio: unknown }).Audio;
      (globalThis as unknown as { Audio: unknown }).Audio = FailingAudio;

      const blob = new Blob(["x"], { type: "audio/webm" });
      await expect(ReferenceManager.tryCreateFromRecording(blob)).rejects.toBeInstanceOf(ReferenceManagerError);

      (globalThis as unknown as { Audio: unknown }).Audio = originalAudio;
    });
  });

  describe("persistToDatabase", () => {
    it("returns ok(null) when no active reference", async () => {
      sessionStorage.clear();
      const r = await ReferenceManager.persistToDatabase("user-1");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBeNull();
    });

    it("tryPersistToDatabase throws on storage upload failure", async () => {
      // Pre-populate active reference with blob URL.
      sessionStorage.setItem(
        "active_audio_reference",
        JSON.stringify({
          id: "ref-1",
          source: "upload",
          audioUrl: "blob:http://localhost/uuid",
          fileName: "test.wav",
          mimeType: "audio/wav",
          fileSize: 100,
          durationSeconds: 1,
          createdAt: Date.now(),
          analysisStatus: "pending",
        }),
      );
      // Stub fetch so blob: URL resolves to a Blob in jsdom.
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async () => ({
        blob: async () => new Blob(["data"]),
      })) as unknown as typeof globalThis.fetch;
      storageUploadMock.mockResolvedValue({ error: { message: "upload failed" } });

      await expect(ReferenceManager.tryPersistToDatabase("user-1")).rejects.toBeInstanceOf(ReferenceManagerError);

      globalThis.fetch = originalFetch;
    });

    it("returns err(STORAGE_UPLOAD_FAILED) on upload error", async () => {
      sessionStorage.setItem(
        "active_audio_reference",
        JSON.stringify({
          id: "ref-2",
          source: "upload",
          audioUrl: "blob:http://localhost/uuid",
          fileName: "x.wav",
          mimeType: "audio/wav",
          fileSize: 100,
          durationSeconds: 1,
          createdAt: Date.now(),
          analysisStatus: "pending",
        }),
      );
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async () => ({
        blob: async () => new Blob(["data"]),
      })) as unknown as typeof globalThis.fetch;
      storageUploadMock.mockResolvedValue({ error: { message: "upload failed" } });

      const r = await ReferenceManager.persistToDatabase("user-1");
      expect(isErr(r)).toBe(true);
      if (isErr(r)) {
        expect(r.error.code).toBe("STORAGE_UPLOAD_FAILED");
        expect(r.error.operation).toBe("persistToDatabase");
      }

      globalThis.fetch = originalFetch;
    });

    it("returns err(DB_INSERT_FAILED) on db error", async () => {
      sessionStorage.setItem(
        "active_audio_reference",
        JSON.stringify({
          id: "ref-3",
          source: "cloud",
          audioUrl: "https://x.com/a.mp3", // non-blob → no upload step
          fileName: "x.mp3",
          mimeType: "audio/mpeg",
          fileSize: 100,
          durationSeconds: 1,
          createdAt: Date.now(),
          analysisStatus: "pending",
        }),
      );
      fromInsertSelectSingleMock.mockResolvedValue({ data: null, error: { message: "db down" } });

      const r = await ReferenceManager.persistToDatabase("user-1");
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.code).toBe("DB_INSERT_FAILED");
    });

    it("returns ok(dbId) on full success path", async () => {
      sessionStorage.setItem(
        "active_audio_reference",
        JSON.stringify({
          id: "ref-4",
          source: "cloud",
          audioUrl: "https://x.com/a.mp3",
          fileName: "x.mp3",
          mimeType: "audio/mpeg",
          fileSize: 100,
          durationSeconds: 1,
          createdAt: Date.now(),
          analysisStatus: "pending",
        }),
      );
      fromInsertSelectSingleMock.mockResolvedValue({ data: { id: "db-row-1" }, error: null });

      const r = await ReferenceManager.persistToDatabase("user-1");
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe("db-row-1");
    });
  });

  describe("pure builders (unchanged signature)", () => {
    it("createFromCloud returns a UnifiedAudioReference synchronously", () => {
      const ref = ReferenceManager.createFromCloud(
        {
          id: "x",
          fileUrl: "https://x.com/a.mp3",
          fileName: "x.mp3",
        },
        "cover",
      );
      expect(ref.source).toBe("cloud");
      expect(ref.intendedMode).toBe("cover");
    });

    it("createFromCreativeTool returns a UnifiedAudioReference synchronously", () => {
      const ref = ReferenceManager.createFromCreativeTool("drums", "https://x.com/d.mp3", {
        bpm: 120,
      });
      expect(ref.source).toBe("drums");
      expect(ref.analysis?.bpm).toBe(120);
    });
  });
});
