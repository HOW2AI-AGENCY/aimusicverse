/**
 * Cross-runtime (Vitest) mirror of the Deno test for the Suno clip field
 * mapper. Ensures the same camelCase + snake_case guarantees apply so the
 * callback handlers can NEVER silently drop clips when the vendor payload
 * shape changes. Keep in sync with supabase/functions/_shared/suno-clip-fields_test.ts.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";

// Load & transpile the Deno module so we can exercise it under Node.
const source = fs.readFileSync(
  path.resolve(__dirname, "../../../supabase/functions/_shared/suno-clip-fields.ts"),
  "utf8",
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod: any = {};
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
new Function("exports", transpiled)(mod);
const { extractClipFields, validateClip } = mod as typeof import("../../../supabase/functions/_shared/suno-clip-fields");

describe("suno-clip-fields mapper", () => {
  it("prefers camelCase source URLs", () => {
    const f = extractClipFields({
      sourceAudioUrl: "https://a/source",
      audioUrl: "https://a/audio",
      streamAudioUrl: "https://a/stream",
      imageUrl: "https://a/img",
      modelName: "chirp-v4",
    });
    expect(f.audioUrl).toBe("https://a/source");
    expect(f.streamUrl).toBe("https://a/stream");
    expect(f.imageUrl).toBe("https://a/img");
    expect(f.modelName).toBe("chirp-v4");
  });

  it("falls back to snake_case", () => {
    const f = extractClipFields({
      audio_url: "https://a/audio",
      stream_audio_url: "https://a/stream",
      image_url: "https://a/img",
      model_name: "chirp-v3",
    });
    expect(f.audioUrl).toBe("https://a/audio");
    expect(f.streamUrl).toBe("https://a/stream");
    expect(f.imageUrl).toBe("https://a/img");
  });

  it("validateClip returns available keys for debugging", () => {
    const skip = validateClip({ id: "x", title: "T" }, 2);
    expect(skip?.code).toBe("missing_audio_url");
    expect(skip?.clipIndex).toBe(2);
    expect(skip?.availableKeys).toEqual(expect.arrayContaining(["id", "title"]));
  });

  it("validateClip passes for either casing", () => {
    expect(validateClip({ audioUrl: "https://x" }, 0)).toBeNull();
    expect(validateClip({ audio_url: "https://x" }, 0)).toBeNull();
  });
});
