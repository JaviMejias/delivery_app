import React, { useState, useEffect } from 'react';
import { formatRut } from '@/utils/formatters';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export default function RutInput({ value, onValueChange, className = '', ...props }: Props) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatRut(value || ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setDisplayValue(formatted);
    onValueChange(formatted);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={`w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 uppercase ${className}`}
      placeholder="12.345.678-9"
      {...props}
    />
  );
}
