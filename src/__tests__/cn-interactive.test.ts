import { describe, it, expect } from "vitest";
import { cnInteractive } from "@/lib/utils";

describe("cnInteractive", () => {
  it("returns default interactive classes with hover and primary ring", () => {
    const classes = cnInteractive();
    expect(classes).toContain("transition-[transform,background-color,border-color,box-shadow]");
    expect(classes).toContain("duration-200");
    expect(classes).toContain("ease-out");
    expect(classes).toContain("active:scale-[0.97]");
    expect(classes).toContain("hover:-translate-y-0.5");
    expect(classes).toContain("focus-visible:ring-primary/60");
    expect(classes).not.toContain("hover:-translate-y-0.5 hover:hidden"); // sanity: not double
  });

  it("omits hover classes when hover=false", () => {
    const classes = cnInteractive({ hover: false });
    expect(classes).not.toContain("hover:-translate-y-0.5");
    expect(classes).not.toContain("hover:shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.35)]");
    expect(classes).toContain("active:scale-[0.97]");
  });

  it("uses destructive ring when ring=destructive", () => {
    const classes = cnInteractive({ ring: "destructive" });
    expect(classes).toContain("focus-visible:ring-destructive/60");
    expect(classes).not.toContain("focus-visible:ring-primary/60");
  });
});
