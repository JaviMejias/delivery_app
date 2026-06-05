import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let bgClass = '';
  let textClass = '';
  let borderClass = '';
  let label = '';

  switch (status) {
    case 'draft':
      bgClass = 'bg-gray-500/10';
      textClass = 'text-gray-400';
      borderClass = 'border-gray-500/20';
      label = 'Borrador';
      break;
    case 'pending':
      bgClass = 'bg-amber-500/10';
      textClass = 'text-amber-400';
      borderClass = 'border-amber-500/20';
      label = 'Pendiente';
      break;
    case 'partial':
      bgClass = 'bg-blue-500/10';
      textClass = 'text-blue-400';
      borderClass = 'border-blue-500/20';
      label = 'Parcial';
      break;
    case 'voided':
    case 'cancelled':
      bgClass = 'bg-red-500/10';
      textClass = 'text-red-400';
      borderClass = 'border-red-500/20';
      label = 'Anulada';
      break;
    case 'paid':
    case 'received':
    case 'completed':
    case 'confirmed':
      bgClass = 'bg-emerald-500/10';
      textClass = 'text-emerald-400';
      borderClass = 'border-emerald-500/20';
      label = status === 'paid' ? 'Pagada' : status === 'received' ? 'Recibida' : status === 'confirmed' ? 'Confirmada' : 'Completada';
      break;
    default:
      bgClass = 'bg-[var(--sf-surface)]';
      textClass = 'text-[var(--sf-text-muted)]';
      borderClass = 'border-[var(--sf-border)]';
      label = status;
      break;
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${bgClass} ${textClass} ${borderClass}`}>
      {label}
    </span>
  );
}
