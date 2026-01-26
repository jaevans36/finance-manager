# Design System & Shared UI Package - Developer Guide

**Last Updated**: January 26, 2026  
**Package**: `@finance-manager/ui`  
**Location**: `packages/ui/`

## 📚 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Using Components](#using-components)
4. [Using Design Tokens](#using-design-tokens)
5. [Creating New Components](#creating-new-components)
6. [Contributing to the Shared Package](#contributing-to-the-shared-package)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)

---

## Overview

The `@finance-manager/ui` package is a **shared component library and design system** that ensures consistency across all Finance Manager applications. It provides:

- ✅ **15+ Pre-built Components** (Button, Card, Modal, Forms, etc.)
- ✅ **Complete Design System** (Typography, spacing, colours)
- ✅ **Theme System** (Light/dark mode with React Context)
- ✅ **TypeScript Support** (Full type safety and autocomplete)
- ✅ **Tree-Shakeable** (Import only what you need)

**Key Principle**: Design once, use everywhere. Update once, applies to all apps.

---

## Getting Started

### 1. Install the Package

In any Finance Manager application:

```json
// apps/your-app/package.json
{
  "dependencies": {
    "@finance-manager/ui": "workspace:*"
  }
}
```

Run: `pnpm install`

### 2. Wrap Your App with ThemeProvider

```tsx
// apps/your-app/src/App.tsx
import { ThemeProvider, GlobalStyles } from '@finance-manager/ui';

function App() {
  return (
    <ThemeProvider>
      <GlobalStyles />
      <YourApp />
    </ThemeProvider>
  );
}
```

### 3. Start Using Components

```tsx
import { Button, Card, Heading1 } from '@finance-manager/ui';

function MyPage() {
  return (
    <Card>
      <Heading1>Hello World</Heading1>
      <Button variant="primary">Click Me</Button>
    </Card>
  );
}
```

---

## Using Components

### Import Patterns

```tsx
// Components
import { Button, Card, Input, Modal } from '@finance-manager/ui';

// Design tokens (spacing, typography)
import { spacing, typography } from '@finance-manager/ui/styles';

// Theme context
import { useTheme } from '@finance-manager/ui';
```

### Common Components

#### Buttons

```tsx
<Button variant="primary" size="medium">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Save</Button>
<Button variant="outline">Cancel</Button>

<Button fullWidth>Full Width Button</Button>
<Button isLoading>Loading...</Button>
<Button disabled>Disabled</Button>
```

**Variants**: `primary`, `secondary`, `danger`, `success`, `outline`  
**Sizes**: `small`, `medium`, `large`

#### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>
    Content goes here
  </CardBody>
</Card>
```

#### Forms

```tsx
<FormGroup>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter email..." 
    hasError={!!error}
  />
  {error && <ErrorText>{error}</ErrorText>}
  <HelperText>We'll never share your email</HelperText>
</FormGroup>
```

#### Badges

```tsx
<Badge $variant="success">Active</Badge>
<Badge $variant="error">Failed</Badge>
<Badge $variant="warning">Pending</Badge>
<SmallBadge $variant="info">Info</SmallBadge>
```

#### Typography

```tsx
<Heading1>Page Title (24px)</Heading1>
<Heading2>Section Heading (18px)</Heading2>
<Heading3>Card Title (16px)</Heading3>
<Text>Body text (14px)</Text>
<TextSecondary>Secondary text</TextSecondary>
<TextSmall>Small text (12px)</TextSmall>
```

**Full component list**: See [packages/ui/src/components/README.md](../../packages/ui/src/components/README.md)

---

## Using Design Tokens

### Why Design Tokens?

❌ **Bad** - Hardcoded values:
```tsx
const Container = styled.div`
  padding: 16px;
  font-size: 18px;
  margin-bottom: 24px;
`;
```

✅ **Good** - Design tokens:
```tsx
import { spacing, typography } from '@finance-manager/ui/styles';

const Container = styled.div`
  padding: ${spacing.lg};
  ${typography.sectionHeading}
  margin-bottom: ${spacing['2xl']};
`;
```

**Benefits**:
- Consistency across all components
- Easy to update globally
- Self-documenting code
- Type-safe with autocomplete

### Typography Tokens

```tsx
import { typography } from '@finance-manager/ui/styles';

const Title = styled.h1`
  ${typography.pageTitle}        // 24px, weight 600
  ${typography.sectionHeading}   // 18px, weight 600
  ${typography.cardTitle}        // 16px, weight 600
  ${typography.body}             // 14px, weight 400
  ${typography.bodySmall}        // 12px, weight 400
  ${typography.label}            // 14px, weight 500
  ${typography.badge}            // 11px, weight 500
  ${typography.displayLarge}     // 32px, weight 700
  ${typography.displayMedium}    // 24px, weight 700
  ${typography.displaySmall}     // 18px, weight 600
`;
```

### Spacing Tokens

4px-based scale:

```tsx
import { spacing } from '@finance-manager/ui/styles';

const Container = styled.div`
  padding: ${spacing.xs};    // 4px
  padding: ${spacing.sm};    // 8px
  padding: ${spacing.md};    // 12px
  padding: ${spacing.lg};    // 16px
  padding: ${spacing.xl};    // 20px
  padding: ${spacing['2xl']}; // 24px
  padding: ${spacing['3xl']}; // 32px
  padding: ${spacing['4xl']}; // 40px
  padding: ${spacing['5xl']}; // 48px
`;
```

### Theme Colors

```tsx
const StyledDiv = styled.div`
  // Background colors
  background: ${({ theme }) => theme.colors.background};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  background: ${({ theme }) => theme.colors.cardBackground};
  
  // Text colors
  color: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.textSecondary};
  
  // Brand colors
  color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primaryHover};
  
  // Status colors
  color: ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.warning};
  color: ${({ theme }) => theme.colors.info};
  
  // Borders
  border: 1px solid ${({ theme }) => theme.colors.border};
`;
```

**See all colors**: Visit `/design-system` in the app for live colour swatches.

### Layout Utilities

```tsx
import { flexCenter, flexBetween, scrollbar } from '@finance-manager/ui/styles';

const Container = styled.div`
  ${flexCenter}    // display: flex; align-items: center; justify-content: center;
  ${flexBetween}   // display: flex; justify-content: space-between; align-items: center;
  ${scrollbar}     // Custom scrollbar styling
`;
```

---

## Creating New Components

### When to Create in Your App

Create components **inside your app** (`apps/your-app/src/components/`) when:

- ✅ Used only in this specific app
- ✅ Highly specialized business logic
- ✅ Rapid prototyping / experimental
- ✅ Page-specific complex behaviour

**Example**: `WeeklyProgressChart`, `TaskFilterDropdown`, `DashboardStats`

### When to Add to Shared Package

Add components **to the shared package** (`packages/ui/src/components/`) when:

- ✅ Used in **2+ applications**
- ✅ Generic, reusable pattern (e.g., "Modal", "Dropdown", "DatePicker")
- ✅ No business logic (pure UI)
- ✅ Represents a design system pattern

**Example**: `Button`, `Card`, `Input`, `Select`, `Tooltip`

### Component Template

When creating new components in your app, use design tokens:

```tsx
import styled from 'styled-components';
import { spacing, typography } from '@finance-manager/ui/styles';

interface MyComponentProps {
  title: string;
  variant?: 'default' | 'highlighted';
}

const Container = styled.div<{ $variant: string }>`
  padding: ${spacing.lg};
  ${typography.cardTitle}
  background: ${({ theme, $variant }) => 
    $variant === 'highlighted' 
      ? theme.colors.backgroundSecondary 
      : theme.colors.cardBackground
  };
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const MyComponent = ({ title, variant = 'default' }: MyComponentProps) => {
  return (
    <Container $variant={variant}>
      {title}
    </Container>
  );
};
```

**Key Points**:
- ✅ Use `${spacing.lg}` not `16px`
- ✅ Use `${typography.cardTitle}` not `font-size: 16px`
- ✅ Use `${({ theme }) => theme.colors.text}` not `#333`
- ✅ Use transient props (`$variant`) for styled-components props

---

## Contributing to the Shared Package

### 1. Add Your Component

Create your component in `packages/ui/src/components/`:

```tsx
// packages/ui/src/components/MyNewComponent.tsx
import styled from 'styled-components';
import { spacing, typography } from '../styles';

export const MyNewComponent = styled.div`
  ${typography.body}
  padding: ${spacing.md};
  // ...
`;
```

### 2. Export from Index

Add to `packages/ui/src/components/index.ts`:

```tsx
export { MyNewComponent } from './MyNewComponent';
```

Or if it's inline in the index file, just add it.

### 3. Update README

Add usage example to `packages/ui/src/components/README.md`:

```markdown
### MyNewComponent

\`\`\`tsx
import { MyNewComponent } from '@finance-manager/ui';

<MyNewComponent>Content</MyNewComponent>
\`\`\`

**Props**: ...
```

### 4. Test Locally

```bash
# In the app using the component
cd apps/web
pnpm dev
```

Changes to `packages/ui/` are reflected immediately (no rebuild needed in monorepo).

### 5. Add to Design System Page

Add example to `apps/web/src/pages/design-system/DesignSystemPage.tsx`:

```tsx
<ComponentGroup>
  <Heading3>MyNewComponent</Heading3>
  <MyNewComponent>Example usage</MyNewComponent>
  <CodeBlock>{`<MyNewComponent>Content</MyNewComponent>`}</CodeBlock>
</ComponentGroup>
```

### 6. Commit

```bash
git add packages/ui/
git commit -m "feat(ui): add MyNewComponent to shared package"
```

---

## Best Practices

### ✅ DO

1. **Use design tokens everywhere**
   ```tsx
   padding: ${spacing.lg}  // Not: padding: 16px
   ```

2. **Import from the shared package**
   ```tsx
   import { Button } from '@finance-manager/ui';  // Not: relative paths
   ```

3. **Use TypeScript for all components**
   ```tsx
   interface Props {
     title: string;
     variant?: 'primary' | 'secondary';
   }
   ```

4. **Use transient props for styled-components**
   ```tsx
   <StyledDiv $variant="primary">  // $ prefix prevents DOM warnings
   ```

5. **Leverage theme colors**
   ```tsx
   color: ${({ theme }) => theme.colors.text};  // Auto dark/light mode
   ```

6. **Use semantic component names**
   ```tsx
   <Heading1>, <Button>, <Card>  // Not: <BigText>, <ClickBox>
   ```

### ❌ DON'T

1. **Don't hardcode values**
   ```tsx
   font-size: 18px;  // ❌ Use typography.sectionHeading
   padding: 20px;    // ❌ Use spacing.xl
   color: #333;      // ❌ Use theme.colors.text
   ```

2. **Don't create duplicate components**
   - Check `packages/ui/src/components/README.md` first
   - Search existing components before creating new ones

3. **Don't skip the design system page**
   - Always test your component in `/design-system` route
   - Verify dark mode works correctly

4. **Don't mix design patterns**
   ```tsx
   // ❌ Bad
   <div style={{ fontSize: '18px' }}>
     <Heading2>Title</Heading2>
   </div>
   
   // ✅ Good
   <div>
     <Heading2>Title</Heading2>
   </div>
   ```

5. **Don't add business logic to shared components**
   - Keep shared components pure UI
   - Business logic stays in the app

---

## Migration Guide

### Migrating Existing Components

**Before** (old pattern):
```tsx
import styled from 'styled-components';

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 30px;
`;

const Container = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.colors.cardBackground};
`;
```

**After** (using shared package):
```tsx
import styled from 'styled-components';
import { Heading1 } from '@finance-manager/ui';
import { spacing } from '@finance-manager/ui/styles';

const StyledHeading = styled(Heading1)`
  margin-bottom: ${spacing['2xl']};
`;

const Container = styled.div`
  padding: ${spacing.xl};
  background: ${({ theme }) => theme.colors.cardBackground};
`;
```

**Or better** - use components directly:
```tsx
import { Heading1, Card, CardBody } from '@finance-manager/ui';

<Card>
  <CardBody>
    <Heading1 style={{ marginBottom: spacing['2xl'] }}>Title</Heading1>
  </CardBody>
</Card>
```

### Migration Checklist

For each file you migrate:

- [ ] Replace hardcoded font sizes with `typography` tokens
- [ ] Replace hardcoded spacing with `spacing` tokens
- [ ] Use shared components where possible
- [ ] Import from `@finance-manager/ui` not relative paths
- [ ] Test in both light and dark mode
- [ ] Verify responsive behaviour

---

## Visual Reference

### Live Examples

Visit **`/design-system`** in any Finance Manager app to see:

1. **Complete Colour Palette** with swatches
2. **Typography Examples** with code snippets
3. **Spacing Scale** visual representation
4. **All Components** with interactive examples
5. **Usage Instructions** with copy-paste code

### Quick Reference

**Typography Scale**:
- `pageTitle`: 24px, weight 600
- `sectionHeading`: 18px, weight 600
- `cardTitle`: 16px, weight 600
- `body`: 14px, weight 400
- `bodySmall`: 12px, weight 400
- `badge`: 11px, weight 500

**Spacing Scale**:
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 32px
- `4xl`: 40px
- `5xl`: 48px

---

## Support & Resources

### Documentation

- **Package README**: `packages/ui/README.md`
- **Component Library**: `packages/ui/src/components/README.md`
- **This Guide**: `docs/guides/DESIGN_SYSTEM_USAGE.md`
- **Live Examples**: Navigate to `/design-system` in any app

### Getting Help

1. Check the Design System page (`/design-system`)
2. Review component README (`packages/ui/src/components/README.md`)
3. Search for similar patterns in `apps/web/src/`
4. Ask the team in #design-system channel

### Related Documentation

- [Theme Implementation](THEME_IMPLEMENTATION.md) - Theme system details
- [Icon Guide](ICON_GUIDE.md) - Icon usage with Lucide
- [Design System Audit](../development/design-system-audit.md) - Migration history

---

## Summary

**Golden Rules**:

1. 🎨 **Always use design tokens** (spacing, typography, theme colors)
2. 🧩 **Import from `@finance-manager/ui`** for shared components
3. 📱 **Test in light/dark mode** before committing
4. 📚 **Document in `/design-system` page** if adding to shared package
5. 🚀 **Keep shared components generic** - business logic stays in apps

**Result**: Consistent, maintainable, beautiful UI across all Finance Manager applications! 🎉

---

**Last Updated**: January 26, 2026  
**Maintained By**: Finance Manager Team  
**Questions?**: Check `/design-system` or ask in team chat
