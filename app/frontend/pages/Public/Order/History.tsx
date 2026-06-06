import React, { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Clock, Package, CheckCircle, Truck, XCircle, ChevronRight, LogOut, Calendar, Navigation, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PublicHeader from '@/components/PublicOrder/PublicHeader'
import Swal from 'sweetalert2'
import Flatpickr from 'react-flatpickr'
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect'
import 'flatpickr/dist/plugins/monthSelect/style.css'
import { Spanish } from 'flatpickr/dist/l10n/es'
import CustomerLayout from '@/layouts/CustomerLayout'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function History({ company, current_customer, orders, pagination, filters }: any) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente', color: 'text-orange-400', bg: 'bg-orange-400/10' }
      case 'accepted': return { label: 'Aceptado', color: 'text-primary-400', bg: 'bg-primary-400/10' }
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
      default: return <Truck className="w-5 h-5 text-primary-400" />
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
    <div className="flex-1 flex flex-col relative text-slate-200">
      <Head title={`Mis Pedidos - ${company.name}`} />

      <div className="w-full mx-auto z-10 p-4 sm:p-6 pb-2">
        <PublicHeader company={company} current_customer={current_customer} />
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <Link href={`/order/${company.slug}`} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">Mis Pedidos</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Historial de {current_customer.first_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 transition-all cursor-pointer">
          <Calendar className="w-4 h-4 text-orange-400" />
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

      <div className="w-full mx-auto z-10 flex flex-col gap-6 p-4 sm:p-6">
        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-white/5 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-6 shadow-inner border border-white/5 relative z-10">
              <Package className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 relative z-10">Aún no tienes pedidos</h3>
            <p className="text-slate-400 mb-8 max-w-md relative z-10 leading-relaxed">Tu historial está vacío por ahora. ¡Anímate a realizar tu primer pedido y disfruta del mejor servicio!</p>
            <Link href={`/order/${company.slug}`} className="relative z-10 group overflow-hidden px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-400 group-hover:animate-spin" />
              <span>Hacer un pedido ahora</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6"
          >
            {orders.map((order: any) => {
              const statusDisplay = getStatusDisplay(order.status)

              return (
                <motion.div variants={itemVariants} key={order.id} className="relative bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-6 flex flex-col justify-between gap-5 transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.15] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] group overflow-hidden">
                  {/* Premium Glowing Accent */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary-500/30 transition-colors duration-500" />
                  
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg ${statusDisplay.bg} border border-white/[0.05] group-hover:scale-[1.05] transition-transform duration-500 ease-out`}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm ${statusDisplay.bg} ${statusDisplay.color} border border-${statusDisplay.color.split('-')[1]}-500/20 backdrop-blur-md`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.color.replace('text-', 'bg-')} animate-pulse`} />
                          {statusDisplay.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium tracking-wide">
                          <Clock className="w-3 h-3 opacity-50" />
                          {new Date(order.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {order.total_price > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Monto Total</p>
                        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 drop-shadow-sm">${order.total_price.toLocaleString('es-CL')}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex-1 flex flex-col justify-center relative z-10 group-hover:bg-black/50 transition-colors duration-500">
                    {order.details?.quick_order ? (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-300 text-sm italic leading-relaxed pt-1.5">"{order.details.quick_order}"</p>
                      </div>
                    ) : (
                      <div className="space-y-2 w-full">
                        {order.details.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-2.5 rounded-xl border border-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0 shadow-inner">
                                <span className="font-black text-primary-400 text-[10px]">{item.quantity}</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-200 line-clamp-1">{item.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-3 relative z-10 border-t border-white/5 mt-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 flex justify-center items-center gap-1.5 text-rose-300 hover:text-white font-bold text-xs sm:text-sm bg-rose-500/10 hover:bg-rose-500 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all duration-300 border border-rose-500/20 hover:border-rose-500 hover:shadow-[0_0_20px_rgba(243,24,96,0.3)] active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Cancelar</span>
                      </button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <Link
                        href={`/order/${company.slug}/track/${order.order_token}`}
                        className="flex-1 flex justify-center items-center gap-1.5 text-primary-300 hover:text-white font-bold text-xs sm:text-sm bg-primary-500/10 hover:bg-primary-500 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all duration-300 border border-primary-500/20 hover:border-primary-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95"
                      >
                        <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Rastrear</span>
                      </Link>
                    )}
                    <Link
                      href={`/order/${company.slug}?reorder=${order.order_token}`}
                      className="flex-1 flex justify-center items-center gap-1.5 text-slate-300 hover:text-white font-bold text-xs sm:text-sm bg-white/5 hover:bg-white/10 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all duration-300 border border-white/5 hover:border-white/20 active:scale-95"
                    >
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70" />
                      <span>Repetir</span>
                    </Link>
                  </div>
                </motion.div>
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
          </motion.div>
        )}
      </div>
    </div>
  )
}

History.layout = (page: any) => <CustomerLayout>{page}</CustomerLayout>
