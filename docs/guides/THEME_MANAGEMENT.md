# Theme Management Guide

> **⚠️ MIGRATION NOTICE**: This guide documents the **styled-components ThemeProvider** approach.
> This is being superseded by **CSS variables + Tailwind `dark:` class strategy** (ADR-016, Phase 48-53).
> During migration, both systems co-exist. For new components, use Tailwind dark mode classes.
> See `specs/platform/frontend-modernisation.md` for the migration plan.

## Overview

The Finance Manager application now has a **centralized theme management system** that ensures consistent styling across all components. This guide explains how to use and maintain it.

## Architecture

```
src/
├── styles/
│   ├── theme.ts           # Theme configuration (colors, typography)
│   └── GlobalStyles.ts    # Global CSS with theme integration
├── contexts/
│   └── ThemeContext.tsx   # Theme provider and hook
└── components/
    └── ui/
        └── index.ts       # Reusable UI components
```

## How It Works

### 1. Theme Configuration (Single Source of Truth)

**File:** `src/styles/theme.ts`

This file defines ALL colors used in the application for both light and dark modes:

```typescript
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#007bff',           // Change this to update primary color everywhere
    primaryHover: '#0056b3',      // Hover state for primary
    background: '#ffffff',        // Page background
    text: '#212529',              // Main text color
    // ... 30+ other semantic color tokens
  }
};

export const darkTheme: Theme = {
  // Same structure with dark mode colors
};
```

**To change a color globally:**
1. Open `src/styles/theme.ts`
2. Update the color value (e.g., `primary: '#007bff'` → `primary: '#ff5722'`)
3. Save the file
4. The change applies EVERYWHERE automatically

### 2. UI Component Library

**File:** `src/components/ui/index.ts`

Provides pre-built, theme-aware components:

```typescript
// Import any component from the UI library
import { 
  Button,      // Themed buttons (5 variants, 3 sizes)
  Input,       // Themed form inputs
  Alert,       // Themed alerts (success, error, warning, info)
  Card,        // Themed cards
  Heading2,    // Themed typography
  // ... 30+ more components
} from './components/ui';
```

**All these components automatically use theme colors** - no need to specify colors manually!

## Usage Examples

### ❌ Wrong Way (Don't Do This)

```tsx
// DON'T hardcode colors
<button style={{ backgroundColor: '#007bff', color: 'white' }}>
  Click Me
</button>

// DON'T create custom styled components for basic elements
const MyButton = styled.button`
  background-color: #007bff;
  color: white;
`;
```

