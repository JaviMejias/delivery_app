import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import Table from '@/components/Table'
import { TableFilters } from '@/components/TableFilters'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { router } from '@inertiajs/react'
import { Store, Printer, XCircle } from 'lucide-react'
import BoletaTicket from '@/components/BoletaTicket'
import { formatCLP } from '@/utils/formatters'
import { useExcelExport } from '@/hooks/useExcelExport'
import { PaymentBreakdownBadge } from '@/components/Badges/PaymentBreakdownBadge'
import Modal from '@/components/Modal'
import { CustomSelect } from '@/components/CustomSelect'
import Swal from 'sweetalert2'

interface Product {
  id: number
  name: string
  sku: string
}

interface LocalSaleItem {
  id: number
  quantity: number
  returned_empty_quantity: number
  subtotal: string
  voucher_code: string | null
  product: Product
}

interface LocalSale {
  id: number
  date: string
  sale_type: string
  total_revenue: string
  cash_revenue: string
  card_revenue: string
  transfer_revenue: string
  voucher_revenue: string
  card_surcharge: string
  warehouse: { name: string }
  local_sale_items: LocalSaleItem[]
}

interface Props {
  sales: LocalSale[]
  pagination: any
  currentSearch?: string
}



export default function LocalSalesIndex({ sales, pagination, currentSearch }: Props) {
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

  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<LocalSale | null>(null)
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm')
  const [printMode, setPrintMode] = useState<'client' | 'store' | 'both' | 'both_paused'>('client')
  const [forcePrintMode, setForcePrintMode] = useState<'client' | 'store' | null>(null)

  const handlePrint = () => {
    if (printMode === 'both_paused') {
      const onAfterFirstPrint = async () => {
        window.removeEventListener('afterprint', onAfterFirstPrint)

        // Wait a bit for browser to fully recover from print dialog
        setTimeout(async () => {
          const res = await Swal.fire({
            target: document.querySelector('dialog.native-modal[open]') as HTMLElement || document.body,
            title: 'Corte el papel ✂️',
            text: 'Se ha enviado la copia del cliente. Corta el papel en tu impresora térmica y presiona Continuar para enviar la copia de comercio.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '🖨️ Imprimir Copia Comercio',
            cancelButtonText: 'Omitir',
            confirmButtonColor: '#3b82f6',
            background: 'var(--sf-dark-card)',
            color: '#fff'
          })

          if (res.isConfirmed) {
            setForcePrintMode('store')
            setTimeout(() => {
              const onAfterSecondPrint = () => {
                window.removeEventListener('afterprint', onAfterSecondPrint)
                setForcePrintMode(null)
              }
              window.addEventListener('afterprint', onAfterSecondPrint)
              window.print()
            }, 500)
          }
        }, 300)
      }

      window.addEventListener('afterprint', onAfterFirstPrint)
      window.print()
    } else {
      window.print()
    }
  }

  const pageTotal = sales.reduce((acc, sale) => acc + parseFloat(sale.total_revenue || '0'), 0)
  const pageCash = sales.reduce((acc, sale) => acc + parseFloat(sale.cash_revenue || '0'), 0)
  const pageCard = sales.reduce((acc, sale) => acc + parseFloat(sale.card_revenue || '0'), 0)
  const pageTransfer = sales.reduce((acc, sale) => acc + parseFloat(sale.transfer_revenue || '0'), 0)

  const { getThemeName, handleExcelClick } = useExcelExport();

  return (
    <AuthenticatedLayout>
      <Head title="Historial de Ventas Locales" />

      <div className="space-y-6">
        <PageHeader
          title="Ventas en Local (Bodega)"
          icon={<Store className="w-8 h-8 opacity-80" />}
          description="Historial de ventas realizadas directamente a clientes en la planta."
          color="indigo"
        >
          <div className="flex gap-3">
            <Link
              href="/sales/local/pos"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-[var(--sf-text-main)] font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-colors shadow-lg shadow-primary-500/25 flex items-center gap-2"
            >
              🛒 Abrir Punto de Venta
            </Link>
          </div>
        </PageHeader>
        <TableFilters onApply={applyFilters} isLoading={isLoading}>
          <TableFilters.Search
            value={search}
            onChange={setSearch}
            onSearch={applyFilters}
            placeholder="Buscar por ID o Bodega..."
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
          <div className="flex items-center ml-2 border-l border-[var(--sf-border)] pl-4">
            <a
              href={`/sales/local?format=xlsx&search=${search || ''}&start_date=${startDate}&end_date=${endDate}`}
              onClick={handleExcelClick}
              className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors h-[42px] flex items-center justify-center"
            >
              ⬇️ EXCEL
            </a>
          </div>
        </TableFilters>
        <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código</Table.Th>
                <Table.Th className="hidden md:table-cell">Bodega</Table.Th>
                <Table.Th className="hidden md:table-cell">Fecha</Table.Th>
                <Table.Th>Detalle de Venta</Table.Th>
                <Table.Th className="text-right hidden lg:table-cell">Desglose de Pago</Table.Th>
                <Table.Th className="text-right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sales.length === 0 ? (
                <Table.Empty
                  title="No hay ventas locales"
                  description="No se encontraron ventas registradas en este período."
                  colSpan={6}
                />
              ) : (
                sales.map((sale) => (
                  <Table.Tr key={sale.id}>
                    <Table.Td className="align-top">
                      <div className="font-bold text-[var(--sf-text-main)] text-lg">VTA-{sale.id.toString().padStart(4, '0')}</div>
                      <div className="mt-1 text-[10px] uppercase text-primary-400 font-bold mb-2">
                        {sale.sale_type === 'warehouse' ? 'P. Bodega' : 'P. Mayorista'}
                      </div>
                      <button
                        onClick={() => setSelectedSaleForTicket(sale)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 font-medium rounded-lg transition-colors text-xs"
                      >
                        <Printer size={14} /> Ver Ticket
                      </button>

                      <div className="md:hidden mt-3 text-xs text-[var(--sf-text-muted)] space-y-1">
                        <p>Bodega: {sale.warehouse.name}</p>
                        <p>Fecha: {sale.date.split('-').reverse().join('-')}</p>
                      </div>
                    </Table.Td>
                    <Table.Td className="align-top hidden md:table-cell">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-[var(--sf-bg)] border border-[var(--sf-border)] text-xs text-[var(--sf-text-muted)]">
                        {sale.warehouse.name}
                      </span>
                    </Table.Td>
                    <Table.Td className="align-top hidden md:table-cell">
                      <div className="text-sm text-[var(--sf-text-main)]">{sale.date.split('-').reverse().join('-')}</div>
                    </Table.Td>
                    <Table.Td className="align-top">
                      <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar pr-2">
                        {sale.local_sale_items.map(item => (
                          <div key={item.id} className="text-xs">
                            <span className="font-bold text-primary-400">{item.quantity}x</span>{' '}
                            <span className="text-[var(--sf-text-main)]">{item.product.name}</span>
                            {item.returned_empty_quantity > 0 && (
                              <span className="text-[var(--sf-text-muted)] ml-2">
                                (Recibió {item.returned_empty_quantity} vacíos)
                              </span>
                            )}
                            {item.voucher_code && (
                              <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono text-[10px]">
                                VALE: {item.voucher_code}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </Table.Td>
                    <Table.Td className="align-top text-right text-xs text-[var(--sf-text-muted)] hidden lg:table-cell">
                      <PaymentBreakdownBadge
                        cashAmount={sale.cash_revenue}
                        cardAmount={sale.card_revenue}
                        transferAmount={sale.transfer_revenue}
                        className="items-end"
                      />
                    </Table.Td>
                    <Table.Td className="align-top text-right font-black text-emerald-400 text-lg">
                      {formatCLP(sale.total_revenue)}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
              {sales.length > 0 && (
                <Table.Tr className="bg-primary-500/5 border-t-2 border-primary-500/20">
                  <Table.Td colSpan={4} className="text-right font-bold text-primary-400 py-4 hidden lg:table-cell">
                    TOTALES VISIBLES:
                  </Table.Td>
                  <Table.Td colSpan={2} className="text-right font-bold text-primary-400 py-4 md:hidden">
                    TOTALES:
                  </Table.Td>
                  <Table.Td colSpan={3} className="text-right font-bold text-primary-400 py-4 hidden md:table-cell lg:hidden">
                    TOTALES:
                  </Table.Td>
                  <Table.Td className="text-right align-top hidden lg:table-cell">
                    <PaymentBreakdownBadge
                      cashAmount={pageCash}
                      cardAmount={pageCard}
                      transferAmount={pageTransfer}
                      className="items-end font-bold"
                    />
                  </Table.Td>
                  <Table.Td className="text-right text-lg font-black text-primary-500 align-middle">
                    {formatCLP(pageTotal)}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          {pagination && pagination.pages > 1 && (
            <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
              <Pagination pagination={pagination} />
            </div>
          )}
        </div>
      </div>

      {/* Modal for Boleta Ticket */}
      <Modal
        show={!!selectedSaleForTicket}
        onClose={() => setSelectedSaleForTicket(null)}
        maxWidth="max-w-lg"
        title={
          <>
            <Printer className="w-5 h-5 text-primary-400" />
            Ticket de Venta
          </>
        }
      >
        <div className="flex flex-col -m-6 max-h-[calc(100vh-8rem)]">
          <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)] flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <CustomSelect
                options={[
                  { value: 'client', label: 'Solo Cliente' },
                  { value: 'store', label: 'Solo Comercio' },
                  { value: 'both', label: 'Ambas (Tira Continua)' },
                  { value: 'both_paused', label: 'Ambas (Pausa / Cortar)' }
                ]}
                value={{
                  value: printMode,
                  label: printMode === 'both' ? 'Ambas (Continuo)' :
                    printMode === 'both_paused' ? 'Ambas (Pausa)' :
                      printMode === 'client' ? 'Solo Cliente' : 'Solo Comercio'
                }}
                onChange={(val: any) => setPrintMode(val.value)}
                isSearchable={false}
              />
            </div>
            <div className="flex-1">
              <CustomSelect
                options={[
                  { value: '80mm', label: '80mm' },
                  { value: '58mm', label: '58mm' }
                ]}
                value={{ value: paperSize, label: paperSize }}
                onChange={(val: any) => setPaperSize(val.value)}
                isSearchable={false}
              />
            </div>
          </div>
          <div className="p-6 overflow-y-auto flex-1 bg-[var(--sf-bg)] flex justify-center custom-scrollbar">
            {selectedSaleForTicket && <BoletaTicket sale={selectedSaleForTicket} paperSize={paperSize} printMode={forcePrintMode || (printMode === 'both_paused' ? 'client' : printMode)} />}
          </div>

          <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)] shrink-0 flex gap-3">
            <button
              onClick={() => setSelectedSaleForTicket(null)}
              className="flex-1 py-2.5 bg-[var(--sf-surface)] hover:bg-[var(--sf-border)] border border-[var(--sf-border)] text-[var(--sf-text-main)] font-semibold rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Imprimir Ticket
            </button>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  )
}
