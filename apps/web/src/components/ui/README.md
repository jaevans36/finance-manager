# UI Component Library & Design System

A centralized, theme-aware component library and design system for consistent styling across the Finance Manager application.

## Purpose

This component library and design system ensures:
- **Consistency**: All components follow the same design patterns with standardized typography and spacing
- **Centralized Theming**: Colors, fonts, and spacing managed from design tokens
- **Type Safety**: Full TypeScript support
- **Accessibility**: Built-in ARIA support and keyboard navigation
- **Maintainability**: Easy to update design system globally
- **Reusability**: Common patterns extracted into reusable components

## Design System Files

- **Typography**: `src/styles/typography.ts` - Font sizes, weights, and text styles
- **Layout & Spacing**: `src/styles/layout.ts` - Spacing scale, breakpoints, and layout utilities
- **UI Components**: `src/components/ui/index.ts` - Reusable styled components
- **Chart Theme**: `src/components/charts/chartTheme.ts` - Chart colors and styling

## Typography System

### Usage

```tsx
import { typography } from '../styles/typography';
import styled from 'styled-components';

const Title = styled.h1`
  ${typography.pageTitle}
  color: ${({ theme }) => theme.colors.text};
`;
```

### Available Styles

**Headings:**
- `pageTitle` - 24px, weight 600 (Main page titles)
- `sectionHeading` - 18px, weight 600 (Section headings, chart titles)
- `cardTitle` - 16px, weight 600 (Card and subsection titles)

**Body Text:**
- `bodyLarge` - 16px (Prominent body text)
- `body` - 14px (Standard body text, buttons, inputs)
- `bodySmall` - 12px (Secondary information, meta text)

**Special:**
- `label` - 14px, weight 500 (Form labels, emphasized text)
- `caption` - 12px (Captions, help text)
- `badge` - 11px, weight 500 (Badges, tags, tiny UI elements)

**Display (for stats/numbers):**
- `displayLarge` - 32px, weight 700
- `displayMedium` - 24px, weight 700
- `displaySmall` - 18px, weight 600

## Spacing System

### 4px-based Spacing Scale

```tsx
import { spacing } from '../styles/layout';

const Container = styled.div`
  padding: ${spacing.lg};        // 16px
  gap: ${spacing.md};            // 12px
  margin-bottom: ${spacing['2xl']}; // 24px
`;
```

Available values: `xs` (4px), `sm` (8px), `md` (12px), `lg` (16px), `xl` (20px), `2xl` (24px), `3xl` (32px), `4xl` (40px), `5xl` (48px)

### Layout Utilities

```tsx
import { flexCenter, flexBetween, truncateText, scrollbar, mediaQueries } from '../styles/layout';

const Container = styled.div`
  ${flexBetween}  // Flex with space-between and centered items
  ${scrollbar}    // Custom scrollbar styling
  
  ${mediaQueries.tablet} {
    flex-direction: column;
  }
`;
```

## Available Components

### Buttons

```tsx
import { Button } from './components/ui';

// Variants
<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="danger">Danger Button</Button>
<Button variant="success">Success Button</Button>
<Button variant="outline">Outline Button</Button>

// Sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// States
<Button fullWidth>Full Width Button</Button>
<Button isLoading>Loading...</Button>
<Button disabled>Disabled</Button>

// With Icons
import { Save } from 'lucide-react';
<Button>
  <Save size={16} />
  Save Changes
</Button>
```

### Form Components

```tsx
import { FormGroup, Label, Input, TextArea, ErrorText, HelperText } from './components/ui';

<FormGroup>
  <Label htmlFor="email">Email Address</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
    hasError={!!error}
  />
  {error && <ErrorText>{error}</ErrorText>}
  <HelperText>We'll never share your email</HelperText>
</FormGroup>

<FormGroup>
  <Label htmlFor="description">Description</Label>
  <TextArea
    id="description"
    placeholder="Enter description"
  />
</FormGroup>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardBody } from './components/ui';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
</Card>
```

### Alerts

```tsx
import { Alert } from './components/ui';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

<Alert variant="success">
  <CheckCircle />
  <span>Operation successful!</span>
</Alert>

<Alert variant="error">
  <XCircle />
  <span>Something went wrong</span>
</Alert>

<Alert variant="warning">
  <AlertTriangle />
  <span>Warning message</span>
</Alert>

<Alert variant="info">
  <Info />
  <span>Helpful information</span>
</Alert>
```

