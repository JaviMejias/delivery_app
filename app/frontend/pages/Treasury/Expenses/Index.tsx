import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import { TableFilters } from '@/components/TableFilters'
import Pagination from '@/components/Pagination'
import { Banknote, Plus, Calendar, Eye } from 'lucide-react'
import { useState } from 'react'
import { formatCLP } from '@/utils/formatters'
import { PaymentBadge } from '@/components/Badges/PaymentBadge'
import { useExcelExport } from '@/hooks/useExcelExport'

export default function ExpensesIndex({ expenses, pagination, filters }: any) {
  const [search, setSearch] = useState(filters?.search || '')
  const [startDate, setStartDate] = useState(filters?.start_date || '')
  const [endDate, setEndDate] = useState(filters?.end_date || '')
  const [paymentMethod, setPaymentMethod] = useState(filters?.payment_method || '')
  const [isLoading, setIsLoading] = useState(false)

  const { handleExcelClick } = useExcelExport()

  const applyFilters = () => {
    setIsLoading(true)
    const url = new URL(window.location.href);
    if (search) url.searchParams.set('search', search); else url.searchParams.delete('search');
    if (startDate) url.searchParams.set('start_date', startDate); else url.searchParams.delete('start_date');
    if (endDate) url.searchParams.set('end_date', endDate); else url.searchParams.delete('end_date');
    if (paymentMethod) url.searchParams.set('payment_method', paymentMethod); else url.searchParams.delete('payment_method');
    
    router.get(url.pathname + url.search, {}, { 
      preserveState: true,
      onFinish: () => setIsLoading(false)
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Egresos" />
      <PageHeader 
        title="Egresos y Pagos"
        icon={<Banknote className="w-8 h-8 opacity-80" />}
        description="Listado de pagos realizados para cubrir facturas y otros documentos."
        color="rose"
      >
        <Link 
          href="/treasury/expenses/new" 
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-5 h-5" /> Registrar Egreso
        </Link>
      </PageHeader>

      <div className="space-y-6">
        <TableFilters onApply={applyFilters} isLoading={isLoading}>
          <TableFilters.Search
            value={search}
            onChange={setSearch}
            onSearch={applyFilters}
            placeholder="Buscar por Referencia o Detalle..."
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
              href={`/treasury/expenses?format=xlsx&search=${search || ''}&start_date=${startDate}&end_date=${endDate}&payment_method=${paymentMethod}`} 
              onClick={handleExcelClick} 
              className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors h-[42px] flex items-center justify-center"
            >
              ⬇️ EXCEL
            </a>
          </div>
        </TableFilters>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>N° Referencia</Table.Th>
                  <Table.Th>Método</Table.Th>
                  <Table.Th>Detalle</Table.Th>
                  <Table.Th className="text-right">Monto Total</Table.Th>
                  <Table.Th className="text-right"></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {expenses.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} className="text-center py-8 text-[var(--sf-text-muted)]">
                      No hay egresos registrados en este rango.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  <>
                    {expenses.map((exp: any) => (
                      <Table.Tr key={exp.id}>
                        <Table.Td className="font-medium text-[var(--sf-text-main)] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[var(--sf-text-muted)]" />
                            {new Date(exp.date + 'T12:00:00').toLocaleDateString('es-CL')}
                          </div>
                        </Table.Td>
                        <Table.Td className="text-[var(--sf-text-muted)]">{exp.reference_number || '-'}</Table.Td>
                        <Table.Td>
                          <PaymentBadge method={exp.payment_method} />
                        </Table.Td>
                        <Table.Td>
                          <div className="flex flex-col gap-1">
                            {exp.notes && (
                              <span className="text-xs text-[var(--sf-text-main)] italic">
                                {exp.notes}
                              </span>
                            )}
                            {exp.expense_documents?.map((ed: any) => (
                              <span key={ed.id} className="text-xs text-[var(--sf-text-muted)] bg-[var(--sf-bg)] border border-[var(--sf-border)] px-2 py-0.5 rounded-md inline-block max-w-max">
                                Factura #{ed.purchase_document?.document_number} ({formatCLP(ed.amount_applied)})
                              </span>
                            ))}
                          </div>
                        </Table.Td>
                        <Table.Td className="text-right font-bold text-rose-400">
                          {formatCLP(exp.amount)}
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Link href={`/treasury/expenses/${exp.id}`} className="p-2 text-[var(--sf-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg inline-block transition-colors" title="Ver Detalle">
                            <Eye size={18} />
                          </Link>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    
                    {/* Fila de Totales */}
                    {(() => {
                      const totalEgresos = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || '0'), 0);
                      return (
                        <Table.TotalRow 
                          label="TOTAL EGRESOS VISIBLES:" 
                          value={formatCLP(totalEgresos)} 
                          colSpan={4} 
                          color="rose"
                          trailingColSpan={1}
                        />
                      );
                    })()}
                  </>
                )}
              </Table.Tbody>
            </Table>
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
              <Pagination pagination={pagination} />
            </div>
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
