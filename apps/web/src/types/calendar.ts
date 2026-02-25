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


