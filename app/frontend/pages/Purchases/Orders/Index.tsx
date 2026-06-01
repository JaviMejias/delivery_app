import { useState } from 'react'
import { Head, useForm, router, Link } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { ClipboardList } from 'lucide-react'

interface Supplier {
  id: number
  name: string
}

interface PurchaseOrder {
  id: number
  status: string
  total: string
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

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  const [startDate, setStartDate] = useState(new URLSearchParams(window.location.search).get('start_date') || formatDate(firstDay))
  const [endDate, setEndDate] = useState(new URLSearchParams(window.location.search).get('end_date') || formatDate(today))

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
    Swal.fire({
      title: '¿Eliminar orden de compra?',
      text: "Solo puedes eliminar órdenes en estado de borrador",
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
        router.delete(`/purchases/orders/${id}`)
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">Borrador</span>
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Confirmada</span>
      case 'received':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Recibida</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Cancelada</span>
      default:
        return null
    }
  }

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
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-[var(--sf-text-main)] font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-lg shadow-indigo-500/25"
          >
            + Nueva Orden
          </button>
        </PageHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center bg-[var(--sf-surface)] border border-[var(--sf-border)] p-4 rounded-xl gap-4 flex-wrap">
          <div className="w-full sm:w-auto flex items-center gap-2">
            <SearchBar routeName="/purchases/orders" currentSearch={currentSearch || ""} placeholder="Buscar por ID o Proveedor..." />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--sf-text-muted)]">Desde:</span>
              <div className="w-36">
                <CustomDatePicker value={startDate} onChange={(val) => {
                  setStartDate(val)
                  const url = new URL(window.location.href);
                  if (val) url.searchParams.set('start_date', val); else url.searchParams.delete('start_date');
                  router.get(url.pathname + url.search, {}, { preserveState: true });
                }} />
              </div>
              <span className="text-sm text-[var(--sf-text-muted)]">Hasta:</span>
              <div className="w-36">
                <CustomDatePicker value={endDate} onChange={(val) => {
                  setEndDate(val)
                  const url = new URL(window.location.href);
                  if (val) url.searchParams.set('end_date', val); else url.searchParams.delete('end_date');
                  router.get(url.pathname + url.search, {}, { preserveState: true });
                }} />
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0 border-l border-[var(--sf-border)] pl-3">
              <a href={`/purchases/orders?format=xlsx&search=${currentSearch || ''}&start_date=${startDate}&end_date=${endDate}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors">
                ⬇️ EXCEL
              </a>
            </div>
          </div>
        </div>
        <Card className="overflow-hidden ">
              <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Código</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Proveedor</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th className="text-right">Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orders.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                      No hay órdenes de compra registradas.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  orders.map((o) => (
                    <Table.Tr key={o.id}>
                      <Table.Td className="text-[var(--sf-text-main)] font-bold text-lg">OC-{o.id.toString().padStart(4, '0')}</Table.Td>
                      <Table.Td className="text-[var(--sf-text-main)]">{o.created_at.split('T')[0].split('-').reverse().join('-')}</Table.Td>
                      <Table.Td className="text-[var(--sf-text-main)] font-medium">{o.supplier?.name}</Table.Td>
                      <Table.Td className="text-emerald-400 font-medium">${parseFloat(o.total).toLocaleString()}</Table.Td>
                      <Table.Td>
                        {getStatusBadge(o.status)}
                      </Table.Td>
                      <Table.Td className="text-right">
                        <Link href={`/purchases/orders/${o.id}`} className="text-indigo-400 hover:text-indigo-300 mr-4 font-medium">
                          Ver Detalles
                        </Link>
                        {o.status === 'draft' && (
                          <button onClick={() => deleteOrder(o.id)} className="text-red-400 hover:text-red-300">Eliminar</button>
                        )}
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
            <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-500 text-[var(--sf-text-main)] rounded-lg hover:bg-indigo-600 disabled:opacity-50">Crear Orden</button>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
