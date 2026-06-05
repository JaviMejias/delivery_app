import React, { useState, useEffect } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number;
  onValueChange: (value: string) => void;
  currencySymbol?: string;
  allowNegative?: boolean;
}

export default function CurrencyInput({ value, onValueChange, currencySymbol = '$', allowNegative = false, className = '', ...props }: Props) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const propString = value?.toString() || '';
    const isNegative = propString.startsWith('-');
    const strippedProp = propString.replace(/\D/g, '');

    const currentStrippedDisplay = displayValue.replace(/\D/g, '');
    const currentIsNegative = displayValue.startsWith('-');

    if (strippedProp !== currentStrippedDisplay || isNegative !== currentIsNegative) {
      if (!strippedProp) {
        setDisplayValue(isNegative ? '-' : '');
      } else {
        const num = parseInt(strippedProp, 10);
        if (!isNaN(num)) {
          setDisplayValue(isNegative ? `-${num.toLocaleString('es-CL')}` : num.toLocaleString('es-CL'));
        }
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    const isNegative = allowNegative && rawValue.startsWith('-');
    
    rawValue = rawValue.replace(/\D/g, '');
    
    if (rawValue.length > 1 && rawValue.startsWith('0')) {
      rawValue = rawValue.replace(/^0+/, '');
      if (rawValue === '') rawValue = '0';
    }

    if (rawValue === '') {
      setDisplayValue(isNegative ? '-' : '');
      onValueChange(isNegative ? '-' : '');
    } else {
      const num = parseInt(rawValue, 10);
      const finalStr = isNegative ? `-${num}` : `${num}`;
      setDisplayValue(isNegative ? `-${num.toLocaleString('es-CL')}` : num.toLocaleString('es-CL'));
      onValueChange(finalStr);
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
        className={`w-full ${currencySymbol ? 'pl-8' : 'px-4'} pr-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 ${className}`}
        {...props}
      />
    </div>
  );
}
