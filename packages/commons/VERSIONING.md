# Versioning Guide for @playback/commons

## Current Version: 1.0.0

This document explains how to manage versions for the @playback/commons package.

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─── Bug fixes (backward compatible)
  │     └───────── New features (backward compatible)
  └─────────────── Breaking changes (not backward compatible)
```

### Examples

- `1.0.0` → `1.0.1` = Bug fix (e.g., fix avatar upload error)
- `1.0.0` → `1.1.0` = New feature (e.g., add DateRangePicker component)
- `1.0.0` → `2.0.0` = Breaking change (e.g., change Button API)

## When to Bump Versions

### MAJOR Version (x.0.0) - Breaking Changes

Bump MAJOR when you make incompatible API changes:

- ❌ Remove a component or utility function
- ❌ Change component props (rename, remove, or change type)
- ❌ Change function signatures
- ❌ Change export paths
- ❌ Require new peer dependencies

**Examples:**

```typescript
// BREAKING: Removed `size` prop from Button
<Button size="lg">Click</Button> // This will break

// BREAKING: Renamed function
uploadAvatar() // Changed to uploadUserAvatar()

// BREAKING: Changed return type
getUser(): User // Changed to getUser(): Promise<User>
```

### MINOR Version (1.x.0) - New Features

Bump MINOR when you add functionality in a backward-compatible manner:

- ✅ Add new components
- ✅ Add new utility functions
- ✅ Add optional props to existing components
- ✅ Add new exports
- ✅ Deprecate (but don't remove) features

**Examples:**

```typescript
// NEW: Added optional `variant` prop to Button
<Button variant="outline">Click</Button> // New feature, old code still works

// NEW: Added new component
import { DateRangePicker } from '@playback/commons/components/ui'

// NEW: Added new utility
import { formatCurrency } from '@playback/commons/lib'
```

### PATCH Version (1.0.x) - Bug Fixes

Bump PATCH when you make backward-compatible bug fixes:

- 🐛 Fix bugs
- 🐛 Improve performance
- 📝 Update documentation
- 🎨 Refactor internal code
- ♿ Improve accessibility

**Examples:**

```typescript
// FIX: Avatar upload now handles large files correctly
// FIX: DatePicker timezone issue resolved
// FIX: Button hover state in dark mode
// DOCS: Added JSDoc comments to utility functions
```

## How to Release a New Version

### Step 1: Make Your Changes

Make your code changes in the commons package:

```bash
cd packages/commons
# ... make your changes ...
```

### Step 2: Update CHANGELOG.md

Add your changes under the "Unreleased" section:

```markdown
## [Unreleased]

### Added

- New `SportSelector` component for multi-sport selection
- `formatCurrency()` utility function

### Fixed

- Avatar upload now handles files >5MB correctly
```

### Step 3: Decide Version Number

Based on your changes:

- Breaking change? → MAJOR (e.g., `1.0.0` → `2.0.0`)
- New feature? → MINOR (e.g., `1.0.0` → `1.1.0`)
- Bug fix? → PATCH (e.g., `1.0.0` → `1.0.1`)

### Step 4: Update package.json

```json
{
  "name": "@playback/commons",
  "version": "1.1.0",  // ← Update this
  ...
}
```

### Step 5: Update CHANGELOG.md

Move "Unreleased" to a version section:

```markdown
## [Unreleased]

(empty - ready for next changes)

## [1.1.0] - 2025-01-15

### Added

- New `SportSelector` component for multi-sport selection
- `formatCurrency()` utility function

### Fixed

- Avatar upload now handles files >5MB correctly
```

### Step 6: Commit and Tag

```bash
# Commit the version bump
git add packages/commons/package.json packages/commons/CHANGELOG.md
git commit -m "chore(commons): release v1.1.0"

# Create a Git tag
git tag commons-v1.1.0 -m "Release @playback/commons v1.1.0"

# Push changes and tags
git push origin main
git push origin commons-v1.1.0
```

### Step 7: Update Consuming Apps (Optional)

If you want to pin PLAYBACK to a specific version:

```json
// PLAYBACK/package.json
{
  "dependencies": {
    "@playback/commons": "1.1.0" // Pin to specific version
  }
}
```

Then run:

```bash
cd PLAYBACK
npm install
```

## Version Pinning Strategies

### Always Latest (Default)

```json
{
  "dependencies": {
    "@playback/commons": "*" // Always use latest
  }
}
```

**Pros:** Get all updates automatically
**Cons:** Breaking changes might break your app

### Pin MAJOR Version (Recommended)

```json
{
  "dependencies": {
    "@playback/commons": "^1.0.0" // Allow 1.x.x (no breaking changes)
  }
}
```

**Pros:** Get features and bug fixes, no breaking changes
**Cons:** Must manually update for MAJOR versions

### Pin MINOR Version

```json
{
  "dependencies": {
    "@playback/commons": "~1.0.0" // Allow 1.0.x (only patches)
  }
}
```

**Pros:** Only get bug fixes
**Cons:** Miss new features

### Pin Exact Version

```json
{
  "dependencies": {
    "@playback/commons": "1.0.0" // Exact version only
  }
}
```

**Pros:** Complete stability
**Cons:** Must manually update for everything

## Quick Reference

### Making Changes Checklist

- [ ] Make code changes
- [ ] Update CHANGELOG.md (Unreleased section)
- [ ] Decide version number (MAJOR/MINOR/PATCH)
- [ ] Update package.json version
- [ ] Move CHANGELOG.md Unreleased → Version section
- [ ] Commit: `git commit -m "chore(commons): release vX.X.X"`
- [ ] Tag: `git tag commons-vX.X.X`
- [ ] Push: `git push && git push --tags`

### Common Scenarios

| Change Type              | Version | Example           |
| ------------------------ | ------- | ----------------- |
| New component            | MINOR   | `1.0.0` → `1.1.0` |
| New optional prop        | MINOR   | `1.0.0` → `1.1.0` |
| Remove component         | MAJOR   | `1.0.0` → `2.0.0` |
| Rename prop              | MAJOR   | `1.0.0` → `2.0.0` |
| Bug fix                  | PATCH   | `1.0.0` → `1.0.1` |
| Performance improvement  | PATCH   | `1.0.0` → `1.0.1` |
| New utility function     | MINOR   | `1.0.0` → `1.1.0` |
| Change utility signature | MAJOR   | `1.0.0` → `2.0.0` |
| Documentation update     | PATCH   | `1.0.0` → `1.0.1` |
| Add TypeScript types     | MINOR   | `1.0.0` → `1.1.0` |

## Git Tag Naming

Always prefix tags with `commons-v`:

```bash
git tag commons-v1.0.0
git tag commons-v1.1.0
git tag commons-v2.0.0
```

This keeps commons tags separate from PLAYBACK app tags.

## Viewing Version History

```bash
# See all commons versions
git tag -l "commons-v*"

# See what changed in a version
git show commons-v1.1.0

# Compare two versions
git diff commons-v1.0.0..commons-v1.1.0
```

## Questions?

- **Should I always bump the version?** Only for releases. Daily development doesn't need versions.
- **Do I need to publish to npm?** No! The monorepo setup means apps get commons automatically.
- **Can I have multiple versions running?** Yes, different apps can pin different versions.
- **What if I forget to bump?** Just bump it in the next commit.

## Resources

- [Semantic Versioning Spec](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Git Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
