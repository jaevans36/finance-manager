import styled from 'styled-components';
import { TextSmall } from '../../../components/ui';

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterLabel = styled(TextSmall)`
  font-weight: 500;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: 16px;
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ theme, $active }) => 
    $active ? '#fff' : theme.colors.text};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    transform: scale(1.05);
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

interface GroupFilterProps {
  groups: string[];
  selectedGroup: string | null;
  onGroupChange: (group: string | null) => void;
  label?: string;
}

export const GroupFilter: React.FC<GroupFilterProps> = ({
  groups,
  selectedGroup,
  onGroupChange,
  label = 'Filter by group:',
}) => {
  return (
    <FilterContainer>
      <FilterLabel>{label}</FilterLabel>
      <FilterChip 
        $active={selectedGroup === null}
        onClick={() => onGroupChange(null)}
      >
        All Groups
      </FilterChip>
      {groups.map((group) => (
        <FilterChip
          key={group}
          $active={selectedGroup === group}
          onClick={() => onGroupChange(group)}
        >
          {group}
        </FilterChip>
      ))}
    </FilterContainer>
  );
};
