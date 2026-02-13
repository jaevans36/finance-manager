import styled from 'styled-components';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@finance-manager/ui';
import { borderRadius } from '@finance-manager/ui/styles';

const ToggleButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: ${borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px ${({ theme }) => theme.colors.shadow};
  transition: all 0.2s ease;
  z-index: 1000;

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: rotate(15deg);
  }
`;

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <ToggleButton
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </ToggleButton>
  );
};
