import React, { ReactNode } from 'react'

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
    <tr className={`hover:bg-[var(--sf-bg)]/50 transition-colors ${className}`}>
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

Table.Thead = Thead
Table.Tbody = Tbody
Table.Tfoot = Tfoot
Table.Tr = Tr
Table.Th = Th
Table.Td = Td

export default Table
