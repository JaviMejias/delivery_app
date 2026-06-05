import React from 'react'
import BackButton from '@/components/BackButton'
import { RouteSettlement } from '../types'

interface Props {
  settlement: RouteSettlement
  isDraft: boolean
  isFormBalanced: boolean
  onConfirm: () => void
}

export default function SettlementHeader({ settlement, isDraft, isFormBalanced, onConfirm }: Props) {
  return (
    <div className="glass-panel interactive-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl border-l-4 border-l-indigo-500 mb-2">
      <div className="flex items-center gap-4">
        <BackButton href="/sales/settlements" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--sf-text-main)] flex items-center gap-3">
            Rendición del {settlement.date}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              isDraft ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
              'bg-primary-500/10 text-primary-400 border-primary-500/20'
            }`}>
              {isDraft ? 'Borrador (Abierta)' : 'Cerrada'}
            </span>
          </h1>
          <div className="mt-2 text-sm text-[var(--sf-text-muted)]">
            Camión: <strong className="text-[var(--sf-text-main)] font-mono tracking-widest">{settlement.truck.plate_number}</strong> 
            <span className="mx-2">•</span> 
            Chofer: <strong className="text-[var(--sf-text-main)]">{settlement.truck.driver ? `${settlement.truck.driver.first_name} ${settlement.truck.driver.last_name}` : 'Sin chofer'}</strong>
          </div>
        </div>
      </div>

      {isDraft && (
        <button
          onClick={onConfirm}
          className={`px-6 py-3 font-bold rounded-xl transition-all shadow-lg w-full sm:w-auto ${
            isFormBalanced 
              ? 'bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] shadow-primary-500/25' 
              : 'bg-orange-500 hover:bg-orange-600 text-[var(--sf-text-main)] shadow-orange-500/25'
          }`}
        >
          🔒 CONFIRMAR RENDICIÓN
        </button>
      )}
    </div>
  )
}
