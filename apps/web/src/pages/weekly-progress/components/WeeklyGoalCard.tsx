import { Input } from '../../../components/ui/input';

interface WeeklyGoalCardProps {
  completedTasks: number;
  weeklyGoal: number;
  onUpdateGoal: (goal: number) => void;
}

export const WeeklyGoalCard = ({
  completedTasks,
  weeklyGoal,
  onUpdateGoal,
}: WeeklyGoalCardProps) => {
  const progressPercentage = (completedTasks / weeklyGoal) * 100;
  const isAchieved = completedTasks >= weeklyGoal;
  const remaining = weeklyGoal - completedTasks;

  return (
    <div className="mb-6 p-5 bg-card rounded-lg border border-border h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-lg font-semibold">Weekly Completion Goal</h3>
        <div className="flex items-center gap-2.5">
          <span className="text-sm">Target:</span>
          <Input
            type="number"
            min={1}
            max={1000}
            value={weeklyGoal}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateGoal(Number.parseInt(e.target.value, 10) || 10)}
            className="w-20 text-center"
          />
          <span className="text-sm">tasks</span>
        </div>
      </div>
      <div className="w-full h-6 bg-secondary rounded-lg overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-[width] duration-500 flex items-center justify-center text-primary-foreground text-sm font-semibold"
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        >
          {isAchieved ? 'Goal Achieved!' : `${Math.round(progressPercentage)}%`}
        </div>
      </div>
      <div className="flex justify-between mt-2.5 text-xs text-muted-foreground">
        <span>{completedTasks} / {weeklyGoal} tasks completed</span>
        <span>
          {isAchieved 
            ? `+${completedTasks - weeklyGoal} over goal!` 
            : `${remaining} remaining`
          }
        </span>
      </div>
    </div>
  );
};
