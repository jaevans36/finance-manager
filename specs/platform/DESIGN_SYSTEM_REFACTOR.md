# Design System Refactor Guide
## Polaris-Inspired UI Overhaul (Principles, Not Visuals)

This document defines the **non-negotiable design and refactor rules** for this application.

It must be followed by:
- Human contributors
- AI coding agents (Copilot, Claude Opus 4.6, etc.)

This is a **design-system–led refactor**, not a feature redesign.

---

## 1. Purpose & Scope

The application already exists and is functionally complete.

The goal of this refactor is to:
- Improve visual quality
- Enforce consistency
- Reduce design drift
- Create a calm, professional, and intentional UI

### Out of Scope
- No new features
- No business logic changes
- No UX flow changes (unless strictly visual)

---

## 2. Design Philosophy

### Reference System
- **Shopify Polaris** is used as a reference for:
  - Hierarchy
  - Spacing discipline
  - Component semantics
  - Accessibility defaults

### Explicitly Not Allowed
- Copying Polaris visuals
- Replicating Polaris layouts
- Matching Polaris typography or colour usage

The end result must feel **distinct and original**.

---

## 3. Colour System (Single Source of Truth)

### Base Palette (Use Exactly These Values)

#### Neutral / Structural
- Grey 700: `#898989`
- Grey 300: `#D9D9D9`

#### Semantic / Accent
- Critical / Destructive: `#FF4D4D`
- Positive / Success: `#4DFFBC`

### Colour Rules
- Neutrals dominate the UI
- Accent colours are used **only for meaning**
- Accent colours must never be used for large decorative backgrounds
- No additional colours may be introduced without updating this document

---

## 4. Theme Tokens (Required)

All visual styling must come from theme tokens.

### Required Tokens
- Colours
- Typography scale
- Spacing scale (choose once: 4px or 8px)
- Border radius (maximum of 2 values)
- Elevation / shadow rules (minimal or none)

### Hard Rules
- No hardcoded values in components
- No inline styles unless unavoidable
- No ad-hoc overrides

---

## 5. Component System Rules

### Base Components (Must Be Defined Once)
- Button
- Input
- Select
- Checkbox / Toggle
- Card / Panel
- Modal

### Buttons
- One primary style
- One secondary style
- One destructive style
- No visual variants beyond these

### Forms
- Consistent label placement
- Consistent input sizing
- Unified helper and error styling
- Clear focus states

### Cards / Panels
- Consistent padding
- Consistent border radius
- Minimal or no elevation
- Prefer whitespace over borders

---

## 6. Layout & Spacing

### Layout Principles
- Clear hierarchy:
  - Page title
  - Section title
  - Content
- Constrained content width for readability
- Avoid centering large content blocks unnecessarily

### Spacing Rules
- Use a single spacing scale everywhere
- No arbitrary margins or padding
- Spacing communicates hierarchy

---

## 7. Custom Components & Widgets (Non-Exempt)

Custom components are **first-class citizens** of the design system.

They must obey the same rules as standard components.

### Applies To
- Calendars
- Charts
- Graphs
- Dashboards
- Custom widgets

---

## 8. Calendar Design Rules

- Neutral colours for structure (grid, dividers, labels)
- Semantic colours used **only for meaning**
  - Success / positive → `#4DFFBC`
  - Critical / destructive → `#FF4D4D`
- No decorative backgrounds
- Clear focus, hover, and selected states
- Typography must match global theme
- Keyboard navigable

---

## 9. Charts & Data Visualisation Rules

### Visual Rules
- Neutral tones for:
  - Axes
  - Gridlines
  - Labels
- Accent colours used sparingly for emphasis
- No more than one accent colour per chart unless strictly necessary

### Typography
- Chart labels and legends must use global typography tokens
- Font sizes must match hierarchy rules

### Interaction & Accessibility
- Charts must not rely on colour alone to convey meaning
- Use labels, legends, or annotations
- Ensure focus visibility where interaction exists

---

## 10. Accessibility (Required)

All UI must meet **WCAG AA** standards.

### Mandatory
- Sufficient colour contrast
- Visible focus states
- Keyboard navigability
- No colour-only indicators

---

## 11. Refactor Order (Must Be Followed)

1. Audit the existing theme and component library
2. Redefine theme tokens using the approved palette
3. Refactor base components
4. Refactor composite components
5. Apply changes to screens

No screen-level styling before base components are complete.

---

## 12. Decision-Making Rules

- Prefer consistency over creativity
- Prefer boring and professional over expressive
- Remove one-off styling
- If a decision is ambiguous, choose the **simpler and more consistent** option

If a component cannot follow the design system exactly:
- Explain why
- Choose the closest consistent alternative

---

## 13. Enforcement Rule (Critical)

> All UI must be visually explainable using existing theme tokens.

If it cannot be explained using tokens, it does not belong in the UI.

---

## 14. AI Agent Instruction

When this document is referenced:

- Follow it **exactly**
- Do not introduce new visual variants
- Do not invent new component styles
- Do not bypass the design system

Any deviation must be explicitly justified.
