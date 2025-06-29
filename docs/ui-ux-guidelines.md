# PLAYBACK UI/UX Guidelines

_A living document for designers & developers building the PLAYBACK Profile Service_

---

## 1. Design Principles

1. **Athlete-Centric** – Every interaction should celebrate athletic achievement and aid talent discovery.
2. **Mobile-First** – Design for screens ≤375 px first, then enhance for tablet & desktop.
3. **Data Made Simple** – Surface complex stats through clear hierarchy, progressive disclosure & visuals.
4. **Dark by Default** – Dark theme is the primary experience; light theme is optional.
5. **Inclusive & Accessible** – Meet or exceed WCAG 2.1 AA; support diverse abilities & devices.
6. **Performance-Driven** – Target <3 s FCP on 4G; <100 KB critical CSS/JS; lazy-load everything else.

---

## 2. Design Tokens

| Token Category | Guideline                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Colors**     | Base palette follows Tailwind gray\[50-950] scale; brand primaries `pb-green` `#00FF88` & `pb-blue` `#2288FF`. Success = lime-400, Warning = amber-400, Error = red-500. Ensure 4.5:1 contrast on dark surfaces. |
| **Typography** | Headings use _Averta Std Semibold_; body uses _Averta Std Regular_. Scale: 32/24/20/18/16/14/12 px with 1.25 line-height. Numbers & stats use `tabular-nums`.                                                    |
| **Spacing**    | 4 pt baseline grid. Core sizes: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.                                                                                                                                            |
| **Radii**      | `sm:2px`, `md:4px`, `lg:8px`, `full` for avatars & pills.                                                                                                                                                        |
| **Elevation**  | Use Tailwind shadow-sm/md/lg. Never exceed `shadow-2xl` to keep focus on content.                                                                                                                                |
| **Motion**     | Default easing `cubic-bezier(0.4,0,0.2,1)`, duration 150 ms. Use spring physics for marquee sports elements via Framer Motion.                                                                                   |

---

## 3. Layout & Grid System

1. **12-Column Fluid Grid** @ ≥1280 px.
2. **8-Column** for tablets (≥768 px <1280 px).
3. **4-Column** stack for mobile (<768 px).
4. **Max-Width Containers**: `sm:540px`, `md:720px`, `lg:960px`, `xl:1140px`, `2xl:1320px`.
5. **Safe Areas**: Respect `env(safe-area-inset-*)` for notch devices.

---

## 4. Component Guidelines

### Core (shadcn/ui extensions)

| Component       | Purpose                             | Key Variants                                  |
| --------------- | ----------------------------------- | --------------------------------------------- |
| Button          | Primary call to actions             | primary / secondary / ghost / destructive     |
| Card            | Display athlete, video, stat blocks | profile / video-thumb / stat                  |
| Tooltip         | Compact info on charts & icons      | dark-elevated                                 |
| Input           | Form elements                       | text / number / select / radio-group / slider |
| Navigation Menu | Global & contextual nav             | bottom-tab (mobile) / sidebar (desktop)       |
| Chart           | Data viz wrapper (recharts)         | bar / line / radar / gauge                    |

### Sports-Specific

- **Athlete Card** – Avatar, name, sport badge, position, KPI snippet, CTA.
- **Video Player** – Custom controls (play, scrub, quality, tag), 16:9 aspect; overlay stats on hover.
- **Stat Chip** – Value + label badges; color-coded by performance thresholds.

_All new components must:_

1. Use Tailwind + variant-driven classes.
2. Export stories in Storybook.
3. Include ARIA roles & keyboard support.

---

## 5. Interaction & Motion

| Scenario        | Motion Guidance                                            |
| --------------- | ---------------------------------------------------------- |
| Page Transition | Fade-through 150 ms opacity + 20 px slide.                 |
| Card Hover      | 1.04 scale, shadow-md → lg.                                |
| Swipe Gestures  | 0.25× velocity threshold, elastic 0.55 when over-dragging. |
| Stats Load      | Count-up animation over 800 ms with easing-out.            |

Avoid motion that triggers vestibular disorders; respect `prefers-reduced-motion`.

---

## 6. Accessibility Checklist

- Color contrast ≥4.5:1 (text) & 3:1 (icons).
- All interactive elements ≥44 × 44 px on mobile.
- Provide visible focus ring (`outline-2 outline-offset-2 outline-pb-blue`).
- Support full keyboard navigation; logical tab order.
- Caption & transcript support for all videos.
- Announce live score updates with `aria-live="polite"`.

---

## 7. Dark Theme Optimization

1. Backgrounds: use `bg-gray-950` on root, `bg-gray-900` on surfaces.
2. Elevation via subtle shadows not increased brightness.
3. **Accent** colors saturate by +10% in dark mode for vibrancy.
4. Do **not** use pure white text; use `text-gray-100`.

---

## 8. Performance Guidelines

- Critical path CSS ≤50 KB compressed (Tailwind + custom).
- Use `next/image` with `priority` for hero visuals.
- Lazy load charts & video players via dynamic import.
- Prefer CSS over JS for simple animations.
- Target Lighthouse Performance score ≥85 on mobile.

---

## 9. Contribution Workflow

1. **Design** in Figma using shared library _Playback DS_.
2. **Prototype** micro-interactions in Framer.
3. **Handoff** tokens via `tailwind.config.ts` & documented variants.
4. **Develop** in a feature branch, add Storybook stories & unit tests.
5. **Review** with UI/UX Designer & QA for accessibility.
6. **Merge** after passing CI (lint, test, Lighthouse-CI).

---

## 10. Resources

- **Design File**: _Figma › Playback DS v1_ (link TBD)
- **Icon Library**: Lucide React + custom sports icons (src/public/assets/\*).
- **Motion Examples**: `/src/components/ui/*` (see `flip-words.tsx`, `canvas-reveal-effect.tsx`).
- **Accessibility Tools**: axe DevTools, Lighthouse, WAVE.

> _This document will evolve with product & user feedback. Submit pull requests for any updates._
