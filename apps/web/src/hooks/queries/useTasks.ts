import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, type Task, type TaskStatus, type UrgencyLevel, type ImportanceLevel, type EnergyLevel } from '@/services/taskService';
import { queryKeys } from '../query-keys';

interface TaskQueryParams {
  groupId?: string;
  priority?: string;
  completed?: boolean;
  startDate?: string;
  endDate?: string;
  status?: TaskStatus;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  groupId?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  completed?: boolean;
  groupId?: string;
}

/** Fetch all tasks with optional filters */
export function useTasks(params?: TaskQueryParams) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params as Record<string, unknown>),
    queryFn: () => taskService.getTasks(params),
  });
}

/** Fetch a single task by ID */
export function useTask(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => taskService.getTask(id),
    enabled: !!id && enabled,
  });
}

/** Create a new task */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Update an existing task */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      taskService.updateTask(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Delete a task */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Toggle task completion */
export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      taskService.toggleTask(id, completed),
    onSuccess: (_data: Task, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.wipSummary() });
    },
  });
}

/** Update task status (NotStarted, InProgress, Blocked, Completed) */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, blockedReason }: { id: string; status: TaskStatus; blockedReason?: string }) =>
      taskService.updateTaskStatus(id, status, blockedReason),
    onSuccess: (_data: Task, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.wipSummary() });
    },
  });
}

/** Fetch tasks grouped by Eisenhower Matrix quadrant */
export function useMatrixTasks(params?: { groupId?: string; priority?: string; includeCompleted?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tasks.matrix(params as Record<string, unknown>),
    queryFn: () => taskService.getMatrixTasks(params),
  });
}

/** Classify a task with urgency and importance */
export function useClassifyTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, urgency, importance }: { id: string; urgency?: UrgencyLevel; importance?: ImportanceLevel }) =>
      taskService.classifyTask(id, urgency, importance),
    onSuccess: (_data: Task, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.matrix() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Bulk classify multiple tasks */
export function useBulkClassify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ taskId: string; urgency?: UrgencyLevel; importance?: ImportanceLevel }>) =>
      taskService.bulkClassifyTasks(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
  });
}

/** Get auto-classification suggestion for a single task */
export function useClassificationSuggestion(taskId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.suggestion(taskId),
    queryFn: () => taskService.getSuggestion(taskId),
    enabled: !!taskId && enabled,
  });
}

/** Preview auto-classification for all unclassified tasks */
export function useAutoClassifyPreview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => taskService.previewAutoClassify(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.autoClassify() });
    },
  });
}

/** Set energy level for a task */
export function useSetEnergy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, energyLevel }: { id: string; energyLevel: EnergyLevel }) =>
      taskService.setEnergy(id, energyLevel),
    onSuccess: (_data: Task, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.energyDistribution() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.suggestions() });
    },
  });
}

/** Set estimated minutes for a task */
export function useSetEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estimatedMinutes }: { id: string; estimatedMinutes: number }) =>
      taskService.setEstimate(id, estimatedMinutes),
    onSuccess: (_data: Task, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.suggestions() });
    },
  });
}

/** Bulk set energy level for multiple tasks */
export function useBulkSetEnergy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ taskId: string; energyLevel: EnergyLevel }>) =>
      taskService.bulkSetEnergy(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.energyDistribution() });
    },
  });
}

/** Get smart task suggestions filtered by energy and time */
export function useSuggestions(params?: { energy?: EnergyLevel; maxMinutes?: number }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.suggestions(params as Record<string, unknown>),
    queryFn: () => taskService.getSuggestions(params),
    enabled,
  });
}

/** Get energy distribution statistics */
export function useEnergyDistribution() {
  return useQuery({
    queryKey: queryKeys.tasks.energyDistribution(),
    queryFn: () => taskService.getEnergyDistribution(),
  });
}
