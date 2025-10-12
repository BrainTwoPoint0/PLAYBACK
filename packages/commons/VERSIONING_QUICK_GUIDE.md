# Quick Versioning Guide

## Current Version: 1.0.0

## How to Version

```bash
# When you make changes to commons:

1. Edit CHANGELOG.md - add your changes
2. Bump package.json version
3. Commit: git commit -m "chore(commons): release v1.x.x"
4. Tag: git tag commons-v1.x.x
5. Push: git push && git push --tags
```

## Which Version Number?

| What Changed?                        | Bump  | Example       |
| ------------------------------------ | ----- | ------------- |
| 🐛 Bug fix                           | PATCH | 1.0.0 → 1.0.1 |
| ✨ New feature (backward compatible) | MINOR | 1.0.0 → 1.1.0 |
| 💥 Breaking change                   | MAJOR | 1.0.0 → 2.0.0 |

## Examples

### Bug Fix (PATCH: 1.0.0 → 1.0.1)

- Fixed avatar upload error
- Improved button hover state
- Updated documentation

### New Feature (MINOR: 1.0.0 → 1.1.0)

- Added DateRangePicker component
- Added optional `variant` prop to Button
- Added formatCurrency() utility

### Breaking Change (MAJOR: 1.0.0 → 2.0.0)

- Removed deprecated component
- Renamed Button `size` prop to `buttonSize`
- Changed uploadAvatar() signature

## Git Commands

```bash
# List all versions
git tag -l "commons-v*"

# See what changed in version
git show commons-v1.0.0

# Compare two versions
git diff commons-v1.0.0..commons-v1.1.0
```

## Pinning Versions in Apps

```json
// PLAYBACK/package.json
{
  "dependencies": {
    "@playback/commons": "*", // Always latest
    "@playback/commons": "^1.0.0", // Allow 1.x.x (Recommended)
    "@playback/commons": "~1.0.0", // Allow 1.0.x only
    "@playback/commons": "1.0.0" // Exact version
  }
}
```

## Full Documentation

See [VERSIONING.md](./VERSIONING.md) for complete guide.
