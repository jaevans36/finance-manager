import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Copy } from 'lucide-react';
import styled from 'styled-components';
import { spacing, typography, borderRadius, shadows, focusRing } from '@finance-manager/ui/styles';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: ${spacing.lg};
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${borderRadius.lg};
  width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: ${shadows.elevated};
  margin: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h2`
  margin: 0;
  ${typography.sectionHeading}
  color: ${({ theme }) => theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  ${typography.displayMedium}
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  ${focusRing}
`;

const ModalBody = styled.div`
  padding: ${spacing.lg};
`;

const Display = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  ${typography.displayLarge}
  font-family: 'Courier New', monospace;
  text-align: right;
  padding: ${spacing.lg};
  border-radius: ${borderRadius.sm};
  margin-bottom: ${spacing.lg};
  min-height: 60px;
  overflow-x: auto;
  word-break: break-all;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${spacing.sm};
`;

const CalcButton = styled.button<{ $variant?: 'number' | 'operator' | 'equals' | 'clear' | 'copy' }>`
  background: ${({ theme, $variant }) => {
    if ($variant === 'operator') return theme.colors.primary;
    if ($variant === 'equals') return theme.colors.success;
    if ($variant === 'clear') return theme.colors.error;
    if ($variant === 'copy') return theme.colors.info;
    return theme.colors.cardBackground;
  }};
  color: ${({ theme, $variant }) => 
    $variant && $variant !== 'number' ? 'white' : theme.colors.text
  };
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  ${typography.sectionHeading}
  padding: ${spacing.lg};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface CalculatorModalProps {
  onClose: () => void;
}

const CalculatorModal = ({ onClose }: CalculatorModalProps) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const calculate = useCallback((a: number, b: number, op: string) => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  }, []);

  const handleNumber = useCallback((value: string) => {
    if (waitingForOperand) {
      setDisplay(value);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? value : display + value);
    }
  }, [display, waitingForOperand]);

  const handleOperator = useCallback((op: string) => {
    if (previousValue && operation && !waitingForOperand) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(parseFloat(display));
    }
    setOperation(op);
    setWaitingForOperand(true);
  }, [previousValue, operation, waitingForOperand, display, calculate]);

  const handleEquals = useCallback(() => {
    if (previousValue !== null && operation) {
      const result = calculate(previousValue, parseFloat(display), operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [previousValue, operation, display, calculate]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  const handleDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(display);
  }, [display]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      if (e.key === '.') handleDecimal();
      if (e.key === '+' || e.key === '-') handleOperator(e.key);
      if (e.key === '*') handleOperator('×');
      if (e.key === '/') { e.preventDefault(); handleOperator('÷'); }
      if (e.key === 'Enter') handleEquals();
      if (e.key === 'Escape') onClose();
      if (e.key === 'c' || e.key === 'C') handleClear();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNumber, handleDecimal, handleOperator, handleEquals, handleClear, onClose]);

  return createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Calculator</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <Display>{display}</Display>
          <ButtonGrid>
            {/* Row 1: 7 8 9 ÷ */}
            <CalcButton $variant="number" onClick={() => handleNumber('7')}>7</CalcButton>
            <CalcButton $variant="number" onClick={() => handleNumber('8')}>8</CalcButton>
            <CalcButton $variant="number" onClick={() => handleNumber('9')}>9</CalcButton>
            <CalcButton $variant="operator" onClick={() => handleOperator('÷')}>÷</CalcButton>

            {/* Row 2: 4 5 6 × */}
            <CalcButton $variant="number" onClick={() => handleNumber('4')}>4</CalcButton>
            <CalcButton $variant="number" onClick={() => handleNumber('5')}>5</CalcButton>
            <CalcButton $variant="number" onClick={() => handleNumber('6')}>6</CalcButton>
            <CalcButton $variant="operator" onClick={() => handleOperator('×')}>×</CalcButton>

            {/* Row 3: 1 2 3 - */}
            <CalcButton $variant="number" onClick={() => handleNumber('1')}>1</CalcButton>
            <CalcButton $variant="number" onClick={() => handleNumber('2')}>2</CalcButton>
            <CalcButton $variant="number" onClick={() => handleNumber('3')}>3</CalcButton>
            <CalcButton $variant="operator" onClick={() => handleOperator('-')}>−</CalcButton>

            {/* Row 4: 0 . C + */}
            <CalcButton $variant="number" onClick={() => handleNumber('0')}>0</CalcButton>
            <CalcButton $variant="number" onClick={handleDecimal}>.</CalcButton>
            <CalcButton $variant="clear" onClick={handleClear}>C</CalcButton>
            <CalcButton $variant="operator" onClick={() => handleOperator('+')}>+</CalcButton>

            {/* Row 5: = (span 3) Copy */}
            <CalcButton 
              $variant="equals" 
              onClick={handleEquals}
              style={{ gridColumn: 'span 3' }}
            >
              =
            </CalcButton>
            <CalcButton $variant="copy" onClick={handleCopy}><Copy size={16} /></CalcButton>
          </ButtonGrid>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>,
    document.body
  );
};

export default CalculatorModal;
