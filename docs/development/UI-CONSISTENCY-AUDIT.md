# UI Consistency Audit Report

**Date**: 2025-01-20  
**Scope**: `apps/web/src/` — all components, pages, contexts, and services  
**Auditor**: GitHub Copilot (UI Consistency Review Agent)  
**Status**: Report only — no changes implemented

---

## Executive Summary

The frontend codebase has a well-designed shared UI package (`@life-manager/ui`) with design tokens for spacing, typography, and theming. However, adoption is **inconsistent**. Several files bypass the design system entirely, duplicate shared components, or use hardcoded values where tokens should be used.

| Category | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Hardcoded Values | 2 | 5 | 8 | 12 | 27 |
| Component Duplication | 3 | 2 | 3 | 0 | 8 |
| Pattern Violations | 4 | 4 | 3 | 2 | 13 |
| Accessibility | 0 | 3 | 4 | 2 | 9 |
| Responsive Design | 0 | 1 | 2 | 1 | 4 |
| Visual Consistency | 1 | 3 | 4 | 3 | 11 |
| **Total** | **10** | **18** | **24** | **20** | **72** |

### Priority Fix List (Top 15)

| # | Severity | File | Issue | Effort |
|---|---|---|---|---|
| 1 | CRITICAL | `pages/auth/ForgotPasswordPage.tsx` | Uses Tailwind/className instead of styled-components | 3–4h |
| 2 | CRITICAL | `pages/auth/ResetPasswordPage.tsx` | Uses Tailwind/className instead of styled-components | 3–4h |
| 3 | CRITICAL | `pages/auth/VerifyEmailPage.tsx` | Uses Tailwind/className instead of styled-components | 3–4h |
| 4 | CRITICAL | `pages/auth/ResendVerificationPage.tsx` | Uses Tailwind/className instead of styled-components | 3–4h |
| 5 | CRITICAL | `components/auth/RegisterForm.tsx` | Recreates 5 shared UI components locally | 2–3h |
| 6 | HIGH | `components/dashboard/TaskStatistics.tsx` | Uses `React.FC`, hardcoded hex colours | 1h |
| 7 | HIGH | `components/dashboard/TaskSkeleton.tsx` | Uses `React.FC` | 15min |
| 8 | HIGH | `components/charts/ChartContainer.tsx` | Uses `React.FC`, custom LoadingSpinner | 1h |
| 9 | HIGH | `components/charts/PieChartWrapper.tsx` | Uses `React.FC` | 15min |
| 10 | HIGH | `pages/admin/AdminDashboard.tsx` | Hardcoded hex colours for stat icons | 1h |
| 11 | HIGH | `pages/version/VersionHistoryPage.tsx` | Hardcoded hex, inline styles, no PageLayout | 2–3h |
| 12 | HIGH | `pages/weekly-progress/WeeklyProgressPage.tsx` | No PageLayout, massive inline styles, no tokens | 4–6h |
| 13 | HIGH | `pages/profile/ProfilePage.tsx` | No PageLayout, inline styles, hardcoded colour | 2h |
| 14 | MEDIUM | `components/ProtectedRoute.tsx` | Bare `<div>Loading...</div>` instead of LoadingSpinner | 15min |
| 15 | MEDIUM | `components/ErrorBoundary.tsx` | Inline styles, bare HTML, no shared components | 1h |

---

## Category 1: Hardcoded Values

### 1.1 Hardcoded Hex Colours in Styled Components (HIGH)

These files embed raw hex colour codes instead of using `theme.colors.*`.

#### `components/dashboard/TaskStatistics.tsx` — Lines 117–132

**Current:**
```tsx
<StatCard>
  <StatIcon $color="#3B82F6"><ListTodo size={24} /></StatIcon>
  ...
  <StatIcon $color="#10B981"><CheckCircle2 size={24} /></StatIcon>
  ...
  <StatIcon $color="#F59E0B"><Clock size={24} /></StatIcon>
  ...
  <StatIcon $color="#8B5CF6"><TrendingUp size={24} /></StatIcon>
</StatCard>
```

**Corrected:**
```tsx
<StatCard>
  <StatIcon $color={theme.colors.primary}><ListTodo size={24} /></StatIcon>
  ...
  <StatIcon $color={theme.colors.success}><CheckCircle2 size={24} /></StatIcon>
  ...
  <StatIcon $color={theme.colors.warning}><Clock size={24} /></StatIcon>
  ...
  <StatIcon $color={theme.colors.info}><TrendingUp size={24} /></StatIcon>
</StatCard>
```
Access `theme` via `useTheme()` from `styled-components` or pass colours from the theme inside the styled component.

