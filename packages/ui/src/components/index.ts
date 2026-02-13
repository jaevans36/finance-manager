import styled, { css } from 'styled-components';
import { borderRadius, focusRing, shadows } from '../styles/layout';

// ============================================================================
// BUTTON COMPONENTS
// Spec: primary, secondary, destructive (danger) — no other variants.
// ============================================================================

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  $isLoading?: boolean;
}

const buttonSizeStyles = {
  small: css`
    padding: 6px 12px;
    font-size: 14px;

    @media (max-width: 768px) {
      padding: 10px 14px;
      font-size: 14px;
      min-height: 44px;
    }
  `,
  medium: css`
    padding: 10px 16px;
    font-size: 16px;

    @media (max-width: 768px) {
      padding: 12px 18px;
      min-height: 48px;
    }
  `,
  large: css`
    padding: 14px 20px;
    font-size: 18px;

    @media (max-width: 768px) {
      padding: 16px 22px;
      min-height: 52px;
    }
  `,
};

const buttonVariantStyles = {
  primary: css`
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.buttonText};
    border: none;

    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primaryHover};
    }

    &:disabled {
      background-color: ${({ theme }) => theme.colors.primaryDisabled};
    }
  `,
  secondary: css`
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.border};

    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.backgroundTertiary};
      border-color: ${({ theme }) => theme.colors.borderHover};
    }
  `,
  danger: css`
    background-color: ${({ theme }) => theme.colors.errorText};
    color: ${({ theme }) => theme.colors.buttonText};
    border: none;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  `,
};

export const Button = styled.button<ButtonProps>`
  ${({ size = 'medium' }) => buttonSizeStyles[size]}
  ${({ variant = 'primary' }) => buttonVariantStyles[variant]}
  
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  border-radius: ${borderRadius.sm};
  font-weight: 500;
  cursor: ${({ $isLoading }) => ($isLoading ? 'wait' : 'pointer')};
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${focusRing}

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

interface InputProps {
  hasError?: boolean;
}

export const Input = styled.input<InputProps>`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid ${({ theme, hasError }) => (hasError ? theme.colors.error : theme.colors.inputBorder)};
  border-radius: ${borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.2s ease;
  font-family: inherit;

  @media (max-width: 768px) {
    padding: 12px 14px;
    font-size: 16px;
    min-height: 44px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => (hasError ? theme.colors.error : theme.colors.inputBorderFocus)};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }
`;

export const TextArea = styled.textarea<InputProps>`
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid ${({ theme, hasError }) => (hasError ? theme.colors.error : theme.colors.inputBorder)};
  border-radius: ${borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.2s ease;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  @media (max-width: 768px) {
    padding: 12px 14px;
    font-size: 16px;
    min-height: 100px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => (hasError ? theme.colors.error : theme.colors.inputBorderFocus)};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  }
`;

// ============================================================================
// FORM COMPONENTS
// ============================================================================

export const FormGroup = styled.div`
  margin-bottom: 16px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

export const ErrorText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.error};
`;

export const HelperText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// ============================================================================
// CARD COMPONENTS
// Spec: consistent padding, border radius, minimal/no elevation,
//       prefer whitespace over borders.
// ============================================================================

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${borderRadius.lg};
  padding: 20px;
`;

export const CardHeader = styled.div`
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const CardTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

export const CardBody = styled.div`
  color: ${({ theme }) => theme.colors.text};
`;

// ============================================================================
// ALERT COMPONENTS
// Uses left-border accent for semantic colour. Text stays neutral for
// readability (accent colours may not meet WCAG contrast on backgrounds).
// ============================================================================

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
}

const alertVariantStyles = {
  success: css`
    border-left-color: ${({ theme }) => theme.colors.success};
    background-color: ${({ theme }) => theme.colors.successBackground};
  `,
  error: css`
    border-left-color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.errorBackground};
  `,
  warning: css`
    border-left-color: ${({ theme }) => theme.colors.warning};
    background-color: ${({ theme }) => theme.colors.warningBackground};
  `,
  info: css`
    border-left-color: ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  `,
};

export const Alert = styled.div<AlertProps>`
  ${({ variant = 'info' }) => alertVariantStyles[variant]}
  padding: 12px 16px;
  border-radius: ${borderRadius.sm};
  border: none;
  border-left: 4px solid;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

// ============================================================================
// TYPOGRAPHY COMPONENTS
// ============================================================================

export const Heading1 = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  margin: 0 0 16px 0;
`;

export const Heading2 = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 12px 0;
`;

export const Heading3 = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
`;

export const Text = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
  line-height: 1.5;
`;

