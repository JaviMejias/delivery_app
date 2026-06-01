import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { CustomSelect } from '@/components/CustomSelect'
import { FileText, Plus, FileBadge2, X } from 'lucide-react'
import { useState } from 'react'
import { router } from '@inertiajs/react'

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
}

export default function DocumentsIndex({ documents, pagination, currentSearch, suppliers, available_invoices }: Props) {
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDocData, setNewDocData] = useState({
    supplier_id: '',
    document_type: 'invoice',
    reference_document_id: ''
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
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-5 h-5" />
            Ingresar Documento
          </button>
        </PageHeader>

        <Card>
          <div className="p-4 border-b border-[var(--sf-border)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--sf-bg)]/50">
            <SearchBar routeName="/purchases/documents" currentSearch={currentSearch || ""} placeholder="Buscar por N° o Proveedor..." />
          </div>

          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Documento</Table.Th>
                <Table.Th>Proveedor</Table.Th>
                <Table.Th>Fechas</Table.Th>
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
                        <div className={`p-2 rounded-lg ${doc.file_url ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-muted)]'}`}>
                          <FileBadge2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-[var(--sf-text-main)]">
                            N° {doc.document_number}
                          </div>
                          <div className="text-xs text-[var(--sf-text-muted)] mt-0.5 uppercase tracking-wide">
                            {getTypeLabel(doc.document_type)}
                          </div>
                        </div>
                      </div>
                    </Table.Td>
                    
                    <Table.Td>
                      <div className="font-medium text-[var(--sf-text-main)]">{doc.supplier?.name}</div>
                      <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">{doc.supplier?.rut}</div>
                    </Table.Td>
                    
                    <Table.Td>
                      <div className="text-sm text-[var(--sf-text-main)] flex items-center gap-2">
                        <span className="text-[var(--sf-text-muted)] w-10 text-xs">Emisión:</span> 
                        {new Date(doc.issue_date).toLocaleDateString('es-CL')}
                      </div>
                      <div className="text-sm text-[var(--sf-text-main)] flex items-center gap-2 mt-0.5">
                        <span className="text-[var(--sf-text-muted)] w-10 text-xs">Vence:</span> 
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        doc.status === 'draft' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                        doc.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        doc.status === 'partial' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        doc.status === 'voided' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {doc.status === 'draft' ? 'Borrador' : 
                         doc.status === 'pending' ? 'No Pagada' : 
                         doc.status === 'partial' ? 'Parcial' : 
                         doc.status === 'voided' ? 'Anulada' : 'Pagada'}
                      </span>
                    </Table.Td>

                    <Table.Td className="text-right">
                      <div className="flex justify-end gap-3">
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
                            PDF
                          </a>
                        )}
                        <Link href={`/purchases/documents/${doc.id}`} className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] font-medium text-sm">
                          Ver Detalles →
                        </Link>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
          
          <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
            <Pagination pagination={pagination} />
          </div>
        </Card>
      </div>

      {/* Modal for Creating Draft Document */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[var(--sf-border)] bg-[var(--sf-surface)]">
              <h3 className="text-lg font-semibold text-[var(--sf-text-main)]">Nuevo Documento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateDraft} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1.5">Proveedor (Opcional)</label>
                <CustomSelect
                  value={newDocData.supplier_id ? { value: newDocData.supplier_id, label: suppliers.find(s => s.id.toString() === newDocData.supplier_id)?.name } : null}
                  onChange={(val: any) => setNewDocData({ ...newDocData, supplier_id: val?.value || '' })}
                  options={suppliers.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.rut})` }))}
                  placeholder="Seleccionar proveedor..."
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
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25">
                  Crear Borrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
