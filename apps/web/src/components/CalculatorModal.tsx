import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Copy } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalculatorModalProps {
  onClose: () => void;
}

const btnBase =
  'flex items-center justify-center rounded-sm border border-border p-4 text-lg font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-md active:translate-y-0';

const btnVariants: Record<string, string> = {
  number: 'bg-card text-foreground',
  operator: 'bg-primary text-white',
  equals: 'bg-green-600 text-white',
  clear: 'bg-destructive text-white',
  copy: 'bg-blue-500 text-white',
};

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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="m-auto w-[400px] max-w-[90vw] max-h-[90vh] rounded-lg bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="m-0 text-lg font-semibold text-foreground">Calculator</h2>
          <button
            onClick={onClose}
            className="text-2xl text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Display */}
          <div className="mb-4 min-h-[60px] overflow-x-auto break-all rounded-sm bg-secondary p-4 text-right font-mono text-[32px] font-bold text-foreground">
            {display}
          </div>

          {/* Button Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1: 7 8 9 ÷ */}
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('7')}>7</button>
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('8')}>8</button>
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('9')}>9</button>
            <button className={cn(btnBase, btnVariants.operator)} onClick={() => handleOperator('÷')}>÷</button>

            {/* Row 2: 4 5 6 × */}
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('4')}>4</button>
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('5')}>5</button>
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('6')}>6</button>
            <button className={cn(btnBase, btnVariants.operator)} onClick={() => handleOperator('×')}>×</button>

            {/* Row 3: 1 2 3 - */}
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('1')}>1</button>
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('2')}>2</button>
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('3')}>3</button>
            <button className={cn(btnBase, btnVariants.operator)} onClick={() => handleOperator('-')}>−</button>

            {/* Row 4: 0 . C + */}
            <button className={cn(btnBase, btnVariants.number)} onClick={() => handleNumber('0')}>0</button>
            <button className={cn(btnBase, btnVariants.number)} onClick={handleDecimal}>.</button>
            <button className={cn(btnBase, btnVariants.clear)} onClick={handleClear}>C</button>
            <button className={cn(btnBase, btnVariants.operator)} onClick={() => handleOperator('+')}>+</button>

            {/* Row 5: = (span 3) Copy */}
            <button
              className={cn(btnBase, btnVariants.equals, 'col-span-3')}
              onClick={handleEquals}
            >
              =
            </button>
            <button className={cn(btnBase, btnVariants.copy)} onClick={handleCopy}><Copy size={16} /></button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CalculatorModal;
