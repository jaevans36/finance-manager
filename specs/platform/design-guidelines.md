# Platform Design Guidelines & Standards

**Created**: 2026-01-07  
**Status**: Planned (Phase 7)  
**Scope**: Platform-wide design system

## Overview

The Life Manager design system ensures visual consistency across all applications through standardized colours, typography, spacing, components, and interaction patterns.

## Features

**Complete specification available in**: `applications/todo/enhancements.md` → Phase 7 - Design Guidelines & Standards

This document provides a high-level overview. See the full spec for:
- Comprehensive design tokens
- Component patterns with examples
- Accessibility standards (WCAG 2.1 AA)
- Animation guidelines
- Responsive breakpoints
- Implementation details

## Design System Components

### Colour Palette

**Primary**: Green (#4CAF50) - To Do application  
**Secondary**: Blue (#2196F3) - Finance application  
**Accent**: Orange (#FF9800) - Admin panel  

**Semantic Colours**:
- Success: #4CAF50
- Error: #F44336
- Warning: #FF9800
- Info: #2196F3

**Neutral Palette**: 9 shades of grey (50-900)

### Typography Scale

**Font Family**: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)

**Sizes**:
- Heading1: 32px, weight 700
- Heading2: 24px, weight 600
- Heading3: 20px, weight 600
- Text: 14px, weight 400
- TextSmall: 12px, weight 400

**Line Heights**: Tight (1.2), Normal (1.5), Relaxed (1.75)

### Spacing System

**Base Unit**: 4px scale
- xs: 4px
- sm: 8px
- md: 12px
- base: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### Border Radius

- sm: 4px (small elements)
- md: 6px (buttons, inputs)
- lg: 8px (cards)
- xl: 12px (modals)
- full: 9999px (avatars, pills)

### Shadows

- sm: Subtle (form inputs)
- md: Standard (cards at rest)
- lg: Elevated (cards on hover)
- xl: Modal overlay

### Icons

**Style**: Flat design with solid fills  
**Library**: Lucide React (primary source)  
**Sizes**: 16px (small), 24px (default), 32px (large), 48px+ (extra large)  
**Colour**: Single colour, inherit from theme  

**Custom Icon Requirements**:
- Square viewBox (0 0 24 24)
- 2px stroke width maximum
- No gradients or complex effects
- Optimized with SVGO

### Component Patterns

**Loading States**: Skeleton screens with pulse animation  
**Empty States**: Icon + message + CTA, centred  
**Error States**: Red accent, icon, message, retry button  
**Success Feedback**: Green checkmark, toast (4s duration)  
**Form Validation**: Inline errors, red border, icon  
**Modal Pattern**: Backdrop blur, centred card, close button  
**Card Hover**: 4px lift, shadow increase, 300ms transition

### Responsive Breakpoints

- **Mobile**: 0-639px
- **Tablet**: 640-1023px
- **Desktop**: 1024-1439px
- **Wide**: 1440px+

### Animation Guidelines

**Duration**:
- Fast: 150ms (micro-interactions)
- Normal: 300ms (transitions)
- Slow: 500ms (maximum)

**Easing**:
- Default: `cubic-bezier(0.4, 0, 0.2, 1)`
- Ease-in: `cubic-bezier(0.4, 0, 1, 1)`
- Ease-out: `cubic-bezier(0, 0, 0.2, 1)`

**Respect `prefers-reduced-motion`**: Disable animations for users who request it

### Accessibility Standards

**WCAG 2.1 AA Compliance**:
- 4.5:1 contrast for normal text
- 3:1 contrast for large text (18pt+)
- 44x44px minimum touch targets
- Visible focus indicators
- Semantic HTML (headings, landmarks)
- ARIA labels for icon-only buttons
- Form labels always visible

### Application Colour System

Each application has a distinct colour palette:

```typescript
const appColors = {
  todo: {
    primary: '#4CAF50',
    secondary: '#81C784',
    accent: '#2E7D32'
  },
  finance: {
    primary: '#2196F3',
    secondary: '#64B5F6',
    accent: '#1565C0'
  },
  admin: {
    primary: '#FF9800',
    secondary: '#FFB74D',
    accent: '#E65100'
  }
};
```

## File Organization

```
apps/web/src/
  styles/
    tokens.ts       # Design tokens (colours, spacing, typography)
    theme.ts        # Styled-components theme
    global.ts       # Global styles
  components/
    ui/             # Atomic design system components
      Button.tsx
      Card.tsx
      Input.tsx
      Text.tsx
      Heading.tsx
      Badge.tsx
      Avatar.tsx
      ...
    feature/        # Feature-specific components
    layouts/        # Page layout components
  assets/
    icons/          # Custom SVG icons
    images/         # Static images
```

## Implementation Requirements

**Tooling**:
- ✅ Styled Components (already in use)
- 📋 Storybook (recommended for component documentation)
- 📋 Design tokens JSON export for Figma/Sketch
- 📋 Visual regression testing (Percy/Chromatic)
- 📋 ESLint rules enforce token usage (no hardcoded colours)

**Documentation Structure**:

```
docs/design-system/
  README.md
  colour-palette.md
  typography.md
  spacing-layout.md
  iconography.md
  components/
    buttons.md
    cards.md
    forms.md
    navigation.md
    data-display.md
  patterns/
    authentication-flows.md
    data-loading-states.md
    error-handling.md
    responsive-design.md
  accessibility.md
  animation-motion.md
```

## Current Implementation Status

### Already Implemented

✅ Colour system (primary green, semantic colours)  
✅ Typography components (Heading1-6, Text, TextSmall, TextSecondary)  
✅ Spacing tokens (consistent padding/margins)  
✅ Card component with hover states  
✅ Button variants (primary, outline, text, danger)  
✅ Input components (InputField, Select, Textarea)  
✅ Badge component (SmallBadge with colour variants)  
✅ Icon system (Lucide React)  
✅ Responsive breakpoints in styled-components  
✅ Dark mode theme structure (needs implementation)

### Needs Documentation

📋 Formalize design tokens in `tokens.ts`  
📋 Create component usage guidelines  
📋 Document accessibility patterns  
📋 Create Figma/design tool integration  
📋 Setup visual regression testing  
📋 Write animation standards  

### Needs Implementation

🚧 Dark mode theme  
🚧 Storybook for component library  
🚧 Additional button sizes/variants  
🚧 Toast notification system  
🚧 Modal/dialog system  
🚧 Tooltip component  
🚧 Dropdown menu component  
🚧 Table component with sorting/filtering  

## Estimated Effort

**1-2 weeks**
- Week 1: Document existing patterns + create tokens + write guidelines
- Week 2: Create examples + setup tooling (Storybook, linting) + review

## Related Specifications

- **Application Hub**: See `platform/application-hub.md` for hub tile styling
- **Authentication**: See `platform/authentication.md` for avatar component standards
- **To Do Application**: See `applications/todo/` for current component implementations

---

**📖 Full Specification**: `applications/todo/enhancements.md` → Phase 7
