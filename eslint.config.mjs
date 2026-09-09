import tseslint from "typescript-eslint";
import powerbi from "eslint-plugin-powerbi-visuals";

export default tseslint.config(
  { ignores: ["node_modules/**", "dist/**", ".tmp/**", "test-results/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    plugins: { "powerbi-visuals": powerbi },
    rules: {
      ...powerbi.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
);
