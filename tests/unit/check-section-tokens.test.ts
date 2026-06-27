/**
 * Unit tests for scripts/check-section-tokens.mjs.
 *
 * Cover: detection, allow-list markers, error formatting, codemod.
 */
import { describe, it, expect } from "vitest";
import {
  scanText,
  rewriteText,
  formatViolation,
  FORBIDDEN,
  DEFAULT_TARGETS,
} from "../../scripts/check-section-tokens.mjs";

describe("check-section-tokens — detection", () => {
  it("flags bg-primary", () => {
    const v = scanText(`<div className="rounded-2xl bg-primary p-4" />`);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ line: 1, ruleId: "bg-brand" });
    expect(v[0].matched).toBe("bg-primary");
    expect(v[0].hint).toContain("bg-card/60");
  });

  it("flags bg-accent/40 with opacity suffix", () => {
    const v = scanText(`bg-accent/40`);
    expect(v).toHaveLength(1);
    expect(v[0].matched).toBe("bg-accent/40");
  });

  it("flags gradient stops (from / via / to / bg-gradient-primary)", () => {
    const text = [
      `from-primary`,
      `via-accent`,
      `to-primary/50`,
      `bg-gradient-primary`,
      `bg-gradient-generate`,
    ].join("\n");
    const v = scanText(text);
    const ids = v.map((x) => x.ruleId).sort();
    expect(ids).toEqual(["bg-gradient-brand", "bg-gradient-brand", "from-brand", "to-brand", "via-brand"]);
    expect(v[0].line).toBe(1);
    expect(v[4].line).toBe(5);
  });

  it("does NOT flag text-primary, border-primary/20, ring-primary", () => {
    const text = `<a className="text-primary border-primary/20 ring-primary" />`;
    expect(scanText(text)).toEqual([]);
  });

  it("does NOT flag neutral tokens (bg-card, bg-muted, bg-background)", () => {
    const text = `bg-card/60 bg-muted/30 bg-background from-card/60 via-background to-muted/40`;
    expect(scanText(text)).toEqual([]);
  });

  it("does NOT flag bg-primary-foreground (different token)", () => {
    expect(scanText(`bg-primary-foreground`)).toEqual([]);
  });
});

describe("check-section-tokens — allow markers", () => {
  it("respects // section-tokens-allow on the same line", () => {
    const text = `bg-primary // section-tokens-allow`;
    expect(scanText(text)).toEqual([]);
  });

  it("respects // section-tokens-allow-next-line on previous line", () => {
    const text = [`// section-tokens-allow-next-line`, `bg-primary`].join("\n");
    expect(scanText(text)).toEqual([]);
  });

  it("does not silence two lines below", () => {
    const text = [`// section-tokens-allow-next-line`, `// other`, `bg-primary`].join("\n");
    expect(scanText(text)).toHaveLength(1);
  });
});

describe("check-section-tokens — formatViolation", () => {
  it("includes path:line, matched, hint and snippet without ANSI when color=false", () => {
    const v = scanText(`<div className="bg-accent" />`)[0];
    const v2 = { ...v, file: "src/components/layout/Section.tsx" };
    const out = formatViolation(v2, { color: false });
    expect(out).toContain("src/components/layout/Section.tsx:1");
    expect(out).toContain("forbidden:");
    expect(out).toContain("bg-accent");
    expect(out).toContain("suggest:");
    expect(out).toContain("bg-card/60");
    expect(out).toContain("line:");
    // No ANSI escapes
    // eslint-disable-next-line no-control-regex
    expect(out).not.toMatch(/\u001b\[/);
  });
});

describe("check-section-tokens — codemod (rewriteText)", () => {
  it("replaces bg-primary with bg-card/60", () => {
    const r = rewriteText(`<div className="bg-primary p-4" />`);
    expect(r.changed).toBe(true);
    expect(r.count).toBe(1);
    expect(r.output).toBe(`<div className="bg-card/60 p-4" />`);
  });

  it("rewrites multi-line gradient stack in one pass", () => {
    const input = [
      `bg-gradient-primary`,
      `from-primary`,
      `via-accent/30`,
      `to-accent`,
    ].join("\n");
    const r = rewriteText(input);
    expect(r.count).toBe(4);
    expect(r.output).toContain("bg-gradient-to-br from-card/60 via-background to-muted/40");
    expect(r.output).toContain("from-card/60");
    expect(r.output).toContain("via-background");
    expect(r.output).toContain("to-muted/40");
  });

  it("is a no-op on already-neutral input", () => {
    const input = `<div className="bg-card/60 border border-border/50" />`;
    const r = rewriteText(input);
    expect(r.changed).toBe(false);
    expect(r.count).toBe(0);
    expect(r.output).toBe(input);
  });

  it("leaves allow-listed lines untouched", () => {
    const input = `bg-primary // section-tokens-allow`;
    const r = rewriteText(input);
    expect(r.changed).toBe(false);
    expect(r.output).toBe(input);
  });

  it("rewrite output passes scanText (idempotent fix)", () => {
    const input = `bg-primary from-accent via-primary/40 to-accent bg-gradient-primary`;
    const r = rewriteText(input);
    expect(scanText(r.output)).toEqual([]);
  });
});

describe("check-section-tokens — config sanity", () => {
  it("exports a non-empty rule table", () => {
    expect(FORBIDDEN.length).toBeGreaterThan(0);
    for (const rule of FORBIDDEN) {
      expect(rule.id).toBeTruthy();
      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect(rule.replacement).toBeTruthy();
    }
  });

  it("includes Section.tsx in default targets", () => {
    expect(DEFAULT_TARGETS).toContain("src/components/layout/Section.tsx");
  });
});
