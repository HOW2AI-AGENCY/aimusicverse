/**
 * Local ESLint plugin: section-tokens
 *
 * Provides `no-saturated-brand` — bans saturated brand washes
 * (bg-primary / bg-accent / from-primary / via-accent / bg-gradient-primary…)
 * inside shared layout primitives. Auto-fixable via the same codemod
 * used by `scripts/check-section-tokens.mjs` — single source of truth.
 *
 * Allow-list: add `// section-tokens-allow` on the same line, or
 * `// section-tokens-allow-next-line` on the previous line.
 */
import { FORBIDDEN, rewriteText, DEFAULT_TARGETS } from "../scripts/check-section-tokens.mjs";

const ALLOW_INLINE = /section-tokens-allow\b/;
const ALLOW_NEXT = /section-tokens-allow-next-line\b/;

/** Find first forbidden match in a raw string; null if none. */
function firstMatch(raw) {
  for (const rule of FORBIDDEN) {
    rule.pattern.lastIndex = 0;
    const m = rule.pattern.exec(raw);
    if (m) return { rule, matched: m[0] };
  }
  return null;
}

const noSaturatedBrand = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow saturated brand washes (bg-primary/accent, brand gradients) in layout primitives. Auto-fixes to neutral surface tokens.",
    },
    fixable: "code",
    schema: [],
    messages: {
      forbidden:
        "Saturated brand token '{{matched}}' is not allowed in layout primitives. Use '{{suggestion}}' instead. Add `// section-tokens-allow-next-line` to opt out.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    function isAllowed(node) {
      const loc = node.loc;
      if (!loc) return false;
      const lineText = sourceCode.lines[loc.start.line - 1] ?? "";
      if (ALLOW_INLINE.test(lineText)) return true;
      const prevText = loc.start.line > 1 ? sourceCode.lines[loc.start.line - 2] : "";
      if (ALLOW_NEXT.test(prevText)) return true;
      return false;
    }

    function check(node, raw) {
      if (!raw || typeof raw !== "string") return;
      const hit = firstMatch(raw);
      if (!hit) return;
      if (isAllowed(node)) return;

      // For string Literals we can safely rewrite the verbatim source
      // (including surrounding quotes). TemplateElements are reported
      // without auto-fix because their range semantics differ across
      // parsers — run `npm run check:section-tokens -- --fix` for those.
      if (node.type !== "Literal") {
        context.report({
          node,
          messageId: "forbidden",
          data: { matched: hit.matched, suggestion: hit.rule.replacement },
        });
        return;
      }
      const original = sourceCode.getText(node);
      const { output } = rewriteText(original);
      context.report({
        node,
        messageId: "forbidden",
        data: { matched: hit.matched, suggestion: hit.rule.replacement },
        fix(fixer) {
          if (output === original) return null;
          return fixer.replaceText(node, output);
        },
      });
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value && node.value.raw);
      },
    };
  },
};

export default {
  rules: {
    "no-saturated-brand": noSaturatedBrand,
  },
  configs: {
    recommended: {
      plugins: ["section-tokens"],
      rules: { "section-tokens/no-saturated-brand": "error" },
    },
  },
  // Re-export for convenience.
  DEFAULT_TARGETS,
};
