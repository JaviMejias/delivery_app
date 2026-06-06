import { useState } from 'react'
import { Head, useForm, router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { ClipboardList, FileText, Eye, Trash2, Calendar } from 'lucide-react'
import { formatMoney } from '@/utils/formatters'
import { useExcelExport } from '@/hooks/useExcelExport'
import { StatusBadge } from '@/components/Badges/StatusBadge'
import { confirmDelete } from '@/utils/alerts'

interface Supplier {
  id: number
  name: string
}

interface PurchaseOrder {
  id: number
  status: string
  total: string
  net_total?: string | number
  tax_total?: string | number
  created_at: string
  supplier: Supplier
}

interface Props {
  orders: PurchaseOrder[]
  suppliers: Supplier[]
  pagination: any
  currentSearch?: string
}

export default function PurchaseOrdersIndex({ orders, suppliers, pagination, currentSearch }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState(currentSearch || '')
  const [isLoading, setIsLoading] = useState(false)

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  const [startDate, setStartDate] = useState(new URLSearchParams(window.location.search).get('start_date') || formatDate(firstDay))
  const [endDate, setEndDate] = useState(new URLSearchParams(window.location.search).get('end_date') || formatDate(today))

  const { getThemeName, handleExcelClick } = useExcelExport()

  const applyFilters = () => {
    setIsLoading(true)
    const url = new URL(window.location.href);
    if (search) url.searchParams.set('search', search); else url.searchParams.delete('search');
    if (startDate) url.searchParams.set('start_date', startDate); else url.searchParams.delete('start_date');
    if (endDate) url.searchParams.set('end_date', endDate); else url.searchParams.delete('end_date');
    router.get(url.pathname + url.search, {}, { 
      preserveState: true,
      onFinish: () => setIsLoading(false)
    })
  }

  const form = useForm({
    supplier_id: '',
  })

  const openModal = () => {
    form.reset()
    if (suppliers.length > 0) {
      form.setData('supplier_id', suppliers[0].id.toString())
    }
    setShowModal(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(`/purchases/orders`, {
      onSuccess: () => setShowModal(false),
    })
  }

  const deleteOrder = (id: number) => {
    confirmDelete({
      title: '¿Eliminar orden de compra?',
      text: 'Solo puedes eliminar órdenes en estado de borrador',
      onConfirm: () => router.delete(`/purchases/orders/${id}`)
    })
  }



  const visibleNetTotal = orders.reduce((sum, o) => sum + parseFloat(o.net_total?.toString() || '0'), 0);
  const visibleTaxTotal = orders.reduce((sum, o) => sum + parseFloat(o.tax_total?.toString() || '0'), 0);
  const visibleTotal = orders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);

  return (
    <AuthenticatedLayout>
      <Head title="Órdenes de Compra" />

      <div className="space-y-6">
        <PageHeader 
          icon={<ClipboardList className="w-8 h-8 opacity-80" />}
          title="Órdenes de Compra"
          description="Gestiona las compras a tus proveedores (Gasco, Lipigas, etc)."
          color="indigo"
        >
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25"
          >
            <span className="text-lg leading-none mb-0.5">+</span> Nueva Orden
          </button>
        </PageHeader>
        <TableFilters onApply={applyFilters} isLoading={isLoading}>
          <TableFilters.Search
            value={search}
            onChange={setSearch}
            onSearch={applyFilters}
            placeholder="Buscar por Código o Proveedor..."
            className="w-full sm:w-96"
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
            <a 
              href={`/purchases/orders?format=xlsx&search=${search || ''}&start_date=${startDate}&end_date=${endDate}`} 
              onClick={handleExcelClick} 
              className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors h-[42px] flex items-center justify-center"
            >
              ⬇️ EXCEL
            </a>
          </div>
        </TableFilters>
        <Card className="overflow-hidden ">
              <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Código</Table.Th>
                  <Table.Th className="hidden md:table-cell">Fecha</Table.Th>
                  <Table.Th>Proveedor</Table.Th>
                  <Table.Th className="hidden md:table-cell">Neto</Table.Th>
                  <Table.Th className="hidden md:table-cell">IVA</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th className="text-right">Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orders.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                      No hay órdenes de compra registradas.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  <>
                    {orders.map((o) => (
                      <Table.Tr key={o.id}>
                        <Table.Td className="text-[var(--sf-text-main)] font-bold text-lg">OC-{o.id.toString().padStart(4, '0')}</Table.Td>
                        <Table.Td className="whitespace-nowrap hidden md:table-cell">
                          <div className="text-[var(--sf-text-main)] flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[var(--sf-text-muted)]" />
                            {o.created_at.split('T')[0].split('-').reverse().join('-')}
                          </div>
                        </Table.Td>
                        <Table.Td className="text-[var(--sf-text-main)] font-medium">
                          <div className="flex flex-col">
                            <span>{o.supplier?.name}</span>
                            <span className="md:hidden text-xs text-[var(--sf-text-muted)] mt-0.5">{o.created_at.split('T')[0].split('-').reverse().join('-')}</span>
                          </div>
                        </Table.Td>
                        <Table.Td className="text-[var(--sf-text-main)] font-medium hidden md:table-cell">${parseFloat(o.net_total?.toString() || '0').toLocaleString()}</Table.Td>
                        <Table.Td className="text-[var(--sf-text-main)] font-medium hidden md:table-cell">${parseFloat(o.tax_total?.toString() || '0').toLocaleString()}</Table.Td>
                        <Table.Td className="text-emerald-400 font-medium">${parseFloat(o.total).toLocaleString()}</Table.Td>
                        <Table.Td>
                          <StatusBadge status={o.status} />
                        </Table.Td>
                        <Table.Td className="text-right flex items-center justify-end gap-3">
                          <a 
                            href={`/purchases/orders/${o.id}.pdf`} 
                            onClick={(e) => { e.preventDefault(); window.open(`/purchases/orders/${o.id}?format=pdf&theme=${getThemeName()}`, '_blank'); }} 
                            className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="Descargar PDF"
                          >
                            <FileText size={18} />
                          </a>
                          <Link href={`/purchases/orders/${o.id}`} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Ver Detalles">
                            <Eye size={18} />
                          </Link>
                          {o.status === 'draft' && (
                            <button onClick={() => deleteOrder(o.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    <Table.Tr className="bg-primary-500/5 border-t-2 border-primary-500/20">
                      <Table.Td colSpan={3} className="text-right font-bold text-primary-400 py-4 hidden md:table-cell">
                        TOTALES VISIBLES:
                      </Table.Td>
                      <Table.Td colSpan={2} className="text-right font-bold text-primary-400 py-4 md:hidden">
                        TOTALES:
                      </Table.Td>
                      <Table.Td className="text-base font-bold text-primary-400 hidden md:table-cell">${visibleNetTotal.toLocaleString()}</Table.Td>
                      <Table.Td className="text-base font-bold text-primary-400 hidden md:table-cell">${visibleTaxTotal.toLocaleString()}</Table.Td>
                      <Table.Td className="text-lg font-black text-primary-500">${visibleTotal.toLocaleString()}</Table.Td>
                      <Table.Td colSpan={2}></Table.Td>
                    </Table.Tr>
                  </>
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

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Nueva Orden de Compra">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Proveedor</label>
            <CustomSelect
              value={form.data.supplier_id ? { value: form.data.supplier_id, label: suppliers.find(s => s.id.toString() === form.data.supplier_id)?.name } : null}
              onChange={(val: any) => form.setData('supplier_id', val?.value || '')}
              options={suppliers.map(s => ({ value: s.id.toString(), label: s.name }))}
              placeholder="Seleccionar proveedor..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]">Cancelar</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 bg-primary-500 text-[var(--sf-text-main)] rounded-lg hover:bg-primary-600 disabled:opacity-50">Crear Orden</button>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
