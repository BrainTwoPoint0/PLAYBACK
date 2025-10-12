## Project Layout (2025-06 Refactor)

```
src/
  app/          # Only route segments (page.tsx, layout.tsx, etc.)
  components/   # Re-usable UI components (presentational only)
  lib/          # Shared helpers and external SDK wrappers
    sanity/     # Sanity client, live utilities, image helpers
public/         # Static assets served as-is
```

Key points:
• Prefer importing with the base alias `@/` – e.g. `@/components/Button` or `@/lib/utils`.
• Route files should never import from `src/app/components`; all shared visual elements live in `src/components`.
• The canonical Tailwind helper `cn` now lives in `src/lib/utils.ts` and is re-exported from `src/app/utils/cn.ts` for backwards-compatibility.
• The only Next.js config file is `next.config.mjs` (ESM).
