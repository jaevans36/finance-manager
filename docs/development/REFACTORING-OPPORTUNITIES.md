# Code Refactoring Opportunities

This document tracks identified opportunities for code improvements and technical debt reduction.

**Last Updated**: 2026-01-15

---

## Weekly Progress Page Component Refactoring

**Status**: ⏳ Planned  
**Priority**: Medium  
**Estimated Effort**: 2-3 hours

### Context

The [apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx](../../apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx) file is **1213 lines long**, making it one of the largest components in the codebase. While 10 reusable components have been created in `components/`, only 2 are currently integrated:

- ✅ `ChartCard` - Integrated
- ✅ `ErrorDisplay` - Integrated
- ❌ `StatisticCard` - Created but unused (75 lines)
- ❌ `DateNavigation` - Created but unused (51 lines)
- ❌ `WeeklyGoalCard` - Created but unused (60 lines)
- ❌ `DailyTaskCard` - Created but unused (207 lines)
- ❌ `UrgentTasksCard` - Created but unused (100 lines)
- ❌ `ViewModeSelector` - Created but unused (62 lines)
- ❌ `GroupFilter` - Created but unused (69 lines)
- ❌ `InsightCard` - Created but unused (76 lines)

### Issue

The components were created with specific prop interfaces that don't match the current usage patterns in WeeklyProgressPage. For example:

**DateNavigation Component**:
```typescript
interface DateNavigationProps {
  currentStartDate: Date;
  viewMode: 'week' | 'month' | 'custom';
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  formatDateRange: (date: Date) => string;
}
```

**Current Usage in WeeklyProgressPage** needs:
- Separate `onNavigateWeek` and `onNavigateMonth` handlers
- Custom date range inputs with separate state management
- Different formatting functions for week vs month

### Solution Options

1. **Refactor Components** (Preferred):
   - Update component interfaces to match current usage patterns
   - Make components more flexible with optional props
   - Add union types for different view modes

2. **Refactor WeeklyProgressPage**:
   - Simplify page logic to match component interfaces
   - Consolidate navigation handlers
   - Unified date formatting

3. **Hybrid Approach**:
   - Some components need interface changes
   - Some page logic can be simplified
   - Balance between flexibility and simplicity

### Benefits of Completing This Work

- **Maintainability**: Smaller, focused components easier to test and modify
- **Reusability**: Components can be used in other dashboards/reports
- **Testability**: Isolated components are easier to unit test
- **Performance**: Smaller component trees can re-render more efficiently
- **Developer Experience**: Clearer separation of concerns

### Estimated Impact

- **File Size Reduction**: ~30-40% (1213 → ~750 lines)
- **Component Count**: 8 additional integrated components
- **Test Coverage**: Easier to write isolated component tests
- **Bundle Size**: No change (components already exist)

### Blockers

None - this is purely technical debt reduction.

### Related Files

- [apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx](../../apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx) (1213 lines)
- [apps/web/src/pages/weekly-progress/components/](../../apps/web/src/pages/weekly-progress/components/) (8 unused components)

---

## Future Refactoring Opportunities

### Dashboard Page Components

**Status**: 🔍 To Investigate  
**File**: [apps/web/src/pages/dashboard/DashboardPage.tsx](../../apps/web/src/pages/dashboard/DashboardPage.tsx)

Similar pattern - could benefit from component extraction.

### Calendar Page Components

**Status**: 🔍 To Investigate  
**File**: [apps/web/src/pages/calendar/CalendarPage.tsx](../../apps/web/src/pages/calendar/CalendarPage.tsx)

Already has some extracted components (EmptyCalendarState, KeyboardShortcutsHint). Could investigate further opportunities.

---

## How to Contribute

When identifying new refactoring opportunities:

1. **Document the Issue**: What makes the code difficult to maintain?
2. **Quantify the Problem**: Line counts, complexity metrics, duplication
3. **Propose Solutions**: List 2-3 approaches with trade-offs
4. **Estimate Impact**: What improvements would this bring?
5. **Identify Blockers**: Are there dependencies or risks?

**Update this document** when:
- Starting refactoring work (change status to 🚧 In Progress)
- Completing refactoring (change status to ✅ Complete, add PR link)
- Discovering new opportunities (add new section)
