import { Task } from '../services/taskService';

export interface DailyStatistics {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  tasks: Task[];
}

/** Matches the backend's DelegatedStatsDto/AssignedToMeStatsDto shape — a count plus its own completion rate, not a bare number. */
export interface TaskGroupStats {
  total: number;
  completed: number;
  completionRate: number;
}

export interface WeeklyStatistics {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  dailyBreakdown: DailyStatistics[];
  delegated: TaskGroupStats;
  assignedToMe: TaskGroupStats;
}

export interface UrgentTask {
  id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  daysUntilDue?: number;
  groupId?: string;
}

export interface HistoricalStatistics {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}
