import React from 'react'
import { Trash2 } from 'lucide-react'
import { formatCLP } from '@/utils/formatters'
import { RouteSettlementItem, RouteSettlementExpense } from '../types'

interface Props {
  isDraft: boolean
  hasOperations: boolean
  items: RouteSettlementItem[]
  expenses: RouteSettlementExpense[]
  onDeleteItem: (id: number) => void
  onDeleteExpense: (id: number) => void
}

export default function SettlementHistoryTable({
  isDraft,
  hasOperations,
  items,
  expenses,
  onDeleteItem,
  onDeleteExpense
}: Props) {
  return (
    <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden h-full">
      <div className="p-5 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
        <h2 className="font-semibold text-[var(--sf-text-main)] text-lg">Detalle de Operación</h2>
      </div>
      
      <div className="overflow-x-auto">
        {!hasOperations ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4 opacity-50">🧾</div>
            <h3 className="text-lg font-medium text-[var(--sf-text-main)] mb-2">No hay movimientos registrados</h3>
            <p className="text-[var(--sf-text-muted)] max-w-sm">
              {isDraft 
                ? "Agrega ventas o gastos en el formulario de la izquierda. El sistema calculará el total a rendir."
                : "Esta rendición se completó sin movimientos."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--sf-bg)]/50 text-[var(--sf-text-muted)] border-b border-[var(--sf-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Concepto</th>
                <th className="px-6 py-4 font-medium text-center">Métricas</th>
                <th className="px-6 py-4 font-medium text-right">Subtotal</th>
                {isDraft && <th className="px-6 py-4 font-medium w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sf-dark-border)]">
              {items.map((item) => (
                <tr key={`item-${item.id}`} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <div className="font-medium text-[var(--sf-text-main)]">Venta: {item.product?.name}</div>
                    </div>
                    <div className="text-xs text-[var(--sf-text-muted)] mt-0.5 ml-4">
                      Lista: <span className="text-primary-400 font-medium">{item.price_list?.name || 'S/N'}</span> ({formatCLP(item.unit_price)} c/u)
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-primary-500/10 border border-primary-500/20 rounded-lg text-primary-400 font-bold text-xs" title="Llenos Vendidos">
                        {item.sold_quantity} Llenos
                      </span>
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 font-bold text-xs" title="Vacíos Recibidos">
                        {item.returned_empty_quantity} Vacíos
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-400">
                    +{formatCLP(item.subtotal)}
                  </td>
                  {isDraft && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDeleteItem(item.id)} 
                        className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                        title="Eliminar Venta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {expenses && expenses.map((expense) => (
                <tr key={`expense-${expense.id}`} className="hover:bg-[var(--sf-bg)]/50 transition-colors bg-rose-500/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <div className="font-medium text-[var(--sf-text-main)]">Gasto: {expense.description}</div>
                    </div>
                    <div className="text-xs text-rose-400/80 mt-0.5 ml-4 uppercase tracking-wider font-semibold">
                      Pagado con: {expense.payment_method === 'cash' ? 'Efectivo' : expense.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-[var(--sf-text-muted)] italic">Egreso Operativo</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-rose-400">
                    -{formatCLP(expense.amount)}
                  </td>
                  {isDraft && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDeleteExpense(expense.id)} 
                        className="p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors"
                        title="Eliminar Gasto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
