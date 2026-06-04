# Phase 58 Frontend & Tests — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all frontend UI and tests for Phase 58's task assignment, event sharing, notifications, and statistics updates, consuming the backend endpoints delivered in Plans 1 and 2.

**Architecture:** New service modules (`sharingService`, `notificationService`) follow the existing `apiClient`-based pattern. TanStack Query hooks wrap those services with structured cache keys added to `query-keys.ts`. UI components are feature-scoped under `features/tasks`, `features/events`, and `features/sharing`; layout-level pieces (`NotificationBell`, `NotificationDropdown`) live in `components/layout`. The `/notifications` route is added to `App.tsx` alongside a lazy-loaded `NotificationsPage`.

**Tech Stack:** React 18, TypeScript 5.7, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod, Jest, RTL

**Prerequisites:** Plans 1 and 2 complete — all backend endpoints must be available. Specifically:
- `PATCH /api/v1/tasks/{id}/assign` and `PATCH /api/v1/tasks/{id}/unassign`
- `GET /api/v1/tasks?view=...`
- All `/api/v1/events/{id}/shares` endpoints
- All `/api/v1/sharing/invitations` endpoints
- All `/api/v1/notifications` endpoints
- `GET /api/v1/statistics/weekly` now returns `delegated` and `assignedToMe` fields

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `apps/web/src/services/sharingService.ts` | Event share + invitation API calls |
| `apps/web/src/services/notificationService.ts` | Notification API calls |
| `apps/web/src/hooks/queries/useNotifications.ts` | TanStack Query hooks for notifications |
| `apps/web/src/hooks/queries/useEventShares.ts` | TanStack Query hooks for event shares |
| `apps/web/src/features/tasks/components/AssignTaskModal.tsx` | Modal to assign/unassign a task to a user |
| `apps/web/src/features/tasks/components/TaskAssignmentBadge.tsx` | "Assigned to" / "From" chip |
| `apps/web/src/features/events/components/ShareEventModal.tsx` | Modal to share an event with permission selector |
| `apps/web/src/features/events/components/EventShareBadge.tsx` | Shared indicator on event cards |
| `apps/web/src/features/sharing/components/InvitationCard.tsx` | Pending invite card with Accept/Decline |
| `apps/web/src/components/layout/NotificationBell.tsx` | Bell icon with unread badge, opens dropdown |
| `apps/web/src/components/layout/NotificationDropdown.tsx` | Last-5 notifications dropdown |
| `apps/web/src/pages/NotificationsPage.tsx` | Full notifications page at `/notifications` |
| `apps/web/tests/components/AssignTaskModal.test.tsx` | RTL tests for AssignTaskModal |
| `apps/web/tests/components/TaskAssignmentBadge.test.tsx` | RTL tests for TaskAssignmentBadge |
| `apps/web/tests/components/ShareEventModal.test.tsx` | RTL tests for ShareEventModal |
| `apps/web/tests/components/EventShareBadge.test.tsx` | RTL tests for EventShareBadge |
| `apps/web/tests/components/NotificationBell.test.tsx` | RTL tests for NotificationBell |
| `apps/web/tests/components/NotificationsPage.test.tsx` | RTL tests for NotificationsPage |
| `apps/web/tests/components/InvitationCard.test.tsx` | RTL tests for InvitationCard |

### Modified files

| File | Change |
|------|--------|
| `apps/web/src/services/taskService.ts` | Add `assignTask`, `unassignTask`; extend `Task` type with assignment fields; extend `TaskQueryParams` with `view` |
| `apps/web/src/types/statistics.ts` | Add `delegated` and `assignedToMe` fields to `WeeklyStatistics` |
| `apps/web/src/hooks/query-keys.ts` | Add `notifications` and `eventShares` key namespaces |
| `apps/web/src/hooks/queries/index.ts` | Export `useNotifications` and `useEventShares` |
| `apps/web/src/components/AppHeader.tsx` | Import and render `NotificationBell` |
| `apps/web/src/App.tsx` | Add lazy `NotificationsPage`; add `/notifications` protected route |
| `apps/web/src/components/events/EventItem.tsx` | Show `EventShareBadge` when event is shared |
| `apps/web/src/components/tasks/TaskItem.tsx` | Show `TaskAssignmentBadge` when task has assignment; wire "Assign" action |
| `apps/web/src/pages/tasks/TasksPage.tsx` | Add view-filter tabs (All / Mine / Assigned to me / Assigned by me); pass `view` param to `taskService.getTasks` |
| `apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx` | Render two new `StatisticCard` components (Delegated tasks, Assigned to me) |

---

## Chunk 1: Services & Query Hooks

### Task 1.1: Extend `taskService.ts` with assignment fields and view filter

**Files:**
- Modify: `apps/web/src/services/taskService.ts`

- [ ] **Step 1: Extend the `Task` interface** with assignment fields returned by the backend:

```typescript
// Add to the Task interface in taskService.ts
assignedToUserId: string | null;
assignedToUsername: string | null;
assignedByUserId: string | null;
assignedByUsername: string | null;
isOwner: boolean;
```

- [ ] **Step 2: Extend `TaskQueryParams`** with the new view filter:

```typescript
// Add to TaskQueryParams
view?: 'all' | 'mine' | 'assigned-to-me' | 'assigned-by-me';
```

- [ ] **Step 3: Add `assignTask` and `unassignTask` methods** to `taskService`:

```typescript
async assignTask(id: string, usernameOrEmail: string): Promise<Task> {
  const response = await apiClient.patch<Task>(`/tasks/${id}/assign`, { usernameOrEmail });
  statisticsService.invalidateCache();
  return response.data;
},

async unassignTask(id: string): Promise<Task> {
  const response = await apiClient.patch<Task>(`/tasks/${id}/unassign`, {});
  statisticsService.invalidateCache();
  return response.data;
},
```

- [ ] **Commit:** `feat: extend taskService with assignment fields and view filter (T-P58)`

---

### Task 1.2: Extend `statistics` types with delegation fields

**Files:**
- Modify: `apps/web/src/types/statistics.ts`

- [ ] **Step 1: Add delegation fields to `WeeklyStatistics`**:

```typescript
// Add to WeeklyStatistics interface
delegated: number;
assignedToMe: number;
```

- [ ] **Commit:** `feat: add delegated/assignedToMe fields to WeeklyStatistics type (T-P58)`

---

### Task 1.3: Create `sharingService.ts`

**Files:**
- New: `apps/web/src/services/sharingService.ts`

- [ ] **Step 1: Create the file** with full TypeScript types and all API calls:

