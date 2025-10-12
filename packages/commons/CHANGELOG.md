# Changelog

All notable changes to the @playback/commons package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-11

### Added

- Initial release of @playback/commons package
- **UI Components** (37 components from shadcn/ui):
  - Form controls: Button, Input, Label, Checkbox, Radio, Select, Slider, Switch, Textarea
  - Layout: Card, Dialog, Popover, Sheet, Tabs, Collapsible
  - Navigation: Command, Navigation Menu
  - Feedback: Loading Spinner, Toast
  - Data Display: Avatar, Badge, Calendar, Table
  - Advanced: Date Picker, Infinite Moving Cards, Hero Highlight, Flip Words, Animated Tooltip, Canvas Reveal Effect, Card Holder Animation
- **Feature Components**:
  - Avatar Upload with image processing and Supabase Storage integration
  - Video Upload with thumbnail generation
  - Stats Form and Dashboard for performance tracking
  - Analytics components for data visualization
- **Supabase Utilities**:
  - Client-side and server-side Supabase client factories
  - TypeScript types generated from database schema
  - Authentication utilities (client and server)
- **Library Functions**:
  - Avatar utilities: upload, delete, process images, generate placeholders
  - Video utilities: upload, validation, thumbnail generation, metadata extraction
  - Stats utilities: CRUD operations, predefined categories for Football, Basketball, Tennis
  - Utility helpers: `cn()` for Tailwind class merging, date formatting
- **Hooks**:
  - Common React hooks for shared functionality

### Technical Details

- Built with TypeScript for type safety
- Designed for Next.js 14+ with App Router
- Integrated with Supabase for backend services
- Uses Radix UI primitives for accessibility
- Styled with Tailwind CSS
- Animations powered by Framer Motion
- 3D components with React Three Fiber and Three.js

### Dependencies

- React 18+
- Next.js 14+
- Supabase SSR and JS client
- Radix UI components
- Framer Motion for animations
- React Three Fiber for 3D components
- Lucide React for icons

### Breaking Changes

- N/A (Initial release)

### Migration Guide

- If migrating from duplicate components in PLAYBACK:
  1. Update imports from `@/components/ui/*` to `@playback/commons/components/ui/*`
  2. Update imports from `@/lib/supabase/*` to `@playback/commons/lib/supabase/*`
  3. Remove duplicate files from your project
  4. Ensure Tailwind config includes commons path: `'../packages/commons/src/**/*.{js,ts,jsx,tsx,mdx}'`

---

## Version Guidelines

### Semantic Versioning

- **MAJOR** (x.0.0): Breaking changes that require code updates
- **MINOR** (1.x.0): New features, backward compatible
- **PATCH** (1.0.x): Bug fixes, backward compatible

### When to Bump Versions

- **MAJOR**: Component API changes, removed features, breaking TypeScript changes
- **MINOR**: New components, new features, new utility functions
- **PATCH**: Bug fixes, documentation updates, internal improvements

### Example Version History

```
1.0.0 - Initial release
1.0.1 - Fix avatar upload bug
1.1.0 - Add new DateRangePicker component
2.0.0 - Breaking: Change Button component API
```

## Future Considerations

### Planned Features (Future Releases)

- [ ] Storybook documentation
- [ ] Component testing suite
- [ ] Performance optimization for 3D components
- [ ] Additional sports-specific utilities
- [ ] Theme customization system
- [ ] Internationalization support

### Known Issues

- None currently reported

---

## How to Use This Changelog

When making changes to commons:

1. **Update this file** with your changes under "Unreleased" section
2. **Follow the format**: Added, Changed, Deprecated, Removed, Fixed, Security
3. **When releasing**: Move "Unreleased" to a new version section with date
4. **Update package.json**: Bump version number accordingly
5. **Git tag**: Create a tag for the release (e.g., `commons-v1.0.0`)

### Example Entry Format

```markdown
## [Unreleased]

### Added

- New SportSelector component for multi-sport selection

### Changed

- Improved avatar upload performance by 30%

### Fixed

- DatePicker now handles timezone correctly
```
