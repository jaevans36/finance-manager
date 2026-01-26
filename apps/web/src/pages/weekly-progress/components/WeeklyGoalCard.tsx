import styled from 'styled-components';
import { Heading3, InputField, Text } from '@finance-manager/ui';
import { chartColors } from '../../../components/charts/chartTheme';

const GoalSection = styled.div`
  margin-bottom: 25px;
  padding: 20px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  height: 100%;
`;

const GoalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const GoalProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const GoalProgressFill = styled.div<{ $percentage: number; $achieved: boolean }>`
  height: 100%;
  background: ${({ $achieved, theme }) => 
    $achieved ? `linear-gradient(90deg, ${chartColors.primary} 0%, #45a049 100%)` : 
    `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.primaryHover} 100%)`
  };
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
`;

const GoalStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

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
    <GoalSection>
      <GoalHeader>
        <Heading3 style={{ margin: 0 }}>Weekly Completion Goal</Heading3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Text style={{ fontSize: '14px' }}>Target:</Text>
          <InputField
            type="number"
            min="1"
            max="1000"
            value={weeklyGoal}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateGoal(Number.parseInt(e.target.value, 10) || 10)}
            style={{ width: '80px', textAlign: 'center' }}
          />
          <Text style={{ fontSize: '14px' }}>tasks</Text>
        </div>
      </GoalHeader>
      <GoalProgressBar>
        <GoalProgressFill 
          $percentage={progressPercentage}
          $achieved={isAchieved}
        >
          {isAchieved ? 'Goal Achieved!' : `${Math.round(progressPercentage)}%`}
        </GoalProgressFill>
      </GoalProgressBar>
      <GoalStats>
        <span>{completedTasks} / {weeklyGoal} tasks completed</span>
        <span>
          {isAchieved 
            ? `+${completedTasks - weeklyGoal} over goal!` 
            : `${remaining} remaining`
          }
        </span>
      </GoalStats>
    </GoalSection>
  );
};