#### `pages/admin/AdminDashboard.tsx` — Lines 215–240

**Current:**
```tsx
<StatsIcon $color="#4CAF50"><Users size={24} /></StatsIcon>
<StatsIcon $color="#2196F3"><CheckSquare size={24} /></StatsIcon>
<StatsIcon $color="#FF9800"><AlertCircle size={24} /></StatsIcon>
<StatsIcon $color="#9C27B0"><Shield size={24} /></StatsIcon>
```

**Corrected:**
```tsx
<StatsIcon $color={theme.colors.success}><Users size={24} /></StatsIcon>
<StatsIcon $color={theme.colors.primary}><CheckSquare size={24} /></StatsIcon>
<StatsIcon $color={theme.colors.warning}><AlertCircle size={24} /></StatsIcon>
<StatsIcon $color={theme.colors.info}><Shield size={24} /></StatsIcon>
```

#### `pages/weekly-progress/components/ErrorDisplay.tsx` — Lines 13, 33

**Current:**
```tsx
const ErrorContainer = styled.div`
  background-color: #dc2626;
  ...
`;
const RetryButton = styled.button`
  color: #fff;
`;
```

**Corrected:**
```tsx
const ErrorContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.error};
  ...
`;
const RetryButton = styled.button`
  color: ${({ theme }) => theme.colors.buttonText};
`;
```

#### `pages/version/VersionHistoryPage.tsx` — Lines 356, 397–399

**Current:**
```tsx
<span style={{ fontSize: '14px', color: '#888' }}>&quot;{version.codename}&quot;</span>
...
<p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '32px' }}>
  <a ... style={{ color: '#4CAF50' }}>CHANGELOG.md</a>
</p>
```

**Corrected:**
```tsx
// Replace inline styles with styled component using theme colours
const CodenameText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FooterLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
`;
```

#### `components/WhatsNewModal.tsx` — Line 271

**Current:**
```tsx
<p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
```

