import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      /**
       * Downgraded to a warning on purpose. Three places in this app call
       * setState from an effect, each for a reason React's own guidance allows:
       *
       *  1. `session-provider.tsx` hydrates the run from localStorage once after
       *     mount. Reading an external store in an effect is the documented
       *     pattern; `useSyncExternalStore` cannot be used because the server
       *     snapshot has to stay null to avoid a hydration mismatch.
       *  2. `diagnostic/page.tsx` and `reassess/page.tsx` resume an interrupted
       *     run once, so a reload mid-diagnostic does not restart it. Guarded by
       *     a `resumed` flag, so it can never re-fire.
       *  3. `bridge/page.tsx` generates the practice tasks once per run.
       *
       * Everything else in the codebase derives state instead of syncing it.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
