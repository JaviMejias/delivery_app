import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { ClipboardList, Eye, Pencil, Calendar, ChevronDown, ShoppingBag, Receipt, Trash2 } from 'lucide-react'
import { formatPlate, formatCLP } from '@/utils/formatters'
import { PaymentBreakdownBadge } from '@/components/Badges/PaymentBreakdownBadge'
import { router } from '@inertiajs/react'
import Swal from 'sweetalert2'

interface Product {
  id: number
  name: string
  sku: string
  material?: { id: number, name: string }
}

interface RouteSettlementItem {
  id: number
  quantity: number
  returned_empty_quantity: number
  sold_quantity: number
  subtotal: string
  product: Product
}

interface RouteSettlementExpense {
  id: number
  description: string
  amount: string
  payment_method: string
}

interface Truck {
  id: number
  plate_number: string
  driver?: { first_name: string, last_name: string }
}

interface RouteSettlement {
  id: number
  truck_id: number
  date: string
  total_revenue: string
  cash_revenue: string
  card_revenue: string
  transfer_revenue: string
  status: string
  truck: Truck
  route_settlement_expenses?: RouteSettlementExpense[]
  route_settlement_items?: RouteSettlementItem[]
}

interface Props {
  settlements: RouteSettlement[]
  trucks: Truck[]
  pagination: any
  currentSearch?: string
}