```typescript
import { apiClient } from './api-client';

export type EventSharePermission = 'View' | 'Edit' | 'Manage';

export interface EventShare {
  id: string;
  eventId: string;
  sharedWithUserId: string;
  username: string;
  email: string;
  permission: EventSharePermission;
  status: 'Pending' | 'Accepted' | 'Declined';
  createdAt: string;
}

export interface CreateEventShareRequest {
  usernameOrEmail: string;
  permission: EventSharePermission;
}

export interface UpdateEventShareRequest {
  permission: EventSharePermission;
}

export const sharingService = {
  async getEventShares(eventId: string): Promise<EventShare[]> {
    const response = await apiClient.get<EventShare[]>(`/events/${eventId}/shares`);
    return response.data;
  },

  async createEventShare(eventId: string, request: CreateEventShareRequest): Promise<EventShare> {
    const response = await apiClient.post<EventShare>(`/events/${eventId}/shares`, request);
    return response.data;
  },

  async updateEventShare(eventId: string, shareId: string, request: UpdateEventShareRequest): Promise<EventShare> {
    const response = await apiClient.put<EventShare>(`/events/${eventId}/shares/${shareId}`, request);
    return response.data;
  },

  async deleteEventShare(eventId: string, shareId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/shares/${shareId}`);
  },

  async getPendingInvitations(): Promise<EventShare[]> {
    const response = await apiClient.get<EventShare[]>('/sharing/invitations');
    return response.data;
  },

  async acceptInvitation(shareId: string): Promise<void> {
    await apiClient.post(`/sharing/invitations/${shareId}/accept`, {});
  },

  async declineInvitation(shareId: string): Promise<void> {
    await apiClient.post(`/sharing/invitations/${shareId}/decline`, {});
  },
};
```

- [ ] **Commit:** `feat: add sharingService for event share API calls (T-P58)`

---

### Task 1.4: Create `notificationService.ts`

**Files:**
- New: `apps/web/src/services/notificationService.ts`

- [ ] **Step 1: Create the file** with types and all API calls:

```typescript
import { apiClient } from './api-client';

export type NotificationType =
  | 'TaskAssigned'
  | 'TaskUnassigned'
  | 'TaskCompletedByAssignee'
  | 'EventShareInvitation'
  | 'EventShareAccepted'
  | 'EventShareDeclined';

export interface Notification {
  id: string;
  type: NotificationType;
  entityId: string;
  entityTitle: string;
  fromUserId: string;
  fromUsername: string;
  isRead: boolean;
  createdAt: string;
  /** Present when type is EventShareInvitation — the shareId to accept/decline */
  shareId?: string;
}

export interface NotificationListParams {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationService = {
  async getNotifications(params?: NotificationListParams): Promise<Notification[]> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    const response = await apiClient.get<Notification[]>(`/notifications${queryString}`);
    return response.data;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`, {});
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all', {});
  },
};
```

- [ ] **Commit:** `feat: add notificationService for notification API calls (T-P58)`

---

### Task 1.5: Extend `query-keys.ts` with new namespaces

**Files:**
- Modify: `apps/web/src/hooks/query-keys.ts`

- [ ] **Step 1: Add `notifications` and `eventShares` namespaces** inside the `queryKeys` object before the closing `} as const`:

```typescript
notifications: {
  all: ['notifications'] as const,
  lists: () => [...queryKeys.notifications.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...queryKeys.notifications.lists(), params] as const,
  unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
},

eventShares: {
  all: ['eventShares'] as const,
  byEvent: (eventId: string) => [...queryKeys.eventShares.all, eventId] as const,
  invitations: () => [...queryKeys.eventShares.all, 'invitations'] as const,
},
```

- [ ] **Commit:** `feat: add notifications and eventShares query keys (T-P58)`

---

### Task 1.6: Create `useNotifications.ts`

**Files:**
- New: `apps/web/src/hooks/queries/useNotifications.ts`

- [ ] **Step 1: Create the file** with query and mutation hooks:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type NotificationListParams } from '@/services/notificationService';
import { queryKeys } from '../query-keys';

/** Fetch paginated notifications */
export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params as Record<string, unknown>),
    queryFn: () => notificationService.getNotifications(params),
  });
}

/** Poll unread notification count every 60 seconds */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
}

/** Mark a single notification as read */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Mark all notifications as read */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
```

- [ ] **Commit:** `feat: add useNotifications TanStack Query hooks (T-P58)`

---

### Task 1.7: Create `useEventShares.ts`

**Files:**
- New: `apps/web/src/hooks/queries/useEventShares.ts`

- [ ] **Step 1: Create the file** with query and mutation hooks:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sharingService,
  type CreateEventShareRequest,
  type UpdateEventShareRequest,
} from '@/services/sharingService';
import { queryKeys } from '../query-keys';

/** Fetch shares for a given event */
export function useEventShares(eventId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventShares.byEvent(eventId),
    queryFn: () => sharingService.getEventShares(eventId),
    enabled: !!eventId && enabled,
  });
}

/** Fetch pending share invitations for the current user */
export function usePendingInvitations() {
  return useQuery({
    queryKey: queryKeys.eventShares.invitations(),
    queryFn: () => sharingService.getPendingInvitations(),
  });
}

/** Create a new event share */
export function useCreateEventShare(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateEventShareRequest) =>
      sharingService.createEventShare(eventId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.byEvent(eventId) });
    },
  });
}

/** Update permission on an existing event share */
export function useUpdateEventShare(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, request }: { shareId: string; request: UpdateEventShareRequest }) =>
      sharingService.updateEventShare(eventId, shareId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.byEvent(eventId) });
    },
  });
}

/** Delete an event share */
export function useDeleteEventShare(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => sharingService.deleteEventShare(eventId, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.byEvent(eventId) });
    },
  });
}

/** Accept a share invitation */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => sharingService.acceptInvitation(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.invitations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Decline a share invitation */
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => sharingService.declineInvitation(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventShares.invitations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
```

- [ ] **Step 2: Export from `hooks/queries/index.ts`** — add these two lines:

```typescript
export * from './useNotifications';
export * from './useEventShares';
```

- [ ] **Commit:** `feat: add useEventShares TanStack Query hooks (T-P58)`

---

## Chunk 2: Task Assignment UI

### Task 2.1: Create `TaskAssignmentBadge.tsx`

**Files:**
- New: `apps/web/src/features/tasks/components/TaskAssignmentBadge.tsx`

- [ ] **Step 1: Create the component.** Owner sees a muted chip; assignee sees an accent chip:

