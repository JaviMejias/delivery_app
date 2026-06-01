import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { Banknote, Filter, Search, Loader2, CreditCard, Building2, Store, Truck } from 'lucide-react'
import { useState } from 'react'
import { router } from '@inertiajs/react'

export default function IncomesIndex({ incomes, pagination, filters }: any) {
  const [dateFrom, setDateFrom] = useState(filters?.date_from || '')
  const [dateTo, setDateTo] = useState(filters?.date_to || '')
  const [paymentMethod, setPaymentMethod] = useState(filters?.payment_method || '')

  const [isLoading, setIsLoading] = useState(false)

  const applyFilters = () => {
    setIsLoading(true)
    router.get('/treasury/incomes', {
      date_from: dateFrom,
      date_to: dateTo,
      payment_method: paymentMethod
    }, { 
      preserveState: true,
      onFinish: () => setIsLoading(false)
    })
  }

  const formatCLP = (amount: number | string) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
  }

  const getSourceBadge = (type: string, source: any) => {
    switch (type) {
      case 'LocalClosure':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold shadow-sm" title="Ver Cierre Local">
            <Store size={14} /> Cierre #{source?.id}
          </span>
        )
      case 'RouteSettlement':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold shadow-sm" title="Ver Rendición de Ruta">
            <Truck size={14} /> Rendición #{source?.id}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--sf-surface)] text-[var(--sf-text-muted)] border border-[var(--sf-border)] rounded-lg text-xs font-bold shadow-sm">
            {type}
          </span>
        )
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <Banknote size={16} className="opacity-80" /> Efectivo
          </span>
        )
      case 'card':
        return (
          <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium">
            <CreditCard size={16} className="opacity-80" /> Tarjeta
          </span>
        )
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1.5 text-purple-400 font-medium">
            <Building2 size={16} className="opacity-80" /> Transferencia
          </span>
        )
      default:
        return <span className="capitalize text-[var(--sf-text-muted)] font-medium">{method}</span>
    }
  }

  const groupedIncomes = incomes.reduce((acc: any[], current: any) => {
    const sourceKey = current.source_type && current.source_id 
      ? `${current.source_type}-${current.source_id}`
      : `income-${current.id}`
      
    const existingGroup = acc.find(g => g.sourceKey === sourceKey)
    
    if (existingGroup) {
      existingGroup.totalAmount += parseFloat(current.amount)
      existingGroup.methods.push({ method: current.payment_method, amount: parseFloat(current.amount) })
    } else {
      acc.push({
        ...current,
        sourceKey,
        totalAmount: parseFloat(current.amount),
        methods: [{ method: current.payment_method, amount: parseFloat(current.amount) }]
      })
    }
    
    return acc
  }, [])

  return (
    <AuthenticatedLayout>
      <Head title="Ingresos" />
      <PageHeader 
        title="Ingresos"
        icon={<Banknote className="w-8 h-8 opacity-80" />}
        description="Listado consolidado de todos los ingresos de la empresa."
        color="emerald"
      />

      <Card className="mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-end bg-[var(--sf-surface)] border-b border-[var(--sf-border)] rounded-t-2xl">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-[var(--sf-text-muted)] mb-1">Desde</label>
            <CustomDatePicker 
              value={dateFrom} 
              onChange={setDateFrom}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-[var(--sf-text-muted)] mb-1">Hasta</label>
            <CustomDatePicker 
              value={dateTo} 
              onChange={setDateTo}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-[var(--sf-text-muted)] mb-1">Método de Pago</label>
            <CustomSelect 
              value={paymentMethod ? { value: paymentMethod, label: paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia' } : { value: '', label: 'Todos' }}
              onChange={(v: any) => setPaymentMethod(v?.value || '')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'cash', label: 'Efectivo' },
                { value: 'card', label: 'Tarjeta' },
                { value: 'transfer', label: 'Transferencia' }
              ]}
              placeholder="Todos"
            />
          </div>
          <button 
            onClick={applyFilters}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Filter size={16} />} 
            {isLoading ? 'Filtrando...' : 'Filtrar'}
          </button>
        </div>

        <div className={`overflow-x-auto transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Origen</Table.Th>
                <Table.Th>Método</Table.Th>
                <Table.Th className="text-right">Monto</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {groupedIncomes.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4} className="text-center py-8 text-[var(--sf-text-muted)]">
                    No hay ingresos en este rango.
                  </Table.Td>
                </Table.Tr>
              ) : (
                groupedIncomes.map((group: any) => (
                  <Table.Tr key={group.sourceKey}>
                    <Table.Td className="font-medium text-[var(--sf-text-main)]">
                      {new Date(group.date + 'T12:00:00').toLocaleDateString('es-CL')}
                    </Table.Td>
                    <Table.Td>
                      {getSourceBadge(group.source_type, group.source)}
                    </Table.Td>
                    <Table.Td>
                      <div className="flex flex-col gap-1.5">
                        {group.methods.map((m: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            {getMethodBadge(m.method)}
                            <span className="text-xs text-[var(--sf-text-muted)] bg-[var(--sf-bg)] px-1.5 py-0.5 rounded border border-[var(--sf-border)]">
                              {formatCLP(m.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Table.Td>
                    <Table.Td className="text-right font-bold text-emerald-400">
                      {formatCLP(group.totalAmount)}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
        <div className="p-4 border-t border-[var(--sf-border)]">
          <Pagination pagination={pagination} />
        </div>
      </Card>
    </AuthenticatedLayout>
  )
}