export default function SettlementsIndex({ settlements, trucks, pagination, currentSearch }: Props) {
  const { data, setData, post, processing, reset, errors } = useForm({
    truck_id: '',
    date: new Date().toISOString().split('T')[0]
  })

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  const [startDate, setStartDate] = useState(new URLSearchParams(window.location.search).get('start_date') || formatDate(firstDay))
  const [endDate, setEndDate] = useState(new URLSearchParams(window.location.search).get('end_date') || formatDate(today))
  const [search, setSearch] = useState(currentSearch || '')
  const [isLoading, setIsLoading] = useState(false)

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/sales/settlements', {
      onSuccess: () => {
        reset()
      }
    })
  }

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar borrador?',
      text: "Se borrará esta rendición y todos sus detalles. Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--sf-bg)',
      color: 'var(--sf-text-main)'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(`/sales/settlements/${id}`)
      }
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Rendiciones Diarias" />

      <div className="space-y-6">
        <PageHeader 
          title="Rendiciones de Ruta"
          icon={<ClipboardList className="w-8 h-8 opacity-80" />}
          description="Ingresa lo vendido, registra los medios de pago y rinde los envases vacíos."
          color="amber"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <Card className=" sticky top-6" >
              <Card.Body>
              <h2 className="font-semibold text-[var(--sf-text-main)] mb-4">Iniciar Rendición</h2>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">
                    ¿Qué camión rindes?
                  </label>
                  <CustomSelect
                    value={data.truck_id ? { value: data.truck_id, label: (() => {
                      const t = trucks.find(tr => tr.id.toString() === data.truck_id);
                      return t ? `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` : '';
                    })() } : null}
                    onChange={(val: any) => setData('truck_id', val?.value || '')}
                    options={trucks.map(t => ({ value: t.id.toString(), label: `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` }))}
                    placeholder="Selecciona camión..."
                    required
                  />
                  {errors.truck_id && <p className="text-red-400 text-sm mt-1">{errors.truck_id}</p>}
                  {trucks.length === 0 && (
                    <p className="text-orange-400 text-xs mt-1">No hay camiones con inventario. Ve a Cargar Camión primero.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Fecha de Operación</label>
                  <CustomDatePicker
                    value={data.date}
                    onChange={(date) => setData('date', date)}
                  />
                  {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
                </div>
                
                <button
                  type="submit"
                  disabled={processing || !data.truck_id || !data.date}
                  className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 mt-2"
                >
                  Siguiente: Detalle de Ventas →
                </button>
              </form>
            </Card.Body>
          </Card>
          </div>

          {/* Lista */}
          <div className="lg:col-span-2 space-y-4">
            <TableFilters onApply={applyFilters} isLoading={isLoading}>
              <TableFilters.Search
                value={search}
                onChange={setSearch}
                onSearch={applyFilters}
                placeholder="Buscar por patente o fecha..."
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
            </TableFilters>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th className="hidden md:table-cell">Fecha</Table.Th>
                        <Table.Th>Camión</Table.Th>
                        <Table.Th>Detalle</Table.Th>
                        <Table.Th className="hidden lg:table-cell">Pagos</Table.Th>
                        <Table.Th className="text-right">Total</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {settlements.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={7} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                            No hay rendiciones registradas
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        <>
                          {settlements.map((s) => (
                            <Table.Tr key={s.id}>
                              <Table.Td className="whitespace-nowrap align-top hidden md:table-cell">
                                <div className="font-mono font-medium text-[var(--sf-text-muted)] flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  {s.date}
                                </div>
                              </Table.Td>
                              <Table.Td className="text-[var(--sf-text-main)] align-top">
                                <div className="font-mono">{formatPlate(s.truck?.plate_number)}</div>
                                <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">{s.truck?.driver ? `${s.truck.driver.first_name} ${s.truck.driver.last_name}` : 'Sin chofer'}</div>
                                <div className="md:hidden mt-1 text-[10px] text-[var(--sf-text-muted)] flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {s.date}
                                </div>
                              </Table.Td>
                              <Table.Td className="align-top">
                                {(s.route_settlement_items && s.route_settlement_items.length > 0) || (s.route_settlement_expenses && s.route_settlement_expenses.length > 0) ? (
                                  <details className="group max-w-[280px]">
                                    <summary className="cursor-pointer text-xs font-semibold text-primary-400 hover:text-primary-500 list-none flex items-center gap-1 select-none">
                                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                                      Ver Detalle
                                    </summary>
                                    <div className="mt-3 space-y-3 pb-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                      {s.route_settlement_items && s.route_settlement_items.length > 0 && (
                                        <div>
                                          <div className="text-[10px] uppercase text-[var(--sf-text-muted)] font-bold mb-1.5 flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Ventas Realizadas</div>
                                          <div className="space-y-1.5">
                                            {s.route_settlement_items.filter(i => i.sold_quantity > 0 || i.returned_empty_quantity > 0).map(item => (
                                              <div key={item.id} className="text-xs bg-[var(--sf-bg)] border border-[var(--sf-border)] p-1.5 rounded-md">
                                                <div className="flex justify-between items-start">
                                                  <span><span className="font-bold text-emerald-400">{item.sold_quantity}x</span> {item.product.name}</span>
                                                  <span className="font-medium text-[var(--sf-text-main)]">{formatCLP(item.subtotal)}</span>
                                                </div>
                                                {item.returned_empty_quantity > 0 && (
                                                  <div className="text-[10px] text-[var(--sf-text-muted)] mt-0.5">
                                                    Devolvió {item.returned_empty_quantity} {item.product.material?.name || 'envases'}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {s.route_settlement_expenses && s.route_settlement_expenses.length > 0 && (
                                        <div>
                                          <div className="text-[10px] uppercase text-[var(--sf-text-muted)] font-bold mb-1.5 flex items-center gap-1"><Receipt className="w-3 h-3"/> Gastos Declarados</div>
                                          <div className="space-y-1.5">
                                            {s.route_settlement_expenses.map(exp => (
                                              <div key={exp.id} className="flex justify-between items-start text-xs bg-rose-500/5 border border-rose-500/10 p-1.5 rounded-md text-rose-400">
                                                <span>{exp.description}</span>
                                                <span className="font-medium">-{formatCLP(exp.amount)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </details>
                                ) : (
                                  <span className="text-xs text-[var(--sf-text-muted)]">-</span>
                                )}
                              </Table.Td>
                              <Table.Td className="hidden lg:table-cell">
                                <PaymentBreakdownBadge 
                                  cashAmount={s.cash_revenue}
                                  cardAmount={s.card_revenue}
                                  transferAmount={s.transfer_revenue}
                                />
                              </Table.Td>
                              <Table.Td className="text-emerald-400 font-bold text-right">
                                {formatCLP(s.total_revenue)}
                              </Table.Td>
                              <Table.Td>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  s.status === 'draft' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                  {s.status === 'draft' ? 'Borrador' : 'Cerrada'}
                                </span>
                              </Table.Td>
                              <Table.Td className="text-right">
                                <Link href={`/sales/settlements/${s.id}`} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg inline-block transition-colors" title={s.status === 'draft' ? 'Completar' : 'Ver Detalles'}>
                                  {s.status === 'draft' ? <Pencil size={18} /> : <Eye size={18} />}
                                </Link>
                                {s.status === 'draft' && (
                                  <button onClick={() => handleDelete(s.id)} className="p-2 text-[var(--sf-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg inline-block transition-colors ml-1" title="Eliminar borrador">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                          
                          {(() => {
                            const totalCash = settlements.reduce((sum, s) => sum + parseFloat(s.cash_revenue || '0'), 0);
                            const totalCard = settlements.reduce((sum, s) => sum + parseFloat(s.card_revenue || '0'), 0);
                            const totalTransfer = settlements.reduce((sum, s) => sum + parseFloat(s.transfer_revenue || '0'), 0);
                            const totalDeclarado = settlements.reduce((sum, s) => sum + parseFloat(s.total_revenue || '0'), 0);

                            return (
                              <Table.Tr className="bg-primary-500/5 border-t-2 border-primary-500/20 font-semibold">
                                {/* XS Label */}
                                <Table.Td colSpan={2} className="px-6 py-4 text-right text-primary-400 uppercase tracking-wider text-xs font-bold md:hidden">
                                  TOTALES:
                                </Table.Td>
                                {/* MD Label */}
                                <Table.Td colSpan={3} className="px-6 py-4 text-right text-primary-400 uppercase tracking-wider text-xs font-bold hidden md:table-cell lg:hidden">
                                  TOTALES:
                                </Table.Td>
                                {/* LG Label */}
                                <Table.Td colSpan={3} className="px-6 py-4 text-right text-primary-400 uppercase tracking-wider text-xs font-bold hidden lg:table-cell">
                                  TOTAL DECLARADO VISIBLE:
                                </Table.Td>
                                
                                {/* LG Pagos */}
                                <Table.Td className="hidden lg:table-cell py-4">
                                  <PaymentBreakdownBadge 
                                    cashAmount={totalCash.toString()}
                                    cardAmount={totalCard.toString()}
                                    transferAmount={totalTransfer.toString()}
                                  />
                                </Table.Td>
                                
                                {/* All breakpoints Total */}
                                <Table.Td className="text-right text-primary-500 font-black text-lg align-middle py-4">
                                  {formatCLP(totalDeclarado)}
                                </Table.Td>
                                
                                {/* All breakpoints Empty Trailing */}
                                <Table.Td colSpan={2} className="py-4"></Table.Td>
                              </Table.Tr>
                            );
                          })()}
                        </>
                      )}
                    </Table.Tbody>
                  </Table>
                </div>
                {pagination.pages > 1 && (
                  <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
                    <Pagination pagination={pagination} />
                  </div>
                )}
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