### Typography

```tsx
import { Heading1, Heading2, Heading3, Text, TextSecondary, TextSmall } from './components/ui';

<Heading1>Main Heading</Heading1>
<Heading2>Section Heading</Heading2>
<Heading3>Subsection Heading</Heading3>
<Text>Regular paragraph text</Text>
<TextSecondary>Secondary text</TextSecondary>
<TextSmall>Small text</TextSmall>
```

### Containers

```tsx
import { Container, PageContainer, CenteredContainer, FormCard } from './components/ui';

// Standard container with max-width
<Container>
  <h1>Page Content</h1>
</Container>

// Full-height page container
<PageContainer>
  <Container>Content</Container>
</PageContainer>

// Centered container (for login/register forms)
<CenteredContainer>
  <FormCard>
    <h2>Sign In</h2>
    {/* form content */}
  </FormCard>
</CenteredContainer>
```

### Layout Components

```tsx
import { Flex, Grid, Divider } from './components/ui';

// Flexbox layout
<Flex direction="row" align="center" justify="space-between" gap={16}>
  <span>Item 1</span>
  <span>Item 2</span>
</Flex>

// Grid layout
<Grid columns={3} gap={20}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

// Divider
<Divider />
```

### Badges

```tsx
import { Badge } from './components/ui';

<Badge variant="primary">New</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">Beta</Badge>
```

## Theme Integration

All components automatically use the theme from ThemeContext:

```tsx
// Component colors change based on theme (light/dark)
const theme = useTheme();

// Components automatically adapt:
<Button>Themed Button</Button> // Uses theme.colors.primary
<Input /> // Uses theme.colors.inputBackground
<Card /> // Uses theme.colors.cardBackground
```

## Customization

To customize the design system, update the theme configuration in `src/styles/theme.ts`:

```typescript
export const lightTheme: Theme = {
  colors: {
    primary: '#007bff',        // Change primary color
    primaryHover: '#0056b3',   // Change hover state
    // ... other colors
  }
};
```

Changes will automatically propagate to all UI components.

## Migration Guide

### Before (Inline Styles)
```tsx
<button style={{
  padding: '10px',
  backgroundColor: '#007bff',
  color: 'white',
  borderRadius: '4px'
}}>
  Click Me
</button>
```

### After (UI Components)
```tsx
import { Button } from './components/ui';

<Button>Click Me</Button>
```

### Before (Custom Styled Components)
```tsx
const MyInput = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  color: black;
`;
```

### After (UI Components)
```tsx
import { Input } from './components/ui';

// Just use Input directly - it's already themed!
<Input />
```

## Best Practices

1. **Always Use UI Components**: Don't create custom styled components for standard elements
2. **Import from Index**: Always import from `./components/ui` not individual files
3. **Use Theme Colors**: Never hardcode colors - let components use theme values
4. **Extend When Needed**: If you need customization, extend UI components:

```tsx
import { Button } from './components/ui';
import styled from 'styled-components';

const IconButton = styled(Button)`
  padding: 8px;
  width: 40px;
  height: 40px;
`;
```

4. **Maintain Consistency**: Use provided variants/sizes instead of custom styling
5. **Accessibility**: UI components include ARIA labels and keyboard support - maintain this when extending

## Component Props Reference

### Button
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
- `size`: 'small' | 'medium' | 'large'
- `fullWidth`: boolean
- `isLoading`: boolean
- `disabled`: boolean

### Input / TextArea
- `hasError`: boolean
- All standard HTML input/textarea attributes

### Alert
- `variant`: 'success' | 'error' | 'warning' | 'info'

### Badge
- `variant`: 'primary' | 'success' | 'error' | 'warning' | 'info'

### Flex
- `direction`: 'row' | 'column'
- `align`: 'flex-start' | 'center' | 'flex-end' | 'stretch'
- `justify`: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
- `gap`: number (pixels)
- `wrap`: boolean

### Grid
- `columns`: number
- `gap`: number (pixels)

## Future Enhancements

Components to be added:
- [ ] Modal/Dialog
- [ ] Dropdown Menu
- [ ] Tooltip
- [ ] Tabs
- [ ] Pagination
- [ ] Checkbox/Radio
- [ ] Toggle Switch
- [ ] Skeleton Loaders
- [ ] Toast Notifications (partially implemented)

## Recently Added Components (v2)

### Typography Components
Pre-styled heading and text components with consistent sizing:

```tsx
import { Heading1, Heading2, Heading3, BodyText, SmallText, Label } from './components/ui';

