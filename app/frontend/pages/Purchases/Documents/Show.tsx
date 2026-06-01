import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import Card from '@/components/Card'
import Table from '@/components/Table'
import { FileBadge2, ExternalLink, CheckCircle, Trash2, Send, XCircle, Save, Upload, Pencil } from 'lucide-react'
import Swal from 'sweetalert2'
import { useState, useRef } from 'react'
import { useForm } from '@inertiajs/react'
import { CustomSelect } from '@/components/CustomSelect'
import CurrencyInput from '@/components/CurrencyInput'
import { CustomSwitch } from '@/components/CustomSwitch'
import { CustomDatePicker } from '@/components/CustomDatePicker'

interface Props {
  document: any
  products?: any[]
  available_invoices?: any[]
}

export default function DocumentShow({ document, products = [], available_invoices = [] }: Props) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
  }

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'invoice': return 'Factura'
      case 'credit_note': return 'Nota de Crédito'
      case 'dispatch_guide': return 'Guía de Despacho'
      case 'receipt': return 'Boleta'
      default: return type
    }
  }



  const finalizeDocument = () => {
    Swal.fire({
      title: '¿Emitir documento?',
      text: "Esto calculará los totales y sumará el inventario a la bodega central (si es manual). No podrás agregar más productos luego de emitir.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Sí, emitir',
      cancelButtonText: 'Cancelar',
      background: 'var(--sf-dark-card)',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        router.patch(`/purchases/documents/${document.id}/finalize`)
      }
    })
  }

  const voidDocument = () => {
    Swal.fire({
      title: '¿Anular documento?',
      text: "Se anulará este documento y se revertirá el inventario ingresado.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      background: 'var(--sf-dark-card)',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        router.patch(`/purchases/documents/${document.id}/void`)
      }
    })
  }

  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: '',
    unit_price: '',
    has_iva: true
  })

  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id)
    setNewItem({
      product_id: item.product_id.toString(),
      quantity: item.quantity.toString(),
      unit_price: item.unit_price.toString(),
      has_iva: item.has_iva
    })
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.product_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto faltante',
        text: 'Debes seleccionar un producto primero.',
        background: 'var(--sf-dark-card)',
        color: '#fff',
        confirmButtonColor: '#6366f1'
      })
      return
    }
    
    if (editingItemId) {
      router.put(`/purchases/documents/${document.id}/items/${editingItemId}`, newItem, {
        onSuccess: () => {
          setNewItem({ product_id: '', quantity: '', unit_price: '', has_iva: true })
          setEditingItemId(null)
        }
      })
    } else {
      router.post(`/purchases/documents/${document.id}/items`, newItem, {
        onSuccess: () => setNewItem({ product_id: '', quantity: '', unit_price: '', has_iva: true })
      })
    }
  }

  const handleDeleteItem = (itemId: number) => {
    router.delete(`/purchases/documents/${document.id}/items/${itemId}`)
  }

  const headerForm = useForm({
    document_number: document.document_number || '',
    issue_date: document.issue_date || new Date().toISOString().split('T')[0],
    due_date: document.due_date || new Date().toISOString().split('T')[0],
    document_type: document.document_type || 'invoice',
    reference_document_id: document.reference_document_id || ''
  })

  const [fileName, setFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveHeader = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    headerForm.put(`/purchases/documents/${document.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        // Optional success notification
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true)
      
      // Auto-upload when selected
      router.post(`/purchases/documents/${document.id}`, {
        _method: 'put',
        files: Array.from(e.target.files)
      }, {
        forceFormData: true,
        preserveScroll: true,
        onFinish: () => setIsUploading(false),
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: e.target.files && e.target.files.length > 1 ? 'Archivos subidos' : 'Archivo subido',
            toast: true,
            position: 'top-end',
            timer: 3000,
            showConfirmButton: false,
            background: 'var(--sf-dark-card)',
            color: '#fff'
          })
        }
      })
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title={`${getTypeLabel(document.document_type)} #${document.document_number}`} />

      <div className="space-y-6">
        {/* Encabezado */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[var(--sf-surface)] border border-[var(--sf-border)] border-l-4 border-l-indigo-500 mb-2">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/purchases/documents" className="px-3 py-2 text-sm font-semibold text-[var(--sf-text-muted)] bg-[var(--sf-bg)] hover:text-[var(--sf-text-main)] rounded-xl border border-[var(--sf-border)] transition-all flex items-center shrink-0">
              ← Volver
            </Link>
            
            <div>
              <h1 className="text-2xl font-heading font-bold text-[var(--sf-text-main)] flex items-center gap-3">
                {getTypeLabel(document.document_type)} {document.document_number ? `N° ${document.document_number}` : '(Borrador)'}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  document.status === 'draft' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                  document.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  document.status === 'partial' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  document.status === 'voided' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {document.status === 'draft' ? '📝 Borrador' : 
                   document.status === 'pending' ? '⏳ No Pagada' : 
                   document.status === 'partial' ? '💵 Pago Parcial' : 
                   document.status === 'voided' ? '❌ Anulada' : '✅ Pagada'}
                </span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[var(--sf-text-muted)]">Proveedor:</span>
                {document.supplier ? (
                  <span className="px-2.5 py-1 bg-[var(--sf-bg)] text-[var(--sf-text-main)] border border-[var(--sf-border)] rounded-md font-medium">
                    {document.supplier.name} ({document.supplier.rut})
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-medium">
                    Sin Proveedor (Compra Informal)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
            {document.status === 'draft' && (
              <button
                onClick={() => {
                  if (headerForm.isDirty) {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Cambios sin guardar',
                      text: 'Debes hacer clic en "Guardar Cambios" antes de emitir.'
                    })
                    return
                  }
                  if (!document.document_number) {
                    Swal.fire({
                      icon: 'error',
                      title: 'Falta N° de Folio',
                      text: 'Debes guardar la cabecera con el número de folio antes de emitir.'
                    })
                    return
                  }
                  if (!document.purchase_order && (!document.purchase_document_items || document.purchase_document_items.length === 0)) {
                    Swal.fire({
                      icon: 'error',
                      title: 'Documento vacío',
                      text: 'Debes agregar al menos un producto antes de emitir.'
                    })
                    return
                  }
                  finalizeDocument()
                }}
                className={`px-5 py-2 text-sm text-white font-bold rounded-xl transition-colors shadow-lg flex items-center gap-2 ${headerForm.isDirty ? 'bg-indigo-400 opacity-50 cursor-not-allowed shadow-none' : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25'}`}
              >
                <Send size={18} />
                Emitir Documento
              </button>
            )}
            {document.status === 'pending' && (
              <button
                onClick={voidDocument}
                className="px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
              >
                <XCircle size={18} />
                Anular
              </button>
            )}
            {document.status === 'partial' && (
              <button
                onClick={voidDocument}
                className="px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
              >
                <XCircle size={18} />
                Anular
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Card.Body>
                <h3 className="text-lg font-semibold text-[var(--sf-text-main)] border-b border-[var(--sf-border)] pb-3 mb-4">Información Tributaria</h3>
                
                {document.status === 'draft' ? (
                  <form onSubmit={saveHeader} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">N° de Folio</label>
                        <input
                          type="text"
                          value={headerForm.data.document_number}
                          onChange={e => headerForm.setData('document_number', e.target.value)}
                          className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50"
                          placeholder="Ej: 12345"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Tipo</label>
                        <CustomSelect
                          value={headerForm.data.document_type ? { 
                            value: headerForm.data.document_type, 
                            label: headerForm.data.document_type === 'invoice' ? 'Factura Electrónica' : headerForm.data.document_type === 'credit_note' ? 'Nota de Crédito' : headerForm.data.document_type === 'dispatch_guide' ? 'Guía de Despacho' : 'Boleta'
                          } : null}
                          onChange={(val: any) => {
                            headerForm.setData(data => ({ ...data, document_type: val?.value || 'invoice', reference_document_id: '' }))
                          }}
                          options={[
                            { value: 'invoice', label: 'Factura Electrónica' },
                            { value: 'credit_note', label: 'Nota de Crédito' },
                            { value: 'dispatch_guide', label: 'Guía de Despacho' },
                            { value: 'receipt', label: 'Boleta' }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Emisión</label>
                        <CustomDatePicker
                          value={headerForm.data.issue_date}
                          onChange={(v: string) => headerForm.setData('issue_date', v)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Vencimiento</label>
                        <CustomDatePicker
                          value={headerForm.data.due_date}
                          onChange={(v: string) => headerForm.setData('due_date', v)}
                          required
                        />
                      </div>
                      {headerForm.data.document_type === 'credit_note' && (
                        <div className="sm:col-span-2 animate-in fade-in">
                          <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Factura Asociada</label>
                          <CustomSelect
                            value={headerForm.data.reference_document_id ? { 
                              value: headerForm.data.reference_document_id, 
                              label: `Factura #${available_invoices.find((i: any) => i.id.toString() === headerForm.data.reference_document_id?.toString())?.document_number}`
                            } : null}
                            onChange={(val: any) => headerForm.setData('reference_document_id', val?.value || '')}
                            options={available_invoices.map((i: any) => ({ 
                              value: i.id.toString(), 
                              label: `Factura #${i.document_number} (${formatMoney(i.total_amount)})` 
                            }))}
                            placeholder="Seleccionar factura..."
                            isClearable
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        disabled={headerForm.processing || !headerForm.isDirty}
                        className="px-5 py-2 text-sm bg-[var(--sf-bg)] text-[var(--sf-text-main)] font-semibold border border-[var(--sf-border)] rounded-xl hover:bg-[var(--sf-surface)] transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save size={18} />
                        {headerForm.isDirty ? 'Guardar Cambios' : 'Guardado'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-sm text-[var(--sf-text-muted)]">Fecha Emisión</p>
                      <p className="text-[var(--sf-text-main)] font-medium mt-1">{document.issue_date ? new Date(document.issue_date).toLocaleDateString('es-CL') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--sf-text-muted)]">Fecha Vencimiento</p>
                      <p className="text-[var(--sf-text-main)] font-medium mt-1">{document.due_date ? new Date(document.due_date).toLocaleDateString('es-CL') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--sf-text-muted)]">Asociada a</p>
                      {document.document_type === 'credit_note' && document.reference_document_id ? (
                        <Link href={`/purchases/documents/${document.reference_document_id}`} className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 font-medium text-sm rounded-lg border border-amber-500/20 mt-1 hover:bg-amber-500/20 transition-colors">
                          Factura #{available_invoices.find((i: any) => i.id === document.reference_document_id)?.document_number || 'Asociada'} →
                        </Link>
                      ) : document.purchase_order ? (
                        <Link href={`/purchases/orders/${document.purchase_order.id}`} className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 font-medium text-sm rounded-lg border border-indigo-500/20 mt-1 hover:bg-indigo-500/20 transition-colors">
                          Orden de Compra #{document.purchase_order.id} →
                        </Link>
                      ) : (
                        <p className="text-[var(--sf-text-muted)] mt-1 italic">Sin documento asociado</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-[var(--sf-bg)] p-4 rounded-xl border border-[var(--sf-border)]">
                    <p className="text-sm text-[var(--sf-text-muted)] mb-1">Monto Neto</p>
                    <p className="text-xl font-medium text-[var(--sf-text-main)]">{formatMoney(document.net_amount)}</p>
                  </div>
                  <div className="bg-[var(--sf-bg)] p-4 rounded-xl border border-[var(--sf-border)]">
                    <p className="text-sm text-[var(--sf-text-muted)] mb-1">IVA (19%)</p>
                    <p className="text-xl font-medium text-[var(--sf-text-main)]">{formatMoney(document.tax_amount)}</p>
                  </div>
                  <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30">
                    <p className="text-sm text-indigo-400/80 font-bold mb-1">TOTAL FACTURA</p>
                    <p className="text-2xl font-bold text-indigo-400">{formatMoney(document.total_amount)}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full">
              <Card.Body>
                <h3 className="text-lg font-semibold text-[var(--sf-text-main)] border-b border-[var(--sf-border)] pb-3 mb-6">Archivo Original</h3>
                
                {document.files && document.files.length > 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 border border-[var(--sf-border)] bg-[var(--sf-bg)] rounded-xl h-[250px]">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 shadow-inner relative">
                      <FileBadge2 className="w-8 h-8" />
                      <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                        {document.files.length}
                      </span>
                    </div>
                    <p className="font-medium text-[var(--sf-text-main)] mb-1">Documento Tributario</p>
                    <p className="text-sm text-[var(--sf-text-muted)] mb-6">{document.files.length} archivo(s) respaldado(s)</p>
                    
                    <button
                      onClick={() => setIsFilesModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
                    >
                      Gestionar Archivos <ExternalLink size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[var(--sf-border)] bg-[var(--sf-bg)] rounded-xl h-[250px] transition-colors hover:border-indigo-500/50">
                    <div className="w-16 h-16 rounded-full bg-[var(--sf-surface)] border border-[var(--sf-border)] flex items-center justify-center text-[var(--sf-text-muted)] mb-4">
                      {isUploading ? (
                        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <p className="font-medium text-[var(--sf-text-main)] mb-1">Sin archivos adjuntos</p>
                    <p className="text-sm text-[var(--sf-text-muted)] mb-6 max-w-[200px]">
                      Sube comprobantes en PDF o Imagen.
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 bg-[var(--sf-surface)] hover:bg-[var(--sf-border)] border border-[var(--sf-border)] text-[var(--sf-text-main)] font-semibold rounded-xl transition-all"
                    >
                      {isUploading ? 'Subiendo...' : 'Subir Archivo(s)'}
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                  multiple
                />
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Ítems de la Orden Asociada */}
        {document.purchase_order && document.purchase_order.purchase_order_items && document.purchase_order.purchase_order_items.length > 0 && (
          <div className="mt-6">
            <Card>
              <div className="p-5 border-b border-[var(--sf-border)] flex items-center justify-between bg-[var(--sf-bg)]">
                <h3 className="font-semibold text-[var(--sf-text-main)]">Productos de la Orden de Compra Asociada</h3>
              </div>
              <Table>
                <Table.Thead className="bg-[var(--sf-bg)]/50">
                  <Table.Tr>
                    <Table.Th>Producto</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>Precio Neto</Table.Th>
                    <Table.Th>IVA</Table.Th>
                    <Table.Th className="text-right">Total Línea</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {document.purchase_order.purchase_order_items.map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <span className="font-medium text-[var(--sf-text-main)]">{item.product.name}</span>
                        {item.product.sku && <span className="block text-xs text-[var(--sf-text-muted)] mt-0.5">SKU: {item.product.sku}</span>}
                      </Table.Td>
                      <Table.Td className="text-[var(--sf-text-main)] font-medium">
                        {item.quantity}
                      </Table.Td>
                      <Table.Td className="text-[var(--sf-text-muted)]">
                        {formatMoney(parseFloat(item.unit_price))}
                      </Table.Td>
                      <Table.Td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.has_iva ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                          {item.has_iva ? '19%' : 'Exento'}
                        </span>
                      </Table.Td>
                      <Table.Td className="text-emerald-400 font-medium text-right">
                        {formatMoney(parseFloat(item.total))}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </div>
        )}

        {/* Ítems Manuales (Si NO tiene OC asociada) */}
        {!document.purchase_order && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {document.status === 'draft' && (
                <Card>
                  <Card.Body className={editingItemId ? 'bg-indigo-500/5 ring-1 ring-indigo-500/30 rounded-xl' : ''}>
                    <h3 className="text-lg font-semibold text-[var(--sf-text-main)] border-b border-[var(--sf-border)] pb-3 mb-4">
                      {editingItemId ? 'Editar Producto' : 'Agregar Producto'}
                    </h3>
                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Producto</label>
                        <CustomSelect
                          value={newItem.product_id ? { value: newItem.product_id, label: products.find((p: any) => p.id.toString() === newItem.product_id)?.name } : null}
                          onChange={(val: any) => setNewItem({ ...newItem, product_id: val?.value || '' })}
                          options={products.map((p: any) => ({ value: p.id.toString(), label: p.name }))}
                          placeholder="Buscar producto..."
                        />
                      </div>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Cantidad</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={newItem.quantity}
                            onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Precio Neto</label>
                          <CurrencyInput
                            value={newItem.unit_price}
                            onValueChange={v => setNewItem({ ...newItem, unit_price: v })}
                            required
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <CustomSwitch
                          checked={newItem.has_iva}
                          onChange={v => setNewItem({ ...newItem, has_iva: v })}
                          label="Afecto a IVA (19%)"
                        />
                      </div>
                      <div className="pt-4 flex gap-2">
                        {editingItemId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(null)
                              setNewItem({ product_id: '', quantity: '', unit_price: '', has_iva: true })
                            }}
                            className="px-4 py-2.5 bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-main)] font-semibold rounded-xl hover:bg-[var(--sf-surface)] transition-all"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                        >
                          <Send size={18} />
                          {editingItemId ? 'Guardar Cambios' : 'Agregar a Factura'}
                        </button>
                      </div>
                    </form>
                  </Card.Body>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="p-5 border-b border-[var(--sf-border)] flex items-center justify-between bg-[var(--sf-bg)]">
                  <h3 className="font-semibold text-[var(--sf-text-main)]">Ítems del Documento</h3>
                </div>
                <Table>
                  <Table.Thead className="bg-[var(--sf-bg)]/50">
                    <Table.Tr>
                      <Table.Th>Producto</Table.Th>
                      <Table.Th>Cant.</Table.Th>
                      <Table.Th>Precio Neto</Table.Th>
                      <Table.Th>IVA</Table.Th>
                      <Table.Th className="text-right">Total</Table.Th>
                      {document.status === 'draft' && <Table.Th className="text-right">Acciones</Table.Th>}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {document.purchase_document_items && document.purchase_document_items.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={6} className="text-center py-8 text-[var(--sf-text-muted)]">
                          No hay productos agregados al documento.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      document.purchase_document_items?.map((item: any) => (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            <span className="font-medium text-[var(--sf-text-main)]">{item.product.name}</span>
                          </Table.Td>
                          <Table.Td className="text-[var(--sf-text-main)] font-medium">
                            {item.quantity}
                          </Table.Td>
                          <Table.Td className="text-[var(--sf-text-muted)]">
                            {formatMoney(parseFloat(item.unit_price))}
                          </Table.Td>
                          <Table.Td>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${item.has_iva ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                              {item.has_iva ? '19%' : 'Exento'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-emerald-400 font-medium text-right">
                            {formatMoney(parseFloat(item.total))}
                          </Table.Td>
                          {document.status === 'draft' && (
                            <Table.Td className="text-right">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors mr-1"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </Table.Td>
                          )}
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Managing Files */}
      {isFilesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-[var(--sf-border)] bg-[var(--sf-surface)] shrink-0">
              <h3 className="text-lg font-semibold text-[var(--sf-text-main)] flex items-center gap-2">
                <FileBadge2 className="w-5 h-5 text-indigo-400" />
                Archivos Adjuntos
              </h3>
              <button onClick={() => setIsFilesModalOpen(false)} className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              {document.files && document.files.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-4 border border-[var(--sf-border)] bg-[var(--sf-surface)] rounded-xl hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <FileBadge2 className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-[var(--sf-text-main)] text-sm max-w-[200px] sm:max-w-[250px] truncate" title={f.filename}>{f.filename}</p>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1 font-medium">
                        Abrir documento <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      Swal.fire({
                        title: '¿Eliminar archivo?',
                        text: "Esta acción no se puede deshacer.",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        cancelButtonColor: '#6366f1',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar',
                        background: 'var(--sf-dark-card)',
                        color: '#fff'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          router.delete(`/purchases/documents/${document.id}/delete_file/${f.id}`, {
                            onSuccess: () => {
                              if (document.files.length <= 1) {
                                setIsFilesModalOpen(false)
                              }
                            }
                          })
                        }
                      })
                    }}
                    className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-[var(--sf-border)] bg-[var(--sf-surface)] shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <Upload size={18} />
                )}
                {isUploading ? 'Subiendo archivos...' : 'Agregar más archivos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
