# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a **monorepo** containing multiple Next.js applications for the PLAYBACK sports ecosystem:

```
PLAYBACK/                    # Parent monorepo
├── PLAYBACK/               # Main website (playbacksports.ai)
│   ├── .git/              # Independent git repository
│   ├── src/
│   │   ├── app/          # Next.js App Router pages & API routes
│   │   ├── components/   # App-specific components (Sanity, blog, etc.)
│   │   ├── lib/          # App-specific utilities
│   │   └── sanity/       # Sanity CMS configuration
│   └── package.json       # Next.js 14 application
│
├── PLAYHUB/               # Marketplace (playhub.playbacksports.ai)
│   └── [To be initialized]
│
├── packages/              # Shared packages
│   └── commons/          # @playback/commons v1.0.0
│       ├── src/
│       │   ├── components/  # 37 shared UI components
│       │   │   ├── ui/      # shadcn/ui (Button, Input, Card, etc.)
│       │   │   ├── avatar/  # Avatar upload/display
│       │   │   ├── video/   # Video player/upload
│       │   │   └── stats/   # Statistics dashboard
│       │   └── lib/         # Shared utilities
│       │       ├── supabase/ # Client & server with types
│       │       ├── auth/     # Auth utilities
│       │       ├── avatar/   # Avatar processing
│       │       ├── video/    # Video processing
│       │       └── utils.ts  # cn() utility
│       └── package.json
│
├── docs/                  # Shared documentation
│   ├── projectplan.md     # Implementation history
│   ├── PLAYHUB.md        # Marketplace specification
│   └── playback-context.md
│
├── package.json          # Root workspace configuration
├── CLAUDE.md             # This file
└── README.md
```

**Important**: Each application (PLAYBACK, PLAYHUB) is an **independent git repository** with its own remote and deployment pipeline. The commons package is tracked in the parent repository.

## Standard Workflow

1. First think through the problem, read the codebase for relevant files, and write a plan to CLAUDE.md
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as "completed" as you go.
5. Add tests whilst developing with the expected inputs and outputs - enforcing TDD.
6. Please, every step of the way, just give me a high level explanation of what changes you have made.
7. Make every task and code change you do as simple as possible. We want to avoid making massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
8. Finally, add a review section to the CLAUDE.md file with a summary of the changes you made abd any other relevant information.

## Important Instruction Reminders

- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

## Common Commands

```bash
# Development
npm run dev          # Start Next.js development server on http://localhost:3000

# Production Build
npm run build        # Build the Next.js application for production
npm run start        # Start the production server

# Code Quality
npm run lint         # Run ESLint to check for code issues
npm run format       # Format all files with Prettier

# Git Hooks Setup
npm run prepare      # Install Husky hooks (runs automatically after npm install)
```

## Codebase Architecture

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme
- **CMS**: Sanity.io for content management
- **Storage**: Supabase Storage for avatars and video highlights

### Project Structure

```
PLAYBACK/src/
  app/              # Next.js App Router pages and API routes
    api/            # API endpoints (sports, posts, playscanner)
    auth/           # Authentication pages (login, register, reset)
    dashboard/      # User dashboard
    playscanner/    # Court availability search
    studio/         # Sanity CMS studio

  components/       # App-specific UI components
    auth/          # Sanity blog components (blog-card, blog-post-grid)
    sanity/        # Other app-specific components

  lib/             # App-specific utilities
    auth/          # Local auth context and utilities
    sanity/        # Sanity client and utilities
    playscanner/   # PLAYScanner functionality

  sanity/          # Sanity CMS schemas and configuration
```

### Commons Package (`@playback/commons`)

All shared UI components and utilities live in the commons package:

```
packages/commons/src/
  components/      # Shared UI components
    ui/           # shadcn/ui base components (37+)
    avatar/       # Avatar upload/display
    video/        # Video player/upload
    stats/        # Statistics components
    analytics/    # Analytics components

  lib/            # Shared utilities
    utils.ts      # cn() utility for Tailwind
    supabase/     # Supabase clients (client & server)
    auth/         # Auth utilities
    avatar/       # Avatar processing
    video/        # Video processing
    stats/        # Stats utilities
```

