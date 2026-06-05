import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import { TableFilters } from '@/components/TableFilters'
import Pagination from '@/components/Pagination'
import { Banknote, Loader2, CreditCard, Building2, Store, Truck, Calendar } from 'lucide-react'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { formatCLP } from '@/utils/formatters'
import { PaymentBadge } from '@/components/Badges/PaymentBadge'
import { useExcelExport } from '@/hooks/useExcelExport'

export default function IncomesIndex({ incomes, pagination, filters }: any) {
  const [startDate, setStartDate] = useState(filters?.start_date || '')
  const [endDate, setEndDate] = useState(filters?.end_date || '')
  const [paymentMethod, setPaymentMethod] = useState(filters?.payment_method || '')

  const [isLoading, setIsLoading] = useState(false)

  const { handleExcelClick } = useExcelExport()

  const applyFilters = () => {
    setIsLoading(true)
    const url = new URL(window.location.href);
    if (startDate) url.searchParams.set('start_date', startDate); else url.searchParams.delete('start_date');
    if (endDate) url.searchParams.set('end_date', endDate); else url.searchParams.delete('end_date');
    if (paymentMethod) url.searchParams.set('payment_method', paymentMethod); else url.searchParams.delete('payment_method');
    
    router.get(url.pathname + url.search, {}, { 
      preserveState: true,
      onFinish: () => setIsLoading(false)
    })
  }

  const getSourceBadge = (type: string, source: any) => {
    switch (type) {
      case 'LocalClosure':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg text-xs font-bold shadow-sm" title="Ver Cierre Local">
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

  const groupedIncomes = incomes.reduce((acc: any[], current: any) => {
    const sourceKey = current.source_type && current.source_id 
      ? `${current.source_type}-${current.source_id}`
      : `income-${current.id}`
      
    const existingGroup = acc.find((g: any) => g.sourceKey === sourceKey)
    
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

      <TableFilters onApply={applyFilters} isLoading={isLoading}>
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
        <TableFilters.Select
          label="Método de Pago"
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={[
            { value: '', label: 'Todos' },
            { value: 'cash', label: 'Efectivo' },
            { value: 'card', label: 'Tarjeta' },
            { value: 'transfer', label: 'Transferencia' }
          ]}
        />
        <div className="flex items-center ml-2 border-l border-[var(--sf-border)] pl-4">
          <a 
            href={`/treasury/incomes?format=xlsx&start_date=${startDate}&end_date=${endDate}&payment_method=${paymentMethod}`} 
            onClick={handleExcelClick} 
            className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors h-[42px] flex items-center justify-center"
          >
            ⬇️ EXCEL
          </a>
        </div>
      </TableFilters>

      <Card className="mb-6">

        <div className={`overflow-x-auto transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Origen</Table.Th>
                <Table.Th className="text-right">Gastos</Table.Th>
                <Table.Th>Método</Table.Th>
                <Table.Th className="text-right">Monto Bruto</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {groupedIncomes.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center py-8 text-[var(--sf-text-muted)]">
                    No hay ingresos en este rango.
                  </Table.Td>
                </Table.Tr>
              ) : (
                <>
                  {groupedIncomes.map((group: any) => (
                    <Table.Tr key={group.sourceKey}>
                      <Table.Td className="font-medium text-[var(--sf-text-main)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[var(--sf-text-muted)]" />
                          {new Date(group.date + 'T12:00:00').toLocaleDateString('es-CL')}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {getSourceBadge(group.source_type, group.source)}
                      </Table.Td>
                      <Table.Td className="text-right">
                        {group.source_type === 'RouteSettlement' && group.source?.route_settlement_expenses?.length > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            {group.source.route_settlement_expenses.map((exp: any) => (
                              <div key={exp.id} className="flex items-center justify-end text-xs gap-2">
                                <span className="text-[var(--sf-text-muted)] truncate max-w-[120px]">- {exp.description}</span>
                                <span className="text-rose-400 font-medium whitespace-nowrap">-{formatCLP(exp.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--sf-text-muted)] text-sm">-</span>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <div className="flex flex-col gap-1.5">
                          {group.methods.map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <PaymentBadge method={m.method} />
                              <span className="text-xs text-[var(--sf-text-muted)] bg-[var(--sf-bg)] px-1.5 py-0.5 rounded border border-[var(--sf-border)]">
                                {formatCLP(m.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Table.Td>
                      <Table.Td className="text-right font-bold text-emerald-400">
                        +{formatCLP(group.totalAmount)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  
                  {/* Filas de Totales */}
                  {(() => {
                    const totalBruto = groupedIncomes.reduce((sum: number, g: any) => sum + g.totalAmount, 0);
                    const totalGastos = groupedIncomes.reduce((sum: number, g: any) => {
                      if (g.source_type === 'RouteSettlement' && g.source?.route_settlement_expenses) {
                        return sum + g.source.route_settlement_expenses.reduce((esum: number, exp: any) => esum + parseFloat(exp.amount || '0'), 0);
                      }
                      return sum;
                    }, 0);
                    const totalNeto = totalBruto - totalGastos;
                    
                    const methodsTotal = groupedIncomes.reduce((acc: any, g: any) => {
                      g.methods.forEach((m: any) => {
                        if (!acc[m.method]) acc[m.method] = 0;
                        acc[m.method] += m.amount;
                      });
                      return acc;
                    }, {});

                    return (
                      <>
                        {groupedIncomes.length > 0 && (
                          <Table.Tr className="bg-primary-500/5 border-t-2 border-primary-500/20">
                            <Table.Td colSpan={2} className="text-right font-bold text-primary-400 py-4">
                              TOTAL INGRESOS VISIBLES:
                            </Table.Td>
                            <Table.Td className="text-right font-bold text-rose-400 align-top py-4">
                              {totalGastos > 0 ? `-${formatCLP(totalGastos)}` : '-'}
                            </Table.Td>
                            <Table.Td className="py-4">
                              <div className="flex flex-col gap-1.5">
                                {Object.entries(methodsTotal).map(([method, amount]) => (
                                  <div key={method} className="flex items-center gap-2">
                                    <PaymentBadge method={method} />
                                    <span className="text-xs font-medium text-[var(--sf-text-main)]">
                                      {formatCLP(amount as number)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </Table.Td>
                            <Table.Td className="text-right font-black text-primary-500 align-top py-4 text-lg">
                              +{formatCLP(totalNeto)}
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </Table.Tbody>
          </Table>
        </div>
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-[var(--sf-border)]">
            <Pagination pagination={pagination} />
          </div>
        )}
      </Card>
    </AuthenticatedLayout>
  )
}
