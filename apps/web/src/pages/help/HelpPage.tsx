import { useState } from 'react';
import {
  BookOpen, ListTodo, FolderKanban, Calendar, BarChart3,
  Users, Settings, ChevronRight, Hash,
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';

// --- Section definitions ---
const SECTIONS = [
  { id: 'getting-started', label: 'Getting started', icon: BookOpen },
  { id: 'tasks', label: 'Tasks & subtasks', icon: ListTodo },
  { id: 'groups', label: 'Task groups', icon: FolderKanban },
  { id: 'calendar', label: 'Calendar & events', icon: Calendar },
  { id: 'progress', label: 'Weekly progress', icon: BarChart3 },
  { id: 'sharing', label: 'Sharing groups', icon: Users },
  { id: 'account', label: 'Account & settings', icon: Settings },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// --- Content components ---

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-0 text-xl font-semibold text-foreground">{children}</h2>;
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mb-2 mt-5 flex items-center gap-2 text-base font-semibold text-foreground">
      <Hash size={14} className="text-muted-foreground" />
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mb-3 ml-4 space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <ChevronRight size={14} className="mt-0.5 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </kbd>
  );
}

function Badge({ variant, children }: { variant: 'info' | 'success' | 'warning'; children: React.ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
      variant === 'info' && 'bg-info/15 text-info',
      variant === 'success' && 'bg-success/15 text-success',
      variant === 'warning' && 'bg-warning/15 text-warning',
    )}>
      {children}
    </span>
  );
}

// --- Sections ---

function GettingStartedSection() {
  return (
    <>
      <H2>Getting started</H2>
      <P>
        Life Manager is a personal productivity platform for managing tasks, events, and goals.
        Everything is organised around <strong>task groups</strong> — collections of related tasks
        you can filter, share, and track independently.
      </P>

      <H3>Logging in</H3>
      <Ul items={[
        'Go to the app URL and enter your username and password.',
        'First-time users: register with a username, email, and password. You may need to verify your email before you can log in.',
        'Forgotten password? Use the "Forgot password" link on the login page.',
      ]} />

      <H3>Creating your first task</H3>
      <Ul items={[
        <>Navigate to <strong>Tasks</strong> from the top navigation.<br />Press <Kbd>N</Kbd> or click <strong>+ New → Task</strong>.</>,
        'Give the task a title. Optionally set a due date, priority, and which group it belongs to.',
        'Click Save — your task appears in the list immediately.',
      ]} />

      <H3>Keyboard shortcuts</H3>
      <div className="mb-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <span className="flex items-center"><Kbd>N</Kbd></span>
        <span className="text-muted-foreground">Open create task / event form</span>
        <span className="flex items-center"><Kbd>/</Kbd></span>
        <span className="text-muted-foreground">Focus search box</span>
        <span className="flex items-center"><Kbd>Esc</Kbd></span>
        <span className="text-muted-foreground">Close form or clear search focus</span>
      </div>
    </>
  );
}

function TasksSection() {
  return (
    <>
      <H2>Tasks & subtasks</H2>
      <P>
        Tasks are the core unit of work. Each task can carry optional metadata to help
        you decide what to work on and when.
      </P>

      <H3>Task fields</H3>
      <Ul items={[
        <><strong>Title</strong> — required, up to 500 characters.</>,
        <><strong>Description</strong> — freeform notes or context.</>,
        <><strong>Due date</strong> — optional; tasks with due dates appear on the calendar.</>,
        <><strong>Priority</strong> — Low / Medium / High / Critical. Drives default sort order.</>,
        <><strong>Energy level</strong> — Low / Medium / High. Use the Suggestions page to find tasks that match your current energy.</>,
        <><strong>Estimated time</strong> — in minutes (1–480). Shown alongside energy on suggestion views.</>,
        <><strong>Group</strong> — which task group this task belongs to. Defaults to &ldquo;Uncategorised&rdquo;.</>,
      ]} />

      <H3>Task status</H3>
      <P>Every task has a status that moves through a lifecycle:</P>
      <Ul items={[
        <><Badge variant="info">Not started</Badge> — default for new tasks.</>,
        <><Badge variant="info">In progress</Badge> — you&apos;re actively working on it. Counts towards group WIP limits.</>,
        <><Badge variant="warning">Blocked</Badge> — requires a reason; surfaced prominently in list views.</>,
        <><Badge variant="success">Completed</Badge> — done. Syncs the completed checkbox automatically.</>,
      ]} />

      <H3>Eisenhower Matrix</H3>
      <P>
        Classify tasks by <strong>Urgency</strong> and <strong>Importance</strong> to place them in
        one of four quadrants: Do First (Q1), Schedule (Q2), Delegate (Q3), Eliminate (Q4).
        Access the matrix from the <strong>Matrix</strong> nav item.
      </P>

      <H3>Subtasks</H3>
      <Ul items={[
        'Open a task to see the subtasks panel. Click "+ Add subtask" or type subtask titles in the create form.',
        'Each subtask has its own complete/incomplete toggle.',
        'Progress percentage on the parent task reflects subtask completion.',
        'Subtasks can be added, renamed, reordered, and deleted from the task detail view.',
      ]} />
    </>
  );
}

