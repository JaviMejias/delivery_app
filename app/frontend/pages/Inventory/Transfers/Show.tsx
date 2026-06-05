import { Head, useForm, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomSwitch } from '@/components/CustomSwitch'
import BackButton from '@/components/BackButton'
import { Download } from 'lucide-react'
import { confirmDelete } from '@/utils/alerts'

interface Product {
  id: number
  name: string
  material?: { id: number, name: string, returnable: boolean }
}

interface StockTransferItem {
  id: number
  item_id: number
  quantity: number
  item_type: string
  item?: Product | Material
}

interface StockTransfer {
  id: number
  status: string
  created_at: string
  source_warehouse: { id: number, name: string }
  destination_warehouse: { id: number, name: string }
  stock_transfer_items: StockTransferItem[]
}

interface Props {
  transfer: StockTransfer
  products: Product[]
}

export default function TransferShow({ transfer, products }: Props) {
  const isDraft = transfer.status === 'draft'

  const itemForm = useForm({
    product_id: '',
    is_empty: false,
    quantity: ''
  })

  const selectedProduct = products.find(p => p.id.toString() === itemForm.data.product_id)

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    itemForm.post(`/inventory/transfers/${transfer.id}/items`, {
      onSuccess: () => itemForm.reset('product_id', 'is_empty', 'quantity'),
      preserveScroll: true
    })
  }

  const deleteItem = (itemId: number) => {
    router.delete(`/inventory/transfers/${transfer.id}/items/${itemId}`, {
      preserveScroll: true
    })
  }

  const confirmTransfer = () => {
    confirmDelete({
      title: '¿Ejecutar transferencia?',
      text: `Esto moverá físicamente los ítems de ${transfer.source_warehouse.name} hacia ${transfer.destination_warehouse.name}.`,
      confirmButtonText: 'Sí, mover stock',
      onConfirm: () => router.post(`/inventory/transfers/${transfer.id}/complete`)
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Transferencia #${transfer.id}`} />

      <div className="space-y-6">
        {/* Encabezado */}
        <div className="glass-panel interactive-card p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[var(--sf-surface)] border border-[var(--sf-border)] border-l-4 border-l-indigo-500 mb-2">
          
          {/* Volver + Título e Info (Izquierda) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <BackButton href="/inventory/transfers" />
            
            <div>
              <h1 className="text-2xl font-heading font-bold text-[var(--sf-text-main)] flex items-center gap-3">
                Transferencia #{transfer.id}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  isDraft ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {isDraft ? 'Borrador (Pendiente)' : 'Completada'}
                </span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[var(--sf-text-muted)]">Origen:</span>
                <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md font-medium">
                  {transfer.source_warehouse.name}
                </span>
                <span className="text-[var(--sf-text-muted)] px-2">→</span>
                <span className="text-[var(--sf-text-muted)]">Destino:</span>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
                  {transfer.destination_warehouse.name}
                </span>
                <span className="text-[var(--sf-text-muted)] px-2 opacity-50">|</span>
                <span className="text-[var(--sf-text-muted)]">Fecha:</span>
                <span className="font-medium text-[var(--sf-text-main)]">
                  {new Date(transfer.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones (Derecha) */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
            
            <a
              href={`/inventory/transfers/${transfer.id}?format=pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-semibold text-[var(--sf-text-muted)] bg-[var(--sf-bg)] hover:text-primary-400 rounded-xl border border-[var(--sf-border)] hover:border-primary-500/30 transition-all flex items-center gap-2"
              title="Descargar PDF"
            >
              <Download size={18} />
              <span className="hidden sm:inline">PDF</span>
            </a>

            {isDraft && transfer.stock_transfer_items.length > 0 && (
              <button
                onClick={confirmTransfer}
                className="px-5 py-2 text-sm bg-emerald-500 text-[var(--sf-text-main)] font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                ✅ Ejecutar
              </button>
            )}
          </div>
        </div>

        {/* Layout principal: 1 columna en móvil, 2 en desktop (formulario a la izq, lista a la der) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Formulario (ahora a la izquierda o arriba en móvil) */}
          {isDraft && (
            <div className="lg:col-span-4">
              <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-6 sticky top-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xl border border-primary-500/30">
                    +
                  </div>
                  <div>
                    <h2 className="font-semibold text-[var(--sf-text-main)]">Añadir Productos</h2>
                    <p className="text-xs text-[var(--sf-text-muted)]">¿Qué galones vas a mover?</p>
                  </div>
                </div>

                <form onSubmit={addItem} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Producto a Mover</label>
                    <CustomSelect
                      value={itemForm.data.product_id ? { value: itemForm.data.product_id, label: (() => {
                        const p = products.find(prod => prod.id.toString() === itemForm.data.product_id);
                        return p ? `${p.name} (${p.sku})` : '';
                      })() } : null}
                      onChange={(val: any) => {
                        itemForm.setData(data => ({
                          ...data,
                          product_id: val?.value || '',
                          is_empty: false // reset when changing product
                        }))
                      }}
                      options={products.map(p => ({ value: p.id.toString(), label: `${p.name} (${p.sku})` }))}
                      placeholder="Selecciona un producto..."
                      required
                    />
                  </div>

                  {selectedProduct?.material?.returnable && (
                    <div className="flex items-center justify-between bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                      <div>
                        <h3 className="text-sm font-medium text-amber-500">¿Mover envases vacíos?</h3>
                        <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">Actívalo si solo estás moviendo {selectedProduct.material.name.toLowerCase()} vacíos.</p>
                      </div>
                      <CustomSwitch
                        checked={itemForm.data.is_empty}
                        onChange={(val) => itemForm.setData('is_empty', val)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-main)] mb-1.5">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={itemForm.data.quantity}
                      onChange={e => itemForm.setData('quantity', e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 shadow-inner"
                      placeholder="Ej: 50"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={itemForm.processing}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <span>Agregar a la lista</span>
                    <span>→</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Lista de Items (derecha o abajo) */}
          <div className={isDraft ? "lg:col-span-8" : "lg:col-span-12"}>
            <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden h-full">
              <div className="p-5 border-b border-[var(--sf-border)] bg-[var(--sf-bg)] flex items-center justify-between">
                <h2 className="font-semibold text-[var(--sf-text-main)] text-lg">Carga a transferir</h2>
                <span className="bg-[var(--sf-surface)] border border-[var(--sf-border)] px-3 py-1 rounded-lg text-sm text-[var(--sf-text-muted)]">
                  Total: {transfer.stock_transfer_items.reduce((sum, item) => sum + item.quantity, 0)} unid.
                </span>
              </div>
              
              <div className="overflow-x-auto">
                {transfer.stock_transfer_items.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-4 opacity-50">📦</div>
                    <h3 className="text-lg font-medium text-[var(--sf-text-main)] mb-2">Transferencia vacía</h3>
                    <p className="text-[var(--sf-text-muted)] max-w-sm">
                      {isDraft 
                        ? "Usa el formulario de al lado para agregar los galones que vas a cargar o descargar del camión."
                        : "Esta transferencia se completó sin productos."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--sf-bg)]/50 text-[var(--sf-text-muted)] border-b border-[var(--sf-border)]">
                      <tr>
                        <th className="px-6 py-4 font-medium">Producto</th>
                        <th className="px-6 py-4 font-medium text-right">Cantidad a mover</th>
                        {isDraft && <th className="px-6 py-4 font-medium w-16"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--sf-dark-border)]">
                      {transfer.stock_transfer_items.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-[var(--sf-text-main)] flex items-center gap-2">
                              {item.item_type === 'Material' ? (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px] uppercase font-bold tracking-widest shrink-0">Vacío</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded text-[10px] uppercase font-bold tracking-widest shrink-0">Lleno</span>
                              )}
                              {item.item?.name}
                            </div>
                            {item.item_type === 'Product' && (
                              <div className="text-xs text-[var(--sf-text-muted)] mt-1 ml-14">{(item.item as Product)?.sku}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-right">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg text-emerald-400 font-bold text-base">
                                {item.quantity}
                              </span>
                            </div>
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
                      ))}
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
