import { Input } from '../../../components/ui/input';

interface WeeklyGoalCardProps {
  completedTasks: number;
  weeklyGoal: number;
  totalTasks: number;
  onUpdateGoal: (goal: number) => void;
}

export const WeeklyGoalCard = ({
  completedTasks,
  weeklyGoal,
  totalTasks,
  onUpdateGoal,
}: WeeklyGoalCardProps) => {
  const progressPercentage = Math.min((completedTasks / weeklyGoal) * 100, 100);
  const isAchieved = completedTasks >= weeklyGoal;
  const remaining = weeklyGoal - completedTasks;
  const hasNoTasks = totalTasks === 0;

  return (
    <div className="p-5 bg-card rounded-lg border border-border h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-lg font-semibold">Weekly Completion Goal</h3>
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-muted-foreground">Target:</span>
          <Input
            type="number"
            min={1}
            max={1000}
            value={weeklyGoal}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdateGoal(Number.parseInt(e.target.value, 10) || 10)
            }
            className="w-20 text-center"
          />
          <span className="text-sm text-muted-foreground">tasks</span>
        </div>
      </div>

      {hasNoTasks ? (
        <div className="flex flex-col gap-3 flex-1 justify-center">
          <div className="w-full h-3 bg-secondary rounded-full" />
          <p className="text-sm text-muted-foreground text-center">
            No tasks for this period — add tasks to start tracking your progress against this goal.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 flex-1 justify-end">
          <div className="w-full h-6 bg-secondary rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-500 flex items-center justify-center text-primary-foreground text-sm font-semibold"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage >= 20 && (isAchieved ? 'Goal Achieved!' : `${Math.round(progressPercentage)}%`)}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedTasks} / {weeklyGoal} tasks completed</span>
            <span>
              {isAchieved
                ? `+${completedTasks - weeklyGoal} over goal!`
                : completedTasks === 0
                  ? 'Start completing tasks'
                  : `${remaining} to go`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
