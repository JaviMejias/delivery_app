import { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { router } from '@inertiajs/react'
import { Store, Printer, XCircle } from 'lucide-react'
import BoletaTicket from '@/components/BoletaTicket'

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
  warehouse: { name: string }
  local_sale_items: LocalSaleItem[]
}

interface Props {
  sales: LocalSale[]
  pagination: any
  currentSearch?: string
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
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

  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<LocalSale | null>(null)
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm')

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
            href="/sales/local/closures"
            className="px-5 py-2.5 bg-[var(--sf-bg)] text-[var(--sf-text-main)] font-medium rounded-xl border border-[var(--sf-border)] hover:bg-[var(--sf-surface)] transition-colors flex items-center gap-2"
          >
            🔒 Cierres de Caja
          </Link>
          <Link
            href="/sales/local/pos"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-[var(--sf-text-main)] font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-colors shadow-lg shadow-emerald-500/25 flex items-center gap-2"
          >
            🛒 Abrir Punto de Venta
          </Link>
        </div>
        </PageHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center bg-[var(--sf-surface)] border border-[var(--sf-border)] p-4 rounded-xl gap-4 flex-wrap">
          <div className="w-full sm:w-auto flex items-center gap-2">
            <SearchBar routeName="/sales/local" currentSearch={currentSearch || ""} placeholder="Buscar por ID o Bodega..." />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-[var(--sf-text-muted)] min-w-[50px] sm:min-w-0">Desde:</span>
                <div className="flex-1 sm:w-36">
                  <CustomDatePicker value={startDate} onChange={(val) => {
                    setStartDate(val)
                    const url = new URL(window.location.href);
                    if (val) url.searchParams.set('start_date', val); else url.searchParams.delete('start_date');
                    router.get(url.pathname + url.search, {}, { preserveState: true });
                  }} />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-[var(--sf-text-muted)] min-w-[50px] sm:min-w-0">Hasta:</span>
                <div className="flex-1 sm:w-36">
                  <CustomDatePicker value={endDate} onChange={(val) => {
                    setEndDate(val)
                    const url = new URL(window.location.href);
                    if (val) url.searchParams.set('end_date', val); else url.searchParams.delete('end_date');
                    router.get(url.pathname + url.search, {}, { preserveState: true });
                  }} />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0 sm:border-l border-[var(--sf-border)] sm:pl-4 w-full sm:w-auto mt-1 sm:mt-0">
              <a href={`/sales/local?format=xlsx&search=${currentSearch || ''}&start_date=${startDate}&end_date=${endDate}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors text-center">
                ⬇️ EXCEL
              </a>
            </div>
          </div>
        </div>
        <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--sf-bg)] text-[var(--sf-text-muted)] border-b border-[var(--sf-border)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Código</th>
                  <th className="px-6 py-4 font-medium">Bodega</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Detalle de Venta</th>
                  <th className="px-6 py-4 font-medium text-right">Desglose de Pago</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sf-dark-border)]">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                      <div className="text-4xl mb-3 opacity-50">🏪</div>
                      No hay ventas locales registradas en este período.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-[var(--sf-text-main)] text-lg">VTA-{sale.id.toString().padStart(4, '0')}</div>
                        <div className="mt-1 text-[10px] uppercase text-indigo-400 font-bold mb-2">
                          {sale.sale_type === 'warehouse' ? 'P. Bodega' : 'P. Mayorista'}
                        </div>
                        <button 
                          onClick={() => setSelectedSaleForTicket(sale)} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium rounded-lg transition-colors text-xs"
                        >
                          <Printer size={14} /> Ver Ticket
                        </button>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-[var(--sf-bg)] border border-[var(--sf-border)] text-xs text-[var(--sf-text-muted)]">
                          {sale.warehouse.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="text-sm text-[var(--sf-text-main)]">{sale.date.split('-').reverse().join('-')}</div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-2">
                          {sale.local_sale_items.map(item => (
                            <div key={item.id} className="text-xs">
                              <span className="font-bold text-indigo-400">{item.quantity}x</span>{' '}
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
                      </td>
                      <td className="px-6 py-4 align-top text-right text-xs text-[var(--sf-text-muted)]">
                        {parseFloat(sale.cash_revenue) > 0 && <div>Efectivo: <span className="text-emerald-400 font-medium">{formatCLP(sale.cash_revenue)}</span></div>}
                        {parseFloat(sale.card_revenue) > 0 && <div>Tarjeta: <span className="text-blue-400 font-medium">{formatCLP(sale.card_revenue)}</span></div>}
                        {parseFloat(sale.transfer_revenue) > 0 && <div>Transf: <span className="text-purple-400 font-medium">{formatCLP(sale.transfer_revenue)}</span></div>}
                      </td>
                      <td className="px-6 py-4 align-top text-right font-black text-emerald-400 text-lg">
                        {formatCLP(sale.total_revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
            <Pagination pagination={pagination} />
          </div>
        </div>
      </div>

      {/* Modal for Boleta Ticket */}
      {selectedSaleForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)] shrink-0">
              <h3 className="text-lg font-semibold text-[var(--sf-text-main)] flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                Ticket de Venta
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-[var(--sf-bg)] rounded-lg p-1 border border-[var(--sf-border)]">
                  <button
                    onClick={() => setPaperSize('80mm')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${paperSize === '80mm' ? 'bg-indigo-500 text-white shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
                  >
                    80mm
                  </button>
                  <button
                    onClick={() => setPaperSize('58mm')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${paperSize === '58mm' ? 'bg-indigo-500 text-white shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
                  >
                    58mm
                  </button>
                </div>
                
                <button onClick={() => setSelectedSaleForTicket(null)} className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[var(--sf-bg)] flex justify-center custom-scrollbar">
              <BoletaTicket sale={selectedSaleForTicket} paperSize={paperSize} />
            </div>

            <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)] shrink-0 flex gap-3">
              <button
                onClick={() => setSelectedSaleForTicket(null)}
                className="flex-1 py-2.5 bg-[var(--sf-surface)] hover:bg-[var(--sf-border)] border border-[var(--sf-border)] text-[var(--sf-text-main)] font-semibold rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