function GroupsSection() {
  return (
    <>
      <H2>Task groups</H2>
      <P>
        Task groups are named collections of tasks — similar to projects or categories.
        They appear in the sidebar on the Tasks page.
      </P>

      <H3>Creating a group</H3>
      <Ul items={[
        'On the Tasks page, click the + button at the top of the Groups sidebar.',
        'Choose a name, colour, and optional icon. You can also set a WIP limit.',
        'Click Create. The group appears immediately in the sidebar.',
      ]} />

      <H3>WIP limits</H3>
      <P>
        A WIP (Work-In-Progress) limit caps how many tasks in a group can be &ldquo;In progress&rdquo;
        simultaneously. If you try to start a task that would exceed the limit, the app
        will warn you. This encourages focus and prevents overloading.
      </P>

      <H3>Organising work</H3>
      <Ul items={[
        'Click a group in the sidebar to filter the task list to just that group.',
        'Click "All Tasks" to see everything regardless of group.',
        'Groups show a task count badge so you can see at a glance where your work sits.',
        '"Uncategorised" is the default group — tasks without an explicit group land here.',
      ]} />
    </>
  );
}

function CalendarSection() {
  return (
    <>
      <H2>Calendar & events</H2>

      <H3>Calendar view</H3>
      <P>
        The Calendar page shows tasks with due dates and standalone events in a monthly grid.
        Click any day to see a list of everything due or scheduled that day.
      </P>

      <H3>Events</H3>
      <Ul items={[
        'Events are distinct from tasks — they represent scheduled appointments or blocks of time.',
        'Create an event from the Tasks page via "+ New → Event", or from the Events page directly.',
        'Events have a title, start/end date-time, optional description, and optional link to a task group.',
        'Recurring events: choose a recurrence rule (daily, weekly, monthly) and an end date.',
      ]} />

      <H3>Tasks on the calendar</H3>
      <P>
        Any task with a due date automatically appears on the calendar on that date.
        Overdue tasks are highlighted in red to make them easy to spot.
      </P>
    </>
  );
}

function ProgressSection() {
  return (
    <>
      <H2>Weekly progress</H2>
      <P>
        The Weekly Progress page tracks how many tasks you complete each day and week,
        helping you spot patterns and maintain momentum.
      </P>

      <H3>What&apos;s tracked</H3>
      <Ul items={[
        'Tasks completed each day for the current and past weeks.',
        'Current streak — consecutive days with at least one task completed.',
        'Completion rate by priority: shows whether high-priority tasks are being finished.',
        'Energy distribution — breakdown of completed tasks by energy level.',
      ]} />

      <H3>Tips</H3>
      <Ul items={[
        'Complete at least one task each day to maintain your streak.',
        'Use the Eisenhower Matrix to ensure high-urgency tasks are completed consistently.',
        'Review the progress page on Friday to plan the following week.',
      ]} />
    </>
  );
}

function SharingSection() {
  return (
    <>
      <H2>Sharing groups</H2>
      <P>
        You can share task groups with other Life Manager users. Shared groups and their
        tasks appear in the recipient&apos;s task list automatically.
      </P>

      <H3>Sharing a group</H3>
      <Ul items={[
        <>On the Tasks page, hover over a group you own in the sidebar. A share icon (<Users size={13} className="inline" />) appears on the right.</>,
        'Click the icon to open the Share modal.',
        'Type the recipient\'s username or email address, choose a permission level, then click Share.',
      ]} />

      <H3>Permission levels</H3>
      <Ul items={[
        <><strong>View</strong> — the recipient can see the group and its tasks but cannot create, edit, or delete tasks.</>,
        <><strong>Edit</strong> — the recipient can create and update tasks within the group. They cannot rename, delete the group, or change sharing settings.</>,
      ]} />

      <H3>Received shares</H3>
      <Ul items={[
        'Shared groups appear in your sidebar with a people icon and a "Shared by [username]" label.',
        'The permission level (View / Edit) is shown beneath the group name.',
        'You cannot share a received group with other users.',
      ]} />

      <H3>Removing a share</H3>
      <Ul items={[
        'Open the Share modal for the group (owner only).',
        'Click the bin icon next to the person whose access you want to remove.',
        'Their access is revoked immediately.',
      ]} />
    </>
  );
}

function AccountSection() {
  return (
    <>
      <H2>Account & settings</H2>

      <H3>Profile settings</H3>
      <Ul items={[
        'Access via the user menu (top-right) → Profile Settings.',
        'Change your display name, email, or password.',
        'Email changes require re-verification.',
      ]} />

      <H3>Theme</H3>
      <P>
        Toggle between light and dark mode using the sun/moon icon in the header.
        Your preference is saved automatically.
      </P>

      <H3>Data export</H3>
      <P>
        You can export your tasks and events as JSON from the Profile Settings page.
        This is useful for backups or migrating data.
      </P>

      <H3>Sessions</H3>
      <Ul items={[
        'Active sessions (devices and browsers currently logged in) are listed in Profile Settings.',
        'Click "Revoke" to log out a specific session remotely.',
        '"Sign out all other sessions" ends all sessions except the current one.',
      ]} />
    </>
  );
}

const SECTION_CONTENT: Record<SectionId, React.ReactNode> = {
  'getting-started': <GettingStartedSection />,
  'tasks': <TasksSection />,
  'groups': <GroupsSection />,
  'calendar': <CalendarSection />,
  'progress': <ProgressSection />,
  'sharing': <SharingSection />,
  'account': <AccountSection />,
};

// --- Page ---

const HelpPage = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('getting-started');

  return (
    <PageLayout title="Help" subtitle="User guide for Life Manager" loading={false}>
      <div className="flex gap-6 md:flex-col">
        {/* Sidebar nav */}
        <nav
          className="w-52 shrink-0 md:w-full"
          aria-label="Help sections"
        >
          <ul className="flex flex-col gap-0.5 md:flex-row md:flex-wrap">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id} className="md:flex-none">
                <button
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    activeSection === id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                  aria-current={activeSection === id ? 'page' : undefined}
                >
                  <Icon size={16} className="shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <article className="min-w-0 flex-1 rounded-lg border border-border bg-card p-6">
          {SECTION_CONTENT[activeSection]}
        </article>
      </div>
    </PageLayout>
  );
};

export default HelpPage;
