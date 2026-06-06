import { useState, useEffect } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import { TableFilters } from '@/components/TableFilters'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { CustomSelect } from '@/components/CustomSelect'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Sparkles, Filter, Bell, CheckCircle, AlertOctagon, AlertTriangle, Gift, Wrench } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface ChartData {
  name: string
  llenos: number
  vacios: number
}

interface Driver {
  id: number
  first_name: string
  last_name: string
  plate_number: string
  license_expiration: string
}

interface UserAlert {
  id: number
  first_name: string
  last_name: string
  birthday?: string
}

interface MaintenanceTruck {
  id: number
  plate_number: string
  current_km: number
  next_maintenance_km: number
}

interface Props {
  warehouses: { id: number, name: string, is_truck: boolean }[]
  filters: {
    from: string
    to: string
    warehouse_id?: string
  }
  stats: {
    total_sales_period: string
    route_revenue: string
    local_revenue: string
    total_expenses_period: string
  }
  chart_data: ChartData[]
  truck_performance: { name: string, driver_name: string, revenue: number, expenses: number }[]
  critical_stock: { name: string, sku: string, stock: number, threshold: number, ratio: number }[]
  alerts: {
    expiring_drivers: Driver[]
    expired_drivers: Driver[]
    upcoming_birthdays: UserAlert[]
    maintenance_trucks: MaintenanceTruck[]
  }
  payment_methods: { name: string, value: number, fill: string }[]
  seven_day_trends: { date: string, ingresos: number, gastos: number }[]
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-2xl">
        <p className="font-bold text-[var(--sf-text-main)] mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm font-medium">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--sf-text-muted)] capitalize">{entry.name}:</span>
            <span className="text-[var(--sf-text-main)] font-black">{entry.value} cil.</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [yyyy, mm, dd] = dateStr.split('T')[0].split('-')
  return `${dd}-${mm}-${yyyy}`
}

