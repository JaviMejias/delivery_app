import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import { TableFilters } from '@/components/TableFilters'
import Pagination, { PagyProps } from '@/components/Pagination'
import { Lock, Eye } from 'lucide-react'
import { PaymentBreakdownBadge } from '@/components/Badges/PaymentBreakdownBadge'
import { useExcelExport } from '@/hooks/useExcelExport'

interface Warehouse {
  id: number
  name: string
}

interface LocalClosure {
  id: number
  date: string
  status: string
  system_cash: string
  system_card: string
  system_transfer: string
  system_total: string
  declared_cash: string
  declared_card: string
  declared_transfer: string
  declared_total: string
  warehouse?: { name: string }
}

interface Props {
  closures: LocalClosure[]
  warehouses: Warehouse[]
  filters: any
  pagination: PagyProps
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
}

const getThemeName = () => {
  if (typeof document === 'undefined') return 'indigo';
  const classes = document.documentElement.className + ' ' + document.body.className;
  if (classes.includes('aura-red')) return 'red';
  if (classes.includes('aura-blue')) return 'blue';
  if (classes.includes('aura-amber')) return 'amber';
  if (classes.includes('aura-orange')) return 'orange';
  if (classes.includes('aura-emerald')) return 'emerald';
  if (classes.includes('aura-rose')) return 'rose';
  if (classes.includes('aura-purple')) return 'purple';
  return 'indigo';
}

export default function LocalClosuresIndex({ closures, warehouses, filters, pagination }: Props) {
  const [search, setSearch] = useState(filters?.search || '')
  const [warehouseId, setWarehouseId] = useState(filters?.warehouse_id || '')
  const [startDate, setStartDate] = useState(filters?.start_date || '')
  const [endDate, setEndDate] = useState(filters?.end_date || '')
  const [isLoading, setIsLoading] = useState(false)

  const { handleExcelClick } = useExcelExport()

  const applyFilters = () => {
    setIsLoading(true)
    const url = new URL(window.location.href);
    if (search) url.searchParams.set('search', search); else url.searchParams.delete('search');
    if (warehouseId) url.searchParams.set('warehouse_id', warehouseId); else url.searchParams.delete('warehouse_id');
    if (startDate) url.searchParams.set('start_date', startDate); else url.searchParams.delete('start_date');
    if (endDate) url.searchParams.set('end_date', endDate); else url.searchParams.delete('end_date');
    
    router.get(url.pathname + url.search, {}, { 
      preserveState: true,
      onFinish: () => setIsLoading(false)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters()
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title="Cierres de Caja" />

      <div className="space-y-6">
        <PageHeader 
          title="Historial de Cierres de Caja"
          icon={<Lock className="w-8 h-8 opacity-80" />}
          description="Control y cuadratura diaria de las ventas en el local."
          color="indigo"
        >
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">

            <Link
              href="/sales/local/closures/new"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-primary-500/25 w-full sm:w-auto text-center"
            >
              + Nuevo Cierre de Caja
            </Link>
          </div>
        </PageHeader>

        <TableFilters onApply={applyFilters} isLoading={isLoading}>
          <TableFilters.Search
            label="Buscar por Código"
            value={search}
            onChange={setSearch}
            onSearch={applyFilters}
            placeholder="Ej: CC-0001"
            className="flex-1 min-w-[200px]"
          />
          <TableFilters.Select
            label="Bodega / Local"
            value={warehouseId}
            onChange={setWarehouseId}
            options={[
              { value: '', label: 'Todas' },
              ...warehouses.map((w: any) => ({ value: w.id.toString(), label: w.name }))
            ]}
            className="flex-1 min-w-[200px]"
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
              href={`/sales/local/closures?format=xlsx&search=${search || ''}&warehouse_id=${warehouseId}&start_date=${startDate}&end_date=${endDate}`} 
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
                  <Table.Th>Código</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Local</Table.Th>
                  <Table.Th>Sistema (Desglose)</Table.Th>
                  <Table.Th>Declarado (Desglose)</Table.Th>
                  <Table.Th>Diferencia</Table.Th>
                  <Table.Th className="text-right"></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {closures.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                      No hay cierres de caja que coincidan con los filtros.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  closures.map((closure) => {
                    const system = parseFloat(closure.system_total)
                    const declared = parseFloat(closure.declared_total)
                    const diff = declared - system

                    return (
                      <Table.Tr key={closure.id}>
                        <Table.Td className="font-mono text-[var(--sf-text-muted)]">CC-{closure.id.toString().padStart(4, '0')}</Table.Td>
                        <Table.Td className="font-medium text-[var(--sf-text-main)] whitespace-nowrap">
                          {new Date(closure.date + 'T12:00:00').toLocaleDateString()}
                        </Table.Td>
                        <Table.Td className="text-[var(--sf-text-main)]">{closure.warehouse?.name}</Table.Td>
                        <Table.Td>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-primary-400 font-medium text-sm">{formatCLP(system)}</span>
                            <PaymentBreakdownBadge 
                              cashAmount={closure.system_cash}
                              cardAmount={closure.system_card}
                              transferAmount={closure.system_transfer}
                            />
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[var(--sf-text-main)] font-medium text-sm">{formatCLP(declared)}</span>
                            <PaymentBreakdownBadge 
                              cashAmount={closure.declared_cash}
                              cardAmount={closure.declared_card}
                              transferAmount={closure.declared_transfer}
                            />
                          </div>
                        </Table.Td>
                        <Table.Td>
                          {diff === 0 ? (
                            <span className="text-emerald-400 font-medium">Cuadrado ✓</span>
                          ) : diff > 0 ? (
                            <span className="text-emerald-400 font-medium">+{formatCLP(diff)} (Sobrante)</span>
                          ) : (
                            <span className="text-red-400 font-medium">{formatCLP(diff)} (Faltante)</span>
                          )}
                        </Table.Td>
                        <Table.Td className="text-right">
                          <Link href={`/sales/local/closures/${closure.id}`} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg inline-block transition-colors" title="Ver Detalle">
                            <Eye size={18} />
                          </Link>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })
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
    </AuthenticatedLayout>
  )
}