### Import Conventions

**For Shared Code (UI components, utilities):**

```typescript
// Import from commons package
import { Button, Card } from '@playback/commons/components/ui';
import { cn } from '@playback/commons/lib';
import { createClient } from '@playback/commons/lib/supabase/client';
import { AvatarUpload } from '@playback/commons/components/avatar';
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
// These can ONLY be used in server components, API routes, or server actions
import { createClient } from '@playback/commons/lib/supabase/server';
import { getUser } from '@playback/commons/lib/auth/utils';
```

**Key Rules**:

- Use `@playback/commons` for all shared UI components and utilities
- Use `@/` only for app-specific code (Sanity, local utilities)
- Never import server-side utilities (`supabase/server`, `auth/utils`) from barrel exports
- Route files should never import from `src/app/components`

### Key Features Implementation

1. **Authentication Flow**
   - Middleware protection in `src/middleware.ts`
   - Auth context provider in `src/components/auth/auth-provider.tsx`
   - Protected routes require authentication
   - Email verification and password reset flows

2. **User Registration & Profile Creation**
   - Streamlined registration with username and full name collection
   - Direct-to-dashboard experience after email verification
   - Automatic profile creation via database trigger
   - Organic profile building within dashboard

3. **New Modular Profile System (2025-01-16)**
   - **Multi-Profile Architecture**: Users can have multiple profile variants (player, coach, scout, etc.)
   - **Sport-Specific Profiles**: Dedicated tables for football, basketball, tennis with sport-specific fields
   - **Realistic Experience Levels**: From "recreational" to "professional" with sport-specific terminology
   - **LinkedIn-Style Flexibility**: One account, multiple professional identities
   - **Modular Preferences**: Extensible system for PLAYScanner and future services

4. **Highlights System**
   - Video upload to Supabase Storage
   - Sport-specific tagging and filtering
   - Grid/list view modes
   - Public/private highlight settings

### Database Schema (Updated 2025-01-16)

**New Modular Profile System** - LinkedIn-style multi-profile architecture:

**Core Profile Tables:**

- `profiles` - Main user account (one per user)
- `profile_variants` - Multiple role variants per user (player, coach, scout, etc.)
- `user_preferences` - Modular preferences system (PLAYScanner, notifications, etc.)

**Sport-Specific Profile Tables:**

- `football_player_profiles` - Football-specific data with realistic experience levels
- `basketball_player_profiles` - Basketball-specific data and metrics
- Coach profiles work across all sports

**Supporting Tables:**

- `sports` - Sports catalog (simplified, no categories)
- `organizations` - Club/academy management with ERP foundation
- `organization_members` - Membership system with role-based permissions
- `highlights` - Video highlights with metadata
- `statistics` - Flexible sport-specific statistics

**PLAYScanner Tables (Production):**

- `playscanner_cache` - Core caching functionality
- `playscanner_collection_log` - Collection monitoring
- `playscanner_sessions/searches/conversions` - Revenue analytics
- `provider_analytics` - Business intelligence

### Environment Variables

