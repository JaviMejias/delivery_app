import React, { useMemo, useEffect } from 'react'
import { CustomSelect } from '@/components/CustomSelect'
import CurrencyInput from '@/components/CurrencyInput'
import { formatCLP } from '@/utils/formatters'
import { TruckInventory } from '../types'

interface Props {
  formType: 'sale' | 'expense'
  setFormType: (type: 'sale' | 'expense') => void
  truck_inventory: TruckInventory[]
  available_price_lists: { id: number, name: string }[]
  // Sale form state
  itemFormData: any
  setItemData: (key: string, value: any) => void
  isItemProcessing: boolean
  onAddSale: (e: React.FormEvent) => void
  // Expense form state
  expenseFormData: any
  setExpenseData: (key: string, value: any) => void
  isExpenseProcessing: boolean
  onAddExpense: (e: React.FormEvent) => void
}

export default function SettlementMovementForm({
  formType,
  setFormType,
  truck_inventory,
  available_price_lists,
  itemFormData,
  setItemData,
  isItemProcessing,
  onAddSale,
  expenseFormData,
  setExpenseData,
  isExpenseProcessing,
  onAddExpense
}: Props) {
  
  // Auto-sync empty quantity logic (extracted from parent)
  useEffect(() => {
    if (itemFormData.sold_quantity && !itemFormData.returned_empty_quantity) {
      setItemData('returned_empty_quantity', itemFormData.sold_quantity)
    }
  }, [itemFormData.sold_quantity])

  const selectedInventory = useMemo(() => {
    if (!itemFormData.product_id) return null
    return truck_inventory.find(inv => inv.item.id.toString() === itemFormData.product_id) || null
  }, [itemFormData.product_id, truck_inventory])

  return (
    <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-6">
      <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border shrink-0 ${formType === 'sale' ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
            {formType === 'sale' ? '+' : '-'}
          </div>
          <div>
            <h2 className="font-semibold text-[var(--sf-text-main)]">Registrar Movimiento</h2>
            <p className="text-xs text-[var(--sf-text-muted)]">Añade ventas o gastos de ruta</p>
          </div>
        </div>
        
        {/* Switch Control */}
        <div className="bg-[var(--sf-bg)] p-1 rounded-xl flex items-center border border-[var(--sf-border)] w-full 2xl:w-auto">
          <button
            type="button"
            onClick={() => setFormType('sale')}
            className={`flex-1 2xl:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all ${formType === 'sale' ? 'bg-primary-500 text-white shadow-md' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
          >
            💰 Venta
          </button>
          <button
            type="button"
            onClick={() => setFormType('expense')}
            className={`flex-1 2xl:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all ${formType === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
          >
            ⛽ Gasto
          </button>
        </div>
      </div>

      {formType === 'sale' ? (
        <form onSubmit={onAddSale} className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Producto Vendido</label>
              {truck_inventory.length === 0 ? (
                <p className="text-orange-400 text-sm bg-[var(--sf-bg)] border border-orange-500/20 px-4 py-3 rounded-xl">
                  Este camión no tiene stock de ningún producto. Primero debes cargar el camión.
                </p>
              ) : (
                <CustomSelect
                  value={itemFormData.product_id ? { value: itemFormData.product_id, label: (() => {
                    const inv = truck_inventory.find(i => i.item.id.toString() === itemFormData.product_id);
                    if (!inv) return '';
                    return `${inv.item.name} (Max ${inv.quantity})`;
                  })() } : null}
                  onChange={(val: any) => setItemData('product_id', val?.value || '')}
                  options={truck_inventory.map(inv => {
                    const p = inv.item;
                    return { value: p.id.toString(), label: `${p.name} (Max ${inv.quantity})` };
                  })}
                  placeholder="Selecciona producto..."
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Lista de Precio</label>
              <CustomSelect
                value={itemFormData.price_list_id ? { value: itemFormData.price_list_id, label: available_price_lists.find(l => l.id.toString() === itemFormData.price_list_id)?.name || '' } : null}
                onChange={(val: any) => setItemData('price_list_id', val?.value || '')}
                options={available_price_lists.map(l => ({ value: l.id.toString(), label: l.name }))}
                placeholder="Selecciona lista..."
                required
                isDisabled={!itemFormData.product_id}
              />
              {itemFormData.product_id && itemFormData.price_list_id && (
                <p className="text-xs text-primary-400 mt-1">
                  Precio: {(() => {
                    const inv = truck_inventory.find(i => i.item.id.toString() === itemFormData.product_id);
                    const productPrice = inv?.item.product_prices?.find(p => p.price_list?.id.toString() === itemFormData.price_list_id);
                    return productPrice ? formatCLP(productPrice.price) : 'No configurado ($0)';
                  })()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--sf-text-main)] mb-1.5">Llenos Vendidos</label>
              <input
                type="number" min="1" max={selectedInventory ? selectedInventory.quantity : undefined}
                value={itemFormData.sold_quantity}
                onChange={e => {
                  setItemData('sold_quantity', e.target.value)
                  if (!itemFormData.returned_empty_quantity || itemFormData.returned_empty_quantity === itemFormData.sold_quantity) {
                    setItemData('returned_empty_quantity', e.target.value)
                  }
                }}
                placeholder={selectedInventory ? `Max ${selectedInventory.quantity}` : ''}
                disabled={!selectedInventory}
                className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-primary-400 font-bold focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
                required
              />
              {selectedInventory && (
                <p className="text-xs text-[var(--sf-text-muted)] mt-1 text-right">
                  Stock en camión: {selectedInventory.quantity}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--sf-text-main)] mb-1.5">Vacíos Recibidos</label>
              <input
                type="number" min="0"
                value={itemFormData.returned_empty_quantity}
                onChange={e => setItemData('returned_empty_quantity', e.target.value)}
                disabled={!selectedInventory}
                className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-orange-400 font-bold focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isItemProcessing || truck_inventory.length === 0}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Agregar Venta a la Rendición
          </button>
        </form>
      ) : (
        <form onSubmit={onAddExpense} className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Descripción del Gasto</label>
            <input
              type="text"
              value={expenseFormData.description}
              onChange={e => setExpenseData('description', e.target.value)}
              placeholder="Ej: Petróleo, Viático, Peaje..."
              className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-rose-500/50"
              required
            />
          </div>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Monto Gasto</label>
              <CurrencyInput
                value={expenseFormData.amount}
                onValueChange={val => setExpenseData('amount', val)}
                className="text-rose-400 font-bold !py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Pagado con</label>
              <select
                value={expenseFormData.payment_method}
                onChange={e => setExpenseData('payment_method', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-rose-500/50"
                required
              >
                <option value="cash">Efectivo (Restará de Caja)</option>
                <option value="card">Tarjeta Corporativa</option>
                <option value="transfer">Transferencia Empresa</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isExpenseProcessing || !expenseFormData.amount || !expenseFormData.description}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Registrar Gasto
          </button>
        </form>
      )}
    </div>
  )
}
