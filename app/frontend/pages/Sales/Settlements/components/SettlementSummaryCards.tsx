import React from 'react'
import { formatCLP } from '@/utils/formatters'

interface Props {
  expectedTotal: number
  declaredTotal: number
  currentDeclaredTotal: number
  isDraft: boolean
  isBalanced: boolean
  isFormBalanced: boolean
}

export default function SettlementSummaryCards({ 
  expectedTotal, 
  declaredTotal, 
  currentDeclaredTotal, 
  isDraft, 
  isBalanced, 
  isFormBalanced 
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-6 flex flex-col justify-center">
        <p className="text-primary-300 font-medium text-sm mb-1">VENTA ESPERADA (Según Sistema)</p>
        <div className="text-4xl font-black text-primary-400">{formatCLP(expectedTotal)}</div>
      </div>
      
      <div className={`border rounded-2xl p-6 flex flex-col justify-center ${
        isDraft 
          ? (isFormBalanced ? 'bg-primary-500/10 border-primary-500/20' : 'bg-orange-500/10 border-orange-500/20')
          : (isBalanced ? 'bg-primary-500/10 border-primary-500/20' : 'bg-red-500/10 border-red-500/20')
      }`}>
        <p className={`font-medium text-sm mb-1 ${
          isDraft 
            ? (isFormBalanced ? 'text-emerald-300' : 'text-orange-300')
            : (isBalanced ? 'text-emerald-300' : 'text-red-300')
        }`}>
          MONTO DECLARADO {isDraft && !isFormBalanced && '(DESCUADRE)'}
        </p>
        <div className={`text-4xl font-black ${
          isDraft 
            ? (isFormBalanced ? 'text-emerald-400' : 'text-orange-400')
            : (isBalanced ? 'text-emerald-400' : 'text-red-400')
        }`}>
          {formatCLP(isDraft ? currentDeclaredTotal : declaredTotal)}
        </div>
      </div>
    </div>
  )
}
