import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";
import jsdoc from "eslint-plugin-jsdoc";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(["**/__mocks__/**/*.js", "src/app/(pages)/.well-known/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],

    extends: compat.extends("prettier", "plugin:@next/next/recommended"),

    plugins: {
      "@typescript-eslint": typescriptEslint,
      "unused-imports": unusedImports,
      jsdoc: jsdoc,
      next: nextPlugin,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",

      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "jsdoc/require-param": "warn",
      "jsdoc/require-param-name": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/check-tag-names": "off",
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
        },
      ],

      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    plugins: {
      jsdoc: jsdoc,
    },
    files: ["src/**/*.test*", "src/**/tests/**/*"],

    rules: {
      "jsdoc/require-jsdoc": "off",
    },
  },
]);
