import { memo } from 'react';
import styled from 'styled-components';
import { borderRadius, spacing } from '@finance-manager/ui/styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskProgressProps {
  /** Number of completed subtasks */
  completed: number;
  /** Total number of subtasks */
  total: number;
  /** Percentage (0–100). Computed from completed/total if omitted. */
  percentage?: number;
  /** Compact variant for inline use inside TaskItem */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Styled helpers
// ---------------------------------------------------------------------------

const Wrapper = styled.div<{ $compact: boolean }>`
  display: flex;
  flex-direction: ${({ $compact }) => ($compact ? 'row' : 'column')};
  align-items: ${({ $compact }) => ($compact ? 'center' : 'stretch')};
  gap: ${({ $compact }) => ($compact ? spacing.sm : spacing.xs)};
  width: 100%;
`;

const BarTrack = styled.div<{ $compact: boolean }>`
  flex: 1;
  height: ${({ $compact }) => ($compact ? '4px' : '8px')};
  background-color: ${({ theme }) => theme.colors.backgroundTertiary};
  border-radius: ${borderRadius.full};
  overflow: hidden;
  position: relative;
`;

/**
 * The progress fill bar.
 * Colour shifts from error → warning → success according to percentage.
 */
const BarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  border-radius: ${borderRadius.full};
  transition: width 300ms ease-out, background-color 300ms ease-out;
  background-color: ${({ $pct, theme }) => {
    if ($pct >= 66) return theme.colors.success;
    if ($pct >= 33) return theme.colors.warning;
    return theme.colors.error;
  }};
`;

const ProgressLabel = styled.span<{ $compact: boolean }>`
  font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

const TooltipWrapper = styled.div`
  position: relative;
  width: 100%;

  &:hover > [data-tooltip] {
    opacity: 1;
    visibility: visible;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: calc(100% + ${spacing.xs});
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.background};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${borderRadius.sm};
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 200ms ease, visibility 200ms ease;
  pointer-events: none;
  z-index: 10;
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SubtaskProgress = memo(({
  completed,
  total,
  percentage,
  compact = false,
}: SubtaskProgressProps) => {
  if (total === 0) return null;

  const pct = percentage ?? Math.round((completed / total) * 100);
  const remaining = total - completed;

  return (
    <TooltipWrapper>
      <Wrapper $compact={compact}>
        <BarTrack $compact={compact} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <BarFill $pct={pct} />
        </BarTrack>
        <ProgressLabel $compact={compact}>
          {completed}/{total} completed ({pct}%)
        </ProgressLabel>
      </Wrapper>
      <Tooltip data-tooltip>
        {completed} of {total} subtasks complete &bull; {remaining} remaining
      </Tooltip>
    </TooltipWrapper>
  );
});

SubtaskProgress.displayName = 'SubtaskProgress';
