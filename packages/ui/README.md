# @finance-manager/ui

Shared UI component library and design system for Finance Manager applications.

> **⚠️ MIGRATION NOTICE**: This package currently uses **styled-components**.
> It is being migrated to **Tailwind CSS + shadcn/ui** (Phase 48-53).
> See `specs/platform/frontend-modernisation.md` for the migration plan.

## Features

- 🎨 **Complete Design System**: Typography, spacing, colors, and layout utilities
- 🌗 **Theme Support**: Light and dark mode with seamless switching
- 🧩 **15+ Components**: Buttons, Cards, Forms, Modals, Badges, and more
- 📱 **Responsive**: Mobile-first design with breakpoint utilities
- ♿ **Accessible**: ARIA labels, keyboard navigation, and focus management
- 🔒 **Type Safe**: Full TypeScript support with comprehensive types
- 📦 **Tree Shakeable**: Import only what you need

## Installation

Since this is a monorepo package, it's automatically available via workspace protocol:

```json
{
  "dependencies": {
    "@finance-manager/ui": "workspace:*"
  }
}
```

## Usage

### Import Components

```tsx
import { Button, Card, Input, Modal } from '@finance-manager/ui';
import { typography, spacing } from '@finance-manager/ui/styles';
import { ThemeProvider, useTheme } from '@finance-manager/ui/contexts';
```

### Setup Theme Provider

Wrap your app with the ThemeProvider:

```tsx
import { ThemeProvider } from '@finance-manager/ui/contexts';
import { GlobalStyles } from '@finance-manager/ui/styles';

function App() {
  return (
    <ThemeProvider>
      <GlobalStyles />
      <YourApp />
    </ThemeProvider>
  );
}
```

### Use Components

```tsx
import { Button, Card, CardHeader, CardTitle, CardBody } from '@finance-manager/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardBody>
        <p>This is using the shared design system!</p>
        <Button variant="primary">Click Me</Button>
      </CardBody>
    </Card>
  );
}
```

### Use Design Tokens

```tsx
import styled from 'styled-components';
import { typography, spacing } from '@finance-manager/ui/styles';

const Title = styled.h1`
  ${typography.pageTitle}
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${spacing.lg};
`;
```

## Documentation

Full documentation available in `src/components/README.md` and individual component files.

## Development

```bash
# Type check
pnpm type-check

# Build (when needed)
pnpm build
```

## Design System

- **Typography**: 13 text styles from 11px to 32px
- **Spacing**: 4px-based scale (xs: 4px → 5xl: 48px)
- **Colors**: Complete palette for light and dark themes
- **Components**: Button, Card, Modal, Form inputs, Badges, Progress bars, etc.

See `src/styles/README.md` for complete design system documentation.
