# Design System & Shared UI Package — Developer Guide

> **Current System**: Tailwind CSS + shadcn/ui with CSS variable tokens.
> All new components use this approach. A few legacy styled-components remain
> and are supported via `StyledThemeProvider` — see [Legacy Support](#legacy-support).

**Last Updated**: February 28, 2026
**Package**: `@finance-manager/ui`
**Location**: `packages/ui/`

## 📚 Table of Contents

1. [Overview](#overview)
2. [Fonts & Typography](#fonts--typography)
3. [Colour Tokens](#colour-tokens)
4. [Spacing & Layout](#spacing--layout)
5. [Using shadcn/ui Components](#using-shadcnui-components)
6. [Creating New Components](#creating-new-components)
7. [Accessibility](#accessibility)
8. [Legacy Support](#legacy-support)
9. [Best Practices](#best-practices)

---

## Overview

The design system provides a **single source of truth** for visual consistency
across all Finance Manager applications. It is built on:

| Layer | Technology | Location |
|-------|-----------|----------|
| **Fonts** | DM Sans (display) + IBM Plex Sans (body) | Google Fonts in `index.html` |
| **Colour tokens** | CSS custom properties (HSL) | `apps/web/src/styles/theme.css` |
| **Utility framework** | Tailwind CSS 3 with shared preset | `packages/ui/tailwind.preset.ts` |
| **Component library** | shadcn/ui (Radix + Tailwind) | `apps/web/src/components/ui/` |
| **Dark mode** | `class` strategy (`.dark` on `<html>`) | `ThemeContext.tsx` |
| **Legacy styled-components** | `StyledThemeProvider` (retained for unmigrated code) | `packages/ui/` |

---

## Fonts & Typography

### Typefaces

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Display** | DM Sans | 600, 700 | Page titles, section headings, stat values |
| **Body** | IBM Plex Sans | 400, 500, 600 | Body text, labels, inputs, buttons |

Fonts are loaded via Google Fonts in `apps/web/index.html` with `preconnect` hints.

### Typography Scale (Tailwind classes)

| Class | Size | Weight | Use |
|-------|------|--------|-----|
| `text-display-lg` | 32px / 2rem | 700 | Page titles, stat hero numbers |
| `text-display` | 24px / 1.5rem | 600 | Section headings |
| `text-display-sm` | 20px / 1.25rem | 600 | Card group headings |
| `text-heading` | 18px / 1.125rem | 600 | Sub-section headings |
| `text-heading-sm` | 16px / 1rem | 600 | Card titles |
| `text-body-lg` | 16px / 1rem | 400 | Prominent body text |
| `text-body` | 14px / 0.875rem | 400 | Default body text |
| `text-body-sm` | 13px / 0.8125rem | 400 | Secondary / compact text |
| `text-caption` | 12px / 0.75rem | 400 | Timestamps, helper text |
| `text-badge` | 11px / 0.6875rem | 500 | Badges, labels |

### Font Family Classes

```html
<h1 class="font-display text-display-lg">Page Title</h1>
<p class="font-sans text-body">Body paragraph</p>
```

- `font-display` → DM Sans, then IBM Plex Sans fallback
- `font-sans` → IBM Plex Sans with system fallbacks

### Reusable Components

```tsx
import { PageTitle, SectionTitle } from '../components/ui/page-title';

<PageTitle>Dashboard</PageTitle>
<SectionTitle>Quick Actions</SectionTitle>
<SectionTitle as="h3" className="text-heading-sm">Card Title</SectionTitle>
```
      <Button variant="primary">Click Me</Button>
    </Card>
  );
}
```

---

## Colour Tokens

All colours are defined as HSL CSS custom properties in `apps/web/src/styles/theme.css`
and mapped to Tailwind utilities via `packages/ui/tailwind.preset.ts`.

### Semantic Colours

| Token | Light | Dark | Tailwind classes |
|-------|-------|------|-----------------|
| `background` | #FFFFFF | #1A1A1A | `bg-background` `text-foreground` |
| `card` | #FFFFFF | #222222 | `bg-card` `text-card-foreground` |
| `primary` | #1A1A1A | #E8E8E8 | `bg-primary` `text-primary-foreground` |
| `secondary` | #F7F7F7 | #2D2D2D | `bg-secondary` `text-secondary-foreground` |
| `muted` | #EFEFEF | #2D2D2D | `bg-muted` `text-muted-foreground` |
| `accent` | #F5F5F5 | #2A2A2A | `bg-accent` `text-accent-foreground` |
| `destructive` | #FF4D4D | #FF4D4D | `bg-destructive` `text-destructive` |
| `success` | #10B981 | #10B981 | `bg-success` `text-success` |
| `warning` | #F59E0B | #FBBF24 | `bg-warning` `text-warning` |
| **`brand`** | **#21B8A4** | **#26CCBA** | `bg-brand` `text-brand` |

### Brand Colour

The **teal brand colour** provides visual identity across the application:

```html
<!-- Background accent -->
<div class="bg-brand text-brand-foreground">Branded element</div>

<!-- Muted surface (e.g. "in progress" badges) -->
<span class="bg-brand-muted text-brand-muted-foreground">In Progress</span>

<!-- Text accent -->
<h2 class="text-brand">Currently Working On</h2>
```

### Status Colour Usage

| Semantic | Use for | Token |
|----------|---------|-------|
| `destructive` | Errors, critical priority, delete actions, blocked status | `text-destructive`, `bg-destructive/10` |
| `warning` | Amber warnings, high priority, medium energy, WIP limits | `text-warning`, `bg-warning/5` |
| `success` | Completed, positive trends, low energy (relaxed) | `text-success`, `bg-success/10` |
| `brand` | In-progress, medium classification, schedule quadrant | `text-brand`, `bg-brand-muted` |
| `muted` | Not started, low priority, eliminate quadrant | `text-muted-foreground`, `bg-muted` |

> **Important**: `warning` ≠ `destructive`. Warning is amber (#F59E0B), destructive is red (#FF4D4D).

### Opacity Patterns for Surfaces

```html
<!-- Light background surface -->
<div class="bg-destructive/5 border border-destructive/20 text-destructive">Error</div>
<div class="bg-warning/5 border border-warning/30 text-warning-foreground">Warning</div>
<div class="bg-success/10 text-success-foreground">Success badge</div>
<div class="bg-brand-muted text-brand-muted-foreground">In Progress badge</div>
```

---

## Spacing & Layout

### Spacing Scale

Use Tailwind's default 4px-based scale. **Never use arbitrary values** like `p-[30px]`.

| Tailwind | Value | Common use |
|----------|-------|-----------|
| `p-1` | 4px | Tight internal spacing |
| `p-2` | 8px | Compact padding |
| `p-3` | 12px | Form field gaps |
| `p-4` | 16px | Standard padding |
| `p-5` | 20px | Comfortable padding |
| `p-6` | 24px | Card body padding |
| `p-8` | 32px | Section header margin |
| `p-10` | 40px | Large section gaps |

### Border Radius

| Tailwind | Value | Use |
|----------|-------|-----|
| `rounded-sm` | 4px | Small elements (badges, chips) |
| `rounded-md` | 6px | Inputs, buttons |
| `rounded-lg` | 12px | Cards, modals, dialogs |

### Shadow

| Class | Use |
|-------|-----|
| `shadow-elevated` | `0 4px 16px rgba(0,0,0,0.08)` — hover states only |

### Container Pattern

```tsx
<div className="mx-auto w-4/5 max-w-6xl px-5 py-5 md:px-2.5 md:w-[95%]">
  {/* Page content */}
</div>
```

Or use the `PageLayout` component for consistency.

---

## Using shadcn/ui Components

shadcn/ui components live in `apps/web/src/components/ui/` and are built on
Radix UI primitives + Tailwind CSS. They consume the CSS variable tokens
automatically.

### Available Components

| Component | File | Radix-based |
|-----------|------|-------------|
| Alert | `alert.tsx` | No |
| Badge | `badge.tsx` | No |
| Button | `button.tsx` | No |
| Card | `card.tsx` | No |
| Checkbox | `checkbox.tsx` | Yes |
| Dialog | `dialog.tsx` | Yes |
| Dropdown Menu | `dropdown-menu.tsx` | Yes |
| Input | `input.tsx` | No |
| Label | `label.tsx` | Yes |
| Modal | `Modal.tsx` | No (custom) |
| PageTitle / SectionTitle | `page-title.tsx` | No |
| Select | `select.tsx` | Yes |
| Separator | `separator.tsx` | Yes |
| Skeleton | `Skeleton.tsx` | No |
| Sonner (toast) | `sonner.tsx` | No |
| Switch | `switch.tsx` | Yes |
| Tabs | `tabs.tsx` | Yes |
| Textarea | `textarea.tsx` | No |
| Tooltip | `tooltip.tsx` | Yes |

### Usage Examples

```tsx
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { PageTitle, SectionTitle } from '../components/ui/page-title';

// Button variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>

// Card
<Card>
  <CardHeader>
    <CardTitle>Section</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

// Typography
<PageTitle>Dashboard</PageTitle>
<SectionTitle>Quick Actions</SectionTitle>
```

### Utility Function: `cn()`

All components use `cn()` from `lib/utils.ts` (clsx + tailwind-merge):

```tsx
import { cn } from '../../lib/utils';

<div className={cn('p-4 rounded-lg', isActive && 'bg-brand/5 border-brand/30')} />
```

---

## Creating New Components

### When to create in your app

- Used only in this specific app
- Contains business logic
- Rapid prototyping

### When to add to shared package

- Used in 2+ applications
- Generic, reusable pattern (no business logic)
- Represents a design system primitive

### Component Template (Tailwind + shadcn)

```tsx
import { cn } from '../../lib/utils';

interface MyComponentProps {
  title: string;
  variant?: 'default' | 'highlighted';
  className?: string;
}

export const MyComponent = ({
  title,
  variant = 'default',
  className,
}: MyComponentProps) => (
  <div
    className={cn(
      'rounded-lg border border-border p-4',
      variant === 'highlighted' && 'bg-brand/5 border-brand/30',
      className,
    )}
  >
    <h3 className="font-display text-heading-sm">{title}</h3>
  </div>
);
```

**Key rules**:
- Always accept `className` prop for composition
- Use `cn()` for conditional classes
- Use semantic tokens, never raw palette colours
- Use the typography scale, never arbitrary sizes

---

## Accessibility

### Skip to Content

A skip-to-content link is rendered before the header in `App.tsx`. It becomes
visible on keyboard focus.

### Landmarks

- `<main id="main-content">` wraps all page routes
- `<header>` wraps the app header and page-level headers

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

This is declared in `global.css` and applies globally.

### Contrast

All semantic colour tokens pass WCAG AA contrast requirements:
- `text-foreground` on `bg-background` — 14.5:1 (light), 12.8:1 (dark)
- `text-destructive` on white — 4.6:1
- `text-success` (#10B981) on white — 4.5:1
- `text-brand` (#21B8A4) on white — 4.2:1

---

## Legacy Support

The `StyledThemeProvider` from `packages/ui` still wraps the app for any
remaining styled-components. `GlobalStyles` is **no longer rendered** — all
base styles come from Tailwind's `global.css`.

If you encounter a styled-component using `${({ theme }) => theme.colors.*}`,
it will still work because `StyledThemeProvider` injects the theme object. To
migrate it:

```tsx
// BEFORE (styled-components)
const Box = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: ${spacing.lg};
  color: ${({ theme }) => theme.colors.text};
`;

// AFTER (Tailwind)
<div className="bg-card p-4 text-card-foreground" />
```

---

## Best Practices

### ✅ DO

1. **Use semantic colour tokens** — `text-destructive`, `bg-brand-muted`, `border-warning/30`
2. **Use the typography scale** — `text-display-lg`, `text-body-sm`, `text-caption`
3. **Use `font-display`** for headings — DM Sans provides visual hierarchy
4. **Use `cn()` for conditional classes** — never string concatenation
5. **Use Tailwind's spacing scale** — `p-4`, `gap-6`, `mb-8`
6. **Accept `className` prop** in every component
7. **Test in light and dark mode**

### ❌ DON'T

1. **Don't use raw palette colours** — `text-red-600` → `text-destructive`
2. **Don't use arbitrary values** — `text-[32px]` → `text-display-lg`
3. **Don't hardcode hex colours** — `#898989` → `hsl(var(--muted-foreground))`
4. **Don't import `GlobalStyles`** — it's no longer rendered
5. **Don't use `React.FC`** — use direct prop typing
6. **Don't mix `warning` and `destructive`** — they are distinct: amber vs red

---

## Quick Reference

### Typography

| Element | Classes |
|---------|---------|
| Page title | `font-display text-display-lg tracking-tight` |
| Section heading | `font-display text-display-sm` |
| Card title | `font-display text-heading-sm` |
| Body text | `text-body` (14px default) |
| Small text | `text-body-sm` (13px) |
| Caption/helper | `text-caption` (12px) |
| Badge text | `text-badge` (11px) |

### Colour Usage Cheatsheet

| Context | Classes |
|---------|---------|
| Error / Critical | `text-destructive`, `bg-destructive/5`, `border-destructive/20` |
| Warning / High | `text-warning`, `bg-warning/5`, `border-warning/30` |
| Success / Complete | `text-success`, `bg-success/10` |
| In Progress / Brand | `text-brand`, `bg-brand-muted`, `text-brand-muted-foreground` |
| Neutral / Muted | `text-muted-foreground`, `bg-muted` |

---

## Support & Resources

- **Tailwind Preset**: `packages/ui/tailwind.preset.ts`
- **CSS Tokens**: `apps/web/src/styles/theme.css`
- **Component Library**: `apps/web/src/components/ui/`
- **Live Examples**: `/design-system` route in the app
- **Icon Guide**: `docs/guides/ICON_GUIDE.md`
- **Theme Management**: `docs/guides/THEME_MANAGEMENT.md`

---

**Last Updated**: February 28, 2026
**Maintained By**: Finance Manager Team
