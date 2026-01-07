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

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: ${({ theme }) => theme.colors.primary};
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


  @media (max-width: 768px) {
    margin-left: 0;
    text-align: center;
    padding: 8px;
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-radius: 6px;
  }
const SummaryText = styled.div`
  margin-left: auto;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
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
  onGroupChange: (groupId: string) => void;
  onPriorityChange: (priorities: string[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const CalendarFilters = ({
  groups,
  selectedGroupId,
  selectedPriorities,
  taskCount,
  onGroupChange,
  onPriorityChange,
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
        <CheckboxGroup>
          {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
            <CheckboxLabel key={priority}>
              <input
                type="checkbox"
                checked={selectedPriorities.includes(priority)}
                onChange={() => handlePriorityToggle(priority)}
              />
              {priority}
            </CheckboxLabel>
          ))}
        </CheckboxGroup>
      </FilterGroup>

      {hasActiveFilters && (
        <ClearButton onClick={onClearFilters}>
          <X />
          Clear Filters
        </ClearButton>
      )}

      <SummaryText>{taskCount} tasks this month</SummaryText>
    </FilterBar>
  );
};
