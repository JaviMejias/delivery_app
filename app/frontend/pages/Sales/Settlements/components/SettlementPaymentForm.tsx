import React from 'react'
import CurrencyInput from '@/components/CurrencyInput'

interface Props {
  data: {
    cash_revenue: string
    card_revenue: string
    transfer_revenue: string
  }
  setData: (key: string, value: string) => void
  isDraft: boolean
  processing: boolean
  isDirty: boolean
  currentDeclaredTotal: number
  onSave: (e: React.FormEvent) => void
}

export default function SettlementPaymentForm({
  data,
  setData,
  isDraft,
  processing,
  isDirty,
  currentDeclaredTotal,
  onSave
}: Props) {
  return (
    <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-emerald-400 text-xl border border-primary-500/30">
          $
        </div>
        <div>
          <h2 className="font-semibold text-[var(--sf-text-main)]">Desglose de Pagos</h2>
          <p className="text-xs text-[var(--sf-text-muted)]">¿Cómo pagaron los clientes?</p>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Efectivo</label>
          <CurrencyInput
            value={data.cash_revenue}
            onValueChange={val => setData('cash_revenue', val)}
            disabled={!isDraft}
            allowNegative={true}
            className="text-emerald-400 font-bold !py-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Tarjetas (Transbank)</label>
          <CurrencyInput
            value={data.card_revenue}
            onValueChange={val => setData('card_revenue', val)}
            disabled={!isDraft}
            allowNegative={true}
            className="text-blue-400 font-bold !py-3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Transferencias</label>
          <CurrencyInput
            value={data.transfer_revenue}
            onValueChange={val => setData('transfer_revenue', val)}
            disabled={!isDraft}
            allowNegative={true}
            className="text-purple-400 font-bold !py-3"
          />
        </div>

        {isDraft && (
          <button
            type="submit"
            disabled={processing || (!isDirty && currentDeclaredTotal === 0)}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-bold rounded-xl transition-colors shadow-lg mt-2 disabled:opacity-50"
          >
            Guardar Desglose
          </button>
        )}
      </form>
    </div>
  )
}
