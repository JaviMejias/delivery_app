import React from 'react';
import { Banknote, CreditCard, Building2, Ticket } from 'lucide-react';

interface PaymentBadgeProps {
  method: string;
}

export function PaymentBadge({ method }: PaymentBadgeProps) {
  switch (method) {
    case 'cash':
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
          <Banknote size={16} className="opacity-80" /> Efectivo
        </span>
      );
    case 'card':
      return (
        <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium">
          <CreditCard size={16} className="opacity-80" /> Tarjeta
        </span>
      );
    case 'transfer':
      return (
        <span className="inline-flex items-center gap-1.5 text-purple-400 font-medium">
          <Building2 size={16} className="opacity-80" /> Transferencia
        </span>
      );
    case 'cheque':
      return (
        <span className="inline-flex items-center gap-1.5 text-orange-400 font-medium">
          <Ticket size={16} className="opacity-80" /> Cheque
        </span>
      );
    default:
      return <span className="capitalize text-[var(--sf-text-muted)] font-medium">{method}</span>;
  }
}
