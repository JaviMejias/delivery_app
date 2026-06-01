import React, { useState, useEffect } from 'react';
import { formatPhone } from '@/utils/formatters';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export default function PhoneInput({ value, onValueChange, className = '', ...props }: Props) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (!value) {
      setDisplayValue('+56 9');
    } else {
      setDisplayValue(formatPhone(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const formatted = formatPhone(inputVal);
    setDisplayValue(formatted);
    onValueChange(formatted);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!value) {
      setDisplayValue('+56 9');
      onValueChange('+56 9');
    }
    if (props.onFocus) props.onFocus(e);
  };

  return (
    <input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      className={`w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 ${className}`}
      placeholder="+56 9 XXXX XXXX"
      {...props}
    />
  );
}
