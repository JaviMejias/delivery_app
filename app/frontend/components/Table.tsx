import React, { ReactNode } from 'react'
import EmptyState from './EmptyState'

interface TableProps {
  children?: ReactNode
  className?: string
}

function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm">
        {children}
      </table>
    </div>
  )
}

function Thead({ children, className = '' }: TableProps) {
  return (
    <thead className={`bg-[var(--sf-bg)] text-[var(--sf-text-muted)] border-b border-[var(--sf-border)] ${className}`}>
      {children}
    </thead>
  )
}

function Tbody({ children, className = '' }: TableProps) {
  return (
    <tbody className={`divide-y divide-[var(--sf-dark-border)] ${className}`}>
      {children}
    </tbody>
  )
}

function Tr({ children, className = '' }: TableProps) {
  return (
    <tr className={`hover:bg-[var(--sf-bg)]/50 transition-colors animate-on-scroll ${className}`}>
      {children}
    </tr>
  )
}

function Th({ children, className = '' }: TableProps) {
  return (
    <th className={`px-6 py-4 font-medium ${className}`}>
      {children}
    </th>
  )
}

function Td({ children, className = '', colSpan }: TableProps & { colSpan?: number }) {
  return (
    <td className={`px-6 py-4 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  )
}

function Tfoot({ children, className = '' }: TableProps) {
  return (
    <tfoot className={`bg-[var(--sf-bg)] ${className}`}>
      {children}
    </tfoot>
  )
}

function Empty({ 
  title = "No hay datos", 
  description = "No se encontraron registros para mostrar.", 
  type = 'box',
  colSpan = 100 
}: { 
  title?: string, 
  description?: string, 
  type?: 'box' | 'search',
  colSpan?: number 
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0 border-b-0">
        <EmptyState title={title} description={description} type={type} />
      </td>
    </tr>
  )
}

function TotalRow({ 
  label, 
  value, 
  colSpan = 4, 
  trailingColSpan = 0,
  color = 'primary' 
}: { 
  label: ReactNode, 
  value: ReactNode, 
  colSpan?: number, 
  trailingColSpan?: number,
  color?: 'primary' | 'rose' | 'emerald' | 'amber' | 'neutral' 
}) {
  const colorMap = {
    primary: { bg: 'bg-primary-500/5', border: 'border-primary-500/20', label: 'text-primary-400', value: 'text-primary-500' },
    rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', label: 'text-rose-400', value: 'text-rose-500' },
    emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', label: 'text-emerald-500', value: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', label: 'text-amber-500', value: 'text-amber-400' },
    neutral: { bg: 'bg-[var(--sf-bg)]', border: 'border-[var(--sf-border)]', label: 'text-[var(--sf-text-main)]', value: 'text-[var(--sf-text-main)]' },
  };
  const styles = colorMap[color];

  return (
    <tr className={`${styles.bg} border-t-2 ${styles.border}`}>
      <td colSpan={colSpan} className={`px-6 py-4 text-right font-bold ${styles.label}`}>
        {label}
      </td>
      <td className={`px-6 py-4 text-right text-lg font-black ${styles.value}`}>
        {value}
      </td>
      {trailingColSpan > 0 && <td colSpan={trailingColSpan}></td>}
    </tr>
  );
}

Table.Thead = Thead
Table.Tbody = Tbody
Table.Tfoot = Tfoot
Table.Tr = Tr
Table.Th = Th
Table.Td = Td
Table.Empty = Empty
Table.TotalRow = TotalRow

export default Table
