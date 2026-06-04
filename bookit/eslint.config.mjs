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
    // P0.2: Restrict createAdminClient to allowed server-side zones only.
    // Forbidden: page.tsx, layout.tsx, loading.tsx, components/**
    // Allowed: src/app/api/**, src/app/**/actions.ts, src/lib/supabase/admin.ts,
    //          src/lib/notifications/**, src/lib/billing/**, src/lib/telegram/**
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/components/**/*.tsx",
      "src/components/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "createAdminClient() bypasses RLS. Use createClient() for authenticated routes or createPublicClient() for public pages. Allowed only in: src/app/**/actions.ts, src/app/api/**, src/lib/notifications/**, src/lib/billing/**, src/lib/telegram/**",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
