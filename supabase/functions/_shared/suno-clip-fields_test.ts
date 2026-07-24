import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractClipFields, validateClip } from "./suno-clip-fields.ts";

Deno.test("extractClipFields — camelCase payload (current Suno shape)", () => {
  const clip = {
    id: "abc",
    title: "Song",
    duration: 120,
    audioUrl: "https://cdn/audio.mp3",
    sourceAudioUrl: "https://cdn/source.mp3",
    streamAudioUrl: "https://cdn/stream.mp3",
    imageUrl: "https://cdn/img.jpg",
    modelName: "chirp-v4",
  };
  const f = extractClipFields(clip);
  assertEquals(f.audioUrl, "https://cdn/source.mp3"); // source preferred over audioUrl
  assertEquals(f.streamUrl, "https://cdn/stream.mp3");
  assertEquals(f.imageUrl, "https://cdn/img.jpg");
  assertEquals(f.modelName, "chirp-v4");
  assertEquals(f.duration, 120);
});

Deno.test("extractClipFields — snake_case payload (legacy)", () => {
  const clip = {
    id: "abc",
    audio_url: "https://cdn/audio.mp3",
    stream_audio_url: "https://cdn/stream.mp3",
    image_url: "https://cdn/img.jpg",
    model_name: "chirp-v3",
  };
  const f = extractClipFields(clip);
  assertEquals(f.audioUrl, "https://cdn/audio.mp3");
  assertEquals(f.streamUrl, "https://cdn/stream.mp3");
  assertEquals(f.imageUrl, "https://cdn/img.jpg");
  assertEquals(f.modelName, "chirp-v3");
});

Deno.test("extractClipFields — mixed casing does not silently drop", () => {
  const clip = { sourceAudioUrl: "https://a", image_url: "https://i" };
  const f = extractClipFields(clip);
  assert(f.audioUrl && f.imageUrl);
});

Deno.test("validateClip — returns skip reason with available keys", () => {
  const skip = validateClip({ id: "x", title: "T" }, 3);
  assert(skip);
  assertEquals(skip!.code, "missing_audio_url");
  assertEquals(skip!.clipIndex, 3);
  assertEquals(skip!.clipId, "x");
  assert(skip!.availableKeys.includes("title"));
});

Deno.test("validateClip — passes when audio present", () => {
  const skip = validateClip({ audioUrl: "https://a" }, 0);
  assertEquals(skip, null);
});

Deno.test("validateClip — empty clip", () => {
  assertEquals(validateClip(null, 0)!.code, "empty_clip");
  assertEquals(validateClip(undefined, 1)!.code, "empty_clip");
});

Deno.test("validateClip — image required", () => {
  const skip = validateClip({ audioUrl: "https://a" }, 0, { requireImage: true });
  assertEquals(skip!.code, "missing_image_url");
});
