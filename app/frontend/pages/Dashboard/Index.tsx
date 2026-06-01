import { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { CustomSelect } from '@/components/CustomSelect'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Sparkles, Filter, Bell, CheckCircle, AlertOctagon, AlertTriangle, Gift } from 'lucide-react'
import {
  BarChart,
  Bar,
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

interface Props {
  warehouses: { id: number, name: string }[]
  filters: {
    from: string
    to: string
    warehouse_id?: string
  }
  stats: {
    total_sales_period: string
    route_revenue: string
    local_revenue: string
  }
  chart_data: ChartData[]
  truck_performance: { name: string, driver_name: string, revenue: number }[]
  critical_stock: { name: string, sku: string, stock: number }[]
  alerts: {
    expiring_drivers: Driver[]
    expired_drivers: Driver[]
    upcoming_birthdays: UserAlert[]
  }
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

export default function Dashboard({ stats, chart_data, truck_performance, critical_stock, alerts, filters, warehouses }: Props) {
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

  const totalSales = parseFloat(stats.total_sales_period || '0')
  const routeRev = parseFloat(stats.route_revenue || '0')
  const localRev = parseFloat(stats.local_revenue || '0')
  
  const totalLlenos = chart_data.reduce((acc, curr) => acc + curr.llenos, 0)
  const totalVacios = chart_data.reduce((acc, curr) => acc + curr.vacios, 0)

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard Principal" />

      <div className="space-y-6">
        {/* Header Area */}
        <PageHeader 
          title="Panorama General" 
          icon={<Sparkles className="w-8 h-8 opacity-80" />} 
          description="Un vistazo rápido a las métricas clave de StockFlow."
          color="indigo"
        >
          <div className="flex flex-col xl:flex-row gap-3 items-center mt-4 sm:mt-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--sf-text-muted)]">Bodega:</span>
              <div className="w-full sm:w-48">
                <CustomSelect
                  value={warehouseId ? { value: warehouseId, label: warehouses.find(w => w.id.toString() === warehouseId)?.name } : { value: '', label: 'Todas las bodegas' }}
                  onChange={(val: any) => setWarehouseId(val?.value || '')}
                  options={[
                    { value: '', label: 'Todas las bodegas' },
                    ...warehouses.map(w => ({ value: w.id.toString(), label: w.name }))
                  ]}
                  placeholder="Todas las bodegas"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium text-[var(--sf-text-muted)] hidden sm:block">Desde:</span>
                <div className="w-full sm:w-36">
                  <CustomDatePicker value={fromDate} onChange={setFromDate} />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium text-[var(--sf-text-muted)] hidden sm:block">Hasta:</span>
                <div className="w-full sm:w-36">
                  <CustomDatePicker value={toDate} onChange={setToDate} maxDate="today" />
                </div>
              </div>
              <button
                onClick={applyFilters}
                disabled={processing}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px] w-full sm:w-auto"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Filter className="w-4 h-4" /> Filtrar</>
                )}
              </button>
            </div>
          </div>
        </PageHeader>

        {/* Top KPIs */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-300 ${processing ? 'opacity-50' : 'opacity-100'}`}>
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500" />
            <p className="text-sm font-bold text-[var(--sf-text-muted)] uppercase tracking-widest mb-2">Ventas del Período</p>
            <h2 className="text-4xl font-black text-[var(--sf-text-main)] tracking-tight">
              <AnimatedNumber value={totalSales} duration={1.5} separator="." prefix="$" />
            </h2>
            <div className="mt-4 flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[var(--sf-text-muted)]">Local:</span>
                <span className="text-emerald-400"><AnimatedNumber value={localRev} duration={1.5} separator="." prefix="$" /></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-[var(--sf-text-muted)]">Ruta:</span>
                <span className="text-indigo-400"><AnimatedNumber value={routeRev} duration={1.5} separator="." prefix="$" /></span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500" />
            <p className="text-sm font-bold text-[var(--sf-text-muted)] uppercase tracking-widest mb-2">Llenos (Global)</p>
            <h2 className="text-4xl font-black text-[var(--sf-text-main)] tracking-tight">
              <AnimatedNumber value={totalLlenos} duration={1.5} /> <span className="text-lg text-indigo-400 font-medium">cilindros</span>
            </h2>
            <p className="mt-4 text-xs text-[var(--sf-text-muted)] font-medium">Stock sumado en todas las bodegas y camiones.</p>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500" />
            <p className="text-sm font-bold text-[var(--sf-text-muted)] uppercase tracking-widest mb-2">Vacíos (Global)</p>
            <h2 className="text-4xl font-black text-[var(--sf-text-main)] tracking-tight">
              <AnimatedNumber value={totalVacios} duration={1.5} /> <span className="text-lg text-purple-400 font-medium">cilindros</span>
            </h2>
            <p className="mt-4 text-xs text-[var(--sf-text-muted)] font-medium">Envases disponibles para recarga.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Estado de Inventario por Tipo</h3>
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
          <div className="glass-panel rounded-2xl p-6 flex flex-col">
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
              {alerts.expired_drivers.length === 0 && alerts.expiring_drivers.length === 0 && alerts.upcoming_birthdays.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6">
                  <CheckCircle className="w-12 h-12 text-[var(--sf-text-main)] mb-3" />
                  <p className="text-sm font-bold text-[var(--sf-text-main)]">Todo en orden</p>
                  <p className="text-xs text-[var(--sf-text-muted)] mt-1">No hay alertas pendientes.</p>
                </div>
              ) : (
                <>
                  {alerts.expired_drivers.map(driver => (
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

                  {alerts.expiring_drivers.map(driver => (
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

                  {alerts.upcoming_birthdays.map(user => {
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
          <div className="glass-panel rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Rendimiento de Camiones (Top 5)</h3>
              <p className="text-xs text-[var(--sf-text-muted)] mt-1">Ingresos recaudados por camión en el período.</p>
            </div>
            <div className="flex-1 w-full mt-4 min-h-[250px]">
              {truck_performance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--sf-text-muted)] opacity-50">
                  Sin datos de rendimiento en este período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={truck_performance} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `$${(value/1000)}k`} axisLine={false} tickLine={false} tick={{ fill: 'var(--sf-text-muted)', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--sf-text-main)', fontSize: 12, fontWeight: 'bold' }} width={80} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-2xl">
                              <p className="font-bold text-[var(--sf-text-main)]">{data.name}</p>
                              <p className="text-xs text-[var(--sf-text-muted)] mb-2">{data.driver_name}</p>
                              <p className="text-emerald-400 font-black">{formatCLP(data.revenue)}</p>
                            </div>
                          )
                        }
                        return null
                      }} 
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={40} animationDuration={1500} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Critical Stock */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Stock Crítico (Alertas)</h3>
              <p className="text-xs text-[var(--sf-text-muted)] mt-1">Los 5 productos con menor cantidad en inventario.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {critical_stock.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--sf-text-muted)] opacity-50">
                  Inventario vacío o sin datos.
                </div>
              ) : (
                critical_stock.map((item, index) => {
                  const isVeryLow = item.stock <= 5
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
                          <p className="text-xs text-[var(--sf-text-muted)] font-mono mt-0.5">{item.sku}</p>
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

      </div>
    </AuthenticatedLayout>
  )
}
