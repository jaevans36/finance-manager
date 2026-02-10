import styled from 'styled-components';
import { TextSmall } from '@finance-manager/ui';
import { borderRadius, mediaQueries } from '@finance-manager/ui/styles';

const HintContainer = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};

  ${mediaQueries.tablet} {
    display: none;
  }
`;

const HintTitle = styled(TextSmall)`
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
`;

const HintList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HintItem = styled(TextSmall)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const KeyBadge = styled.kbd`
  padding: 2px 6px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

export const KeyboardShortcutsHint = () => {
  return (
    <HintContainer>
      <HintTitle>Keyboard Shortcuts</HintTitle>
      <HintList>
        <HintItem>
          <KeyBadge>←</KeyBadge>
          <KeyBadge>→</KeyBadge>
          <span>Navigate months</span>
        </HintItem>
        <HintItem>
          <KeyBadge>Enter</KeyBadge>
          <span>Quick add task</span>
        </HintItem>
        <HintItem>
          <KeyBadge>Esc</KeyBadge>
          <span>Close modals</span>
        </HintItem>
      </HintList>
    </HintContainer>
  );
};
