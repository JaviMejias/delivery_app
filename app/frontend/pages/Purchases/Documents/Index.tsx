import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { CustomSelect } from '@/components/CustomSelect'
import Modal from '@/components/Modal'
import { FileText, Plus, FileBadge2, X, Trash2, Eye, Calendar } from 'lucide-react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { formatMoney } from '@/utils/formatters'
import { useExcelExport } from '@/hooks/useExcelExport'
import { StatusBadge } from '@/components/Badges/StatusBadge'
import { confirmDelete } from '@/utils/alerts'

interface Document {
  id: number
  document_number: string
  document_type: string
  issue_date: string
  due_date: string
  total_amount: number
  status: string
  supplier: { id: number, name: string, rut: string }
  purchase_order?: { id: number }
  file_url?: string
}

interface Props {
  documents: Document[]
  pagination: any
  currentSearch?: string
  suppliers: { id: number, name: string, rut: string }[]
  available_invoices: { id: number, document_number: string, supplier_id: number, total_amount: number }[]
  purchase_orders: any[]
}

export default function DocumentsIndex({ documents, pagination, currentSearch, suppliers, available_invoices, purchase_orders }: Props) {
  const { handleExcelClick } = useExcelExport()


  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'invoice': return 'Factura'
      case 'credit_note': return 'Nota de Crédito'
      case 'dispatch_guide': return 'Guía de Despacho'
      case 'receipt': return 'Boleta'
      default: return type
    }
  }

  const [search, setSearch] = useState(currentSearch || '')
  const [isFiltering, setIsFiltering] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  const [startDate, setStartDate] = useState(new URLSearchParams(window.location.search).get('start_date') || formatDate(firstDay))
  const [endDate, setEndDate] = useState(new URLSearchParams(window.location.search).get('end_date') || formatDate(today))

  const applyFilters = () => {
    setIsFiltering(true)
    const url = new URL(window.location.href);
    if (search) url.searchParams.set('search', search); else url.searchParams.delete('search');
    if (startDate) url.searchParams.set('start_date', startDate); else url.searchParams.delete('start_date');
    if (endDate) url.searchParams.set('end_date', endDate); else url.searchParams.delete('end_date');
    router.get(url.pathname + url.search, {}, { 
      preserveState: true,
      onFinish: () => setIsFiltering(false)
    })
  }
  const [newDocData, setNewDocData] = useState({
    supplier_id: '',
    document_type: 'invoice',
    reference_document_id: '',
    purchase_order_id: ''
  })

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault()
    router.post('/purchases/documents', {
      ...newDocData,
      status: 'draft' // ensure it triggers draft logic if needed, though controller checks document_number
    })
    setIsModalOpen(false)
  }



  return (
    <AuthenticatedLayout>
      <Head title="Documentos de Compra" />

      <div className="space-y-6">
        <PageHeader 
          title="Documentos de Compra (Facturas)"
          icon={<FileText className="w-8 h-8 opacity-80" />}
          description="Archivador digital de facturas y documentos enviados por proveedores."
          color="indigo"
        >
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25"
          >
            <Plus className="w-5 h-5" />
            Ingresar Documento
          </button>
        </PageHeader>

        <div className="flex flex-col gap-4">
          <TableFilters onApply={applyFilters} isLoading={isFiltering}>
            <TableFilters.Search
              value={search}
              onChange={setSearch}
              onSearch={applyFilters}
              placeholder="Buscar por N° o Proveedor..."
              className="w-full sm:flex-1 min-w-[250px]"
            />
            <TableFilters.Date
              label="Desde"
              value={startDate}
              onChange={setStartDate}
            />
            <TableFilters.Date
              label="Hasta"
              value={endDate}
              onChange={setEndDate}
            />
            <div className="flex items-center ml-2 border-l border-[var(--sf-border)] pl-4">
              <a href={`/purchases/documents?format=xlsx&search=${search || ''}&start_date=${startDate}&end_date=${endDate}`} onClick={handleExcelClick} className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors h-[42px] flex items-center justify-center">
                ⬇️ EXCEL
              </a>
            </div>
          </TableFilters>

          <Card className="overflow-hidden">
            <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Documento</Table.Th>
                <Table.Th className="hidden md:table-cell">Proveedor</Table.Th>
                <Table.Th className="hidden lg:table-cell">Fechas</Table.Th>
                <Table.Th className="text-right">Total</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th className="text-right">Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {documents.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                    No hay documentos registrados
                  </Table.Td>
                </Table.Tr>
              ) : (
                documents.map((doc) => (
                  <Table.Tr key={doc.id}>
                    <Table.Td>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${doc.file_url ? 'bg-primary-500/10 text-primary-400' : 'bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-muted)]'}`}>
                          <FileBadge2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-[var(--sf-text-main)]">
                            N° {doc.document_number}
                          </div>
                          <div className="text-xs text-[var(--sf-text-muted)] mt-0.5 uppercase tracking-wide">
                            {getTypeLabel(doc.document_type)}
                          </div>
                          {/* Visible on Mobile */}
                          <div className="text-xs font-medium mt-1 md:hidden text-[var(--sf-text-main)]">
                            {doc.supplier?.name}
                          </div>
                          <div className="text-xs text-[var(--sf-text-muted)] mt-0.5 lg:hidden flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(doc.issue_date).toLocaleDateString('es-CL')}
                          </div>
                        </div>
                      </div>
                    </Table.Td>
                    
                    <Table.Td className="hidden md:table-cell">
                      <div className="font-medium text-[var(--sf-text-main)]">{doc.supplier?.name}</div>
                      <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">{doc.supplier?.rut}</div>
                    </Table.Td>
                    
                    <Table.Td className="hidden lg:table-cell">
                      <div className="text-sm text-[var(--sf-text-main)] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--sf-text-muted)]" />
                        <span className="text-[var(--sf-text-muted)] text-xs">Emisión:</span> 
                        {new Date(doc.issue_date).toLocaleDateString('es-CL')}
                      </div>
                      <div className="text-sm text-[var(--sf-text-main)] flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-[var(--sf-text-muted)]" />
                        <span className="text-[var(--sf-text-muted)] text-xs">Vence:</span> 
                        <span className={new Date(doc.due_date) < new Date() && doc.status === 'pending' ? 'text-red-400 font-medium' : ''}>
                          {new Date(doc.due_date).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    </Table.Td>

                    <Table.Td className="text-right">
                      <div className="font-bold text-[var(--sf-text-main)]">
                        {formatMoney(doc.total_amount)}
                      </div>
                    </Table.Td>

                    <Table.Td>
                      <StatusBadge status={doc.status} />
                    </Table.Td>

                    <Table.Td className="text-right">
                      <div className="flex justify-end gap-3 items-center">
                        {doc.status === 'draft' && (
                          <button
                            onClick={() => {
                              confirmDelete({
                                title: '¿Eliminar Borrador?',
                                text: 'Esta acción no se puede deshacer.',
                                onConfirm: () => router.delete(`/purchases/documents/${doc.id}`)
                              })
                            }}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg font-medium text-sm flex items-center transition-colors cursor-pointer"
                            title="Eliminar Borrador"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Descargar PDF">
                            <FileText size={18} />
                          </a>
                        )}
                        <Link href={`/purchases/documents/${doc.id}`} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg font-medium text-sm transition-colors" title="Ver Detalles">
                          <Eye size={18} />
                        </Link>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
              {documents.length > 0 && (
                <Table.Tr className="bg-primary-500/5 border-t-2 border-primary-500/20">
                  <Table.Td colSpan={3} className="text-right font-bold text-primary-400 py-4 hidden lg:table-cell">
                    TOTALES VISIBLES:
                  </Table.Td>
                  <Table.Td colSpan={2} className="text-right font-bold text-primary-400 py-4 hidden md:table-cell lg:hidden">
                    TOTALES:
                  </Table.Td>
                  <Table.Td className="text-right font-bold text-primary-400 py-4 md:hidden">
                    TOTALES:
                  </Table.Td>
                  <Table.Td className="text-right text-lg font-black text-primary-500">
                    {formatMoney(documents.reduce((sum, doc) => sum + parseFloat(doc.total_amount.toString()), 0))}
                  </Table.Td>
                  <Table.Td colSpan={2}></Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          
          {pagination && pagination.pages > 1 && (
            <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
              <Pagination pagination={pagination} />
            </div>
          )}
        </Card>
      </div>
      </div>

      {/* Modal for Creating Draft Document */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Documento" maxWidth="max-w-md">
        <form onSubmit={handleCreateDraft} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Asociar a Orden de Compra (Opcional)</label>
            <CustomSelect
              value={newDocData.purchase_order_id ? { 
                value: newDocData.purchase_order_id, 
                label: `Orden #${newDocData.purchase_order_id.padStart(5, '0')} - ${purchase_orders.find(po => po.id.toString() === newDocData.purchase_order_id)?.supplier?.name || ''}` 
              } : null}
              onChange={(val: any) => {
                const po_id = val?.value || '';
                if (po_id) {
                  const po = purchase_orders.find(po => po.id.toString() === po_id);
                  setNewDocData({ ...newDocData, purchase_order_id: po_id, supplier_id: po?.supplier_id?.toString() || '' });
                } else {
                  setNewDocData({ ...newDocData, purchase_order_id: '' });
                }
              }}
              options={purchase_orders.map(po => ({ 
                value: po.id.toString(), 
                label: `Orden #${po.id.toString().padStart(5, '0')} - ${po.supplier?.name} (${formatMoney(parseFloat(po.total))})` 
              }))}
              placeholder="Seleccionar orden..."
              isClearable
            />
            <p className="text-xs text-[var(--sf-text-muted)] mt-1">Si seleccionas una orden, se copiarán sus productos y valores automáticamente.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Proveedor (Opcional)</label>
            <CustomSelect
              value={newDocData.supplier_id ? { value: newDocData.supplier_id, label: suppliers.find(s => s.id.toString() === newDocData.supplier_id)?.name } : null}
              onChange={(val: any) => setNewDocData({ ...newDocData, supplier_id: val?.value || '' })}
              options={suppliers.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.rut})` }))}
              placeholder="Seleccionar proveedor..."
              isDisabled={!!newDocData.purchase_order_id}
              isClearable
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Tipo de Documento</label>
            <CustomSelect
              value={{ 
                value: newDocData.document_type, 
                label: newDocData.document_type === 'invoice' ? 'Factura Electrónica' : newDocData.document_type === 'credit_note' ? 'Nota de Crédito' : newDocData.document_type === 'dispatch_guide' ? 'Guía de Despacho' : 'Boleta'
              }}
              onChange={(val: any) => setNewDocData({ ...newDocData, document_type: val?.value || 'invoice', reference_document_id: '' })}
              options={[
                { value: 'invoice', label: 'Factura Electrónica' },
                { value: 'credit_note', label: 'Nota de Crédito' },
                { value: 'dispatch_guide', label: 'Guía de Despacho' },
                { value: 'receipt', label: 'Boleta' }
              ]}
            />
          </div>

          {newDocData.document_type === 'credit_note' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Factura Asociada</label>
              <CustomSelect
                value={newDocData.reference_document_id ? { 
                  value: newDocData.reference_document_id, 
                  label: `Factura #${available_invoices.find(i => i.id.toString() === newDocData.reference_document_id)?.document_number}`
                } : null}
                onChange={(val: any) => setNewDocData({ ...newDocData, reference_document_id: val?.value || '' })}
                options={available_invoices.filter(i => i.supplier_id.toString() === newDocData.supplier_id).map(i => ({ 
                  value: i.id.toString(), 
                  label: `Factura #${i.document_number} (${formatMoney(i.total_amount)})` 
                }))}
                placeholder="Seleccionar factura..."
                isDisabled={!newDocData.supplier_id}
                isClearable
              />
              {!newDocData.supplier_id && (
                <p className="text-xs text-amber-500 mt-1">Selecciona un proveedor primero para ver sus facturas.</p>
              )}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-[var(--sf-surface)] text-[var(--sf-text-main)] border border-[var(--sf-border)] rounded-xl hover:bg-[var(--sf-border)] transition-colors font-medium">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium shadow-lg shadow-primary-500/25">
              Crear Borrador
            </button>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
