/**
 * Unit tests for the local ESLint plugin `section-tokens`.
 *
 * Verifies the rule is wired to the shared codemod and that auto-fix
 * output equals scripts/check-section-tokens.mjs rewriteText().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { RuleTester } from "eslint";
// @ts-expect-error - JS plugin without types
import plugin from "../../eslint-rules/section-tokens.js";

const rule = plugin.rules["no-saturated-brand"];

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("section-tokens/no-saturated-brand", rule, {
  valid: [
    { code: `const c = "bg-card/60 border border-border/50";` },
    { code: `const c = "text-primary border-primary/20 ring-primary";` },
    { code: `const c = "bg-primary-foreground";` },
    { code: `const c = \`bg-card/60\`;` },
    { code: `const c = "bg-primary"; // section-tokens-allow` },
    {
      code: [
        `// section-tokens-allow-next-line`,
        `const c = "bg-primary";`,
      ].join("\n"),
    },
  ],
  invalid: [
    {
      code: `const c = "rounded-2xl bg-primary p-4";`,
      output: `const c = "rounded-2xl bg-card/60 p-4";`,
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: `const c = "bg-accent/40";`,
      output: `const c = "bg-card/60";`,
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: `const c = "bg-gradient-primary";`,
      output: `const c = "bg-gradient-to-br from-card/60 via-background to-muted/40";`,
      errors: [{ messageId: "forbidden" }],
    },
    {
      // Template literals are flagged but not auto-fixed (output = code).
      code: "const c = `from-primary via-accent to-primary/50`;",
      output: null,
      errors: [
        { messageId: "forbidden" },
        { messageId: "forbidden" },
        { messageId: "forbidden" },
      ],
    },
  ],
});