<Heading1>Page Title</Heading1>
<Heading2>Section Heading</Heading2>
<Heading3>Subsection</Heading3>
<BodyText>Regular paragraph text</BodyText>
<SmallText>Small meta information</SmallText>
<Label htmlFor="input">Form Label</Label>
```

### Layout Components

**PageContainer** - Standard page wrapper with max-width and responsive padding:
```tsx
import { PageContainer } from './components/ui';

<PageContainer>
  {/* Page content */}
</PageContainer>
```

**GridLayout** - Responsive grid with auto-fit:
```tsx
import { GridLayout } from './components/ui';

<GridLayout columns={4} gap={20} minColumnWidth="250px">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
</GridLayout>
```

**FlexRow** - Flexible row layout:
```tsx
import { FlexRow } from './components/ui';

<FlexRow gap={16} align="center" justify="space-between">
  <span>Left</span>
  <span>Right</span>
</FlexRow>
```

**Section** - Consistent section spacing:
```tsx
import { Section } from './components/ui';

<Section spacing="large">
  {/* Section content */}
</Section>
```

### Progress Bar Components

```tsx
import { ProgressBar, ProgressFill } from './components/ui';

<ProgressBar height="12px">
  <ProgressFill $percentage={75} $variant="primary" />
</ProgressBar>
```

Props:
- `$percentage`: number (0-100)
- `$variant`: 'primary' | 'success' | 'warning' | 'error'
- `height`: string (default: '8px')

### Empty State Components

```tsx
import { EmptyState, EmptyStateIcon, EmptyStateText } from './components/ui';

<EmptyState>
  <EmptyStateIcon>📭</EmptyStateIcon>
  <EmptyStateText>No items to display</EmptyStateText>
</EmptyState>
```

## Best Practices for Consistency

### 1. Use Design Tokens

❌ **Don't** hardcode values:
```tsx
const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;
```

✅ **Do** use design tokens:
```tsx
import { typography } from '../styles/typography';
import { spacing } from '../styles/layout';

const Title = styled.h1`
  ${typography.pageTitle}
  margin-bottom: ${spacing.xl};
`;
```

### 2. Extend Existing Components

❌ **Don't** recreate from scratch:
```tsx
const MyCard = styled.div`
  background: white;
  border: 1px solid gray;
  padding: 20px;
  border-radius: 8px;
`;
```

✅ **Do** extend shared components:
```tsx
import { Card } from '../components/ui';

const MyCard = styled(Card)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;
```

### 3. Consistent Spacing

Always use the spacing scale for padding, margin, and gaps:
```tsx
import { spacing } from '../styles/layout';

const Container = styled.div`
  padding: ${spacing.lg};
  gap: ${spacing.md};
  margin-bottom: ${spacing['2xl']};
`;
```

### 4. Typography Consistency

Use typography mixins or pre-styled components instead of ad-hoc font sizes:
```tsx
import { typography } from '../styles/typography';
import { Heading2 } from '../components/ui';

// Option 1: Use mixin
const Title = styled.h2`
  ${typography.sectionHeading}
`;

// Option 2: Use pre-styled component
<Heading2>Section Title</Heading2>
```

## Migration Guide for Existing Pages

To migrate existing page-specific components to use the design system:

1. **Import design tokens** at the top of your file
2. **Replace hardcoded values** with tokens (font-sizes, spacing, colors)
3. **Use shared components** where possible (Heading1, Card, Button, GridLayout, etc.)
4. **Extract reusable patterns** into the UI library if used in multiple places

### Example Migration

**Before:**
```tsx
const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 30px 0;
  color: ${({ theme }) => theme.colors.text};
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
`;
```

**After:**
```tsx
import { Heading1, GridLayout } from '../components/ui';
import { spacing } from '../styles/layout';

const Title = styled(Heading1)`
  margin-bottom: ${spacing['2xl']};
`;

// Or use directly:
<GridLayout columns={4} gap={20}>
  {/* content */}
</GridLayout>
```

## Questions or Improvements?

If you need a component that doesn't exist or have suggestions for the design system:
1. Check if it can be composed from existing components
2. Consider if it's reusable enough for the shared library
3. Document new patterns in this README
4. Use consistent naming and follow existing conventions
