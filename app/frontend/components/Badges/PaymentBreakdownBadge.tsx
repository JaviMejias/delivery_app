import React from 'react'
import { Banknote, CreditCard, ArrowRightLeft } from 'lucide-react'
import { formatCLP } from '@/utils/formatters'

interface Props {
  cashAmount?: string | number
  cardAmount?: string | number
  transferAmount?: string | number
  className?: string
}

export function PaymentBreakdownBadge({ cashAmount = 0, cardAmount = 0, transferAmount = 0, className = '' }: Props) {
  const cash = parseFloat(cashAmount.toString() || '0')
  const card = parseFloat(cardAmount.toString() || '0')
  const transfer = parseFloat(transferAmount.toString() || '0')

  if (cash === 0 && card === 0 && transfer === 0) {
    return <span className={`text-[var(--sf-text-muted)] text-xs ${className}`}>-</span>
  }

  return (
    <div className={`flex flex-col gap-1.5 text-xs ${className}`}>
      {cash !== 0 && (
        <div className="flex items-center gap-1.5 text-emerald-400" title="Efectivo">
          <Banknote className="w-3.5 h-3.5" />
          <span className="font-medium">{formatCLP(cash)}</span>
        </div>
      )}
      {card !== 0 && (
        <div className="flex items-center gap-1.5 text-blue-400" title="Tarjeta">
          <CreditCard className="w-3.5 h-3.5" />
          <span className="font-medium">{formatCLP(card)}</span>
        </div>
      )}
      {transfer !== 0 && (
        <div className="flex items-center gap-1.5 text-purple-400" title="Transferencia">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span className="font-medium">{formatCLP(transfer)}</span>
        </div>
      )}
    </div>
  )
}
