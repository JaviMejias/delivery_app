import { useState } from 'react'
import { Head, useForm, router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Modal from '@/components/Modal'
import BackButton from '@/components/BackButton'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomSwitch } from '@/components/CustomSwitch'
import CurrencyInput from '@/components/CurrencyInput'
import { Eye, Trash2 } from 'lucide-react'
import { useExcelExport } from '@/hooks/useExcelExport'
import { StatusBadge } from '@/components/Badges/StatusBadge'

interface Material {
  id: number
  name: string
  unit: string
}

interface Brand {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
  material?: Material
  brand?: Brand
}

interface Supplier {
  id: number
  name: string
}

interface PurchaseOrderItem {
  id: number
  product_id: number
  quantity: number
  received_quantity: number
  unit_price: string
  subtotal: string
  has_iva: boolean
  tax_amount: string
  total: string
  product?: Product
}

interface PurchaseDocument {
  id: number
  document_number: string
  document_type: string
  status: string
  total_amount: string
}

interface PurchaseOrder {
  id: number
  status: string
  total: string
  created_at: string
  supplier: Supplier
  purchase_order_items: PurchaseOrderItem[]
  purchase_documents: PurchaseDocument[]
}

interface Props {
  order: PurchaseOrder
  products: Product[]
}

export default function PurchaseOrderShow({ order, products }: Props) {
  const isDraft = order.status === 'draft'
  const isReceived = order.status === 'received'
  const hasActiveInvoice = order.purchase_documents && order.purchase_documents.some((d: any) => d.status !== 'voided');
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  const itemForm = useForm({
    product_id: '',
    quantity: '',
    unit_price: '',
    has_iva: true
  })

  // Para la recepción inicializamos el form con las cantidades pedidas
  const initialReceiveData = order.purchase_order_items.reduce((acc, item) => {
    acc[item.id] = item.quantity.toString()
    return acc
  }, {} as Record<number, string>)

  const receiveForm = useForm({
    received_items: initialReceiveData
  })

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    itemForm.post(`/purchases/orders/${order.id}/items`, {
      onSuccess: () => {
        itemForm.reset()
      }
    })
  }

  const deleteItem = (itemId: number) => {
    router.delete(`/purchases/orders/${order.id}/items/${itemId}`)
  }

  const handleReceiveItemChange = (itemId: number, value: string) => {
    receiveForm.setData('received_items', {
      ...receiveForm.data.received_items,
      [itemId]: value
    })
  }

  const { getThemeName } = useExcelExport()

  const confirmReceive = (e: React.FormEvent) => {
    e.preventDefault()
    receiveForm.post(`/purchases/orders/${order.id}/receive`, {
      onSuccess: () => setShowReceiveModal(false)
    })
  }

  // Cálculo de totales (ahora se suma el total global de las líneas, incluyendo impuestos)
  const netTotal = order.purchase_order_items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
  const taxTotal = order.purchase_order_items.reduce((sum, item) => sum + parseFloat(item.tax_amount), 0)
  const grandTotal = order.purchase_order_items.reduce((sum, item) => sum + parseFloat(item.total), 0)
  
  const totalReceived = isReceived
    ? order.purchase_order_items.reduce((sum, item) => sum + (item.received_quantity * parseFloat(item.unit_price) * (item.has_iva ? 1.19 : 1)), 0)
    : 0

  return (
    <AuthenticatedLayout>
      <Head title={`Orden #${order.id.toString().padStart(5, '0')}`} />

      <div className="space-y-6">
        <div className="glass-panel interactive-card p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-l-indigo-500 mb-2">
          <div className="flex items-center gap-4">
            <BackButton href="/purchases/orders" />
            <div>
              <h1 className="text-2xl font-heading font-bold text-[var(--sf-text-main)] flex items-center gap-3">
                Orden #{order.id.toString().padStart(5, '0')}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${order.status === 'draft' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                    order.status === 'received' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''
                  }`}>
                  {order.status === 'draft' ? 'Borrador' : order.status === 'received' ? 'Recibida' : order.status}
                </span>
              </h1>
              <p className="text-[var(--sf-text-muted)] mt-1">
                Proveedor: <strong className="text-[var(--sf-text-main)]">{order.supplier?.name}</strong> | Fecha: {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <a
              href={`/purchases/orders/${order.id}.pdf`}
              onClick={(e) => { e.preventDefault(); window.open(`/purchases/orders/${order.id}?format=pdf&theme=${getThemeName()}`, '_blank'); }}
              className="px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-main)] font-medium rounded-lg hover:bg-[var(--sf-surface)] transition-colors shadow-sm"
            >
              📄 PDF
            </a>
            {isDraft && order.purchase_order_items.length > 0 && (
              <button
                onClick={() => setShowReceiveModal(true)}
                className="px-6 py-2 bg-emerald-500 text-[var(--sf-text-main)] font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
              >
                Marcar como Recibida
              </button>
            )}
            {isReceived && !hasActiveInvoice && (
              <button
                onClick={() => {
                  router.post('/purchases/documents', {
                    purchase_order_id: order.id,
                    document_type: 'invoice',
                    status: 'draft'
                  })
                }}
                className="px-5 py-2 bg-primary-500 text-[var(--sf-text-main)] font-medium rounded-lg hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25 flex items-center gap-2"
              >
                + Asociar Factura
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario para agregar ítems */}
          {isDraft && (
            <div className="lg:col-span-1">
              <Card className="h-fit sticky top-6">
                <Card.Body>
                  <h2 className="font-semibold text-[var(--sf-text-main)] mb-4">Añadir Producto</h2>
                  <form onSubmit={addItem} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Producto Final</label>
                        <CustomSelect
                          value={itemForm.data.product_id ? { value: itemForm.data.product_id, label: products.find(p => p.id.toString() === itemForm.data.product_id)?.name + ' (' + products.find(p => p.id.toString() === itemForm.data.product_id)?.sku + ')' } : null}
                          onChange={(val: any) => itemForm.setData('product_id', val?.value || '')}
                          options={products.map(p => ({ value: p.id.toString(), label: `${p.name} (${p.sku})` }))}
                          placeholder="Seleccionar producto..."
                        />
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={itemForm.data.quantity}
                          onChange={e => itemForm.setData('quantity', e.target.value)}
                          className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Costo Unit. ($)</label>
                        <CurrencyInput
                          value={itemForm.data.unit_price}
                          onValueChange={(val) => itemForm.setData('unit_price', val)}
                          className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="mt-4 pb-2 border-b border-[var(--sf-border)]">
                      <CustomSwitch
                        checked={itemForm.data.has_iva}
                        onChange={(val) => itemForm.setData('has_iva', val)}
                        label="Afecto a IVA (19%)"
                        description="Agrega el 19% al subtotal de este producto."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={itemForm.processing}
                      className="w-full py-2.5 mt-2 bg-primary-500/10 text-primary-400 font-medium rounded-xl border border-primary-500/20 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                    >
                      + Agregar a la Orden
                    </button>
                  </form>
                </Card.Body>
              </Card>
            </div>
          )}

          {/* Detalles de la Orden */}
          <div className={isDraft ? "lg:col-span-2 space-y-6" : "lg:col-span-3 space-y-6"}>
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
                <h2 className="font-semibold text-[var(--sf-text-main)]">Ítems de la Orden</h2>
              </div>
              <Table>
                <Table.Thead className="bg-[var(--sf-bg)]/50">
                  <Table.Tr>
                    <Table.Th>Producto</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    {isReceived && <Table.Th className="text-emerald-400">Recibidos</Table.Th>}
                    <Table.Th>Precio Neto</Table.Th>
                    <Table.Th>IVA</Table.Th>
                    <Table.Th className="text-right">Total (+IVA)</Table.Th>
                    {isDraft && <Table.Th></Table.Th>}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {order.purchase_order_items.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={isReceived ? 7 : 6} className="py-12 text-center text-[var(--sf-text-muted)]">
                        No has agregado ningún producto a esta orden.
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    order.purchase_order_items.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td className="text-[var(--sf-text-main)]">
                          <div>{item.product?.name}</div>
                          <div className="text-xs text-[var(--sf-text-muted)]">{item.product?.sku}</div>
                        </Table.Td>
                        <Table.Td className="text-[var(--sf-text-muted)] font-medium">{item.quantity}</Table.Td>
                        {isReceived && (
                          <Table.Td className="font-bold text-emerald-400">
                            {item.received_quantity}
                            {item.received_quantity !== item.quantity && (
                              <span className="text-xs text-red-400 ml-2 font-normal">(Faltaron {item.quantity - item.received_quantity})</span>
                            )}
                          </Table.Td>
                        )}
                        <Table.Td className="text-[var(--sf-text-muted)]">${parseFloat(item.unit_price).toLocaleString()}</Table.Td>
                        <Table.Td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.has_iva ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                            {item.has_iva ? '19%' : 'Exento'}
                          </span>
                        </Table.Td>
                        <Table.Td className="text-emerald-400 font-medium text-right">
                          {isReceived
                            ? `$${(item.received_quantity * parseFloat(item.unit_price) * (item.has_iva ? 1.19 : 1)).toLocaleString()}`
                            : `$${parseFloat(item.total).toLocaleString()}`
                          }
                        </Table.Td>
                        {isDraft && (
                          <Table.Td className="text-right">
                            <button onClick={() => deleteItem(item.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar ítem">
                              <Trash2 size={18} />
                            </button>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
                {order.purchase_order_items.length > 0 && (
                  <Table.Tfoot>
                    <Table.Tr className="bg-[var(--sf-bg)]/50">
                      <Table.Td colSpan={isReceived ? 5 : 4} className="text-right font-medium text-[var(--sf-text-muted)] border-b-0">Total Neto:</Table.Td>
                      <Table.Td className="text-right font-semibold text-[var(--sf-text-main)] border-b-0">${netTotal.toLocaleString()}</Table.Td>
                      {isDraft && <Table.Td className="border-b-0"></Table.Td>}
                    </Table.Tr>
                    <Table.Tr className="bg-[var(--sf-bg)]/50">
                      <Table.Td colSpan={isReceived ? 5 : 4} className="text-right font-medium text-[var(--sf-text-muted)] border-b-0">IVA (19%):</Table.Td>
                      <Table.Td className="text-right font-semibold text-[var(--sf-text-main)] border-b-0">${taxTotal.toLocaleString()}</Table.Td>
                      {isDraft && <Table.Td className="border-b-0"></Table.Td>}
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td colSpan={isReceived ? 5 : 4} className="text-right font-medium text-[var(--sf-text-muted)]">
                        {isReceived ? 'TOTAL REAL RECIBIDO:' : 'TOTAL PACTADO:'}
                      </Table.Td>
                      <Table.Td className="text-right font-bold text-emerald-400 text-lg">
                        ${(isReceived ? totalReceived : grandTotal).toLocaleString()}
                      </Table.Td>
                      {isDraft && <Table.Td></Table.Td>}
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
            </Card>
          </div>

          {/* Documentos Asociados */}
          {order.purchase_documents && order.purchase_documents.length > 0 && (
            <div className="lg:col-span-3">
              <Card>
                <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
                  <h2 className="font-semibold text-[var(--sf-text-main)]">Documentos Tributarios (Facturas) Asociados</h2>
                </div>
                <Table>
                  <Table.Thead className="bg-[var(--sf-bg)]/50">
                    <Table.Tr>
                      <Table.Th>N° Documento</Table.Th>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th>Total</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th className="text-right">Acción</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {order.purchase_documents.map((doc) => (
                      <Table.Tr key={doc.id}>
                        <Table.Td className="font-bold text-[var(--sf-text-main)]">#{doc.document_number}</Table.Td>
                        <Table.Td className="text-[var(--sf-text-muted)] uppercase text-xs">
                          {doc.document_type === 'invoice' ? 'Factura' : doc.document_type === 'credit_note' ? 'Nota de Crédito' : doc.document_type === 'dispatch_guide' ? 'Guía de Despacho' : 'Boleta'}
                        </Table.Td>
                        <Table.Td className="text-[var(--sf-text-main)] font-medium">
                          ${parseFloat(doc.total_amount).toLocaleString()}
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge status={doc.status} />
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Link href={`/purchases/documents/${doc.id}`} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg inline-block transition-colors" title="Ver Detalles">
                            <Eye size={18} />
                          </Link>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Modal de Recepción (Vía Profesional) */}
      <Modal show={showReceiveModal} onClose={() => setShowReceiveModal(false)} title="Confirmar Recepción de Productos">
        <form onSubmit={confirmReceive} className="space-y-6">
          <p className="text-[var(--sf-text-muted)] text-sm">
            Ingresa la cantidad exacta que llegó en buenas condiciones. Si llegó menos, el sistema solo sumará al inventario lo que declares aquí y calculará el Total Real.
          </p>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {order.purchase_order_items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl">
                <div>
                  <div className="text-[var(--sf-text-main)] font-medium">{item.product?.name}</div>
                  <div className="text-xs text-[var(--sf-text-muted)]">Pediste: {item.quantity} unidades</div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[var(--sf-text-muted)]">Llegaron:</label>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={receiveForm.data.received_items[item.id] || ''}
                    onChange={(e) => handleReceiveItemChange(item.id, e.target.value)}
                    className="w-24 px-3 py-1.5 text-right bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--sf-border)]">
            <button type="button" onClick={() => setShowReceiveModal(false)} className="px-4 py-2 text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]">Cancelar</button>
            <button type="submit" disabled={receiveForm.processing} className="px-6 py-2 bg-emerald-500 text-[var(--sf-text-main)] rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium shadow-lg shadow-emerald-500/25">
              Confirmar Recepción
            </button>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
