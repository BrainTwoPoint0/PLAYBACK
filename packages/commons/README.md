# @playback/commons

Shared UI components, utilities, types, and hooks for all PLAYBACK platforms (PLAYBACK, PLAYHUB, PLAYScanner, etc.).

## Overview

This package contains all reusable code that's shared across the PLAYBACK ecosystem. It's set up as an npm workspace package that can be imported by any application in the monorepo.

## Installation

The package is automatically linked via npm workspaces. No installation needed!

```bash
# In any workspace app (PLAYBACK, PLAYHUB)
# Just import and use - npm workspaces handles the rest
```

## Usage

### Importing Components

```typescript
// Import UI components
import { Button, Card, Input, Dialog } from '@playback/commons/components/ui';
import { ProtectedRoute } from '@playback/commons/components/auth';
import { AvatarUpload } from '@playback/commons/components/avatar';

// Or import specific components
import { Button } from '@playback/commons/components/ui/button';
import { cn } from '@playback/commons/lib';
```

### Importing Utilities

```typescript
// Client-side utilities (safe for any component)
import { createClient } from '@playback/commons/lib/supabase/client';
import { cn, formatDate } from '@playback/commons/lib';

// Server-side utilities (MUST import directly, NOT from barrel exports)
// These can ONLY be used in server components, API routes, or server actions
import { createClient as createServerClient } from '@playback/commons/lib/supabase/server';
import { getUser, requireAuth } from '@playback/commons/lib/auth/utils';
```

**⚠️ IMPORTANT: Server-Side Imports**

Server-side utilities (`supabase/server` and `auth/utils`) use `next/headers` and can **ONLY** be used in:

- Server Components (default in App Router)
- API Routes (`app/api/**/route.ts`)
- Server Actions

They are **NOT exported** from barrel files (`@playback/commons/lib`) to prevent accidental imports in client components. Always import them directly:

```typescript
// ✅ CORRECT - Direct import in server component
import { createClient } from '@playback/commons/lib/supabase/server';

// ❌ WRONG - Will cause build errors
import { createClient } from '@playback/commons/lib';
```

### Importing Types

```typescript
// Database types
import type { Database, Tables } from '@playback/commons/lib/supabase/types';

// Or import from types directly
import type { Database } from '@playback/commons/types';
```

## Package Structure

```
packages/commons/
├── src/
│   ├── components/          # UI Components
│   │   ├── ui/             # shadcn/ui base components (37+)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── auth/           # Authentication components
│   │   │   └── protected-route.tsx
│   │   ├── avatar/         # Avatar upload/display
│   │   │   └── avatar-upload.tsx
│   │   ├── video/          # Video player/upload
│   │   │   ├── video-player.tsx
│   │   │   └── video-upload.tsx
│   │   ├── stats/          # Statistics components
│   │   │   ├── stats-form.tsx
│   │   │   └── stats-dashboard.tsx
│   │   ├── analytics/      # Analytics components
│   │   │   └── SimpleChart.tsx
│   │   └── index.ts        # Barrel exports
│   │
│   ├── lib/                # Utilities & Helpers
│   │   ├── utils.ts        # cn() and common utilities
│   │   ├── supabase/       # Supabase clients & types
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── auth/           # Auth utilities
│   │   │   ├── client.ts
│   │   │   ├── shared.ts
│   │   │   └── utils.ts
│   │   ├── avatar/         # Avatar utilities
│   │   │   └── utils.ts
│   │   ├── video/          # Video utilities
│   │   │   └── utils.ts
│   │   ├── stats/          # Stats utilities
│   │   │   └── utils.ts
│   │   └── index.ts        # Barrel exports
│   │
│   ├── types/              # Shared TypeScript types
│   │   └── index.ts
│   │
│   ├── hooks/              # Shared React hooks
│   │   └── index.ts
│   │
│   └── index.ts            # Main package entry
│
├── package.json
├── tsconfig.json
└── README.md (this file)
```

## Available Components

### UI Components (37+)

All shadcn/ui components with Tailwind CSS styling:

- **Buttons & Inputs**: `Button`, `Input`, `Textarea`, `Checkbox`, `Switch`, `Slider`, `RadioGroup`
- **Cards & Containers**: `Card`, `Badge`, `Sheet`, `Tabs`, `Collapsible`
- **Overlays**: `Dialog`, `Popover`, `Sheet`, `Command`
- **Forms**: `Label`, `Select`, `Calendar`, `DatePicker`, `TimePicker`, `FileUpload`
- **Navigation**: `NavigationMenu`
- **Feedback**: `LoadingSpinner`, `ErrorBoundary`
- **Advanced**: `CanvasRevealEffect`, `InfiniteMovingCards`, `AnimatedTooltip`, `BlogCard`, etc.

### Feature Components

- **Authentication**: `ProtectedRoute`
- **Avatar**: `AvatarUpload`, `AvatarDisplay`
- **Video**: `VideoPlayer`, `VideoUpload`
- **Statistics**: `StatsForm`, `StatsDashboard`
- **Analytics**: `SimpleChart`

### Utilities

