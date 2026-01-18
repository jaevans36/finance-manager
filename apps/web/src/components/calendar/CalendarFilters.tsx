import styled from 'styled-components';
import { X } from 'lucide-react';

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const Select = styled.select`
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 8px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 6px;
  padding: 4px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.text};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryHover : theme.colors.cardBackground};
  }
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SummaryText = styled.div`
  margin-left: auto;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};

  @media (max-width: 768px) {
    margin-left: 0;
    text-align: center;
    padding: 8px;
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-radius: 6px;
  }
`;

interface TaskGroup {
  id: string;
  name: string;
  colour: string;
}

interface CalendarFiltersProps {
  groups: TaskGroup[];
  selectedGroupId: string;
  selectedPriorities: string[];
  taskCount: number;
  eventCount: number;
  showTasks: boolean;
  showEvents: boolean;
  onGroupChange: (groupId: string) => void;
  onPriorityChange: (priorities: string[]) => void;
  onShowTasksChange: (show: boolean) => void;
  onShowEventsChange: (show: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const CalendarFilters = ({
  groups,
  selectedGroupId,
  selectedPriorities,
  taskCount,
  eventCount,
  showTasks,
  showEvents,
  onGroupChange,
  onPriorityChange,
  onShowTasksChange,
  onShowEventsChange,
  onClearFilters,
  hasActiveFilters,
}: CalendarFiltersProps) => {
  const handlePriorityToggle = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  return (
    <FilterBar>
      <FilterGroup>
        <FilterLabel>Show:</FilterLabel>
        <ToggleGroup>
          <ToggleButton
            $active={showTasks}
            onClick={() => onShowTasksChange(!showTasks)}
            type="button"
          >
            📋 Tasks
          </ToggleButton>
          <ToggleButton
            $active={showEvents}
            onClick={() => onShowEventsChange(!showEvents)}
            type="button"
          >
            📅 Events
          </ToggleButton>
        </ToggleGroup>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel htmlFor="group-filter">Group:</FilterLabel>
        <Select
          id="group-filter"
          value={selectedGroupId}
          onChange={(e) => onGroupChange(e.target.value)}
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Priority:</FilterLabel>
        <ToggleGroup>
          {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
            <ToggleButton
              key={priority}
              $active={selectedPriorities.includes(priority)}
              onClick={() => handlePriorityToggle(priority)}
              type="button"
            >
              {priority}
            </ToggleButton>
          ))}
        </ToggleGroup>
      </FilterGroup>

      {hasActiveFilters && (
        <ClearButton onClick={onClearFilters}>
          <X />
          Clear Filters
        </ClearButton>
      )}

      <SummaryText>
        {showTasks && showEvents
          ? `${taskCount} tasks • ${eventCount} events`
          : showTasks
          ? `${taskCount} tasks`
          : showEvents
          ? `${eventCount} events`
          : 'No filters active'}
      </SummaryText>
    </FilterBar>
  );
};
