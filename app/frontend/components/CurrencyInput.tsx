import React, { useState, useEffect } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number;
  onValueChange: (value: string) => void;
  currencySymbol?: string;
}

export default function CurrencyInput({ value, onValueChange, currencySymbol = '$', className = '', ...props }: Props) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const strippedDisplay = displayValue.replace(/\D/g, '');
    const propString = value?.toString() || '';
    
    if (strippedDisplay !== propString) {
      if (!propString) {
        setDisplayValue('');
      } else {
        const num = parseInt(propString, 10);
        if (!isNaN(num)) {
          setDisplayValue(num.toLocaleString('es-CL'));
        }
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    
    if (rawValue.length > 1 && rawValue.startsWith('0')) {
      rawValue = rawValue.replace(/^0+/, '');
      if (rawValue === '') rawValue = '0';
    }

    if (rawValue === '') {
      setDisplayValue('');
      onValueChange('');
    } else {
      const num = parseInt(rawValue, 10);
      setDisplayValue(num.toLocaleString('es-CL'));
      onValueChange(rawValue);
    }
  };

  return (
    <div className="relative">
      {currencySymbol && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sf-text-muted)] font-medium">
          {currencySymbol}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        className={`w-full ${currencySymbol ? 'pl-8' : 'px-4'} pr-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 ${className}`}
        {...props}
      />
    </div>
  );
}