Required in `.env.local` (or `.env`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_READ_TOKEN=
```

### Development Guidelines

1. **Component Development**
   - Use shadcn/ui components as base
   - Follow existing component patterns
   - Keep components in `src/components` directory
   - Use TypeScript interfaces for props

2. **API Routes**
   - Use Next.js App Router conventions
   - Implement proper error handling
   - Return appropriate HTTP status codes
   - Use Supabase client for database operations

3. **Styling**
   - Use Tailwind CSS classes
   - Follow the existing dark theme
   - Use `cn()` utility for conditional classes
   - Maintain mobile-first responsive design

4. **State Management**
   - Use React Context for global state (auth, user)
   - Keep component state local when possible
   - Use Supabase real-time subscriptions for live updates

### Testing and Quality

- ESLint configuration follows Next.js Core Web Vitals
- Prettier formatting on pre-commit via Husky
- TypeScript strict mode enabled
- No test framework currently configured

### Performance Considerations

- Images use Next.js Image component with optimization
- Lazy loading for video highlights
- Supabase RLS for security and performance
- Static generation where possible

## Commons Package Architecture

### What is @playback/commons?

A shared npm workspace package containing all reusable UI components, utilities, and types used across the PLAYBACK ecosystem (PLAYBACK, PLAYHUB, PLAYScanner).

**Version**: 1.0.0
**Location**: `/packages/commons`

### How It Works

- **No Publishing Required**: Managed via npm workspaces, no npm publish needed
- **Linked Locally**: Automatically linked during development via workspace configuration
- **Bundled in Production**: Commons code is bundled directly into apps during build
- **Immediate Availability**: Changes to commons are immediately available to all apps
- **Semantic Versioning**: Versioned using semver (1.0.0, 1.1.0, 2.0.0, etc.) for tracking breaking changes

### What's Inside

**37+ UI Components**:

- Form controls: Button, Input, Label, Checkbox, Radio, Select, Slider, Switch, Textarea
- Layout: Card, Dialog, Popover, Sheet, Tabs, Collapsible
- Navigation: Command, Navigation Menu
- Feedback: Loading Spinner, Toast
- Data Display: Avatar, Badge, Calendar, Table
- Advanced: Date Picker, Infinite Moving Cards, Hero Highlight, Animated Tooltip, Canvas Reveal Effect

**Feature Components**:

- Avatar Upload with image processing and Supabase Storage integration
- Video Upload with thumbnail generation
- Stats Form and Dashboard for performance tracking
- Analytics components for data visualization

**Supabase Utilities**:

- Client-side and server-side Supabase client factories
- TypeScript types generated from database schema
- Authentication utilities (client and server)

**Library Functions**:

- `cn()` for Tailwind class merging
- Avatar utilities: upload, delete, process images, generate placeholders
- Video utilities: upload, validation, thumbnail generation, metadata extraction
- Stats utilities: CRUD operations, predefined categories for Football, Basketball, Tennis
- Date formatting and other utility helpers

### Deployment

The commons package:

- **Does NOT need separate deployment** - bundled into each app
- **Works automatically in production** - npm workspaces resolve during build
- **No publishing to npm required** - linked locally in monorepo
- **Version controlled via Git** - tracked in parent repository

When you deploy PLAYBACK:

1. Build process runs `npm run build`
2. Next.js bundles all code including `@playback/commons`
3. Commons code is included in the production bundle
4. Deployed as a single application

### Versioning Strategy

See `/packages/commons/VERSIONING.md` for complete guide.

**Quick Reference**:

- **PATCH** (1.0.x): Bug fixes, backward compatible
- **MINOR** (1.x.0): New features, backward compatible
- **MAJOR** (x.0.0): Breaking changes, not backward compatible

### Current Development Status (Updated 2025-01-16)

**Major Architecture Overhaul Complete** - New modular profile system designed:

**✅ Completed:**

- Complete authentication system with streamlined registration
- **NEW: Modular Profile Architecture** - LinkedIn-style multi-profile system
- **NEW: Sport-Specific Tables** - Football, basketball, tennis with dedicated schemas
- **NEW: Realistic Experience Levels** - From "sunday_league" to "professional"
- **Production PLAYScanner System** - Caching, analytics, revenue tracking
- Organization/club management foundation
- Highlights system with sport-specific metadata
- Mobile responsive design with dark theme
- Row Level Security and proper indexes

**✅ Schema Migration Complete (2025-01-18):**

- ✅ Database migration deployed (`20250115_complete_schema_redesign.sql`)
- ✅ Fixed table creation order and forward references
- ✅ Added validation constraints (height, weight, jersey numbers, country codes)
- ✅ Implemented cascading updates for all foreign keys
- ✅ Added comprehensive statistics table for performance tracking

**✅ Schema Migration Frontend Implementation (2025-01-18):**

- Complete frontend cleanup and signup flow fixes

**✅ Commons Package Migration (2025-10-11):**

- Migrated all UI components from PLAYBACK to `@playback/commons`
- Centralized Supabase clients (client & server) in commons package
- Removed 68 files from PLAYBACK (UI components, utilities, duplicate code)
- Updated all imports to use `@playback/commons` package
- Fixed Tailwind CSS configuration to scan commons package
- Configured npm workspaces for automatic package linking
- Production build verified - all 24 pages generating successfully

**📋 Completed Tasks:**

- [x] Analyze current user registration flow and auth trigger ✅ COMPLETED
- [x] Review existing pages to identify what needs deletion (keep dashboard only) ✅ COMPLETED
- [x] Check if auth trigger matches new schema structure ✅ COMPLETED
- [x] Clean up unnecessary pages while preserving dashboard ✅ COMPLETED
- [x] Update registration to work with new profile variant system ✅ COMPLETED
- [x] Fix signup 406/500 errors by updating TypeScript types ✅ COMPLETED
- [x] Remove all user_sports references from codebase ✅ COMPLETED
- [x] Generate fresh TypeScript types from remote database ✅ COMPLETED
- [x] Update current_schema.sql with latest remote structure ✅ COMPLETED

## Analysis Results

### Auth Trigger Status

The `handle_new_user()` function in the database creates profiles correctly:

- ✅ Creates entry in `profiles` table with user_id, username, email, full_name
- ✅ Uses metadata from registration (username, full_name)
- ✅ Compatible with new schema structure

### Current Registration Flow

- ✅ Collects: email, password, username, full_name
- ✅ Stores as metadata for trigger
- ✅ Redirects to email verification
- ✅ After verification → dashboard

### Pages to Delete (Profile-Related)

Based on new modular profile system, these pages are outdated:

1. **`/src/app/profile/[username]/page.tsx`** - Public profile pages (old system)
2. **`/src/app/profile/edit/page.tsx`** - Profile editing (old single-profile system)
3. **`/src/app/profile/player/page.tsx`** - Player profile creation (old system)
4. **`/src/app/academy/page.tsx`** - Academy pages (unclear relevance)
5. **`/src/app/foundation/page.tsx`** - Foundation pages (unclear relevance)
6. **`/src/app/tournament/page.tsx`** - Tournament pages (unclear relevance)
7. **`/src/app/highlights/page.tsx`** - Highlights (may need updating for new schema)

**Keep:**

- `/src/app/dashboard/page.tsx` - Main user dashboard (will update for new variants)
- All auth pages (login, register, etc.)
- API routes (will need updates but keep structure)
- PLAYScanner pages (working with new schema)

## Summary of Changes Made

### Pages Deleted (Profile-Related)

- ✅ `/src/app/profile/` - Entire old profile system directory
- ✅ `/src/app/academy/` - Academy pages
- ✅ `/src/app/foundation/` - Foundation pages
- ✅ `/src/app/tournament/` - Tournament pages
- ✅ `/src/app/highlights/` - Highlights (will rebuild for new schema)

### Components Deleted (Profile-Related)

- ✅ `/src/components/profile/` - Old profile components
- ✅ `/src/components/highlights/` - Old highlight components
- ✅ `/src/components/TournamentOnboarding.tsx` - Tournament component

### Utility Functions Deleted (Schema Incompatible)

- ✅ `/src/lib/profile/utils.ts` - Old single-profile utility functions
- ✅ `/src/lib/highlights/utils.ts` - Highlight functions using old schema (user_id vs profile_id)

### API Routes Removed (Old Schema)

- ✅ `/src/app/api/user-sports/` - API routes referencing non-existent user_sports table
- ✅ `/src/app/api/user-sports-get/` - GET endpoint for user_sports table

### Navigation & Middleware Updated

- ✅ Updated `NavBar.tsx` to remove deleted page references
- ✅ Updated `middleware.ts` to remove protection for deleted routes
- ✅ Fixed all TypeScript compilation errors

### Dashboard Updated

- ✅ Removed references to deleted profile/highlight components
- ✅ Updated profile edit/view buttons to show schema migration messages
- ✅ Maintained core dashboard functionality

### Auth Context & Types Updated

- ✅ Removed `user_sports` field from UserProfile interface
- ✅ Cleaned auth context to not fetch user_sports data
- ✅ Updated TypeScript types to match new schema structure
- ✅ Generated fresh types from remote database using `npx supabase gen types typescript --linked`
- ✅ Fixed INSERT policy for profiles table to allow auth trigger
- ✅ Verified all RLS policies are correctly applied

### Build Status

- ✅ **Successful compilation** - All deletions completed without breaking existing functionality
- ✅ **TypeScript validated** - No compilation errors, types match remote schema
- ✅ **Auth system intact** - Registration and login flows preserved
- ✅ **Database trigger working** - Profile creation trigger compatible with new schema
- ✅ **Schema alignment** - Local types now match remote database exactly

## Result

The codebase is now clean and ready for implementing the new modular profile system. Old profile-related pages have been removed while preserving:

- Dashboard (main user interface)
- Authentication system (fully compatible)
- PLAYScanner functionality
- API routes structure

## Signup Issues Resolution (2025-01-18)

✅ **RESOLVED** - Signup flow now fully functional and production-ready.

### Final Root Cause Analysis

The persistent 406/500 errors were caused by:

- **Missing Auth Trigger**: `handle_new_user()` function existed but wasn't attached to `auth.users` table
- **Foreign Key Timing Issue**: Auth trigger execution had timing conflicts with foreign key constraints
- **RLS Policy Conflicts**: Missing policies for anonymous username availability checking

### Final Solutions Applied

1. **Added Missing Auth Trigger**: Created `on_auth_user_created` trigger with `AFTER INSERT ON auth.users`
2. **Enhanced Trigger Function**: Added `SECURITY DEFINER`, `ON CONFLICT DO NOTHING`, and proper exception handling
3. **Production RLS Policies**: Comprehensive policies for secure username checking and profile creation
4. **Cleaned up user_sports references** from entire codebase
5. **Generated fresh TypeScript types** from remote database

### Production-Ready Signup Flow

- ✅ Username availability checking works (no 406 errors)
- ✅ User signup creates auth.users record (no 500 errors)
- ✅ Auth trigger automatically creates profile in profiles table
- ✅ User redirected to email verification → dashboard
- ✅ RLS properly secures all profile operations
- ✅ Error handling prevents signup failures

### Database Security

- **RLS Enabled** with production policies:
  - Users can view/update own profiles
  - Anonymous users can check username availability
  - Auth trigger can create profiles during signup
  - Public profile viewing enabled for discovery
- **Auth Trigger** with `SECURITY DEFINER` and robust error handling
- **Foreign Key Constraints** properly handle auth user creation timing

**Status**: Signup system is production-ready and secure.

**💡 Key Design Decisions:**

- **Sport-specific tables** instead of generic categories (better UX, easier to iterate)
- **Realistic experience levels** that people actually identify with
- **Modular preferences** system for future services
- **Preserved PLAYScanner data** and revenue-generating analytics
- **Commons package architecture** for true code reuse across all PLAYBACK applications

## Important Notes

- Usually I already have a running session so don't run `npm run dev`
- **NEVER create files** unless absolutely necessary - always prefer editing existing files
- **Use @playback/commons** for all shared UI components and utilities
- **Use @/ only** for app-specific code (Sanity, local utilities)
- **Server-side imports** must be direct imports, never from barrel exports
- When working with commons, changes are immediately available to all apps (no rebuild required during development)
- Production builds automatically bundle commons code into the app