- **`cn(...classes)`**: Tailwind class merger (clsx + tailwind-merge)
- **`formatDate(date)`**: Date formatting utility
- **Supabase Clients**: Browser and server-side Supabase clients
- **Auth Helpers**: `getUser()`, `requireAuth()`, `requireNoAuth()`
- **Avatar Utilities**: Upload, delete, process images
- **Video Utilities**: Upload, validate, extract metadata
- **Stats Utilities**: CRUD operations for statistics

## Example: Building a New PLAYBACK App

Here's how to use commons in a new app (e.g., PLAYHUB):

### 1. Initialize PLAYHUB

```bash
cd /path/to/PLAYBACK/monorepo
npx create-next-app@latest PLAYHUB
cd PLAYHUB
```

### 2. Update package.json

```json
{
  "name": "playhub",
  "dependencies": {
    "@playback/commons": "*",
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  }
}
```

### 3. Update tsconfig.json

```json
{
  "compilerOptions": {
    // ... other options
    "paths": {
      "@/*": ["./src/*"],
      "@playback/commons": ["../packages/commons/src"],
      "@playback/commons/*": ["../packages/commons/src/*"]
    }
  }
}
```

### 4. Install Dependencies

```bash
cd /path/to/PLAYBACK/monorepo
npm install
```

### 5. Use Commons in Your App

```typescript
// app/page.tsx
import { Button, Card } from "@playback/commons/components/ui"
import { createClient } from "@playback/commons/lib/supabase/client"
import { cn } from "@playback/commons/lib"

export default function Home() {
  return (
    <Card className={cn("p-6", "max-w-md")}>
      <h1>Welcome to PLAYHUB</h1>
      <Button>Get Started</Button>
    </Card>
  )
}
```

## Styling

All components use Tailwind CSS and are styled with the PLAYBACK design system:

- **Dark theme** by default
- **Custom color palette** with `--primary`, `--secondary`, etc.
- **Responsive** mobile-first design
- **Animations** via `tailwindcss-animate`

### Tailwind Configuration

Apps using commons should extend the commons Tailwind config:

```javascript
// tailwind.config.js in your app
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    '../packages/commons/src/**/*.{ts,tsx}', // Include commons
  ],
  theme: {
    extend: {
      // Your app-specific overrides
    },
  },
};
```

## TypeScript

All components and utilities are fully typed. Import types from:

```typescript
import type { Database } from '@playback/commons/lib/supabase/types';
import type { UserProfile } from '@playback/commons/types';
```

## Shared Dependencies

The following dependencies are included in commons:

### UI & Styling

- `@radix-ui/*` - Radix UI primitives
- `class-variance-authority` - CVA for component variants
- `clsx` + `tailwind-merge` - Class name utilities
- `tailwindcss-animate` - Animation utilities
- `lucide-react` - Icon library
- `framer-motion` - Animations

### Backend & Data

- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - SSR support
- `date-fns` - Date utilities
- `react-dropzone` - File uploads
- `react-day-picker` - Date picker

## Development

### Adding New Components

1. Add component to `src/components/`
2. Export from appropriate index file
3. Component is immediately available in all apps

```typescript
// packages/commons/src/components/ui/my-component.tsx
export function MyComponent() {
  return <div>My Component</div>
}

// packages/commons/src/components/ui/index.ts
export * from './my-component'
```

### Adding New Utilities

1. Add utility to `src/lib/`
2. Export from lib index
3. Utility is immediately available

```typescript
// packages/commons/src/lib/my-util.ts
export function myUtil() {
  return 'utility';
}

// packages/commons/src/lib/index.ts
export * from './my-util';
```

## Benefits

### Code Reuse

- Write once, use everywhere
- No copy-paste between apps
- Bug fixes benefit all apps

### Consistency

- Same UI across all platforms
- Unified design system
- Shared authentication logic

### Maintainability

- Single source of truth
- Easier refactoring
- Better type safety

### Development Speed

- Instant access to all components
- No setup for new apps
- Hot reload across workspace

## Troubleshooting

### Import Not Found

If imports aren't working:

1. **Check tsconfig paths**:

   ```json
   {
     "paths": {
       "@playback/commons": ["../packages/commons/src"],
       "@playback/commons/*": ["../packages/commons/src/*"]
     }
   }
   ```

2. **Reinstall dependencies**:

   ```bash
   cd /path/to/monorepo/root
   rm -rf node_modules PLAYBACK/node_modules PLAYHUB/node_modules
   npm install
   ```

3. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   ```

### Type Errors

If you get Supabase type errors, regenerate types:

```bash
cd PLAYBACK
npx supabase gen types typescript --linked > ../packages/commons/src/lib/supabase/types.ts
```

### Module Resolution

If webpack can't resolve commons, add to `next.config.js`:

```javascript
webpack: (config) => {
  config.resolve.modules = [
    ...(config.resolve.modules || []),
    path.resolve(__dirname, '../node_modules'),
  ];
  return config;
};
```

## Contributing

When adding new shared code:

1. **Is it truly shared?** - Only add code used by 2+ apps
2. **Is it app-agnostic?** - Avoid app-specific business logic
3. **Is it well-documented?** - Add JSDoc comments
4. **Is it properly exported?** - Update index files

## License

Private package for PLAYBACK ecosystem.

---

**Questions?** Check the main PLAYBACK monorepo README or contact the development team.
