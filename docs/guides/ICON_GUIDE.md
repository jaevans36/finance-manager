# Icon Usage Guide

## Using Lucide React Icons

We've standardized on [Lucide React](https://lucide.dev/) for all icons in the application. This provides a consistent, modern, flat icon design system.

## Installation

Already installed:
```bash
pnpm add lucide-react
```

## Basic Usage

```tsx
import { IconName } from 'lucide-react';

// Basic icon
<IconName />

// With size
<IconName size={20} />

// With custom styling
<IconName size={24} color="red" strokeWidth={2} />

// In styled-components
const Button = styled.button`
  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
```

## Commonly Used Icons

### Navigation & UI
- `Menu` - Hamburger menu
- `X` - Close/cancel
- `ChevronLeft`, `ChevronRight`, `ChevronDown`, `ChevronUp` - Arrows
- `ArrowLeft`, `ArrowRight` - Back/forward navigation
- `Plus`, `Minus` - Add/subtract
- `Search` - Search functionality
- `Filter` - Filter options
- `Settings` - Settings/preferences
- `MoreVertical`, `MoreHorizontal` - More options menu

### Theme (Already Implemented)
- `Sun` - Light mode icon
- `Moon` - Dark mode icon

### User & Auth
- `User` - User profile
- `Users` - Multiple users
- `LogIn`, `LogOut` - Authentication
- `UserPlus` - Register/add user
- `Mail` - Email
- `Lock` - Password/security
- `Eye`, `EyeOff` - Show/hide password

### Finance Specific
- `DollarSign` - Money/currency
- `CreditCard` - Card payments
- `Wallet` - Wallet/accounts
- `TrendingUp`, `TrendingDown` - Trends
- `PieChart`, `BarChart`, `LineChart` - Charts
- `Receipt` - Transactions
- `Calculator` - Calculations

### Actions
- `Edit`, `Edit2`, `Edit3` - Edit actions
- `Trash`, `Trash2` - Delete
- `Save` - Save action
- `Download`, `Upload` - File transfers
- `Copy` - Copy to clipboard
- `Check` - Checkmark/success
- `AlertCircle` - Alert/warning
- `Info` - Information
- `HelpCircle` - Help

### Status
- `CheckCircle` - Success
- `XCircle` - Error
- `AlertTriangle` - Warning
- `AlertCircle` - Alert

### Documents & Files
- `File`, `FileText` - Files
- `Folder` - Folders
- `Download`, `Upload` - Transfers

## Example: Updating a Component

Before (emoji):
```tsx
<button>💰 Add Transaction</button>
```

After (lucide-react):
```tsx
import { DollarSign } from 'lucide-react';

<button>
  <DollarSign size={16} />
  Add Transaction
</button>
```

## Theming Icons

Icons automatically inherit color from their parent, but you can also style them:

```tsx
import styled from 'styled-components';
import { User } from 'lucide-react';

const IconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.text};
  
  svg {
    color: ${({ theme }) => theme.colors.primary};
    transition: color 0.2s ease;
  }
  
  &:hover svg {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

<IconButton>
  <User size={20} />
  Profile
</IconButton>
```

## Best Practices

1. **Consistent Sizing**: Use standard sizes (16, 20, 24px)
2. **Stroke Width**: Default is 2, adjust only when needed
3. **Accessibility**: Always provide text labels or aria-labels
4. **Theme Colors**: Use theme colors instead of hardcoded values
5. **Performance**: Import only icons you need

## Browse All Icons

Visit [lucide.dev](https://lucide.dev/icons/) to browse all available icons.
