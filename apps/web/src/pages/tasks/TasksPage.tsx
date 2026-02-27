import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { taskService, type Task, type TaskStatus, type UrgencyLevel, type ImportanceLevel } from '../../services/taskService';
import { eventService } from '../../services/eventService';
import { taskGroupService } from '../../services/taskGroupService';
import { subtaskService } from '../../services/subtaskService';
import { CreateTaskForm } from '../../components/tasks/CreateTaskForm';
import { EventForm } from '../../components/events/EventForm';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { TaskList } from '../../components/tasks/TaskList';
import { TaskGroupList } from '../../components/task-groups/TaskGroupList';
import { TaskStatistics } from '../../components/dashboard/TaskStatistics';
import { TaskSkeleton } from '../../components/dashboard/TaskSkeleton';
import { TaskSearch } from '../../components/dashboard/TaskSearch';
import { PageLayout } from '../../components/layout/PageLayout';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { XCircle, ChevronDown, ListTodo, Calendar } from 'lucide-react';
import { TaskGroup } from '../../types/taskGroup';
import { DashboardLayout } from '../dashboard/components';
import { WipCounter } from '../../components/tasks/WipCounter';
import type { CreateEventRequest } from '../../types/event';

const TasksPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState<'task' | 'event'>('task');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: N = new item, / = search, Esc = close modals/unfocus search
  useKeyboardShortcuts({
    'n': () => {
      if (!showCreateForm && !editingTask) {
        setShowCreateForm(true);
      }
    },
    '/': (event) => {
      event.preventDefault();
      searchInputRef.current?.focus();
    },
    'Escape': () => {
      if (showCreateForm) {
        setShowCreateForm(false);
      } else if (editingTask) {
        setEditingTask(null);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    }
  }, [showCreateForm, editingTask]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasks = await taskService.getTasks();
      setTasks(tasks);
      setError('');
    } catch (err) {
      toast.error('Failed to load tasks');
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setGroupsLoading(true);
      const groups = await taskGroupService.getGroups();
      setGroups(groups);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTasks = tasks
    .filter((task) => {
      // Filter by group
      if (selectedGroupId && task.groupId !== selectedGroupId) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesDescription;
      }
      
      return true;
    });

  const handleSelectGroup = (groupId: string | null) => {
    // Toggle off if clicking the same group
    setSelectedGroupId(groupId === selectedGroupId ? null : groupId);
  };

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate?: string;
    groupId?: string;
    subtaskTitles?: string[];
  }) => {
    try {
      const { subtaskTitles, ...taskData } = data;
      const task = await taskService.createTask(taskData);

      // Create subtasks if provided
      if (subtaskTitles && subtaskTitles.length > 0) {
        try {
          await subtaskService.bulkCreateSubtasks(task.id, subtaskTitles);
        } catch (subtaskErr) {
          console.error('Failed to create subtasks:', subtaskErr);
          toast.error('Task created but some subtasks failed');
        }
      }

      setTasks((prev) => [task, ...prev]);
      setShowCreateForm(false);
      toast.success('Task created successfully');
      // Reload groups to update task counts
      loadGroups();
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task');
      // Re-throw so the form can display the error
      throw err;
    }
  };

  const handleCreateEvent = async (data: CreateEventRequest) => {
    try {
      await eventService.createEvent(data);
      setShowCreateForm(false);
      toast.success('Event created successfully');
      // Navigate to calendar to see the event
      navigate('/calendar');
    } catch (err) {
      console.error('Failed to create event:', err);
      toast.error('Failed to create event');
      // Re-throw so the form can display the error
      throw err;
    }
  };

  const handleUpdateTask = async (
    id: string,
    data: {
      title: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      dueDate?: string;
    }
  ) => {
    try {
      const updatedTask = await taskService.updateTask(id, data);
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      setEditingTask(null);
      toast.success('Task updated successfully');
      // Reload groups to update task counts
      loadGroups();
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task');
      throw err;
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const updatedTask = await taskService.updateTask(id, { completed: !task.completed });
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      toast.success(updatedTask.completed ? 'Task completed!' : 'Task marked as incomplete');
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
      toast.error('Failed to update task');
    }
  };

  const handleSubtaskChange = useCallback(
    (taskId: string, counts: { subtaskCount: number; completedSubtaskCount: number }) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtaskCount: counts.subtaskCount,
                completedSubtaskCount: counts.completedSubtaskCount,
                hasSubtasks: counts.subtaskCount > 0,
                progressPercentage:
                  counts.subtaskCount > 0
                    ? Math.round((counts.completedSubtaskCount / counts.subtaskCount) * 100)
                    : 0,
              }
            : t,
        ),
      );
      // Also update the editingTask so the modal stays in sync
      setEditingTask((prev) =>
        prev && prev.id === taskId
          ? {
              ...prev,
              subtaskCount: counts.subtaskCount,
              completedSubtaskCount: counts.completedSubtaskCount,
              hasSubtasks: counts.subtaskCount > 0,
              progressPercentage:
                counts.subtaskCount > 0
                  ? Math.round((counts.completedSubtaskCount / counts.subtaskCount) * 100)
                  : 0,
            }
          : prev,
      );
    },
    [],
  );

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        setTasks((prev) => prev.filter((task) => task.id !== id));
        toast.success('Task deleted successfully');
        // Reload groups to update task counts
        loadGroups();
      } catch (err) {
        console.error('Failed to delete task:', err);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus, blockedReason?: string) => {
    try {
      const updatedTask = await taskService.updateTaskStatus(id, status, blockedReason);
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      setEditingTask((prev) => (prev && prev.id === id ? updatedTask : prev));
      toast.success(`Task status changed to ${status.replace(/([A-Z])/g, ' $1').trim()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update task status';
      toast.error(message);
    }
  };

  const handleClassificationChange = async (id: string, urgency: UrgencyLevel | null, importance: ImportanceLevel | null) => {
    try {
      const updatedTask = await taskService.classifyTask(id, urgency ?? undefined, importance ?? undefined);
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      setEditingTask((prev) => (prev && prev.id === id ? updatedTask : prev));
      toast.success('Classification updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to classify task';
      toast.error(message);
    }
  };

  const handleGroupCreated = () => {
    loadGroups();
  };

  return (
    <PageLayout 
      title="Tasks"
      loading={loading}
      loadingComponent={<TaskSkeleton />}
    >
      {error && (
        <Alert variant="destructive" className="mb-5">
          <XCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DashboardLayout>
        <TaskGroupList
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={handleSelectGroup}
          onGroupCreated={handleGroupCreated}
          loading={groupsLoading}
        />

        <main role="main" aria-label="Task management">
          <TaskStatistics tasks={tasks} totalGroups={groups.length} />

          <div className="mb-4 flex items-center gap-3">
            <TaskSearch ref={searchInputRef} value={searchQuery} onChange={setSearchQuery} />
            <WipCounter />
          </div>

          {showCreateForm ? (
            createType === 'task' ? (
              <CreateTaskForm 
                onSubmit={handleCreateTask} 
                onCancel={() => setShowCreateForm(false)}
                groups={groups}
                selectedGroupId={selectedGroupId}
              />
            ) : (
              <EventForm
                onSubmit={handleCreateEvent}
                onCancel={() => setShowCreateForm(false)}
                groups={groups}
              />
            )
          ) : (
            <div className="relative mb-5 inline-block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Create new item">
                    + New <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[200px]">
                  <DropdownMenuItem
                    onClick={() => {
                      setCreateType('task');
                      setShowCreateForm(true);
                    }}
                  >
                    <ListTodo className="size-4" /> Task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCreateType('event');
                      setShowCreateForm(true);
                    }}
                  >
                    <Calendar className="size-4" /> Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {loading ? (
            <div role="status" aria-label="Loading tasks">
              <TaskSkeleton count={5} />
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              isLoading={false}
              onToggleComplete={handleToggleComplete}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          )}
        </main>
      </DashboardLayout>

      {editingTask && (
        <TaskDetailModal 
          task={editingTask} 
          onSubmit={handleUpdateTask} 
          onCancel={() => setEditingTask(null)}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          onStatusChange={handleStatusChange}
          onClassificationChange={handleClassificationChange}
          onSubtaskChange={handleSubtaskChange}
        />
      )}
    </PageLayout>
  );
};

export default TasksPage;