**Corrected:**
```tsx
// Use a styled component with theme colour
const DescriptionText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${spacing.sm};
`;
```

#### `components/charts/LineChartWrapper.tsx` — Line 43

**Current:**
```tsx
<Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
```

**Corrected:**
```tsx
// Pass theme-aware values
const { theme } = useTheme();
<Tooltip contentStyle={{
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`
}} />
```

#### `components/events/EventItem.tsx` — Lines ~95–100

**Current:**
```tsx
const groupColor = group?.color || '#6B7280';
...
color: '#3B82F6';
```

**Corrected:**
```tsx
const groupColor = group?.color || theme.colors.textSecondary;
```

---

### 1.2 Hardcoded `rgba(0,0,0,...)` Shadows (MEDIUM)

~30 instances of hardcoded `rgba(0,0,0,...)` which break in dark mode. Should use `theme.colors.shadow` or a design token.

**Key offenders:**

| File | Line(s) | Current | Corrected |
|---|---|---|---|
| `components/ui/Modal.tsx` | ~20 | `rgba(0, 0, 0, 0.5)` | `${({ theme }) => theme.colors.overlay}` |
| `components/AppHeader.tsx` | ~40 | `rgba(0, 0, 0, 0.05)` | `${({ theme }) => theme.colors.shadow}` |
| `pages/dashboard/DashboardPage.tsx` | ~60 | `rgba(0, 0, 0, 0.1)` | `${({ theme }) => theme.colors.shadow}` |
| `pages/calendar/CalendarPage.tsx` | ~50 | `rgba(0, 0, 0, 0.1)` | `${({ theme }) => theme.colors.shadow}` |
| `contexts/ToastContext.tsx` | ~80 | `rgba(0, 0, 0, 0.15)` | `${({ theme }) => theme.colors.shadow}` |
| `components/calendar/StyledCalendar.tsx` | multiple | `rgba(0, 0, 0, 0.05)` | `${({ theme }) => theme.colors.shadow}` |

**Recommendation:** Create a `shadows` token set in the design system (e.g., `shadows.sm`, `shadows.md`, `shadows.lg`) so all components reference a consistent elevation system.

---

### 1.3 Hardcoded Pixel Values — No Spacing Tokens (LOW–MEDIUM)

The design system provides a `spacing` token scale (`xs`=4px through `5xl`=48px). Most files ignore it entirely. Only `CalculatorModal.tsx` and `DesignSystemPage.tsx` import `spacing`.

**Worst offenders (by volume of hardcoded px):**

| File | Approx. Count | Examples |
|---|---|---|
| `pages/weekly-progress/WeeklyProgressPage.tsx` | 40+ | `padding: 20px`, `gap: 16px`, `margin-bottom: 24px` |
| `components/calendar/StyledCalendar.tsx` | 30+ | `padding: 10px`, `border-radius: 8px`, `gap: 12px` |
| `components/calendar/DayTaskListModal.tsx` | 25+ | `padding: 20px`, `margin-bottom: 16px`, `gap: 8px` |
| `components/calendar/QuickAddTaskModal.tsx` | 20+ | `padding: 24px`, `gap: 12px`, `margin-top: 8px` |
| `pages/version/VersionHistoryPage.tsx` | 20+ | `padding: 24px`, `border-radius: 12px`, `gap: 8px` |
| `components/WhatsNewModal.tsx` | 15+ | `padding: 30px`, `margin-bottom: 20px`, `gap: 12px` |
| `components/AppHeader.tsx` | 15+ | `padding: 12px 20px`, `gap: 16px`, `height: 50px` |

**Example fix pattern:**
```tsx
// Before
padding: 20px;
gap: 16px;
margin-bottom: 24px;

// After
import { spacing } from '@life-manager/ui/styles';
padding: ${spacing.xl};
gap: ${spacing.lg};
margin-bottom: ${spacing['2xl']};
```

---

### 1.4 Hardcoded Typography Values (LOW)

The design system provides `typography` mixins (pageTitle, sectionHeading, cardTitle, body, bodySmall, label, badge). Most files hardcode `font-size` and `font-weight` instead.

**Example offenders:**

| File | Current | Should Use |
|---|---|---|
| `pages/version/VersionHistoryPage.tsx` L225 | `font-size: 18px; font-weight: 600` | `${typography.sectionHeading}` |
| `components/WhatsNewModal.tsx` L200 | `font-size: 24px; font-weight: 700` | `${typography.pageTitle}` |
| `components/dashboard/TaskStatistics.tsx` L50 | `font-size: 14px; font-weight: 500` | `${typography.label}` |
| `components/AppHeader.tsx` L100 | `font-size: 16px; font-weight: 600` | `${typography.cardTitle}` |

---

## Category 2: Component Duplication

### 2.1 RegisterForm Recreates Shared UI Components (CRITICAL)

**File:** `components/auth/RegisterForm.tsx` (lines 15–85)

Creates **5 local styled components** that duplicate the shared UI package:

| Local Component | Shared Equivalent | Import From |
|---|---|---|
| `FormGroup` | `FormGroup` | `@life-manager/ui` |
| `Label` | `Label` | `@life-manager/ui` |
| `Input` (custom styled) | `Input` | `@life-manager/ui` |
| `ErrorText` | `Alert` with `variant="error"` | `@life-manager/ui` |
| `SubmitButton` | `Button` with `variant="primary"` | `@life-manager/ui` |

**Current (lines 15–85):**
```tsx
const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
`;

// ... 70 lines of duplicated component definitions
```

**Corrected:**
```tsx
import { FormGroup, Label, Input, Button, Alert } from '@life-manager/ui';
// Remove all 5 local styled component definitions
// Replace <SubmitButton> with <Button variant="primary" type="submit">
// Replace <ErrorText> with <Alert variant="error">
```

**Note:** `LoginForm.tsx` already correctly uses shared components — RegisterForm should match.

---

### 2.2 DayTaskListModal Duplicates Badge Component (HIGH)

**File:** `components/calendar/DayTaskListModal.tsx` (lines ~50–90)

Creates custom `PriorityBadge` and `GroupBadge` styled components instead of using `Badge` from `@life-manager/ui`.

**Current:**
```tsx
const PriorityBadge = styled.span<{ $priority: string }>`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  // ... custom colour logic
`;

const GroupBadge = styled.span<{ $color?: string }>`
  // ... duplicate of Badge styling
`;
```

**Corrected:**
```tsx
import { Badge } from '@life-manager/ui';
// Use <Badge variant="primary">{priority}</Badge>
// Use <Badge style based on group colour>
```

---

### 2.3 UserManagement Duplicates Badge and Search Components (HIGH)

**File:** `pages/admin/UserManagement.tsx` (lines ~50–120)

Creates custom `RoleBadge`, `SearchInput`, and `FilterButton` that duplicate shared components.

**Current:**
```tsx
const RoleBadge = styled.span<{ $role: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  // ...
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  // ...
`;
```

**Corrected:**
```tsx
import { Badge, Input } from '@life-manager/ui';
// Use <Badge> with appropriate variant
// Use <Input> for search
```

---

### 2.4 ChartContainer Creates Custom LoadingSpinner (MEDIUM)

**File:** `components/charts/ChartContainer.tsx` (lines ~30–60)

Creates a custom `LoadingContainer` with spinning animation instead of using `LoadingSpinner` from `@life-manager/ui`.

**Corrected:**
```tsx
import { LoadingSpinner } from '@life-manager/ui';
```

---

### 2.5 EventsPage Creates Custom Filter Components (MEDIUM)

**File:** `pages/events/EventsPage.tsx` (lines ~50–90)

Creates custom `FilterInput` and `FilterSelect` styled components instead of using `Input` from the shared package.

---

### 2.6 VersionHistoryPage Creates Custom RetryButton and LoadingSpinner (MEDIUM)

**File:** `pages/version/VersionHistoryPage.tsx` (lines 203–250)

Creates custom `RetryButton` (should use `Button variant="outline"`) and custom `LoadingSpinner` with keyframe animation (should use shared `LoadingSpinner`).

---

## Category 3: Pattern Violations

### 3.1 Tailwind/className Styling Instead of styled-components (CRITICAL)

**4 auth pages** use Tailwind-style `className` directives instead of the project's styled-components pattern. This completely bypasses the theme system, meaning dark mode, design tokens, and consistent styling do not apply.

| File | Lines | Approach |
|---|---|---|
| `pages/auth/ForgotPasswordPage.tsx` | 1–130 | `className="min-h-screen flex items-center justify-center..."` |
| `pages/auth/ResetPasswordPage.tsx` | 1–200 | `className="min-h-screen flex items-center..."` |
| `pages/auth/VerifyEmailPage.tsx` | 1–144 | `className="min-h-screen flex items-center..."` |
| `pages/auth/ResendVerificationPage.tsx` | 1–127 | `className="min-h-screen flex items-center..."` |

**Current (ForgotPasswordPage.tsx):**
```tsx
return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
        ...
      </div>
    </div>
  </div>
);
```

**Corrected:**
```tsx
import styled from 'styled-components';
import { Card, Heading2, Button, Input, FormGroup, Label } from '@life-manager/ui';
import { spacing, typography } from '@life-manager/ui/styles';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
`;

const FormCard = styled(Card)`
  max-width: 400px;
  width: 100%;
  padding: ${spacing['3xl']};
`;

// Use shared UI components for form elements
```

**Impact:** These pages do not support dark mode and will have a jarring visual mismatch with the rest of the application.

---

### 3.2 React.FC Usage (HIGH)

Per project standards, `React.FC` is deprecated and must not be used. 4 files violate this.

| File | Line | Current | Corrected |
|---|---|---|---|
| `components/dashboard/TaskStatistics.tsx` | 96 | `const TaskStatistics: React.FC<Props> = ({ ... }) =>` | `const TaskStatistics = ({ ... }: Props) =>` |
| `components/dashboard/TaskSkeleton.tsx` | 36 | `const TaskSkeleton: React.FC = () =>` | `const TaskSkeleton = () =>` |
| `components/charts/ChartContainer.tsx` | 160 | `const ChartContainer: React.FC<Props> = ({ ... }) =>` | `const ChartContainer = ({ ... }: Props) =>` |
| `components/charts/PieChartWrapper.tsx` | 26 | `const PieChartWrapper: React.FC<Props> = ({ ... }) =>` | `const PieChartWrapper = ({ ... }: Props) =>` |

---

### 3.3 Untyped Catch Blocks (HIGH)

Per project standards, all catch blocks must use `catch (error: unknown)` with proper type narrowing. 20+ catch blocks use bare `catch (error)` or `catch (err)` without type annotation.

| File | Line(s) | Current | Corrected |
|---|---|---|---|
| `pages/tasks/TasksPage.tsx` | 133, 147, 197, 212, 236, 251, 265 | `catch (error)` | `catch (error: unknown)` |
| `pages/events/EventsPage.tsx` | ~110, ~140, ~170 | `catch (error)` | `catch (error: unknown)` |
| `pages/dashboard/DashboardPage.tsx` | 258 | `catch (error)` | `catch (error: unknown)` |
| `pages/admin/SystemSettings.tsx` | 161 | `catch (error)` | `catch (error: unknown)` |
| `pages/admin/UserManagement.tsx` | ~200, ~250, ~300, ~350 | `catch (error)` | `catch (error: unknown)` |
| `pages/version/VersionHistoryPage.tsx` | 277 | `catch (err)` | `catch (err: unknown)` |
| `contexts/AuthContext.tsx` | 41 | `catch (error)` | `catch (error: unknown)` |

**Note:** Some files (e.g., `ProfilePage.tsx` line 224) already correctly use `catch (error: unknown)` — these should be the reference pattern.

---

### 3.4 Pages Not Using PageLayout (HIGH)

`PageLayout` provides a consistent page structure with sidebar support, loading states, and error handling. 4 pages bypass it:

| Page | Current Layout | Issue |
|---|---|---|
| `pages/weekly-progress/WeeklyProgressPage.tsx` | Custom `Header` + raw `<div>` | Builds entirely custom layout with no sidebar integration |
| `pages/profile/ProfilePage.tsx` | `<Container style={{ padding: '20px', ... }}>` | Uses `Container` from UI lib with inline styles for layout |
| `pages/version/VersionHistoryPage.tsx` | `<Container style={{ padding: '20px', ... }}>` | Same pattern as ProfilePage |
| `pages/dashboard/DashboardPage.tsx` | Custom grid layout | Has its own Header/QuickActions pattern instead of PageLayout |

**Corrected:** Wrap content in `<PageLayout>` component, matching `TasksPage.tsx` and `EventsPage.tsx` patterns.

---

### 3.5 Inconsistent Modal Implementations (MEDIUM)

The project has a shared `ui/Modal.tsx` component but multiple files create their own modal overlays:

| File | Implementation | Should Use |
|---|---|---|
| `components/WhatsNewModal.tsx` | Custom `Overlay` + `Modal` styled components | `ui/Modal` |
| `components/tasks/EditTaskModal.tsx` | Custom `Overlay` + `ModalContainer` | `ui/Modal` |
| `components/task-groups/CreateTaskGroupModal.tsx` | Custom `ModalOverlay` + `ModalContent` | `ui/Modal` |
| `components/events/EditEventModal.tsx` | Custom overlay | `ui/Modal` |
| `components/calendar/QuickAddTaskModal.tsx` | Custom `ModalOverlay` + `ModalContent` | `ui/Modal` |
| `components/calendar/DayTaskListModal.tsx` | Custom `ModalOverlay` + `ModalContent` | `ui/Modal` |

Each has subtly different overlay opacity, animation, padding, and close behaviour. Consolidating to `ui/Modal` would ensure:
- Consistent overlay darkness
- Consistent padding
- Consistent close-on-ESC and close-on-backdrop behaviour
- Consistent animation

---

### 3.6 Inline Styles Instead of Styled Components (MEDIUM)

50+ instances of `style={{ }}` inline props scattered across the codebase. Key offenders:

| File | Line(s) | Inline Style | Fix |
|---|---|---|---|
| `pages/version/VersionHistoryPage.tsx` | 300 | `style={{ padding: '20px', maxWidth: '1000px', width: '80%' }}` | Create `PageWrapper` styled component |
| `pages/profile/ProfilePage.tsx` | 246 | `style={{ padding: '20px', maxWidth: '1200px', width: '80%' }}` | Create `PageWrapper` styled component |
| `pages/profile/ProfilePage.tsx` | 256 | `style={{ color: 'orange' }}` | Use `theme.colors.warning` in styled component |
| `pages/weekly-progress/WeeklyProgressPage.tsx` | 614, 704, 717 | `style={{ padding: '20px', display: 'flex', ... }}` | Create `EmptyStateCard` styled component |
| `components/tasks/CreateTaskForm.tsx` | 87 | `style={{ padding: '20px' }}` | Add padding to styled component |
| `components/tasks/CreateTaskForm.tsx` | 144 | `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}` | Create `FormGrid` styled component |
| `components/tasks/EditTaskModal.tsx` | 168 | `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}` | Create `FormGrid` styled component |
| `components/events/EventForm.tsx` | 151, 191, 244 | Same grid inline styles | Create `FormGrid` styled component |

**Recommendation:** Create a shared `FormGrid` styled component in UI package since the `display: grid; grid-template-columns: 1fr 1fr; gap: 15px` pattern is used in 4+ files.

---

### 3.7 Button Variant Inconsistency for Submit Actions (LOW)

Submit/create buttons use different variants across forms:

| File | Action | Variant Used |
|---|---|---|
| `components/tasks/CreateTaskForm.tsx` | Create Task | `variant="success"` |
| `components/tasks/EditTaskModal.tsx` | Update Task | `variant="primary"` |
| `components/events/EventForm.tsx` | Create Event | `variant="success"` |
| `components/calendar/QuickAddTaskModal.tsx` | Add Task | `variant="primary"` |
| `pages/tasks/TasksPage.tsx` | Create button | `variant="success"` |
| `pages/profile/ProfilePage.tsx` | Save Username | `variant="success"` |

**Recommendation:** Establish a convention:
- **Create/Save actions**: `variant="success"` ← appears to be the majority pattern
- **Edit/Update actions**: `variant="primary"`
- **Delete/Destructive actions**: `variant="danger"`
- **Cancel/Secondary actions**: `variant="outline"`

Then align all files. The `EditTaskModal` submit should likely also be `variant="success"` for consistency with other save actions, and `QuickAddTaskModal` should be `variant="success"`.

---

## Category 4: Accessibility

### 4.1 ProtectedRoute — No Loading Feedback (HIGH)

**File:** `components/ProtectedRoute.tsx` — Line ~18

**Current:**
```tsx
if (loading) {
  return <div>Loading...</div>;
}
```

**Corrected:**
```tsx
import { LoadingSpinner } from '@life-manager/ui';

if (loading) {
  return (
    <div role="status" aria-label="Loading authentication">
      <LoadingSpinner />
    </div>
  );
}
```

`AdminRoute.tsx` already correctly uses `LoadingSpinner` — ProtectedRoute should match.

---

### 4.2 ErrorBoundary — No Semantic HTML or ARIA (HIGH)

**File:** `components/ErrorBoundary.tsx` — Lines ~30–42

**Current:**
```tsx
return (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>Something went wrong</h1>
    <p>{this.state.error?.message}</p>
  </div>
);
```

**Corrected:**
```tsx
import { Alert, Button, Heading1 } from '@life-manager/ui';

return (
  <div role="alert" aria-live="assertive" style={{ padding: '20px', textAlign: 'center' }}>
    <Alert variant="error">
      <Heading1>Something went wrong</Heading1>
      <p>{this.state.error?.message}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Reload Page
      </Button>
    </Alert>
  </div>
);
```

---

### 4.3 Modal Overlays Missing Keyboard Trap (HIGH)

Custom modal implementations (WhatsNewModal, EditTaskModal, CreateTaskGroupModal, QuickAddTaskModal, DayTaskListModal, EditEventModal) do not implement focus trapping. When open, tab/shift-tab can navigate to elements behind the modal.

**The shared `ui/Modal.tsx` component should implement focus trap**, and all modals should use it. Consider adding `react-focus-lock` or a custom focus trap utility.

---

### 4.4 Chart Components Missing ARIA Labels (MEDIUM)

| File | Issue |
|---|---|
| `components/charts/LineChartWrapper.tsx` | No `aria-label` on chart container |
| `components/charts/PieChartWrapper.tsx` | No `aria-label` on chart container |
| `components/charts/ChartContainer.tsx` | No `role="img"` or `aria-label` describing chart purpose |

`BarChartWrapper.tsx` correctly uses `aria-label` — other chart wrappers should match.

**Corrected:**
```tsx
<div role="img" aria-label="Line chart showing task completion trends">
  <ResponsiveContainer>...</ResponsiveContainer>
</div>
```

---

### 4.5 Calendar Modals Missing Description (MEDIUM)

`DayTaskListModal.tsx` and `QuickAddTaskModal.tsx` don't use `aria-labelledby` or `aria-describedby` on their modal containers.

**Corrected:**
```tsx
<ModalContent role="dialog" aria-labelledby="modal-title" aria-describedby="modal-desc">
  <h2 id="modal-title">Tasks for {date}</h2>
  <p id="modal-desc">View and manage tasks scheduled for this day</p>
  ...
</ModalContent>
```

---

### 4.6 Form Fields Missing Labels (MEDIUM)

| File | Line(s) | Issue |
|---|---|---|
| `components/calendar/CalendarFilters.tsx` | ~140–180 | `<Select>` elements have no associated `<label>` |
| `components/events/EventForm.tsx` | ~200 | Colour picker input has no label |
| `pages/events/EventsPage.tsx` | ~220 | Filter inputs have no `aria-label` |

---

### 4.7 Interactive Elements Without Keyboard Handlers (LOW)

| File | Element | Issue |
|---|---|---|
| `pages/version/VersionHistoryPage.tsx` | `VersionHeader` (clickable div) | No `onKeyDown` or `role="button"` |
| `components/events/EventItem.tsx` | Delete button | Icon-only button missing `aria-label` |

---

## Category 5: Responsive Design

### 5.1 WeeklyProgressPage — No Responsive Breakpoints (HIGH)

**File:** `pages/weekly-progress/WeeklyProgressPage.tsx`

The 822-line page uses fixed grid layouts (e.g., `grid-template-columns: 1fr 1fr 1fr`) without media queries. On mobile, content will overflow or become unreadable.

**Recommendation:** Add breakpoints:
```tsx
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${spacing.lg};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;
```

---

### 5.2 VersionHistoryPage and ProfilePage — Hardcoded Width (MEDIUM)

Both pages use `style={{ maxWidth: '1000px', width: '80%' }}` (or `1200px`). This offers no mobile adaptation.

**Corrected:**
```tsx
const PageWrapper = styled.div`
  padding: ${spacing.xl};
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: ${spacing.lg};
  }
`;
```

---

### 5.3 Inline Grid Layouts — Not Responsive (MEDIUM)

The inline `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}` pattern in `CreateTaskForm.tsx`, `EditTaskModal.tsx`, and `EventForm.tsx` will not stack on mobile.

**Corrected:** Create a `FormGrid` with responsive breakpoint:
```tsx
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing.lg};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;
```

---

## Category 6: Visual Consistency

### 6.1 Styling Paradigm Split — Styled-components vs Tailwind (CRITICAL)

The project uses **styled-components** throughout, except for 4 auth pages that use **Tailwind/className**. This creates:
- Two different CSS methodologies in one project
- Dark mode support only in styled-components pages
- Different spacing and sizing scales
- Maintenance burden of knowing two systems

**Resolution:** Convert all 4 Tailwind pages to styled-components. See §3.1 for specifics.

---

### 6.2 Inconsistent Page Layout Structure (HIGH)

Three distinct page layout patterns exist:

| Pattern | Pages | Description |
|---|---|---|
| **PageLayout wrapper** | TasksPage, EventsPage, CalendarPage, AdminDashboard, SystemSettings, UserManagement | Uses `<PageLayout>` with sidebar |
| **Container + inline styles** | ProfilePage, VersionHistoryPage | `<Container style={{ padding: '20px', maxWidth: ... }}>` |
| **Fully custom** | WeeklyProgressPage, DashboardPage | Own header, grid, no sidebar |

**Recommendation:** All pages should use `PageLayout` for the outer structure. Pages that don't need a sidebar can pass `sidebar={null}`.

---

### 6.3 Inconsistent Border Radius Values (HIGH)

| Value | Files Using It |
|---|---|
| `4px` | TaskSearch, CalendarFilters |
| `6px` | CreateTaskForm, EditTaskModal |
| `8px` | AppHeader, Modal, WhatsNewModal, QuickAddTaskModal, RetryButton, multiple pages |
| `12px` | VersionHistoryPage, DayTaskListModal, UserManagement badges |
| `16px` | DashboardPage cards |

**Recommendation:** Add `borderRadius` tokens to the design system:
```tsx
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};
```

---

### 6.4 Inconsistent Card Padding (MEDIUM)

Cards across the app use different padding values:

| File | Padding |
|---|---|
| `CreateTaskForm.tsx` | `20px` (via inline style) |
| `EventForm.tsx` | `20px` (via inline style) |
| `DashboardPage.tsx` | `24px` (styled component) |
| `WeeklyProgressPage.tsx` | `20px` (inline style) |
| `ui/Card.tsx` (shared) | Inherits from theme |

**Recommendation:** Card padding should be set in the shared `Card` component. If variants are needed, add `$compact` and `$spacious` props.

---

### 6.5 Inconsistent Transition Timing (MEDIUM)

| Transition | Files |
|---|---|
| `0.2s ease` | AppHeader, VersionHistoryPage, WhatsNewModal, most buttons |
| `0.3s ease` | StyledCalendar, DayTaskListModal, Modal overlay |
| `all 0.2s` | QuickAddTaskModal, CalendarFilters |
| `0.15s ease-in-out` | TaskItem |

**Recommendation:** Add `transitions` tokens:
```tsx
export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
};
```

---

### 6.6 Icon Size Inconsistency (MEDIUM)

Header/navigation icons vary between `16px`, `18px`, `20px`, and `24px` without clear reasoning:

| Context | Sizes Used |
|---|---|
| Modal close buttons | `24px` (WhatsNewModal), `20px` (EditTaskModal) |
| Inline icons in text | `14px`, `16px` |
| Stat card icons | `24px` |
| Profile label icons | `20px` |
| Button icons | `16px`, `18px` |

**Recommendation:** Add `iconSize` tokens:
```tsx
export const iconSize = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};
```

---

### 6.7 Inconsistent "Empty State" Patterns (LOW)

Different pages show empty states differently:

| File | Pattern |
|---|---|
| `TasksPage.tsx` | Uses `Alert` component with message |
| `EventsPage.tsx` | Uses `Alert` component with message |
| `WeeklyProgressPage.tsx` | Custom `Card` with inline styling and emoji |
| `DayTaskListModal.tsx` | Plain `<p>` text |

**Recommendation:** Create an `EmptyState` component in the shared UI package.

---

## Gold Standard Files

These files demonstrate correct patterns and should be used as references when fixing violations:

| File | Why It's Exemplary |
|---|---|
| [CalculatorModal.tsx](apps/web/src/components/CalculatorModal.tsx) | Imports and uses `spacing` and `typography` tokens from `@life-manager/ui/styles` |
| [ThemeToggle.tsx](apps/web/src/components/ThemeToggle.tsx) | Proper theme colours, `aria-label`, clean component pattern |
| [TaskGroupItem.tsx](apps/web/src/components/task-groups/TaskGroupItem.tsx) | Uses shared `Badge`, `Text`; has keyboard/ARIA support |
| [PageLayout.tsx](apps/web/src/components/layout/PageLayout.tsx) | Consistent page wrapper with loading/error states |
| [LoginForm.tsx](apps/web/src/components/auth/LoginForm.tsx) | Uses shared FormGroup, Label, Input, Button, Alert; has aria labels |
| [BarChartWrapper.tsx](apps/web/src/components/charts/BarChartWrapper.tsx) | Has `aria-label` on chart container |
| [DesignSystemPage.tsx](apps/web/src/pages/design-system/DesignSystemPage.tsx) | Reference implementation of all tokens and components |
| [SubtaskItem.tsx](apps/web/src/components/tasks/SubtaskItem.tsx) | Comprehensive ARIA: role, aria-label on every interactive element |

---

## Consistency Patterns (Current vs Target)

| Pattern | Current State | Target State |
|---|---|---|
| **Styling system** | Mixed styled-components + Tailwind | styled-components only |
| **Spacing** | Hardcoded px (98% of files) | `spacing.*` tokens from `@life-manager/ui/styles` |
| **Typography** | Hardcoded font-size/weight | `typography.*` mixins from `@life-manager/ui/styles` |
| **Colours** | Mix of theme.colors + hardcoded hex | `theme.colors.*` exclusively |
| **Shadows** | Hardcoded `rgba(0,0,0,...)` | `theme.colors.shadow` or `shadows.*` tokens |
| **Border radius** | Random values (4–16px) | `borderRadius.*` token scale |
| **Components** | Shared UI + local duplicates | Shared UI components only |
| **Page layout** | 3 different patterns | `PageLayout` wrapper on every page |
| **Modals** | 6+ custom implementations | Shared `ui/Modal` component |
| **Error handling** | Mix of typed/untyped catch | `catch (error: unknown)` everywhere |
| **Component def** | Mix of React.FC and arrow fn | Named arrow function with typed props |
| **Button variants** | Inconsistent per-form | Consistent convention (see §3.7) |
| **Accessibility** | Partial (subtasks excellent, rest patchy) | ARIA on all interactive elements |

---

## Recommended Fix Order

### Phase 1: Critical Fixes (Week 1, ~2 days)
1. Convert 4 Tailwind auth pages to styled-components
2. Refactor RegisterForm to use shared UI components
3. Fix all 4 React.FC usages
4. Add `: unknown` to all catch blocks

### Phase 2: Design Token Adoption (Week 1–2, ~3 days)
5. Replace all hardcoded hex colours with theme.colors
6. Replace hardcoded `rgba()` shadows with theme token
7. Begin adopting `spacing.*` tokens (start with most-changed files)
8. Begin adopting `typography.*` mixins

### Phase 3: Layout Consistency (Week 2, ~2 days)
9. Wrap ProfilePage, VersionHistoryPage, WeeklyProgressPage in PageLayout
10. Consolidate all modals to use `ui/Modal`
11. Replace inline styles with styled components
12. Standardise Button variants across all forms

### Phase 4: Accessibility & Polish (Week 3, ~2 days)
13. Add ARIA labels to all chart components
14. Add focus trapping to Modal component
15. Add labels to all form fields
16. Add keyboard handlers to clickable divs
17. Create responsive breakpoints for grid layouts

### Phase 5: Design System Expansion (Week 3, ~1 day)
18. Add `borderRadius` tokens to design system
19. Add `shadows` token scale
20. Add `transitions` token scale
21. Add `iconSize` constants
22. Create `EmptyState` and `FormGrid` shared components

---

*End of report. No code changes have been made.*
