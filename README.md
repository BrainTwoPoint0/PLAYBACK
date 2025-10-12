# PLAYBACK

Main platform for player profiles, highlights, and sports networking.

**URL**: https://playbacksports.ai
**Tech Stack**: Next.js 14, TypeScript, Supabase, Tailwind CSS, Sanity CMS

## Overview

PLAYBACK is the flagship application of the PLAYBACK sports ecosystem, providing a platform for athletes to showcase their profiles, share highlights, and connect with coaches, scouts, and organizations.

This application is part of a **monorepo** that includes shared components and multiple applications.

## Repository Structure

```
PLAYBACK/                    # Parent monorepo
├── PLAYBACK/               # This application
│   ├── .git/              # Independent git repository
│   ├── src/
│   │   ├── app/          # Next.js App Router pages & API routes
│   │   ├── components/   # App-specific components (Sanity, blog)
│   │   ├── lib/          # App-specific utilities
│   │   └── sanity/       # Sanity CMS configuration
│   └── package.json
│
├── packages/              # Shared packages
│   └── commons/          # @playback/commons v1.0.0
│       └── src/
│           ├── components/  # 37+ shared UI components
│           └── lib/         # Shared utilities
│
└── docs/                  # Shared documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Sanity.io account and project

### Installation

```bash
# Navigate to PLAYBACK directory
cd PLAYBACK

# Install dependencies (automatically links @playback/commons)
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=your_sanity_read_token
```

## Project Structure

### App Structure

```
src/
  app/              # Next.js App Router
    api/            # API endpoints (sports, posts, playscanner)
    auth/           # Authentication pages (login, register, reset)
    dashboard/      # User dashboard
    playscanner/    # Court availability search
    studio/         # Sanity CMS studio

  components/       # App-specific components
    sanity/        # Sanity blog components (blog-card, blog-post-grid)

  lib/             # App-specific utilities
    auth/          # Local auth context and utilities
    sanity/        # Sanity client and utilities
    playscanner/   # PLAYScanner functionality

  sanity/          # Sanity CMS schemas and configuration
```

### Commons Package

Shared UI components and utilities are imported from `@playback/commons`:

```typescript
// Import UI components
import { Button, Card, Input } from '@playback/commons/components/ui';

// Import utilities
import { cn } from '@playback/commons/lib';
import { createClient } from '@playback/commons/lib/supabase/client';

// Import feature components
import { AvatarUpload } from '@playback/commons/components/avatar';
import { VideoPlayer } from '@playback/commons/components/video';
```

**Available from Commons**:

- 37+ UI components (Button, Input, Card, Dialog, Select, etc.)
- Feature components (Avatar upload, Video player, Stats dashboard)
- Supabase clients and utilities
- Authentication utilities
- Avatar, video, and stats processing functions

See `/packages/commons/README.md` for complete documentation.

## Development

### Common Commands

```bash
# Development
npm run dev          # Start Next.js dev server on http://localhost:3000

# Production Build
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier

# Git Hooks
npm run prepare      # Install Husky hooks (auto-runs after npm install)
```

### Import Conventions

**For Shared Code:**

```typescript
// Import from commons package
import { Button } from '@playback/commons/components/ui';
import { cn } from '@playback/commons/lib';
import { createClient } from '@playback/commons/lib/supabase/client';
```

**For App-Specific Code:**

```typescript
// Import from local app using @/ alias
import { BlogCard } from '@/components/sanity/blog-card';
import { sanityClient } from '@/lib/sanity/client';
```

**Server-Side Imports (IMPORTANT):**

```typescript
// Server-side utilities MUST be imported directly (NOT from barrel exports)
import { createClient } from '@playback/commons/lib/supabase/server';
import { getUser } from '@playback/commons/lib/auth/utils';
```

### Working with Commons

```bash
# Make changes to commons package
cd ../packages/commons
# Edit files in src/

# Changes are immediately available in PLAYBACK
# No rebuild or reinstall needed during development
```

For production builds, commons code is automatically bundled into the app.

## Features

### Authentication

- Streamlined registration with email verification
- Username and full name collection
- Direct-to-dashboard experience
- Protected routes with middleware

### Modular Profile System

- Multi-profile architecture (player, coach, scout variants)
- Sport-specific profiles (football, basketball, tennis)
- Realistic experience levels
- LinkedIn-style flexibility

### PLAYScanner

- Real-time court availability search
- Revenue analytics and conversion tracking
- Commission calculation for partnerships
- Caching system for performance

### Highlights

- Video upload to Supabase Storage
- Sport-specific tagging and filtering
- Grid/list view modes
- Public/private highlight settings

### Organizations

- Club and academy management
- Role-based membership system
- ERP foundation for future features

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui + @playback/commons
- **Styling**: Tailwind CSS with dark theme
- **CMS**: Sanity.io for content management
- **Storage**: Supabase Storage for avatars and video highlights
- **3D Graphics**: Three.js with React Three Fiber

## Database Schema

### Core Profile Tables

- `profiles` - Main user account (one per user)
- `profile_variants` - Multiple role variants per user
- `user_preferences` - Modular preferences system

### Sport-Specific Tables

- `football_player_profiles` - Football-specific data
- `basketball_player_profiles` - Basketball-specific data
- Coach profiles work across all sports

### Supporting Tables

- `sports` - Sports catalog
- `organizations` - Club/academy management
- `organization_members` - Role-based membership
- `highlights` - Video highlights with metadata
- `statistics` - Flexible performance tracking

### PLAYScanner Tables

- `playscanner_cache` - Caching functionality
- `playscanner_sessions/searches/conversions` - Analytics
- `provider_analytics` - Business intelligence

## Deployment

### Production Build

```bash
npm run build  # Builds PLAYBACK + bundles @playback/commons
npm run start  # Start production server
```

### Deployment Platform

Deployed to **playbacksports.ai** via Netlify.

The build process automatically:

1. Runs `npm run build`
2. Bundles all code including `@playback/commons`
3. Generates static pages where possible
4. Deploys as a single application

**Note**: The commons package does NOT need separate deployment - it's bundled directly into the app.

## Testing & Quality

- ESLint follows Next.js Core Web Vitals config
- Prettier formatting enforced on pre-commit via Husky
- TypeScript strict mode enabled
- Lint-staged for automated formatting

## Documentation

- **CLAUDE.md**: Development guidelines for AI assistance
- **docs/projectplan.md**: Implementation history and reviews
- **docs/PLAYHUB.md**: Marketplace specification
- **packages/commons/README.md**: Commons package documentation
- **packages/commons/VERSIONING.md**: Versioning guide for commons

## Contributing

When making changes:

### App-Specific Changes

```bash
cd PLAYBACK
# Make changes to src/
git add .
git commit -m "feat: add new feature"
git push
```

### Commons Changes

```bash
cd packages/commons
# Make changes to src/
# Update CHANGELOG.md
# Bump version in package.json if breaking changes
git add .
git commit -m "chore(commons): update component"
git push
```

## Support

For issues or questions:

- Check `/docs/projectplan.md` for implementation context
- Review `/packages/commons/README.md` for commons usage
- See CLAUDE.md for development guidelines

## License

Private - Brain 2.0 Ltd
