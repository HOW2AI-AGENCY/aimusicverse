/**
 * Local ESLint plugin: layer-boundary
 *
 * C4 layer-boundary guardrail for src/components/**:
 *  - no-supabase-from-in-component — запрещает вызовы supabase.from() напрямую
 *    в компонентах. Используйте слой src/api/* или src/services/*.
 *
 * Реализован как отдельный rule (а не `no-restricted-syntax`) чтобы иметь
 * собственную severity — иначе `no-restricted-syntax` объединит селекторы
 * с мобильными design-token селекторами (которые остаются на `warn` как
 * tech debt, см. eslint.config.js → techDebtWarnRules).
 */

const noSupabaseFromInComponent = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow direct supabase.from() calls in src/components/**. Use src/api/* or src/services/*.",
    },
    schema: [],
    messages: {
      forbidden:
        "Не вызывайте supabase.from() напрямую в компонентах. Используйте слой src/api/* или src/services/*.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression") return;
        if (callee.object && callee.object.type === "Identifier" && callee.object.name === "supabase") {
          if (callee.property && callee.property.type === "Identifier" && callee.property.name === "from") {
            context.report({ node, messageId: "forbidden" });
          }
        }
      },
    };
  },
};

export default {
  rules: {
    "no-supabase-from-in-component": noSupabaseFromInComponent,
  },
  configs: {
    recommended: {
      plugins: ["layer-boundary"],
      rules: { "layer-boundary/no-supabase-from-in-component": "error" },
    },
  },
};