import { useState, useMemo, useEffect } from 'react'
import { Head, useForm, Link, router } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import CurrencyInput from '@/components/CurrencyInput'
import { CustomSelect } from '@/components/CustomSelect'

interface ProductPrice {
  id: number
  channel: string
  price: string
}

interface Product {
  id: number
  name: string
  sku: string
  product_prices: ProductPrice[]
}

interface RouteSettlementItem {
  id: number
  product_id: number
  price_list_id: number
  unit_price: string
  subtotal: string
  sold_quantity: number
  returned_empty_quantity: number
  product?: Product
  price_list?: { name: string }
}

interface RouteSettlement {
  id: number
  date: string
  cash_revenue: string
  card_revenue: string
  transfer_revenue: string
  total_revenue: string
  status: string
  truck: { plate_number: string, driver?: { name: string } }
  route_settlement_items: RouteSettlementItem[]
}

interface TruckInventory {
  id: number
  quantity: number
  item: Product
}

interface Props {
  settlement: RouteSettlement
  truck_inventory: TruckInventory[]
  available_price_lists: { id: number, name: string }[]
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
}

export default function SettlementShow({ settlement, truck_inventory, available_price_lists }: Props) {
  const isDraft = settlement.status === 'draft'

  // Cálculos de montos esperados
  const expectedTotal = useMemo(() => {
    return settlement.route_settlement_items.reduce((total, item) => {
      // Usamos el subtotal que se guarda congelado en la base de datos
      return total + parseFloat(item.subtotal || '0')
    }, 0)
  }, [settlement.route_settlement_items])

  const declaredTotal = parseFloat(settlement.total_revenue || '0')
  const isBalanced = expectedTotal === declaredTotal

  // Formulario de Productos
  const itemForm = useForm({
    product_id: '',
    price_list_id: '',
    sold_quantity: '',
    returned_empty_quantity: ''
  })

  // Auto-llenar cantidad devuelta
  useEffect(() => {
    if (itemForm.data.sold_quantity && !itemForm.data.returned_empty_quantity) {
      itemForm.setData('returned_empty_quantity', itemForm.data.sold_quantity)
    }
  }, [itemForm.data.sold_quantity])

  // Determinar stock máximo disponible para el producto seleccionado
  const selectedInventory = useMemo(() => {
    if (!itemForm.data.product_id) return null
    return truck_inventory.find(inv => inv.item.id.toString() === itemForm.data.product_id) || null
  }, [itemForm.data.product_id, truck_inventory])

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    itemForm.post(`/sales/settlements/${settlement.id}/items`, {
      onSuccess: () => itemForm.reset('product_id', 'price_list_id', 'sold_quantity', 'returned_empty_quantity'),
      preserveScroll: true
    })
  }

  const deleteItem = (itemId: number) => {
    router.delete(`/sales/settlements/${settlement.id}/items/${itemId}`, { preserveScroll: true })
  }

  // Formulario de Pagos (Desglose)
  const paymentForm = useForm({
    cash_revenue: settlement.cash_revenue || '0',
    card_revenue: settlement.card_revenue || '0',
    transfer_revenue: settlement.transfer_revenue || '0',
  })

  const currentDeclaredTotal = 
    parseFloat(paymentForm.data.cash_revenue || '0') + 
    parseFloat(paymentForm.data.card_revenue || '0') + 
    parseFloat(paymentForm.data.transfer_revenue || '0')

  const isFormBalanced = expectedTotal === currentDeclaredTotal

  const savePayments = (e: React.FormEvent) => {
    e.preventDefault()
    paymentForm.patch(`/sales/settlements/${settlement.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        Swal.fire({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
          icon: 'success', title: 'Pagos guardados', background: 'var(--sf-dark-card)', color: '#fff'
        })
      }
    })
  }

  const confirmSettlement = () => {
    if (expectedTotal !== currentDeclaredTotal) {
      Swal.fire({
        title: 'Hay un descuadre',
        text: `El total esperado es ${formatCLP(expectedTotal)} pero has declarado ${formatCLP(currentDeclaredTotal)}. ¿Estás seguro de cerrar la caja con esta diferencia?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6366f1',
        confirmButtonText: 'Sí, confirmar con diferencia',
        cancelButtonText: 'Revisar',
        background: 'var(--sf-dark-card)',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          router.post(`/sales/settlements/${settlement.id}/complete`, {
            cash_revenue: paymentForm.data.cash_revenue,
            card_revenue: paymentForm.data.card_revenue,
            transfer_revenue: paymentForm.data.transfer_revenue
          })
        }
      })
    } else {
      Swal.fire({
        title: '¿Confirmar Rendición?',
        text: 'La rendición está cuadrada. Esto actualizará el inventario del camión.',
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6366f1',
        confirmButtonText: 'Sí, confirmar rendición',
        cancelButtonText: 'Cancelar',
        background: 'var(--sf-dark-card)',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          router.post(`/sales/settlements/${settlement.id}/complete`, {
            cash_revenue: paymentForm.data.cash_revenue,
            card_revenue: paymentForm.data.card_revenue,
            transfer_revenue: paymentForm.data.transfer_revenue
          })
        }
      })
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Rendición #${settlement.id}`} />

      <div className="space-y-6 pb-20">
        {/* Encabezado Principal */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--sf-surface)] border border-[var(--sf-border)] p-6 rounded-2xl border-l-4 border-l-indigo-500 mb-2">
          <div className="flex items-center gap-4">
            <Link href="/sales/settlements" className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors bg-[var(--sf-bg)] p-2 rounded-lg border border-[var(--sf-border)]">
              ← Volver
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-bold text-[var(--sf-text-main)] flex items-center gap-3">
                Rendición del {settlement.date}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  isDraft ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
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
              onClick={confirmSettlement}
              className={`px-6 py-3 font-bold rounded-xl transition-all shadow-lg w-full sm:w-auto ${
                isFormBalanced 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-[var(--sf-text-main)] shadow-emerald-500/25' 
                  : 'bg-orange-500 hover:bg-orange-600 text-[var(--sf-text-main)] shadow-orange-500/25'
              }`}
            >
              🔒 CONFIRMAR RENDICIÓN
            </button>
          )}
        </div>

        {/* Resumen de Caja Superior */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col justify-center">
            <p className="text-indigo-300 font-medium text-sm mb-1">VENTA ESPERADA (Según Sistema)</p>
            <div className="text-4xl font-black text-indigo-400">{formatCLP(expectedTotal)}</div>
          </div>
          
          <div className={`border rounded-2xl p-6 flex flex-col justify-center ${
            isDraft 
              ? (isFormBalanced ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20')
              : (isBalanced ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20')
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Formularios (Productos y Pagos) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Formulario de Pagos */}
            <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl border border-emerald-500/30">
                  $
                </div>
                <div>
                  <h2 className="font-semibold text-[var(--sf-text-main)]">Desglose de Pagos</h2>
                  <p className="text-xs text-[var(--sf-text-muted)]">¿Cómo pagaron los clientes?</p>
                </div>
              </div>

              <form onSubmit={savePayments} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Efectivo</label>
                  <CurrencyInput
                    value={paymentForm.data.cash_revenue}
                    onValueChange={val => paymentForm.setData('cash_revenue', val)}
                    disabled={!isDraft}
                    className="text-emerald-400 font-bold !py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Tarjetas (Transbank)</label>
                  <CurrencyInput
                    value={paymentForm.data.card_revenue}
                    onValueChange={val => paymentForm.setData('card_revenue', val)}
                    disabled={!isDraft}
                    className="text-blue-400 font-bold !py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Transferencias</label>
                  <CurrencyInput
                    value={paymentForm.data.transfer_revenue}
                    onValueChange={val => paymentForm.setData('transfer_revenue', val)}
                    disabled={!isDraft}
                    className="text-purple-400 font-bold !py-3"
                  />
                </div>

                {isDraft && (
                  <button
                    type="submit"
                    disabled={paymentForm.processing || (!paymentForm.isDirty && currentDeclaredTotal === 0)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-[var(--sf-text-main)] font-bold rounded-xl transition-colors shadow-lg mt-2"
                  >
                    Guardar Desglose
                  </button>
                )}
              </form>
            </div>

            {/* Formulario de Ventas */}
            {isDraft && (
              <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl border border-indigo-500/30">
                    +
                  </div>
                  <div>
                    <h2 className="font-semibold text-[var(--sf-text-main)]">Ventas y Envases</h2>
                    <p className="text-xs text-[var(--sf-text-muted)]">¿Qué cilindros se movieron?</p>
                  </div>
                </div>

                <form onSubmit={addItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Producto Vendido</label>
                      {truck_inventory.length === 0 ? (
                        <p className="text-orange-400 text-sm bg-[var(--sf-bg)] border border-orange-500/20 px-4 py-3 rounded-xl">
                          Este camión no tiene stock de ningún producto. Primero debes cargar el camión.
                        </p>
                      ) : (
                        <CustomSelect
                          value={itemForm.data.product_id ? { value: itemForm.data.product_id, label: (() => {
                            const inv = truck_inventory.find(i => i.item.id.toString() === itemForm.data.product_id);
                            if (!inv) return '';
                            return `${inv.item.name} (Max ${inv.quantity})`;
                          })() } : null}
                          onChange={(val: any) => itemForm.setData('product_id', val?.value || '')}
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
                        value={itemForm.data.price_list_id ? { value: itemForm.data.price_list_id, label: available_price_lists.find(l => l.id.toString() === itemForm.data.price_list_id)?.name || '' } : null}
                        onChange={(val: any) => itemForm.setData('price_list_id', val?.value || '')}
                        options={available_price_lists.map(l => ({ value: l.id.toString(), label: l.name }))}
                        placeholder="Selecciona lista..."
                        required
                        isDisabled={!itemForm.data.product_id}
                      />
                      {itemForm.data.product_id && itemForm.data.price_list_id && (
                        <p className="text-xs text-indigo-400 mt-1">
                          Precio: {(() => {
                            const inv = truck_inventory.find(i => i.item.id.toString() === itemForm.data.product_id);
                            const productPrice = inv?.item.product_prices?.find(p => p.price_list?.id.toString() === itemForm.data.price_list_id);
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
                        value={itemForm.data.sold_quantity}
                        onChange={e => {
                          itemForm.setData('sold_quantity', e.target.value)
                          // Auto-sync empty quantity only if it matches or is empty
                          if (!itemForm.data.returned_empty_quantity || itemForm.data.returned_empty_quantity === itemForm.data.sold_quantity) {
                            itemForm.setData('returned_empty_quantity', e.target.value)
                          }
                        }}
                        placeholder={selectedInventory ? `Max ${selectedInventory.quantity}` : ''}
                        disabled={!selectedInventory}
                        className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-indigo-400 font-bold focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
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
                        value={itemForm.data.returned_empty_quantity}
                        onChange={e => itemForm.setData('returned_empty_quantity', e.target.value)}
                        disabled={!selectedInventory}
                        className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-orange-400 font-bold focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={itemForm.processing || truck_inventory.length === 0}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    Agregar a la rendición
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Columna Derecha: Lista de Ítems */}
          <div className="lg:col-span-8">
            <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden h-full">
              <div className="p-5 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
                <h2 className="font-semibold text-[var(--sf-text-main)] text-lg">Detalle de Operación</h2>
              </div>
              
              <div className="overflow-x-auto">
                {settlement.route_settlement_items.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-4 opacity-50">🧾</div>
                    <h3 className="text-lg font-medium text-[var(--sf-text-main)] mb-2">No hay ventas registradas</h3>
                    <p className="text-[var(--sf-text-muted)] max-w-sm">
                      {isDraft 
                        ? "Agrega los cilindros vendidos en el formulario de la izquierda. El sistema calculará el total a rendir."
                        : "Esta rendición se completó sin movimientos."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--sf-bg)]/50 text-[var(--sf-text-muted)] border-b border-[var(--sf-border)]">
                      <tr>
                        <th className="px-6 py-4 font-medium">Producto</th>
                        <th className="px-6 py-4 font-medium text-center">Llenos Vendidos</th>
                        <th className="px-6 py-4 font-medium text-center">Vacíos Recibidos</th>
                        <th className="px-6 py-4 font-medium text-right">Subtotal</th>
                        {isDraft && <th className="px-6 py-4 font-medium w-16"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--sf-dark-border)]">
                      {settlement.route_settlement_items.map((item) => {
                        return (
                          <tr key={item.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-[var(--sf-text-main)]">{item.product?.name}</div>
                              <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                                Lista: <span className="text-indigo-400 font-medium">{item.price_list?.name || 'S/N'}</span> ({formatCLP(item.unit_price)} c/u)
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 font-bold text-base">
                                {item.sold_quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 font-bold text-base">
                                {item.returned_empty_quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-400">
                              {formatCLP(item.subtotal)}
                            </td>
                            {isDraft && (
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => deleteItem(item.id)} 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                  title="Eliminar"
                                >
                                  ✕
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
