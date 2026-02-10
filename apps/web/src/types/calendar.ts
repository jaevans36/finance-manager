export interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  groupId?: string;
  groupName?: string;
  groupColor?: string;
  hasSubtasks?: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  progressPercentage?: number;
}

export interface DayData {
  date: Date;
  tasks: CalendarTask[];
  taskCount: number;
  hasHighPriority: boolean;
  hasCritical: boolean;
}

export interface CalendarFilters {
  groupIds: string[];
  priorities: string[];
}