```typescript
import { cn } from '@/lib/utils';
import { UserCheck } from 'lucide-react';

interface TaskAssignmentBadgeProps {
  /** The task object is the current user's owner perspective */
  isOwner: boolean;
  assignedToUsername: string | null;
  assignedByUsername: string | null;
  className?: string;
}

export function TaskAssignmentBadge({
  isOwner,
  assignedToUsername,
  assignedByUsername,
  className,
}: TaskAssignmentBadgeProps) {
  if (isOwner && assignedToUsername) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
          className,
        )}
        title={`Assigned to @${assignedToUsername}`}
      >
        <UserCheck size={11} />
        Assigned to @{assignedToUsername}
      </span>
    );
  }

  if (!isOwner && assignedByUsername) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary',
          className,
        )}
        title={`Assigned by @${assignedByUsername}`}
      >
        <UserCheck size={11} />
        From @{assignedByUsername}
      </span>
    );
  }

  return null;
}
```

- [ ] **Commit:** `feat: add TaskAssignmentBadge component (T-P58)`

---

### Task 2.2: Create `AssignTaskModal.tsx`

**Files:**
- New: `apps/web/src/features/tasks/components/AssignTaskModal.tsx`

- [ ] **Step 1: Create the component.** Uses `apiClient` via `taskService`; shows current assignee with reassign/unassign option. Owner-only:

```typescript
import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/contexts/ToastContext';
import { taskService, type Task } from '@/services/taskService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/query-keys';

interface AssignTaskModalProps {
  task: Task;
  onClose: () => void;
}

export function AssignTaskModal({ task, onClose }: AssignTaskModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = usernameOrEmail.trim();
    if (!value) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await taskService.assignTask(task.id, value);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Task assigned successfully');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await taskService.unassignTask(task.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('Assignment removed');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unassign task';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current assignee */}
          {task.assignedToUsername && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Currently assigned to</p>
                <p className="text-sm text-muted-foreground">@{task.assignedToUsername}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnassign}
                disabled={isSubmitting}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <UserMinus size={14} />
                Unassign
              </Button>
            </div>
          )}

          {/* Assign form */}
          <form onSubmit={handleAssign} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="assign-user">
                {task.assignedToUsername ? 'Reassign to' : 'Assign to'}
              </Label>
              <Input
                id="assign-user"
                placeholder="Username or email address"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !usernameOrEmail.trim()}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                {task.assignedToUsername ? 'Reassign' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Commit:** `feat: add AssignTaskModal component (T-P58)`

---

### Task 2.3: Wire `TaskAssignmentBadge` into `TaskItem.tsx` and add Assign button

**Files:**
- Modify: `apps/web/src/components/tasks/TaskItem.tsx`

- [ ] **Step 1: Import `TaskAssignmentBadge`** and add `onAssign` prop to `TaskItemProps`:

```typescript
// Add to imports
import { TaskAssignmentBadge } from '../../features/tasks/components/TaskAssignmentBadge';

// Add to TaskItemProps
onAssign?: (task: Task) => void;
```

- [ ] **Step 2: Render the badge** in the task metadata row (after existing badges, before due date):

```tsx
{/* Assignment badge — shown to both owner and assignee */}
{(task.assignedToUsername || task.assignedByUsername) && (
  <TaskAssignmentBadge
    isOwner={task.isOwner ?? true}
    assignedToUsername={task.assignedToUsername ?? null}
    assignedByUsername={task.assignedByUsername ?? null}
  />
)}
```

- [ ] **Step 3: Add Assign button** in the actions row (owner-only, next to Edit button):

```tsx
{/* Only show Assign button to task owner */}
{task.isOwner !== false && onAssign && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => onAssign(task)}
    aria-label={`Assign task "${task.title}"`}
  >
    Assign
  </Button>
)}
```

- [ ] **Commit:** `feat: add assignment badge and assign button to TaskItem (T-P58)`

---

### Task 2.4: Add view-filter tabs to `TasksPage.tsx`

**Files:**
- Modify: `apps/web/src/pages/tasks/TasksPage.tsx`

- [ ] **Step 1: Import shadcn Tabs and `AssignTaskModal`**:

```typescript
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AssignTaskModal } from '../../features/tasks/components/AssignTaskModal';
```

- [ ] **Step 2: Add view state** near the top of the component body:

```typescript
const [taskView, setTaskView] = useState<'all' | 'mine' | 'assigned-to-me' | 'assigned-by-me'>('all');
const [assigningTask, setAssigningTask] = useState<Task | null>(null);
```

- [ ] **Step 3: Pass `view` to `taskService.getTasks`** inside `loadTasks`:

```typescript
const tasks = await taskService.getTasks({ view: taskView });
```

- [ ] **Step 4: Re-run `loadTasks` when `taskView` changes** — add `taskView` to the relevant `useEffect` dependency array.

- [ ] **Step 5: Render the tab strip** just above the task list (below the page title row):

```tsx
<Tabs
  value={taskView}
  onValueChange={(v) => setTaskView(v as typeof taskView)}
  className="mb-4"
>
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="mine">Mine</TabsTrigger>
    <TabsTrigger value="assigned-to-me">Assigned to me</TabsTrigger>
    <TabsTrigger value="assigned-by-me">Assigned by me</TabsTrigger>
  </TabsList>
</Tabs>
```

- [ ] **Step 6: Pass `onAssign` to `TaskList`** (which should forward it to each `TaskItem`):

```tsx
<TaskList
  tasks={filteredTasks}
  onToggleComplete={handleToggleComplete}
  onEdit={setEditingTask}
  onDelete={handleDeleteTask}
  onAssign={setAssigningTask}
/>
```

- [ ] **Step 7: Render `AssignTaskModal`** at the bottom of the JSX tree:

```tsx
{assigningTask && (
  <AssignTaskModal
    task={assigningTask}
    onClose={() => setAssigningTask(null)}
  />
)}
```

- [ ] **Commit:** `feat: add task view filter tabs and assign modal wiring to TasksPage (T-P58)`

---

## Chunk 3: Event Sharing UI

### Task 3.1: Create `EventShareBadge.tsx`

**Files:**
- New: `apps/web/src/features/events/components/EventShareBadge.tsx`

- [ ] **Step 1: Create the component**:

```typescript
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventShareBadgeProps {
  shareCount: number;
  className?: string;
}

