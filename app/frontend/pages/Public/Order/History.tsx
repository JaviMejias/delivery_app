import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Clock, Package, CheckCircle, Truck, XCircle, ChevronRight, LogOut, Calendar, Navigation } from 'lucide-react'
import PublicHeader from '@/components/PublicOrder/PublicHeader'
import Swal from 'sweetalert2'
import Flatpickr from 'react-flatpickr'
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect'
import 'flatpickr/dist/plugins/monthSelect/style.css'
import { Spanish } from 'flatpickr/dist/l10n/es'

export default function History({ company, current_customer, orders, pagination, filters }: any) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente', color: 'text-orange-400', bg: 'bg-orange-400/10' }
      case 'accepted': return { label: 'Aceptado', color: 'text-indigo-400', bg: 'bg-indigo-400/10' }
      case 'in_transit': return { label: 'En Camino', color: 'text-blue-400', bg: 'bg-blue-400/10' }
      case 'nearby': return { label: 'Cerca', color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' }
      case 'arrived': return { label: 'En Puerta', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
      case 'completed': return { label: 'Entregado', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
      case 'cancelled': return { label: 'Cancelado', color: 'text-rose-400', bg: 'bg-rose-400/10' }
      default: return { label: status, color: 'text-slate-400', bg: 'bg-slate-800' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'cancelled': return <XCircle className="w-5 h-5 text-rose-400" />
      default: return <Truck className="w-5 h-5 text-indigo-400" />
    }
  }

  const currentMonthDate = new Date(filters?.year || new Date().getFullYear(), (filters?.month || new Date().getMonth() + 1) - 1, 1)

  const handleDateChange = (dates: Date[]) => {
    if (dates.length > 0) {
      const date = dates[0]
      router.get(`/order/${company.slug}/history`, { month: date.getMonth() + 1, year: date.getFullYear() }, { preserveState: true })
    }
  }

  const handlePageChange = (page: number) => {
    router.get(`/order/${company.slug}/history`, { month: filters?.month, year: filters?.year, page }, { preserveState: true })
  }

  const handleCancelOrder = async (orderId: number) => {
    const cancellations = current_customer?.cancellations_in_last_24h || 0
    const text = cancellations > 0
      ? `Has cancelado ${cancellations} pedidos hoy. Recuerda que al llegar a 3 serás bloqueado por 24h.`
      : 'No podrás revertir esta acción.'

    const result = await Swal.fire({
      title: '¿Cancelar Pedido?',
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      background: '#0f172a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/order/${company.slug}/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        })
        const data = await response.json()
        if (data.success) {
          Swal.fire({ title: 'Cancelado', text: data.message, icon: 'success', background: '#0f172a', color: '#fff' })
          router.reload({ only: ['orders'] })
        } else {
          Swal.fire({ title: 'Error', text: data.error || 'No se pudo cancelar', icon: 'error', background: '#0f172a', color: '#fff' })
        }
      } catch (e) {
        Swal.fire({ title: 'Error', text: 'Hubo un problema de conexión', icon: 'error', background: '#0f172a', color: '#fff' })
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center px-4 py-8 relative overflow-hidden text-slate-200">
      <Head title={`Mis Pedidos - ${company.name}`} />

      <div className="w-full mx-auto z-10 flex flex-col gap-6">
        <PublicHeader company={company} current_customer={current_customer} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-white">Mis Pedidos</h1>
            <p className="text-slate-400 mt-1">Historial de compras de {current_customer.first_name}</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500/50 transition-all">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Flatpickr
              value={currentMonthDate}
              onChange={handleDateChange}
              options={{
                locale: Spanish,
                disableMobile: true,
                plugins: [
                  new (monthSelectPlugin as any)({
                    shorthand: true,
                    dateFormat: "m-Y",
                    altFormat: "F Y",
                    theme: "dark"
                  })
                ]
              }}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer w-24 text-center placeholder-slate-400"
              placeholder="Mes-Año"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
            <Package className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Aún no tienes pedidos</h3>
            <p className="text-slate-400 mb-6">No encontramos pedidos en este mes para {company.name}.</p>
            <Link href={`/order/${company.slug}`} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors">
              Hacer un nuevo pedido
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {orders.map((order: any) => {
              const statusDisplay = getStatusDisplay(order.status)

              return (
                <div key={order.id} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col justify-between gap-4 transition-all hover:bg-slate-800/60 hover:border-white/10 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${statusDisplay.bg}`}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-1.5 ${statusDisplay.bg} ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(order.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {order.total_price > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
                        <p className="text-base font-black text-emerald-400">${order.total_price.toLocaleString('es-CL')}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex-1 flex items-center">
                    {order.details?.quick_order ? (
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <p className="font-medium text-slate-300 text-sm italic">"{order.details.quick_order}"</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 w-full">
                        {order.details.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                              <span className="font-black text-indigo-400 text-xs">{item.quantity}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-200 line-clamp-1">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 flex justify-center items-center gap-1.5 text-rose-400 hover:text-white font-bold text-sm bg-rose-500/10 hover:bg-rose-500 px-4 py-2.5 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <Link
                        href={`/order/${company.slug}/track/${order.order_token}`}
                        className="flex-1 flex justify-center items-center gap-1.5 text-indigo-400 hover:text-white font-bold text-sm bg-indigo-500/10 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all"
                      >
                        <Navigation className="w-4 h-4" />
                        Ver Mapa
                      </Link>
                    )}
                    <Link
                      href={`/order/${company.slug}?reorder=${order.order_token}`}
                      className="flex-1 flex justify-center items-center gap-1.5 text-slate-300 hover:text-white font-bold text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-all"
                    >
                      Repetir Pedido
                    </Link>
                  </div>
                </div>
              )
            })}

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                {pagination.prev && (
                  <button onClick={() => handlePageChange(pagination.prev)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-white transition-colors">
                    Anterior
                  </button>
                )}
                <span className="text-sm font-medium text-slate-400 px-4">
                  Página {pagination.page} de {pagination.pages}
                </span>
                {pagination.next && (
                  <button onClick={() => handlePageChange(pagination.next)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-white transition-colors">
                    Siguiente
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
