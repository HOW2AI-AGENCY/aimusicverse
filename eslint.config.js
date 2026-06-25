import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const restrictedImports = {
  paths: [
    {
      name: "framer-motion",
      message:
        "Импортируйте из '@/lib/motion' — обёртка с tree-shaking. Прямой импорт framer-motion увеличивает бандл.",
    },
    {
      name: "lucide-react",
      message:
        "Импортируйте иконки из '@/lib/icons' — централизованный реестр для оптимизации бандла.",
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      "coverage",
      "node_modules",
      "**/*.stories.tsx",
      "**/*.min.js",
      "storybook-static",
      ".storybook",
      "supabase/functions/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/refs": "off",
      "no-restricted-imports": ["error", restrictedImports],
      "no-console": ["warn", { allow: [] }],
    },
  },
  // Файлы, которым разрешены console.* (инфраструктура логирования / отладки)
  {
    files: [
      "src/lib/logger.ts",
      "src/lib/sentry.ts",
      "src/lib/debug/**",
      "src/lib/icons.ts",
      "src/lib/motion.ts",
    ],
    rules: {
      "no-console": "off",
      "no-restricted-imports": "off",
    },
  },
  // Запрет прямого supabase.from() в компонентах и страницах — используем src/api или src/services
  {
    files: ["src/components/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.object.name='supabase'][callee.property.name='from']",
          message:
            "Не вызывайте supabase.from() напрямую в компонентах/страницах. Используйте слой src/api/* или src/services/*.",
        },
      ],
    },
  },
  prettier
);
