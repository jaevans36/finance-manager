import styled from 'styled-components';
import { Search, X } from 'lucide-react';

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1px solid ${props => props.theme.colors.inputBorder};
  border-radius: 8px;
  font-size: 14px;
  background-color: ${props => props.theme.colors.cardBackground};
  color: ${props => props.theme.colors.text};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  pointer-events: none;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TaskSearch = React.forwardRef<HTMLInputElement, TaskSearchProps>((
  {
    value,
    onChange,
    placeholder = 'Search tasks by title or description...'
  },
  ref
) => {
  return (
    <SearchContainer>
      <SearchIcon size={18} />
      <SearchInput
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <ClearButton onClick={() => onChange('')} aria-label="Clear search">
          <X size={18} />
        </ClearButton>
      )}
    </SearchContainer>
  );
});

TaskSearch.displayName = 'TaskSearch';