**Problems:**
- Colors hardcoded (won't work with dark mode)
- Inconsistent styling across app
- Difficult to update design system
- Have to maintain custom styles everywhere

### ✅ Right Way (Use UI Components)

```tsx
import { Button } from './components/ui';

// Just use the component - it's already themed!
<Button>Click Me</Button>

// Use variants and sizes as needed
<Button variant="primary" size="large">Primary</Button>
<Button variant="danger" size="small">Delete</Button>
```

**Benefits:**
- Automatic theme support (light/dark mode)
- Consistent styling everywhere
- Easy to maintain
- Type-safe props

## Common Patterns

### Building a Form

```tsx
import { 
  FormGroup, 
  Label, 
  Input, 
  ErrorText, 
  Button,
  Alert 
} from './components/ui';
import { XCircle } from 'lucide-react';

function MyForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <form>
      {error && (
        <Alert variant="error">
          <XCircle />
          <span>{error}</span>
        </Alert>
      )}

      <FormGroup>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hasError={!!error}
          placeholder="Enter your email"
        />
        {error && <ErrorText>{error}</ErrorText>}
      </FormGroup>

      <Button type="submit" fullWidth>
        Submit
      </Button>
    </form>
  );
}
```

### Creating a Card Layout

```tsx
import { Card, CardHeader, CardTitle, CardBody, Grid } from './components/ui';

function Dashboard() {
  return (
    <Grid columns={3} gap={20}>
      <Card>
        <CardHeader>
          <CardTitle>Total Balance</CardTitle>
        </CardHeader>
        <CardBody>
          <h2>$12,345.67</h2>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This Month</CardTitle>
        </CardHeader>
        <CardBody>
          <h2>$1,234.56</h2>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last Month</CardTitle>
        </CardHeader>
        <CardBody>
          <h2>$987.65</h2>
        </CardBody>
      </Card>
    </Grid>
  );
}
```

### Using Layout Components

```tsx
import { Flex, Container, PageContainer } from './components/ui';

function MyPage() {
  return (
    <PageContainer>
      <Container>
        <Flex justify="space-between" align="center" gap={16}>
          <h1>Page Title</h1>
          <Button>Action</Button>
        </Flex>

        {/* Page content */}
      </Container>
    </PageContainer>
  );
}
```

## Customization Guide

### Changing Brand Colors

**To update the primary color across the entire app:**

1. Edit `src/styles/theme.ts`:
```typescript
export const lightTheme: Theme = {
  colors: {
    primary: '#ff5722',        // New primary color
    primaryHover: '#e64a19',   // Darker shade for hover
    primaryDisabled: '#ffccbc' // Lighter shade for disabled
  }
};

export const darkTheme: Theme = {
  colors: {
    primary: '#ff7043',        // Adjusted for dark mode
    primaryHover: '#ff5722',
    primaryDisabled: '#bf360c'
  }
};
```

2. Save the file - all buttons, links, and primary-colored elements update instantly!

### Adding New Colors

If you need a new semantic color (e.g., "accent"):

1. Add to the Theme interface:
```typescript
export interface Theme {
  colors: {
    // ... existing colors
    accent: string;
    accentHover: string;
  }
}
```

2. Add to both themes:
```typescript
export const lightTheme: Theme = {
  colors: {
    // ... existing colors
    accent: '#9c27b0',
    accentHover: '#7b1fa2'
  }
};

export const darkTheme: Theme = {
  colors: {
    // ... existing colors
    accent: '#ba68c8',
    accentHover: '#9c27b0'
  }
};
```

3. Use in components:
```typescript
const AccentButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.accent};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.accentHover};
  }
`;
```

### Extending UI Components

When you need custom styling beyond provided variants:

```tsx
import { Button } from './components/ui';
import styled from 'styled-components';

// Extend an existing component
const IconButton = styled(Button)`
  padding: 8px;
  width: 40px;
  height: 40px;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

// Still uses theme colors and all Button props!
<IconButton variant="primary">
  <Icon />
</IconButton>
```

## Best Practices

### ✅ Do

1. **Always import from UI library** when available
2. **Use semantic names** (primary, danger, success) not specific colors (blue, red)
3. **Use theme tokens** (`theme.colors.primary`) instead of hex codes
4. **Extend components** rather than creating from scratch
5. **Document new components** if you create reusable ones

### ❌ Don't

1. **Don't hardcode colors** anywhere in components
2. **Don't use inline styles** for theming (use UI components)
3. **Don't create duplicate components** (check UI library first)
4. **Don't bypass the theme system** with external CSS
5. **Don't use `any` type** with theme-related code

## Available Components Quick Reference

| Category | Components |
|----------|-----------|
| **Buttons** | Button (5 variants, 3 sizes) |
| **Forms** | Input, TextArea, FormGroup, Label, ErrorText, HelperText |
| **Cards** | Card, CardHeader, CardTitle, CardBody |
| **Alerts** | Alert (4 variants) |
| **Typography** | Heading1-3, Text, TextSecondary, TextSmall |
| **Layout** | Container, PageContainer, CenteredContainer, FormCard, Flex, Grid |
| **Other** | Badge, Divider |

## Testing Theme Changes

1. **Change a color** in `theme.ts`
2. **Toggle theme** using the sun/moon button (top-right)
3. **Verify changes** appear in both light and dark modes
4. **Check all pages** to ensure consistency

## Troubleshooting

### Component not using theme colors

**Problem:** Component still shows hardcoded colors
**Solution:** 
- Check if component uses UI library components
- Ensure it's wrapped in ThemeProvider (should be automatic via App.tsx)
- Use `${({ theme }) => theme.colors.primary}` syntax in styled-components

### Colors look wrong in dark mode

**Problem:** Colors don't look right when switching themes
**Solution:**
- Verify both `lightTheme` and `darkTheme` have all color properties defined
- Ensure you're using theme tokens, not hardcoded values
- Check color contrast for accessibility

### TypeScript errors with theme

**Problem:** `theme.colors.xyz` shows TypeScript error
**Solution:**
- Make sure property exists in Theme interface (`src/styles/theme.ts`)
- Ensure `styled.d.ts` is present and properly configured
- Restart TypeScript server in VS Code

## Future Enhancements

Components planned for addition:
- Modal/Dialog
- Dropdown Menu
- Tooltip
- Tabs
- Select/Dropdown
- Checkbox/Radio
- Toggle Switch
- Toast Notifications

Want to add one? Follow the pattern in `src/components/ui/index.ts`!

## Summary

**One file controls all colors:** `src/styles/theme.ts`  
**One library provides all components:** `src/components/ui/index.ts`  
**One import gives you everything:** `import { ... } from './components/ui'`

This system ensures:
- ✅ Consistent design across the entire app
- ✅ Easy theme updates (change once, apply everywhere)
- ✅ Automatic light/dark mode support
- ✅ Type-safe styling
- ✅ Faster development with reusable components
