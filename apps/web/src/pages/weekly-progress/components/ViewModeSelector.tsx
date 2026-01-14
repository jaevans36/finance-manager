import styled from 'styled-components';

const ViewToggle = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ViewButton = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.backgroundSecondary};
  color: ${({ theme, $active }) => 
    $active ? '#fff' : theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

type ViewMode = 'week' | 'month' | 'custom';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <ViewToggle>
      <ViewButton 
        $active={currentMode === 'week'} 
        onClick={() => onModeChange('week')}
      >
        Week View
      </ViewButton>
      <ViewButton 
        $active={currentMode === 'month'} 
        onClick={() => onModeChange('month')}
      >
        Month View
      </ViewButton>
      <ViewButton 
        $active={currentMode === 'custom'} 
        onClick={() => onModeChange('custom')}
      >
        Custom Range
      </ViewButton>
    </ViewToggle>
  );
};
