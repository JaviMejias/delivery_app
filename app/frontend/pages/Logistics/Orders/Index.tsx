import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import Modal from '@/components/Modal'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { ClipboardList, Navigation, CheckCircle, Clock, Truck, MapPin, XCircle, FileText } from 'lucide-react'

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
  in_transit: { label: 'En Camino', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: Navigation },
  nearby:     { label: 'Cerca', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: Truck },
  arrived:    { label: 'Llegó', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: MapPin },
  completed:  { label: 'Completado', color: 'text-emerald-500', bg: 'bg-emerald-500/20 border-emerald-500/30', icon: CheckCircle },
  cancelled:  { label: 'Cancelado', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: XCircle }
}

const formatPlate = (p: string) => {
  if (!p) return ''
  const c = p.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (c.length <= 2) return c
  if (c.length <= 4) return `${c.slice(0, 2)}-${c.slice(2)}`
  return `${c.slice(0, 2)}-${c.slice(2, 4)}-${c.slice(4, 6)}`
}

export default function CustomerOrdersIndex({ orders, pagination, currentSearch, currentStatus, startDate, endDate }: Props) {
  const { auth } = usePage().props as any
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  const handleDateChange = (type: 'start' | 'end', val: string) => {
    const url = new URL(window.location.href)
    if (val) url.searchParams.set(type === 'start' ? 'start_date' : 'end_date', val)
    else url.searchParams.delete(type === 'start' ? 'start_date' : 'end_date')
    router.visit(url.toString(), { preserveState: true })
  }

  const handleStatusChange = (val: string) => {
    const url = new URL(window.location.href)
    if (val && val !== 'all') url.searchParams.set('status', val)
    else url.searchParams.delete('status')
    router.visit(url.toString(), { preserveState: true })
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
        />

        <Card className="overflow-hidden">
          {/* Toolbar de Filtros */}
          <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-bg)] grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <SearchBar 
                placeholder="Buscar cliente, dirección o ID..." 
                currentSearch={currentSearch || ""} 
                routeName="/logistics/orders"
              />
            </div>
            
            <div className="md:col-span-3">
              <CustomSelect
                value={currentStatus ? { value: currentStatus, label: currentStatus === 'all' ? 'Todos los estados' : statusConfig[currentStatus as keyof typeof statusConfig]?.label || currentStatus } : { value: 'all', label: 'Todos los estados' }}
                onChange={(val: any) => handleStatusChange(val?.value)}
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'accepted', label: 'Aceptado' },
                  { value: 'in_transit', label: 'En Camino' },
                  { value: 'completed', label: 'Completado' },
                  { value: 'cancelled', label: 'Cancelado' }
                ]}
                placeholder="Filtrar por estado"
              />
            </div>

            <div className="md:col-span-5 flex items-center gap-2">
              <CustomDatePicker 
                value={startDate ? startDate.split('T')[0] : ''} 
                onChange={(val) => handleDateChange('start', val)}
              />
              <span className="text-[var(--sf-text-muted)]">-</span>
              <CustomDatePicker 
                value={endDate ? endDate.split('T')[0] : ''} 
                onChange={(val) => handleDateChange('end', val)}
              />
            </div>
          </div>

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
                          <div className="text-[var(--sf-text-main)] font-medium text-sm">{new Date(order.created_at).toLocaleDateString()}</div>
                          <div className="text-[var(--sf-text-muted)] text-xs font-mono">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </Table.Td>
                        <Table.Td>
                          <div className="font-bold text-[var(--sf-text-main)] text-sm">{order.client_name}</div>
                          <div className="text-[var(--sf-text-muted)] text-xs font-mono">{order.phone}</div>
                        </Table.Td>
                        <Table.Td>
                          <div className="text-[var(--sf-text-main)] text-sm font-medium line-clamp-1">{order.summary_text}</div>
                          <div className="text-[var(--sf-text-muted)] text-xs flex items-center gap-1 mt-0.5 max-w-xs truncate">
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
                            className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          >
                            Detalles →
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
              <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20">
                <p className="text-sm font-semibold text-indigo-300 leading-relaxed">
                  {selectedOrder.summary_text}
                </p>
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
                  className="text-indigo-400 hover:text-indigo-300 font-bold"
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