export function EventShareBadge({ shareCount, className }: EventShareBadgeProps) {
  if (shareCount === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary',
        className,
      )}
      title={`Shared with ${shareCount} ${shareCount === 1 ? 'person' : 'people'}`}
    >
      <Users size={11} />
      Shared
    </span>
  );
}
```

- [ ] **Commit:** `feat: add EventShareBadge component (T-P58)`

---

### Task 3.2: Create `ShareEventModal.tsx`

**Files:**
- New: `apps/web/src/features/events/components/ShareEventModal.tsx`

- [ ] **Step 1: Create the component.** Closely mirrors `ShareGroupModal` in style but adds a three-level permission selector and permission-update capability:

```typescript
import { useState } from 'react';
import { UserPlus, Trash2, Shield, Eye, Settings, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import {
  useEventShares,
  useCreateEventShare,
  useUpdateEventShare,
  useDeleteEventShare,
} from '@/hooks/queries';
import type { EventSharePermission } from '@/services/sharingService';
import { cn } from '@/lib/utils';

interface ShareEventModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const PERMISSION_OPTIONS: { value: EventSharePermission; label: string; icon: React.ReactNode }[] = [
  { value: 'View', label: 'View', icon: <Eye size={12} /> },
  { value: 'Edit', label: 'Edit', icon: <Shield size={12} /> },
  { value: 'Manage', label: 'Manage', icon: <Settings size={12} /> },
];

export function ShareEventModal({ eventId, eventTitle, onClose }: ShareEventModalProps) {
  const toast = useToast();
  const { data: shares = [], isLoading } = useEventShares(eventId);
  const createShare = useCreateEventShare(eventId);
  const updateShare = useUpdateEventShare(eventId);
  const deleteShare = useDeleteEventShare(eventId);

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [permission, setPermission] = useState<EventSharePermission>('View');
  const [error, setError] = useState<string | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = usernameOrEmail.trim();
    if (!value) return;
    setError(null);
    try {
      const share = await createShare.mutateAsync({ usernameOrEmail: value, permission });
      setUsernameOrEmail('');
      toast.success(`Shared with @${share.username}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to share event');
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: EventSharePermission) => {
    try {
      await updateShare.mutateAsync({ shareId, request: { permission: newPermission } });
    } catch {
      toast.error('Failed to update permission');
    }
  };

  const handleRemove = async (shareId: string, username: string) => {
    try {
      await deleteShare.mutateAsync(shareId);
      toast.success(`Removed @${username}'s access`);
    } catch {
      toast.error('Failed to remove share');
    }
  };

  const isSubmitting = createShare.isPending;

  return (
    <Modal isOpen onClose={onClose} title={`Share "${eventTitle}"`}>
      {/* Add share form */}
      <form onSubmit={handleShare} className="mb-6">
        <label className="mb-1.5 block text-sm font-medium text-foreground">Add person</label>
        <div className="flex gap-2">
          <Input
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Username or email"
            className="flex-1"
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as EventSharePermission)}
            className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PERMISSION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button
            type="submit"
            disabled={isSubmitting || !usernameOrEmail.trim()}
            className="gap-1.5"
            size="sm"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Share
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </form>

      {/* Permission legend */}
      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Eye size={12} /> View — read only</span>
        <span className="flex items-center gap-1"><Shield size={12} /> Edit — can modify event</span>
        <span className="flex items-center gap-1"><Settings size={12} /> Manage — can share &amp; delete</span>
      </div>

      {/* Current shares */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          {isLoading
            ? 'Loading…'
            : shares.length === 0
            ? 'Not shared with anyone yet'
            : `Shared with ${shares.length} ${shares.length === 1 ? 'person' : 'people'}`}
        </p>
        {shares.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {shares.map((share) => (
              <li key={share.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {share.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">@{share.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{share.email}</p>
                </div>
                <select
                  value={share.permission}
                  onChange={(e) => handleUpdatePermission(share.id, e.target.value as EventSharePermission)}
                  className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label={`Permission for @${share.username}`}
                >
                  {PERMISSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-xs font-medium',
                  share.status === 'Pending' && 'bg-warning/15 text-warning',
                  share.status === 'Accepted' && 'bg-success/15 text-success',
                  share.status === 'Declined' && 'bg-muted text-muted-foreground',
                )}>
                  {share.status}
                </span>
                <button
                  onClick={() => handleRemove(share.id, share.username)}
                  className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title={`Remove @${share.username}'s access`}
                  aria-label={`Remove @${share.username}'s access`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
```

- [ ] **Commit:** `feat: add ShareEventModal component (T-P58)`

---

### Task 3.3: Wire sharing into `EventItem.tsx`

**Files:**
- Modify: `apps/web/src/components/events/EventItem.tsx`

- [ ] **Step 1: Add `onShare` prop and `shareCount` to `EventItemProps`**:

```typescript
interface EventItemProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onShare?: (event: Event) => void;
  shareCount?: number;
}
```

- [ ] **Step 2: Import `EventShareBadge`** and render it in the badge row:

```typescript
import { EventShareBadge } from '../../features/events/components/EventShareBadge';

// In JSX, after existing badges:
{(shareCount ?? 0) > 0 && <EventShareBadge shareCount={shareCount ?? 0} />}
```

- [ ] **Step 3: Add a Share button** in the actions row:

```tsx
{onShare && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => onShare(event)}
    aria-label={`Share event "${event.title}"`}
  >
    Share
  </Button>
)}
```

- [ ] **Commit:** `feat: add share button and EventShareBadge to EventItem (T-P58)`

---

## Chunk 4: Notifications UI (Bell, Dropdown, Page)

### Task 4.1: Create `NotificationDropdown.tsx`

**Files:**
- New: `apps/web/src/components/layout/NotificationDropdown.tsx`

- [ ] **Step 1: Create the component**. Displays last 5 notifications; each row shows type icon, entity title, from username, and relative time:

```typescript
import { useNavigate } from 'react-router-dom';
import { Bell, UserCheck, UserMinus, CheckCircle, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/queries';
import type { NotificationType } from '@/services/notificationService';

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  TaskAssigned: <UserCheck size={14} className="text-primary" />,
  TaskUnassigned: <UserMinus size={14} className="text-muted-foreground" />,
  TaskCompletedByAssignee: <CheckCircle size={14} className="text-success" />,
  EventShareInvitation: <Calendar size={14} className="text-primary" />,
  EventShareAccepted: <Calendar size={14} className="text-success" />,
  EventShareDeclined: <Calendar size={14} className="text-destructive" />,
};

const TYPE_LABELS: Record<NotificationType, string> = {
  TaskAssigned: 'assigned you a task',
  TaskUnassigned: 'unassigned a task',
  TaskCompletedByAssignee: 'completed an assigned task',
  EventShareInvitation: 'shared an event with you',
  EventShareAccepted: 'accepted your event share',
  EventShareDeclined: 'declined your event share',
};

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotifications({ pageSize: 5 });
  const markAllRead = useMarkAllNotificationsRead();

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
  };

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-background shadow-lg"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
          className="h-auto py-0.5 text-xs text-muted-foreground"
        >
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          You're all caught up
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 text-sm',
                !notification.isRead && 'bg-primary/5',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {TYPE_ICONS[notification.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-foreground">{notification.entityTitle}</p>
                <p className="text-xs text-muted-foreground">
                  @{notification.fromUsername} {TYPE_LABELS[notification.type]}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(notification.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border px-4 py-2">
        <button
          onClick={handleViewAll}
          className="flex w-full items-center justify-between text-xs text-primary hover:underline"
        >
          View all notifications
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Commit:** `feat: add NotificationDropdown component (T-P58)`

---

### Task 4.2: Create `NotificationBell.tsx`

**Files:**
- New: `apps/web/src/components/layout/NotificationBell.tsx`

- [ ] **Step 1: Create the component.** Polls unread count every 60 seconds; click toggles `NotificationDropdown`:

```typescript
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadNotificationCount } from '@/hooks/queries';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data } = useUnreadNotificationCount();
  const unreadCount = data?.count ?? 0;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
            : 'Notifications'
        }
        className="relative size-9 md:size-8"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
}
```

- [ ] **Commit:** `feat: add NotificationBell component (T-P58)`

---

### Task 4.3: Create `InvitationCard.tsx`

**Files:**
- New: `apps/web/src/features/sharing/components/InvitationCard.tsx`

- [ ] **Step 1: Create the component**:

```typescript
import { Calendar, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAcceptInvitation, useDeclineInvitation } from '@/hooks/queries';
import type { EventShare } from '@/services/sharingService';

interface InvitationCardProps {
  share: EventShare;
}

export function InvitationCard({ share }: InvitationCardProps) {
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();
  const isLoading = accept.isPending || decline.isPending;

  return (
    <Card className="flex items-center gap-4 px-4 py-3">
      <Calendar size={20} className="shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{share.eventId}</p>
        <p className="text-xs text-muted-foreground">
          Shared by @{share.username} &bull; {share.permission} access
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => decline.mutate(share.id)}
          disabled={isLoading}
          aria-label="Decline invitation"
        >
          {decline.isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
          Decline
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => accept.mutate(share.id)}
          disabled={isLoading}
          aria-label="Accept invitation"
        >
          {accept.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Accept
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Commit:** `feat: add InvitationCard component (T-P58)`

---

### Task 4.4: Create `NotificationsPage.tsx`

**Files:**
- New: `apps/web/src/pages/NotificationsPage.tsx`

- [ ] **Step 1: Create the page**:

```typescript
import { Bell } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  usePendingInvitations,
} from '@/hooks/queries';
import { InvitationCard } from '@/features/sharing/components/InvitationCard';
import type { NotificationType } from '@/services/notificationService';

const TYPE_LABELS: Record<NotificationType, string> = {
  TaskAssigned: 'assigned you a task',
  TaskUnassigned: 'unassigned a task',
  TaskCompletedByAssignee: 'completed an assigned task',
  EventShareInvitation: 'shared an event with you',
  EventShareAccepted: 'accepted your event share',
  EventShareDeclined: 'declined your event share',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const NotificationsPage = () => {
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: pendingInvitations = [] } = usePendingInvitations();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageLayout title="Notifications">
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pending invitations
            </h2>
            <div className="space-y-2">
              {pendingInvitations.map((share) => (
                <InvitationCard key={share.id} share={share} />
              ))}
            </div>
          </section>
        )}

        {/* Notifications list */}
        <section>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Bell size={40} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You're all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/40',
                    !notification.isRead && 'bg-primary/5',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {notification.entityTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{notification.fromUsername} {TYPE_LABELS[notification.type]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-auto py-0.5 text-xs"
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageLayout>
  );
};

export default NotificationsPage;
```

- [ ] **Commit:** `feat: add NotificationsPage (T-P58)`

---

## Chunk 5: Statistics Dashboard Updates

### Task 5.1: Add delegation stat cards to `WeeklyProgressPage.tsx`

**Files:**
- Modify: `apps/web/src/pages/weekly-progress/WeeklyProgressPage.tsx`

- [ ] **Step 1: Locate the existing statistics cards grid** (the section rendering `StatisticCard` components for total tasks, completed tasks, completion percentage, etc.).

- [ ] **Step 2: Add two new `StatisticCard` components** after the existing cards:

```tsx
{/* Delegated tasks card — only meaningful when stats are loaded */}
<StatisticCard
  label="Delegated tasks"
  value={stats?.delegated ?? 0}
  valueColor={stats?.delegated ? undefined : 'hsl(var(--muted-foreground))'}
/>

<StatisticCard
  label="Assigned to me"
  value={stats?.assignedToMe ?? 0}
  valueColor={stats?.assignedToMe ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
/>
```

- [ ] **Commit:** `feat: add Delegated tasks and Assigned to me stat cards to WeeklyProgressPage (T-P58)`

---

## Chunk 6: Routing & Navigation Integration

### Task 6.1: Add `/notifications` route to `App.tsx`

**Files:**
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Add lazy import** for `NotificationsPage` alongside the other lazy imports:

```typescript
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
```

- [ ] **Step 2: Add the protected route** after the `/help` route:

```tsx
<Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Commit:** `feat: add /notifications route to App.tsx (T-P58)`

---

### Task 6.2: Add `NotificationBell` to `AppHeader.tsx`

**Files:**
- Modify: `apps/web/src/components/AppHeader.tsx`

- [ ] **Step 1: Import `NotificationBell`**:

```typescript
import { NotificationBell } from './layout/NotificationBell';
```

- [ ] **Step 2: Render `NotificationBell`** in the right-side button group, between the Help button and the Calculator button:

```tsx
{/* Notification bell */}
<NotificationBell />
```

- [ ] **Commit:** `feat: add NotificationBell to AppHeader (T-P58)`

---

### Task 6.3: Build verification

- [ ] **Step 1: Run the frontend build** to confirm no TypeScript errors:

```
pnpm --filter @life-manager/web build
```

Fix any type errors before proceeding.

- [ ] **Commit:** `fix: resolve any TypeScript errors from Phase 58 frontend changes (T-P58)` (only if fixes needed)

---

## Chunk 7: Frontend Tests

All tests live under `apps/web/tests/components/` following the existing pattern. Use `renderWithProviders` from `tests/utils/test-utils.tsx`. Mock `@/services/api-client` and all service modules. The `QueryProvider` wrapper must be added to `renderWithProviders` calls for components that use TanStack Query hooks — wrap in a `QueryClientProvider` with a fresh `QueryClient` per test.

### Task 7.1: `TaskAssignmentBadge.test.tsx`

**Files:**
- New: `apps/web/tests/components/TaskAssignmentBadge.test.tsx`

- [ ] **Step 1: Create the test file**:

```typescript
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import { TaskAssignmentBadge } from '../../src/features/tasks/components/TaskAssignmentBadge';

describe('TaskAssignmentBadge', () => {
  it('renders "Assigned to" chip for owner view', () => {
    render(
      <TaskAssignmentBadge
        isOwner={true}
        assignedToUsername="alice"
        assignedByUsername={null}
      />,
    );
    expect(screen.getByText(/Assigned to @alice/)).toBeInTheDocument();
  });

  it('renders "From" chip for assignee view', () => {
    render(
      <TaskAssignmentBadge
        isOwner={false}
        assignedToUsername={null}
        assignedByUsername="bob"
      />,
    );
    expect(screen.getByText(/From @bob/)).toBeInTheDocument();
  });

  it('renders nothing when no assignment', () => {
    const { container } = render(
      <TaskAssignmentBadge
        isOwner={true}
        assignedToUsername={null}
        assignedByUsername={null}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('owner chip has muted styling', () => {
    render(
      <TaskAssignmentBadge
        isOwner={true}
        assignedToUsername="alice"
        assignedByUsername={null}
      />,
    );
    const chip = screen.getByTitle('Assigned to @alice');
    expect(chip).toHaveClass('bg-muted');
  });

  it('assignee chip has accent styling', () => {
    render(
      <TaskAssignmentBadge
        isOwner={false}
        assignedToUsername={null}
        assignedByUsername="bob"
      />,
    );
    const chip = screen.getByTitle('Assigned by @bob');
    expect(chip).toHaveClass('text-primary');
  });
});
```

- [ ] **Commit:** `test: add TaskAssignmentBadge unit tests (T-P58)`

---

### Task 7.2: `AssignTaskModal.test.tsx`

**Files:**
- New: `apps/web/tests/components/AssignTaskModal.test.tsx`

- [ ] **Step 1: Create the test file** — mock `taskService` and `QueryClient`:

```typescript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { AssignTaskModal } from '../../src/features/tasks/components/AssignTaskModal';
import { taskService } from '../../src/services/taskService';
import type { Task } from '../../src/services/taskService';

jest.mock('../../src/services/taskService', () => ({
  taskService: {
    assignTask: jest.fn(),
    unassignTask: jest.fn(),
  },
}));

const mockTaskService = taskService as jest.Mocked<typeof taskService>;

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const baseTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: null,
  priority: 'Medium',
  completed: false,
  completedAt: null,
  dueDate: null,
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  status: 'NotStarted',
  startedAt: null,
  blockedReason: null,
  urgency: null,
  importance: null,
  quadrant: null,
  energyLevel: null,
  estimatedMinutes: null,
  groupId: null,
  groupName: null,
  groupColour: null,
  parentTaskId: null,
  hasSubtasks: false,
  subtaskCount: 0,
  completedSubtaskCount: 0,
  progressPercentage: 0,
  assignedToUserId: null,
  assignedToUsername: null,
  assignedByUserId: null,
  assignedByUsername: null,
  isOwner: true,
};

describe('AssignTaskModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal title', () => {
    renderWithProviders(<AssignTaskModal task={baseTask} onClose={onClose} />, {}, createWrapper());
    expect(screen.getByText('Assign Task')).toBeInTheDocument();
  });

  it('shows "Assign" label when task has no current assignee', () => {
    renderWithProviders(<AssignTaskModal task={baseTask} onClose={onClose} />, {}, createWrapper());
    expect(screen.getByRole('button', { name: /^Assign$/ })).toBeInTheDocument();
  });

  it('shows current assignee and Unassign button when task is assigned', () => {
    const assignedTask = {
      ...baseTask,
      assignedToUserId: 'user-2',
      assignedToUsername: 'alice',
    };
    renderWithProviders(<AssignTaskModal task={assignedTask} onClose={onClose} />, {}, createWrapper());
    expect(screen.getByText(/Currently assigned to/)).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unassign/ })).toBeInTheDocument();
  });

  it('calls taskService.assignTask on form submit with entered username', async () => {
    mockTaskService.assignTask.mockResolvedValue({ ...baseTask, assignedToUsername: 'bob' });
    renderWithProviders(<AssignTaskModal task={baseTask} onClose={onClose} />, {}, createWrapper());

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'bob' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Assign$/ }));

    await waitFor(() => {
      expect(mockTaskService.assignTask).toHaveBeenCalledWith('task-1', 'bob');
    });
  });

  it('calls taskService.unassignTask when Unassign is clicked', async () => {
    mockTaskService.unassignTask.mockResolvedValue(baseTask);
    const assignedTask = { ...baseTask, assignedToUserId: 'user-2', assignedToUsername: 'alice' };
    renderWithProviders(<AssignTaskModal task={assignedTask} onClose={onClose} />, {}, createWrapper());

    fireEvent.click(screen.getByRole('button', { name: /Unassign/ }));

    await waitFor(() => {
      expect(mockTaskService.unassignTask).toHaveBeenCalledWith('task-1');
    });
  });

  it('shows error message when assignment fails', async () => {
    mockTaskService.assignTask.mockRejectedValue(new Error('User not found'));
    renderWithProviders(<AssignTaskModal task={baseTask} onClose={onClose} />, {}, createWrapper());

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'unknown@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Assign$/ }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    renderWithProviders(<AssignTaskModal task={baseTask} onClose={onClose} />, {}, createWrapper());
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Commit:** `test: add AssignTaskModal unit tests (T-P58)`

---

### Task 7.3: `EventShareBadge.test.tsx`

**Files:**
- New: `apps/web/tests/components/EventShareBadge.test.tsx`

- [ ] **Step 1: Create the test file**:

```typescript
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import { EventShareBadge } from '../../src/features/events/components/EventShareBadge';

describe('EventShareBadge', () => {
  it('renders "Shared" when shareCount > 0', () => {
    render(<EventShareBadge shareCount={3} />);
    expect(screen.getByText('Shared')).toBeInTheDocument();
  });

  it('renders nothing when shareCount is 0', () => {
    const { container } = render(<EventShareBadge shareCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows correct title for single share', () => {
    render(<EventShareBadge shareCount={1} />);
    expect(screen.getByTitle('Shared with 1 person')).toBeInTheDocument();
  });

  it('shows correct title for multiple shares', () => {
    render(<EventShareBadge shareCount={4} />);
    expect(screen.getByTitle('Shared with 4 people')).toBeInTheDocument();
  });
});
```

- [ ] **Commit:** `test: add EventShareBadge unit tests (T-P58)`

---

### Task 7.4: `ShareEventModal.test.tsx`

**Files:**
- New: `apps/web/tests/components/ShareEventModal.test.tsx`

- [ ] **Step 1: Create the test file** — mock `sharingService`:

```typescript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { ShareEventModal } from '../../src/features/events/components/ShareEventModal';
import { sharingService } from '../../src/services/sharingService';
import type { EventShare } from '../../src/services/sharingService';

jest.mock('../../src/services/sharingService', () => ({
  sharingService: {
    getEventShares: jest.fn(),
    createEventShare: jest.fn(),
    updateEventShare: jest.fn(),
    deleteEventShare: jest.fn(),
    getPendingInvitations: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
  },
}));

const mockSharingService = sharingService as jest.Mocked<typeof sharingService>;

const existingShare: EventShare = {
  id: 'share-1',
  eventId: 'event-1',
  sharedWithUserId: 'user-2',
  username: 'alice',
  email: 'alice@example.com',
  permission: 'View',
  status: 'Accepted',
  createdAt: '2026-01-01T00:00:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ShareEventModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSharingService.getEventShares.mockResolvedValue([existingShare]);
  });

  it('renders the modal title', async () => {
    renderWithProviders(
      <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />,
      {},
      createWrapper(),
    );
    expect(screen.getByText('Share "Team Meeting"')).toBeInTheDocument();
  });

  it('displays existing shares', async () => {
    renderWithProviders(
      <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />,
      {},
      createWrapper(),
    );
    await waitFor(() => {
      expect(screen.getByText('@alice')).toBeInTheDocument();
    });
  });

  it('calls createEventShare on form submit', async () => {
    mockSharingService.createEventShare.mockResolvedValue({
      ...existingShare,
      id: 'share-2',
      username: 'bob',
      email: 'bob@example.com',
    });
    renderWithProviders(
      <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />,
      {},
      createWrapper(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'bob' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Share$/ }));

    await waitFor(() => {
      expect(mockSharingService.createEventShare).toHaveBeenCalledWith('event-1', {
        usernameOrEmail: 'bob',
        permission: 'View',
      });
    });
  });

  it('calls deleteEventShare when revoke button is clicked', async () => {
    mockSharingService.deleteEventShare.mockResolvedValue(undefined);
    renderWithProviders(
      <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />,
      {},
      createWrapper(),
    );

    await waitFor(() => {
      expect(screen.getByTitle("Remove @alice's access")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Remove @alice's access"));

    await waitFor(() => {
      expect(mockSharingService.deleteEventShare).toHaveBeenCalledWith('event-1', 'share-1');
    });
  });

  it('shows error when share creation fails', async () => {
    mockSharingService.createEventShare.mockRejectedValue(new Error('User not found'));
    renderWithProviders(
      <ShareEventModal eventId="event-1" eventTitle="Team Meeting" onClose={onClose} />,
      {},
      createWrapper(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Username or email/), {
      target: { value: 'nobody' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Share$/ }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Commit:** `test: add ShareEventModal unit tests (T-P58)`

---

### Task 7.5: `InvitationCard.test.tsx`

**Files:**
- New: `apps/web/tests/components/InvitationCard.test.tsx`

- [ ] **Step 1: Create the test file** — mock `sharingService`:

```typescript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { InvitationCard } from '../../src/features/sharing/components/InvitationCard';
import { sharingService } from '../../src/services/sharingService';
import type { EventShare } from '../../src/services/sharingService';

jest.mock('../../src/services/sharingService', () => ({
  sharingService: {
    getEventShares: jest.fn(),
    createEventShare: jest.fn(),
    updateEventShare: jest.fn(),
    deleteEventShare: jest.fn(),
    getPendingInvitations: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
  },
}));

const mockSharingService = sharingService as jest.Mocked<typeof sharingService>;

const pendingShare: EventShare = {
  id: 'share-1',
  eventId: 'event-1',
  sharedWithUserId: 'user-2',
  username: 'alice',
  email: 'alice@example.com',
  permission: 'View',
  status: 'Pending',
  createdAt: '2026-01-01T00:00:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('InvitationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSharingService.getPendingInvitations.mockResolvedValue([]);
  });

  it('renders Accept and Decline buttons', () => {
    renderWithProviders(<InvitationCard share={pendingShare} />, {}, createWrapper());
    expect(screen.getByRole('button', { name: /Accept/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decline/ })).toBeInTheDocument();
  });

  it('calls sharingService.acceptInvitation with shareId on Accept click', async () => {
    mockSharingService.acceptInvitation.mockResolvedValue(undefined);
    renderWithProviders(<InvitationCard share={pendingShare} />, {}, createWrapper());

    fireEvent.click(screen.getByRole('button', { name: /Accept/ }));

    await waitFor(() => {
      expect(mockSharingService.acceptInvitation).toHaveBeenCalledWith('share-1');
    });
  });

  it('calls sharingService.declineInvitation with shareId on Decline click', async () => {
    mockSharingService.declineInvitation.mockResolvedValue(undefined);
    renderWithProviders(<InvitationCard share={pendingShare} />, {}, createWrapper());

    fireEvent.click(screen.getByRole('button', { name: /Decline/ }));

    await waitFor(() => {
      expect(mockSharingService.declineInvitation).toHaveBeenCalledWith('share-1');
    });
  });

  it('shows permission level', () => {
    renderWithProviders(<InvitationCard share={pendingShare} />, {}, createWrapper());
    expect(screen.getByText(/View access/)).toBeInTheDocument();
  });

  it('shows sharer username', () => {
    renderWithProviders(<InvitationCard share={pendingShare} />, {}, createWrapper());
    expect(screen.getByText(/@alice/)).toBeInTheDocument();
  });
});
```

- [ ] **Commit:** `test: add InvitationCard unit tests (T-P58)`

---

### Task 7.6: `NotificationBell.test.tsx`

**Files:**
- New: `apps/web/tests/components/NotificationBell.test.tsx`

- [ ] **Step 1: Create the test file** — mock `notificationService`:

```typescript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import { NotificationBell } from '../../src/components/layout/NotificationBell';
import { notificationService } from '../../src/services/notificationService';

jest.mock('../../src/services/notificationService', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.getNotifications.mockResolvedValue([]);
    mockNotificationService.markAllRead.mockResolvedValue(undefined);
  });

  it('renders bell button', () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ count: 0 });
    renderWithProviders(<NotificationBell />, {}, createWrapper());
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
  });

  it('shows unread count badge when count > 0', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ count: 3 });
    renderWithProviders(<NotificationBell />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('shows "9+" badge when count > 9', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ count: 12 });
    renderWithProviders(<NotificationBell />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  it('does not show badge when count is 0', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ count: 0 });
    renderWithProviders(<NotificationBell />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  it('opens dropdown on bell click', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ count: 0 });
    renderWithProviders(<NotificationBell />, {}, createWrapper());

    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Notifications/ })).toBeInTheDocument();
    });
  });

  it('has accessible aria-label reflecting unread count', async () => {
    mockNotificationService.getUnreadCount.mockResolvedValue({ count: 2 });
    renderWithProviders(<NotificationBell />, {}, createWrapper());

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /2 unread notifications/ }),
      ).toBeInTheDocument();
    });
  });
});
```

- [ ] **Commit:** `test: add NotificationBell unit tests (T-P58)`

---

### Task 7.7: `NotificationsPage.test.tsx`

**Files:**
- New: `apps/web/tests/components/NotificationsPage.test.tsx`

- [ ] **Step 1: Create the test file** — mock `notificationService` and `sharingService`:

```typescript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import NotificationsPage from '../../src/pages/NotificationsPage';
import { notificationService } from '../../src/services/notificationService';
import { sharingService } from '../../src/services/sharingService';
import type { Notification } from '../../src/services/notificationService';

jest.mock('../../src/services/notificationService', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

jest.mock('../../src/services/sharingService', () => ({
  sharingService: {
    getEventShares: jest.fn(),
    createEventShare: jest.fn(),
    updateEventShare: jest.fn(),
    deleteEventShare: jest.fn(),
    getPendingInvitations: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
  },
}));

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockSharingService = sharingService as jest.Mocked<typeof sharingService>;

const sampleNotification: Notification = {
  id: 'notif-1',
  type: 'TaskAssigned',
  entityId: 'task-1',
  entityTitle: 'Fix login bug',
  fromUserId: 'user-2',
  fromUsername: 'alice',
  isRead: false,
  createdAt: '2026-03-10T09:00:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.getUnreadCount.mockResolvedValue({ count: 0 });
    mockSharingService.getPendingInvitations.mockResolvedValue([]);
    mockNotificationService.markRead.mockResolvedValue(undefined);
    mockNotificationService.markAllRead.mockResolvedValue(undefined);
  });

  it('renders page heading', () => {
    mockNotificationService.getNotifications.mockResolvedValue([]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    });
  });

  it('renders notification list items', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByText('Fix login bug')).toBeInTheDocument();
      expect(screen.getByText(/@alice assigned you a task/)).toBeInTheDocument();
    });
  });

  it('shows "Mark all read" button when unread notifications exist', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark all read/ })).toBeInTheDocument();
    });
  });

  it('calls markAllRead when "Mark all read" button is clicked', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Mark all read/ }));
    });

    await waitFor(() => {
      expect(mockNotificationService.markAllRead).toHaveBeenCalledTimes(1);
    });
  });

  it('shows inline "Mark read" button for unread notifications', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());

    await waitFor(() => {
      const markReadBtn = screen.getAllByRole('button', { name: /Mark read/ });
      expect(markReadBtn.length).toBeGreaterThan(0);
    });
  });

  it('calls markRead with notification id on inline mark-read click', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([sampleNotification]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());

    await waitFor(() => {
      const btn = screen.getAllByRole('button', { name: /Mark read/ })[0];
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(mockNotificationService.markRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('renders pending invitations section when invitations exist', async () => {
    mockNotificationService.getNotifications.mockResolvedValue([]);
    mockSharingService.getPendingInvitations.mockResolvedValue([
      {
        id: 'share-1',
        eventId: 'event-1',
        sharedWithUserId: 'user-3',
        username: 'bob',
        email: 'bob@example.com',
        permission: 'View',
        status: 'Pending',
        createdAt: '2026-03-10T08:00:00Z',
      },
    ]);
    renderWithProviders(<NotificationsPage />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByText(/Pending invitations/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Commit:** `test: add NotificationsPage unit tests (T-P58)`

---

### Task 7.8: Task view filter tab tests (inline in TasksPage tests)

**Files:**
- New: `apps/web/tests/components/TasksPageViewFilter.test.tsx`

- [ ] **Step 1: Create the test file** — verify tabs render and query param changes on click:

```typescript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithProviders } from '../utils/test-utils';
import TasksPage from '../../src/pages/tasks/TasksPage';
import { taskService } from '../../src/services/taskService';

jest.mock('../../src/services/taskService', () => ({
  taskService: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    toggleTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    classifyTask: jest.fn(),
    assignTask: jest.fn(),
    unassignTask: jest.fn(),
  },
}));

jest.mock('../../src/services/taskGroupService', () => ({
  taskGroupService: { getGroups: jest.fn().mockResolvedValue([]) },
}));

jest.mock('../../src/services/eventService', () => ({
  eventService: { getEvents: jest.fn().mockResolvedValue([]) },
}));

const mockTaskService = taskService as jest.Mocked<typeof taskService>;

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TasksPage view filter tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskService.getTasks.mockResolvedValue([]);
  });

  it('renders all four view tabs', async () => {
    renderWithProviders(<TasksPage />, {}, createWrapper());
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Mine' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Assigned to me' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Assigned by me' })).toBeInTheDocument();
    });
  });

  it('"All" tab is active by default', async () => {
    renderWithProviders(<TasksPage />, {}, createWrapper());
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('data-state', 'active');
    });
  });

  it('calls getTasks with view=assigned-to-me when that tab is clicked', async () => {
    renderWithProviders(<TasksPage />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Assigned to me' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Assigned to me' }));

    await waitFor(() => {
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ view: 'assigned-to-me' }),
      );
    });
  });

  it('calls getTasks with view=assigned-by-me when that tab is clicked', async () => {
    renderWithProviders(<TasksPage />, {}, createWrapper());

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Assigned by me' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Assigned by me' }));

    await waitFor(() => {
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ view: 'assigned-by-me' }),
      );
    });
  });
});
```

- [ ] **Commit:** `test: add TasksPage view filter tab tests (T-P58)`

---

### Task 7.9: Run full test suite

- [ ] **Step 1: Run all frontend tests** and confirm all pass:

```
pnpm --filter @life-manager/web test
```

- [ ] **Step 2: Fix any failing tests.** Common causes: missing mock setup, component import paths, or new required props on modified components (e.g. `TaskItem` now accepts `onAssign` — existing tests must still pass without it since the prop is optional).

- [ ] **Commit:** `test: fix any failing tests after Phase 58 frontend additions (T-P58)` (only if fixes needed)

---

## Verification Checklist

- [ ] `pnpm --filter @life-manager/web build` passes with zero TypeScript errors
- [ ] `pnpm --filter @life-manager/web test` — all tests pass (300+ total, new tests included)
- [ ] `NotificationBell` appears in the header for an authenticated user
- [ ] Unread count badge appears/disappears correctly when notifications are read
- [ ] Polling does not cause visible re-renders (refetchInterval is 60 s)
- [ ] `/notifications` route is protected (redirects unauthenticated users to `/login`)
- [ ] Accepting a share invitation via `InvitationCard` removes it from the pending list
- [ ] Task view filter tabs change the API call parameter without a full page reload
- [ ] `AssignTaskModal` is accessible (keyboard-navigable, correct aria-labels)
- [ ] `ShareEventModal` permission change calls `PUT /api/v1/events/{id}/shares/{shareId}`
- [ ] `WeeklyProgressPage` shows "Delegated tasks" and "Assigned to me" cards without errors when values are 0
- [ ] No `any` types introduced — TypeScript strict mode passes
- [ ] British English used throughout all UI strings (no "color", "favorite", "canceled", etc.)
- [ ] All new components use `cn()` from `@/lib/utils` for conditional class merging
- [ ] `apiClient` is the only HTTP client used — no direct `axios` imports