export default function Dashboard({ stats, chart_data, truck_performance, critical_stock, alerts, filters, warehouses, payment_methods, seven_day_trends }: Props) {
  const { app_name } = usePage().props as any
  const [fromDate, setFromDate] = useState(filters.from)
  const [toDate, setToDate] = useState(filters.to)
  const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const startListener = router.on('start', () => setProcessing(true))
    const finishListener = router.on('finish', () => setProcessing(false))
    
    return () => {
      startListener()
      finishListener()
    }
  }, [])

  const applyFilters = () => {
    router.get('/dashboard', { from: fromDate, to: toDate, warehouse_id: warehouseId }, { preserveState: true })
  }

  const appliedWarehouseId = filters.warehouse_id || ''
  const selectedWarehouse = warehouses.find(w => w.id.toString() === appliedWarehouseId)
  const displayContext = selectedWarehouse ? selectedWarehouse.name : 'Global'
  const isTruck = selectedWarehouse ? selectedWarehouse.is_truck : null // null means Global

  const totalSales = parseFloat(stats.total_sales_period || '0')
  const routeRev = parseFloat(stats.route_revenue || '0')
  const localRev = parseFloat(stats.local_revenue || '0')
  
  const totalExpensesPeriod = parseFloat(stats.total_expenses_period || '0')
  
  const totalLlenos = chart_data.reduce((acc, curr) => acc + curr.llenos, 0)
  const totalVacios = chart_data.reduce((acc, curr) => acc + curr.vacios, 0)

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard Principal" />

      <div className="space-y-6">
        <PageHeader 
          title="Panorama General" 
          icon={<Sparkles className="w-8 h-8 opacity-80" />} 
          description={`Métricas clave y estado general de ${app_name}.`}
          color="indigo"
        />

        <TableFilters onApply={applyFilters} isLoading={processing}>
          <TableFilters.Select
            label="Bodega"
            value={warehouseId}
            onChange={setWarehouseId}
            options={[
              { value: '', label: 'Todas las bodegas' },
              ...warehouses.map(w => ({ value: w.id.toString(), label: w.name }))
            ]}
            placeholder="Todas las bodegas"
          />
          <TableFilters.Date
            label="Desde"
            value={fromDate}
            onChange={setFromDate}
          />
          <TableFilters.Date
            label="Hasta"
            value={toDate}
            onChange={setToDate}
          />
        </TableFilters>

        {/* Top KPIs */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-300 ${processing ? 'opacity-50' : 'opacity-100'}`}>
          <div className="glass-panel interactive-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500" />
            <p className="text-sm font-bold text-[var(--sf-text-muted)] uppercase tracking-widest mb-2">Recaudación Neta ({displayContext})</p>
            <h2 className="text-4xl font-black text-[var(--sf-text-main)] tracking-tight">
              <AnimatedNumber value={totalSales} duration={1.5} separator="." prefix="$" />
            </h2>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
              {isTruck !== true && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[var(--sf-text-muted)]">Local:</span>
                  <span className="text-blue-400"><AnimatedNumber value={localRev} duration={1.5} separator="." prefix="$" /></span>
                </div>
              )}
              {isTruck !== false && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[var(--sf-text-muted)]">Ruta:</span>
                  <span className="text-emerald-400"><AnimatedNumber value={routeRev} duration={1.5} separator="." prefix="$" /></span>
                </div>
              )}
              {isTruck !== false && (
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-[var(--sf-text-muted)]">Gastos:</span>
                  <span className="text-rose-400">-<AnimatedNumber value={totalExpensesPeriod} duration={1.5} separator="." prefix="$" /></span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel interactive-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl group-hover:bg-primary-500/30 transition-all duration-500" />
            <p className="text-sm font-bold text-[var(--sf-text-muted)] uppercase tracking-widest mb-2">Llenos ({displayContext})</p>
            <h2 className="text-4xl font-black text-[var(--sf-text-main)] tracking-tight">
              <AnimatedNumber value={totalLlenos} duration={1.5} /> <span className="text-lg text-primary-400 font-medium">cilindros</span>
            </h2>
            <p className="mt-4 text-xs text-[var(--sf-text-muted)] font-medium">Stock sumado en este origen.</p>
          </div>

          <div className="glass-panel interactive-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500" />
            <p className="text-sm font-bold text-[var(--sf-text-muted)] uppercase tracking-widest mb-2">Vacíos ({displayContext})</p>
            <h2 className="text-4xl font-black text-[var(--sf-text-main)] tracking-tight">
              <AnimatedNumber value={totalVacios} duration={1.5} /> <span className="text-lg text-purple-400 font-medium">cilindros</span>
            </h2>
            <p className="mt-4 text-xs text-[var(--sf-text-muted)] font-medium">Envases disponibles en este origen.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-panel interactive-card rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Estado de Inventario por Tipo ({displayContext})</h3>
              <p className="text-xs text-[var(--sf-text-muted)] mt-1">Comparativa de cilindros llenos vs envases vacíos.</p>
            </div>
            <div className="flex-1 w-full mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--sf-text-muted)', fontSize: 12, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="llenos" name="Llenos" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1500} animationEasing="ease-out" />
                  <Bar dataKey="vacios" name="Vacíos" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1500} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Center / Alerts */}
          <div className="glass-panel interactive-card rounded-2xl p-6 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Centro de Alertas</h3>
                <p className="text-xs text-[var(--sf-text-muted)] mt-1">Acciones que requieren atención.</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {(alerts?.expired_drivers || []).length === 0 && (alerts?.expiring_drivers || []).length === 0 && (alerts?.upcoming_birthdays || []).length === 0 && (alerts?.maintenance_trucks || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6">
                  <CheckCircle className="w-12 h-12 text-[var(--sf-text-main)] mb-3" />
                  <p className="text-sm font-bold text-[var(--sf-text-main)]">Todo en orden</p>
                  <p className="text-xs text-[var(--sf-text-muted)] mt-1">No hay alertas pendientes.</p>
                </div>
              ) : (
                <>
                  {(alerts?.maintenance_trucks || []).map(truck => {
                    const isRequired = truck.current_km >= truck.next_maintenance_km
                    const colorClass = isRequired ? 'rose' : 'amber'
                    const title = isRequired ? 'Mantenimiento Requerido' : 'Mantenimiento Próximo'
                    
                    return (
                      <Link 
                        key={`maint-${truck.id}`} 
                        href={`/trucks?edit_truck_id=${truck.id}`}
                        className={`p-3 rounded-xl bg-${colorClass}-500/10 border border-${colorClass}-500/20 flex gap-3 items-start animate-slide-up hover:bg-${colorClass}-500/20 transition-colors cursor-pointer group`}
                      >
                        <Wrench className={`w-5 h-5 text-${colorClass}-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform`} />
                        <div>
                          <h4 className={`text-sm font-bold text-${colorClass}-400`}>{title}</h4>
                          <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                            El camión patente <strong className="text-[var(--sf-text-main)] uppercase tracking-wider">{truck.plate_number.replace(/-/g, '').replace(/(.{2})/g, '$1-').slice(0, -1)}</strong> requiere mantención ({truck.current_km.toLocaleString('es-CL')} / {truck.next_maintenance_km.toLocaleString('es-CL')} km).
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                  {(alerts?.expired_drivers || []).map(driver => (
                    <div key={`expired-${driver.id}`} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start animate-slide-up">
                      <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-red-400">Licencia Expirada</h4>
                        <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                          La licencia de <strong className="text-[var(--sf-text-main)]">{driver.first_name} {driver.last_name}</strong> venció el {formatDate(driver.license_expiration)}.
                        </p>
                      </div>
                    </div>
                  ))}

                  {(alerts?.expiring_drivers || []).map(driver => (
                    <div key={`expiring-${driver.id}`} className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start animate-slide-up">
                      <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-orange-400">Licencia por Vencer</h4>
                        <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                          La licencia de <strong className="text-[var(--sf-text-main)]">{driver.first_name} {driver.last_name}</strong> vence el {formatDate(driver.license_expiration)}.
                        </p>
                      </div>
                    </div>
                  ))}

                  {(alerts?.upcoming_birthdays || []).map(user => {
                    const bDate = new Date(user.birthday + 'T00:00:00');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday = bDate.getDate() === today.getDate() && bDate.getMonth() === today.getMonth();

                    return (
                      <div key={`birthday-${user.id}`} className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex gap-3 items-start animate-slide-up">
                        <Gift className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-pink-400">
                            {isToday ? '¡Feliz Cumpleaños!' : 'Cumpleaños Próximo'}
                          </h4>
                          <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                            {isToday ? (
                              <>Hoy es el cumpleaños de <strong className="text-[var(--sf-text-main)]">{user.first_name} {user.last_name}</strong>.</>
                            ) : (
                              <>El cumpleaños de <strong className="text-[var(--sf-text-main)]">{user.first_name} {user.last_name}</strong> es el {formatDate(user.birthday || '')}.</>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Truck Performance */}
          <div className="glass-panel interactive-card rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Rendimiento de Camiones (Top 5)</h3>
              <p className="text-xs text-[var(--sf-text-muted)] mt-1">Recaudación Neta vs Gastos Operativos.</p>
            </div>
            <div className="flex-1 w-full mt-4 min-h-[250px]">
              {truck_performance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--sf-text-muted)] opacity-50">
                  Sin datos de rendimiento en este período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={truck_performance} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `$${(value/1000)}k`} axisLine={false} tickLine={false} tick={{ fill: 'var(--sf-text-muted)', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--sf-text-main)', fontSize: 12, fontWeight: 'bold' }} width={80} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          const totalGross = data.revenue + data.expenses
                          const expenseRatio = totalGross > 0 ? ((data.expenses / totalGross) * 100).toFixed(1) : 0
                          return (
                            <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-2xl">
                              <p className="font-bold text-[var(--sf-text-main)]">{data.name}</p>
                              <p className="text-xs text-[var(--sf-text-muted)] mb-2">{data.driver_name}</p>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-xs text-[var(--sf-text-muted)]">Neto a Caja:</span>
                                  <span className="text-emerald-400 font-black">{formatCLP(data.revenue)}</span>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-white/10 pb-1">
                                  <span className="text-xs text-[var(--sf-text-muted)]">Gastos:</span>
                                  <span className="text-rose-400 font-bold">{formatCLP(data.expenses)}</span>
                                </div>
                                <div className="flex justify-between gap-4 pt-1">
                                  <span className="text-xs text-primary-400 font-bold">Venta Bruta:</span>
                                  <span className="text-primary-400 font-bold">{formatCLP(totalGross)}</span>
                                </div>
                                <p className="text-[10px] text-[var(--sf-text-muted)] mt-2 italic text-right">
                                  Los gastos representan un {expenseRatio}% de la venta.
                                </p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="revenue" name="Neto a Caja" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={15} animationDuration={1500} animationEasing="ease-out" />
                    <Bar dataKey="expenses" name="Gastos Operativos" fill="#f43f5e" radius={[0, 4, 4, 0]} maxBarSize={15} animationDuration={1500} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Critical Stock */}
          <div className="glass-panel interactive-card rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Stock Crítico (Alertas)</h3>
              <p className="text-xs text-[var(--sf-text-muted)] mt-1">Productos cuyo stock perforó su umbral mínimo.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {critical_stock.length === 0 ? (
                <EmptyState 
                  title="Stock Saludable" 
                  description="Todo el stock está por encima del mínimo."
                  type="box"
                />
              ) : (
                critical_stock.map((item, index) => {
                  const isVeryLow = item.ratio <= 0.5
                  return (
                    <div key={item.sku} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      isVeryLow ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isVeryLow ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isVeryLow ? 'text-red-400' : 'text-orange-400'}`}>{item.name}</p>
                          <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">Mínimo ideal: {item.threshold}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[var(--sf-text-muted)] uppercase tracking-wider font-bold mb-0.5">Stock</p>
                        <p className={`text-xl font-black ${isVeryLow ? 'text-red-400' : 'text-[var(--sf-text-main)]'}`}>{item.stock}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* New Advanced Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Trend Chart (7 days) */}
          <div className="lg:col-span-2 glass-panel interactive-card rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Tendencia Últimos 7 Días</h3>
              <p className="text-xs text-[var(--sf-text-muted)] mt-1">Comparativa de ingresos diarios vs gastos operativos.</p>
            </div>
            <div className="flex-1 w-full mt-4 min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={seven_day_trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--sf-text-muted)', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis tickFormatter={(value) => `$${(value/1000)}k`} axisLine={false} tickLine={false} tick={{ fill: 'var(--sf-text-muted)', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '3 3' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-2xl">
                            <p className="font-bold text-[var(--sf-text-main)] mb-2">{label}</p>
                            {payload.map((entry: any, index: number) => (
                              <div key={`item-${index}`} className="flex items-center gap-2 text-sm font-medium">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[var(--sf-text-muted)] capitalize">{entry.name}:</span>
                                <span className="text-[var(--sf-text-main)] font-black">{formatCLP(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={1500} />
                  <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Donut */}
          <div className="glass-panel interactive-card rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Métodos de Pago</h3>
              <p className="text-xs text-[var(--sf-text-muted)] mt-1">Distribución de recaudación en el período.</p>
            </div>
            <div className="flex-1 w-full mt-4 min-h-[250px] flex items-center justify-center">
              {payment_methods.length === 0 ? (
                <div className="text-[var(--sf-text-muted)] opacity-50">Sin recaudación.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={payment_methods}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {payment_methods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-2xl">
                              <p className="font-bold text-[var(--sf-text-main)] mb-1">{payload[0].name}</p>
                              <p className="text-sm font-black" style={{ color: payload[0].payload.fill }}>
                                {formatCLP(payload[0].value)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

      </div>
    </AuthenticatedLayout>
  )
}
