export interface DailyStatistics {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface WeeklyStatistics {
  weekStart: string;
  weekEnd: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  dailyBreakdown: DailyStatistics[];
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
