import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import Modal from '@/components/Modal'
import { TableFilters } from '@/components/TableFilters'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { ClipboardList, Navigation, CheckCircle, Clock, Truck, MapPin, XCircle, FileText, Eye, Calendar } from 'lucide-react'
import { formatPlate } from '@/utils/formatters'
import { useExcelExport } from '@/hooks/useExcelExport'

interface Order {
  id: number
  order_token: string
  client_name: string
  phone: string
  address: string
  latitude: number
  longitude: number
  status: 'pending' | 'accepted' | 'in_transit' | 'nearby' | 'arrived' | 'completed' | 'cancelled'
  summary_text: string
  details: any
  notes?: string
  created_at: string
  truck?: {
    plate_number: string
    driver?: {
      first_name: string
      last_name: string
    }
  }
}

interface Props {
  orders: Order[]
  pagination: any
  currentSearch?: string
  currentStatus?: string
  startDate?: string
  endDate?: string
}

const statusConfig = {
  pending:    { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
  accepted:   { label: 'Aceptado', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', icon: CheckCircle },
  in_transit: { label: 'En Camino', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20', icon: Navigation },
  nearby:     { label: 'Cerca', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: Truck },
  arrived:    { label: 'Llegó', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: MapPin },
  completed:  { label: 'Completado', color: 'text-emerald-500', bg: 'bg-emerald-500/20 border-emerald-500/30', icon: CheckCircle },
  cancelled:  { label: 'Cancelado', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: XCircle }
}



export default function CustomerOrdersIndex({ orders, pagination, currentSearch, currentStatus, startDate, endDate }: Props) {
  const { auth } = usePage().props as any
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  const { handleExcelClick } = useExcelExport()

  const [search, setSearch] = useState(currentSearch || '')
  const [start, setStart] = useState(startDate ? startDate.split('T')[0] : '')
  const [end, setEnd] = useState(endDate ? endDate.split('T')[0] : '')
  const [status, setStatus] = useState(currentStatus || 'all')
  const [isLoading, setIsLoading] = useState(false)

  const applyFilters = () => {
    setIsLoading(true)
    const url = new URL(window.location.href)
    if (search) url.searchParams.set('search', search); else url.searchParams.delete('search')
    if (start) url.searchParams.set('start_date', start); else url.searchParams.delete('start_date')
    if (end) url.searchParams.set('end_date', end); else url.searchParams.delete('end_date')
    if (status && status !== 'all') url.searchParams.set('status', status); else url.searchParams.delete('status')
    
    router.visit(url.toString(), { 
      preserveState: true,
      onFinish: () => setIsLoading(false)
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Historial de Pedidos" />

      <div className="space-y-6">
        <PageHeader 
          title="Historial de Despachos"
          icon={<ClipboardList className="w-8 h-8 opacity-80" />}
          description="Audita todos los pedidos realizados a través del mapa, su estado actual y el camión asignado."
          color="indigo"
        >
          <div className="flex gap-2 shrink-0">
            <a 
              href={`/logistics/orders?format=xlsx&search=${currentSearch || ''}&status=${currentStatus || 'all'}&start_date=${startDate}&end_date=${endDate}`} 
              onClick={handleExcelClick}
              className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors"
            >
              ⬇️ EXCEL
            </a>
          </div>
        </PageHeader>

        <TableFilters onApply={applyFilters} isLoading={isLoading}>
          <TableFilters.Search
            value={search}
            onChange={setSearch}
            onSearch={applyFilters}
            placeholder="Buscar cliente, dirección o ID..."
            className="w-full sm:flex-1 min-w-[250px]"
          />
          <TableFilters.Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'pending', label: 'Pendiente' },
              { value: 'accepted', label: 'Aceptado' },
              { value: 'in_transit', label: 'En Camino' },
              { value: 'completed', label: 'Completado' },
              { value: 'cancelled', label: 'Cancelado' }
            ]}
            placeholder="Todos los estados"
            className="w-full sm:w-[200px]"
          />
          <TableFilters.Date
            label="Desde"
            value={start}
            onChange={setStart}
          />
          <TableFilters.Date
            label="Hasta"
            value={end}
            onChange={setEnd}
          />
        </TableFilters>

        <Card className="overflow-hidden">

          <div className="overflow-x-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Hora</Table.Th>
                  <Table.Th>Cliente</Table.Th>
                  <Table.Th>Detalle / Dirección</Table.Th>
                  <Table.Th>Vehículo</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th className="text-right">Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orders.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                      No se encontraron pedidos con estos filtros
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  orders.map((order) => {
                    const conf = statusConfig[order.status] || statusConfig.pending
                    const StatusIcon = conf.icon
                    return (
                      <Table.Tr key={order.id} className="hover:bg-[var(--sf-surface)] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <Table.Td className="whitespace-nowrap">
                          <div className="text-[var(--sf-text-main)] font-medium text-sm flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--sf-text-muted)]"/> {new Date(order.created_at).toLocaleDateString()}</div>
                          <div className="text-[var(--sf-text-muted)] text-xs font-mono">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </Table.Td>
                        <Table.Td>
                          <div className="font-bold text-[var(--sf-text-main)] text-sm">{order.client_name}</div>
                          <div className="text-[var(--sf-text-muted)] text-xs font-mono">{order.phone}</div>
                        </Table.Td>
                        <Table.Td>
                          <details className="group" onClick={(e) => e.stopPropagation()}>
                            <summary className="text-[var(--sf-text-main)] text-sm font-medium cursor-pointer select-none hover:text-primary-400 transition-colors list-none flex items-center gap-1.5">
                              <span className="text-[10px] text-[var(--sf-text-muted)] transition-transform group-open:rotate-90">▶</span> 
                              <span className="line-clamp-1">{order.summary_text}</span>
                            </summary>
                            <div className="mt-2 mb-1 pl-4 border-l-2 border-primary-500/30 space-y-1">
                              {order.details?.quick_order ? (
                                <p className="text-xs text-[var(--sf-text-main)]">⚡ {order.details.quick_order}</p>
                              ) : order.details?.items?.length > 0 ? (
                                order.details.items.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center text-xs max-w-[220px]">
                                    <span className="text-slate-400 truncate pr-2">{item.name}</span>
                                    <span className="font-bold text-primary-400">{item.quantity}x</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-slate-500 italic">Sin detalle</p>
                              )}
                            </div>
                          </details>
                          <div className="text-[var(--sf-text-muted)] text-xs flex items-center gap-1 mt-1.5 max-w-xs truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{order.address}</span>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          {order.truck ? (
                            <>
                              <div className="font-mono text-xs font-bold tracking-widest text-[var(--sf-text-main)]">{formatPlate(order.truck.plate_number)}</div>
                              <div className="text-[var(--sf-text-muted)] text-xs truncate max-w-[120px]">
                                {order.truck.driver ? `${order.truck.driver.first_name} ${order.truck.driver.last_name}` : 'Sin chofer'}
                              </div>
                            </>
                          ) : (
                            <span className="text-[var(--sf-text-muted)] text-xs italic">No asignado</span>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${conf.bg} ${conf.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {conf.label}
                          </span>
                        </Table.Td>
                        <Table.Td className="text-right">
                          <button 
                            className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg font-medium text-sm transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                            title="Ver Detalles"
                          >
                            <Eye size={18} />
                          </button>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })
                )}
              </Table.Tbody>
            </Table>
          </div>
          <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
            <Pagination pagination={pagination} />
          </div>
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal show={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Detalle del Pedido">
        {selectedOrder && (
          <div className="space-y-6">
            {/* Cabecera */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-[var(--sf-text-muted)] uppercase tracking-widest mb-1">ID Seguimiento</p>
                <p className="font-mono text-sm text-[var(--sf-text-main)] bg-[var(--sf-bg)] px-2 py-1 rounded-lg border border-[var(--sf-border)]">{selectedOrder.order_token}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].color}`}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {statusConfig[selectedOrder.status].label}
              </div>
            </div>

            <hr className="border-[var(--sf-border)]" />

            {/* Datos Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-[var(--sf-text-muted)] mb-1">Cliente</p>
                <p className="text-sm font-semibold text-[var(--sf-text-main)]">{selectedOrder.client_name}</p>
                <p className="text-xs text-[var(--sf-text-muted)] font-mono mt-0.5">{selectedOrder.phone}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--sf-text-muted)] mb-1">Vehículo Asignado</p>
                {selectedOrder.truck ? (
                  <>
                    <p className="text-sm font-bold font-mono tracking-widest text-[var(--sf-text-main)]">{formatPlate(selectedOrder.truck.plate_number)}</p>
                    <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">{selectedOrder.truck.driver ? `${selectedOrder.truck.driver.first_name} ${selectedOrder.truck.driver.last_name}` : 'Sin chofer'}</p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--sf-text-muted)] italic">Aún buscando...</p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-[var(--sf-bg)] p-3 rounded-xl border border-[var(--sf-border)] flex items-start gap-3">
              <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[var(--sf-text-muted)] mb-0.5">Destino</p>
                <p className="text-sm text-[var(--sf-text-main)]">{selectedOrder.address}</p>
              </div>
            </div>

            {/* Resumen del pedido */}
            <div>
              <p className="text-xs font-bold text-[var(--sf-text-muted)] mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Detalle Solicitado
              </p>
              <div className="bg-primary-500/5 p-4 rounded-xl border border-primary-500/20">
                <p className="text-sm font-semibold text-primary-300 leading-relaxed mb-3 border-b border-primary-500/10 pb-2">
                  {selectedOrder.summary_text}
                </p>
                <div className="space-y-1.5">
                  {selectedOrder.details?.quick_order ? (
                    <p className="text-sm text-[var(--sf-text-main)] font-semibold flex items-center gap-2">
                      ⚡ {selectedOrder.details.quick_order}
                    </p>
                  ) : selectedOrder.details?.items?.length > 0 ? (
                    selectedOrder.details.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm py-1">
                        <span className="text-slate-300 flex items-center gap-2"><span className="text-primary-500/50">📦</span> {item.name}</span>
                        <span className="font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-md">{item.quantity}x</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sin detalle de productos</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notas */}
            {selectedOrder.notes && (
              <div>
                <p className="text-xs font-bold text-[var(--sf-text-muted)] mb-2">Notas del Cliente</p>
                <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 text-sm text-amber-300/90 italic">
                  "{selectedOrder.notes}"
                </div>
              </div>
            )}
            
            {/* Fechas */}
            <div className="flex justify-between items-center text-xs text-[var(--sf-text-muted)] pt-4 border-t border-[var(--sf-border)]">
              <p>Creado: {new Date(selectedOrder.created_at).toLocaleString()}</p>
              {!['completed', 'cancelled'].includes(selectedOrder.status) && auth?.current_company?.slug && (
                <a 
                  href={`/${auth.current_company.slug}/order/${selectedOrder.order_token}`} 
                  target="_blank"
                  className="text-primary-400 hover:text-primary-300 font-bold"
                >
                  Ver Enlace Público ↗
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

    </AuthenticatedLayout>
  )
}
