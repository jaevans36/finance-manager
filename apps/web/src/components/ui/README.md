# UI Component Library

A centralized, theme-aware component library for consistent styling across the Finance Manager application.

## Purpose

This component library ensures:
- **Consistency**: All components follow the same design patterns
- **Centralized Theming**: Colors and styles managed from one place
- **Type Safety**: Full TypeScript support
- **Accessibility**: Built-in ARIA support and keyboard navigation
- **Maintainability**: Easy to update design system globally

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
- [ ] Select/Dropdown
- [ ] Checkbox/Radio
- [ ] Toggle Switch
- [ ] Progress Bar
- [ ] Skeleton Loaders
- [ ] Toast Notifications
