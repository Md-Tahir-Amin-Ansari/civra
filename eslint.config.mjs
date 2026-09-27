import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["app/src/**/*.js"],
    languageOptions: { globals: globals.browser },
    rules: js.configs.recommended.rules,
  },
  {
    files: ["tests/**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: js.configs.recommended.rules,
  },
];