export const TextSecondary = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const TextSmall = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// ============================================================================
// CONTAINER COMPONENTS
// ============================================================================

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

export const ContentContainer = styled.div`
  max-width: 1200px;
  width: 80%;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
    width: 95%;
  }
`;

export const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const CenteredContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const FormCard = styled(Card)`
  width: 100%;
  max-width: 500px;
  padding: 40px;
`;

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

export const Flex = styled.div<{
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: number;
  wrap?: boolean;
}>`
  display: flex;
  flex-direction: ${({ direction = 'row' }) => direction};
  align-items: ${({ align = 'stretch' }) => align};
  justify-content: ${({ justify = 'flex-start' }) => justify};
  gap: ${({ gap = 0 }) => gap}px;
  flex-wrap: ${({ wrap }) => (wrap ? 'wrap' : 'nowrap')};
`;

export const Grid = styled.div<{
  columns?: number;
  gap?: number;
}>`
  display: grid;
  grid-template-columns: repeat(${({ columns = 1 }) => columns}, 1fr);
  gap: ${({ gap = 16 }) => gap}px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 16px 0;
`;

// ============================================================================
// BADGE COMPONENT
// Simplified: primary (neutral), success, error + outline. No warning/info
// variants — they map through theme tokens to approved colours.
// ============================================================================

interface BadgeProps {
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'outline';
}

const badgeVariantStyles = {
  primary: css`
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.buttonText};
  `,
  success: css`
    background-color: ${({ theme }) => `${theme.colors.success}26`};
    color: ${({ theme }) => theme.colors.successText};
    border: 1px solid ${({ theme }) => `${theme.colors.success}40`};
  `,
  error: css`
    background-color: ${({ theme }) => `${theme.colors.error}26`};
    color: ${({ theme }) => theme.colors.errorText};
    border: 1px solid ${({ theme }) => `${theme.colors.error}40`};
  `,
  warning: css`
    background-color: ${({ theme }) => `${theme.colors.warning}26`};
    color: ${({ theme }) => theme.colors.errorText};
    border: 1px solid ${({ theme }) => `${theme.colors.warning}40`};
  `,
  info: css`
    background-color: ${({ theme }) => theme.colors.backgroundTertiary};
    color: ${({ theme }) => theme.colors.text};
  `,
  outline: css`
    background-color: transparent;
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.border};
  `,
};

export const Badge = styled.span<BadgeProps>`
  ${({ variant = 'primary' }) => badgeVariantStyles[variant]}
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: ${borderRadius.full};
  line-height: 1;
`;

// ============================================================================
// LOADING SPINNER
// ============================================================================

export const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid ${({ theme }) => theme.colors.border};
    border-top-color: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

export const IconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.backgroundTertiary};
    border-color: ${({ theme }) => theme.colors.borderHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${focusRing}

  @media (max-width: 768px) {
    min-height: 44px;
  }
`;

export const SmallButton = styled.button`
  padding: 6px 12px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.backgroundTertiary};
    border-color: ${({ theme }) => theme.colors.borderHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${focusRing}
`;

export const SmallBadge = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: ${borderRadius.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  display: inline-block;
`;

// ============================================================================
// RESPONSIVE GRID LAYOUTS
// ============================================================================

export const ResponsiveGrid = styled.div<{ 
  minWidth?: string;
  gap?: number;
}>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${({ minWidth = '200px' }) => minWidth}, 1fr));
  gap: ${({ gap = 20 }) => gap}px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const TwoColumnGrid = styled.div<{ gap?: number }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ gap = 20 }) => gap}px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

export const ResponsiveDailyGrid = styled.div<{ gap?: number }>`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ gap = 20 }) => gap}px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

export const InputField = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// ============================================================================
// TOGGLE GROUP COMPONENT
// ============================================================================

export const ToggleGroup = styled.div`
  display: flex;
  gap: 8px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.sm};
  padding: 4px;
`;

export const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: ${borderRadius.sm};
  background: ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.buttonText : theme.colors.text};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryHover : theme.colors.backgroundTertiary};
  }
`;

// ============================================================================
// TAB COMPONENTS
// WAI-ARIA Tabs pattern. Use TabBar (role=tablist), Tab (role=tab),
// and TabPanel (role=tabpanel) together.
// ============================================================================

export const TabBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Tab = styled.button<{ $active?: boolean }>`
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textSecondary)};
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  margin-bottom: -1px;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  ${focusRing}
`;

export const TabPanel = styled.div`
  padding: 16px 0;
`;

// ============================================================================
// SCROLLABLE CONTAINER
// ============================================================================

export const ScrollableContainer = styled.div`
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;
