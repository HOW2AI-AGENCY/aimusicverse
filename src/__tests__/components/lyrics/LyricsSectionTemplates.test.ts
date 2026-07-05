import { describe, it, expect } from "vitest";
import { LYRICS_TEMPLATES } from "@/components/generate-form/lyrics/LyricsSectionTemplates";

describe("LYRICS_TEMPLATES", () => {
  it("has 4 templates", () => {
    expect(LYRICS_TEMPLATES).toHaveLength(4);
  });

  it("every template has unique id", () => {
    const ids = LYRICS_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Pop Standard has Verse, Chorus, Bridge, Chorus pattern", () => {
    const pop = LYRICS_TEMPLATES.find((t) => t.id === "pop-standard");
    expect(pop?.sections.map((s) => s.type)).toEqual(["verse", "chorus", "verse", "chorus", "bridge", "chorus"]);
  });

  it("every section type is a valid SectionType", () => {
    const valid = ["verse", "chorus", "bridge", "pre-chorus", "intro", "outro", "hook", "custom"];
    for (const tmpl of LYRICS_TEMPLATES) {
      for (const s of tmpl.sections) {
        expect(valid).toContain(s.type);
      }
    }
  });
});
