import { useState, useEffect, useRef } from 'react'
import { Head, router } from '@inertiajs/react'
import { useActionCable } from '@/hooks/useActionCable'
import Swal from 'sweetalert2'
import { MapPin, Truck as TruckIcon, CheckCircle, Package, Clock, Users, Bell, Navigation } from 'lucide-react'
import PublicHeader from '@/components/PublicOrder/PublicHeader'

interface TrackingProps {
  company: {
    id: number
    slug: string
    name: string
    phone: string
  }
  current_customer?: any
  order: {
    id: number
    order_token: string
    status: string
    client_name: string
    address: string
    latitude: number
    longitude: number
    summary: string
    available_trucks_count: number
    truck: {
      latitude: number
      longitude: number
      plate_number: string
      driver_name: string
      route_points?: [number, number][] | null
      departure_time?: string | null
    } | null
  }
}

export default function Tracking({ company, current_customer, order: initialOrder }: TrackingProps) {
  const [order, setOrder] = useState(initialOrder)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isTopExpanded, setIsTopExpanded] = useState(true)
  const [isBottomExpanded, setIsBottomExpanded] = useState(true)
  const mapRef = useRef<any>(null)
  const truckMarkerRef = useRef<any>(null)
  const routePolylineRef = useRef<any>(null)

  
  const statusConfig = {
    pending:    { label: 'Buscando Repartidor',  sublabel: 'Asignando el chofer más cercano...', color: 'text-amber-400',   bg: 'bg-amber-500/20',   icon: TruckIcon,   pulse: true  },
    accepted:   { label: 'En Preparación',        sublabel: 'El repartidor está preparando tu pedido', color: 'text-sky-400',     bg: 'bg-sky-500/20',     icon: Clock,       pulse: false },
    in_transit: { label: 'En Camino',             sublabel: 'El repartidor viene hacia ti',       color: 'text-indigo-400',  bg: 'bg-indigo-500/20',  icon: Navigation,  pulse: true  },
    nearby:     { label: '¡Está Cerca!',          sublabel: 'El repartidor está a menos de 500m', color: 'text-orange-400',  bg: 'bg-orange-500/20',  icon: Bell,        pulse: true  },
    arrived:    { label: '¡Llegó tu Pedido!',     sublabel: 'El repartidor está en tu puerta',    color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle, pulse: true  },
    completed:  { label: '¡Entregado!',           sublabel: 'Gracias por tu compra',              color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle, pulse: false },
    cancelled:  { label: 'Cancelado',             sublabel: 'Este pedido fue cancelado',          color: 'text-rose-400',    bg: 'bg-rose-500/20',    icon: TruckIcon,   pulse: false }
  }
  const currentStatus = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = currentStatus.icon

  
  useEffect(() => {
    if (order.status !== 'accepted' || !order.truck?.departure_time) {
      setCountdown(null)
      return
    }

    const tick = () => {
      const diff = Math.max(0, Math.ceil((new Date(order.truck!.departure_time!).getTime() - Date.now()) / 1000))
      setCountdown(diff)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [order.status, order.truck?.departure_time])

  
  useEffect(() => {
    if (order && order.status !== 'completed' && order.status !== 'cancelled' && isTopExpanded) {
      const timer = setTimeout(() => setIsTopExpanded(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [order?.status, isTopExpanded])

  
  useActionCable({ channel: 'TrackingChannel', token: order.order_token }, (payload) => {
    if (payload.action === 'truck_moved') {
      if (order.status !== 'completed' && order.status !== 'cancelled') {
        setOrder(prev => ({
          ...prev,
          truck: { ...prev.truck!, latitude: payload.latitude, longitude: payload.longitude }
        }))
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setLatLng([payload.latitude, payload.longitude])
        }
      }
    } else if (payload.action === 'status_changed') {
      setOrder(prev => {
        
        let newTruck = prev.truck
        if (payload.truck === null) {
          newTruck = null
        } else if (payload.truck !== undefined) {
          newTruck = { ...(prev.truck || {}), ...payload.truck } as any
        }

        if (payload.status === 'pending' && (prev.status === 'accepted' || prev.status === 'in_transit')) {
          Swal.fire({
            icon: 'warning', title: 'Buscando nuevo repartidor',
            text: 'El repartidor tuvo un inconveniente. Tu pedido sigue activo y será reasignado muy pronto.',
            background: '#0f172a', color: 'white', confirmButtonColor: '#f97316'
          })
        }
        return { ...prev, status: payload.status, truck: newTruck }
      })

      if (payload.status === 'accepted') {
        Swal.fire({
          icon: 'info', title: '¡Repartidor Asignado!',
          text: `Tu pedido está siendo preparado por ${payload.truck?.driver_name || 'nuestro chofer'}.`,
          background: '#0f172a', color: 'white', confirmButtonColor: '#f97316'
        })
      } else if (payload.status === 'in_transit') {
        Swal.fire({
          icon: 'info', title: '¡Tu pedido viene en camino! 🚛',
          text: 'El repartidor ya salió hacia tu dirección.',
          background: '#0f172a', color: 'white', confirmButtonColor: '#6366f1',
          timer: 3000, showConfirmButton: false
        })
      } else if (payload.status === 'nearby') {
        
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        Swal.fire({
          icon: 'info', title: '¡Ya está cerca! 🔔',
          text: 'Tu repartidor está a menos de 500 metros. ¡Prepárate para recibir tu pedido!',
          background: '#0f172a', color: 'white', confirmButtonColor: '#f97316',
          timer: 5000, showConfirmButton: false
        })
      } else if (payload.status === 'arrived') {
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300])
        Swal.fire({
          icon: 'success', title: '¡Llegó tu pedido! 🎉',
          text: '¡El repartidor está en tu puerta! Por favor recibe tu pedido.',
          background: '#0f172a', color: 'white', confirmButtonColor: '#10b981',
          timer: 6000, showConfirmButton: false
        })
      } else if (payload.status === 'completed') {
        Swal.fire({
          icon: 'success', title: '¡Pedido Entregado! 🎊',
          text: `Gracias por preferir ${company.name}. ¡Hasta la próxima!`,
          background: '#0f172a', color: 'white', confirmButtonColor: '#10b981',
          timer: 4000, showConfirmButton: false
        }).then(() => {
          localStorage.removeItem(`last_order_token_${company.slug}`)
          window.location.href = `/order/${company.slug}`
        })
      }
    }
  })

  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadLeaflet = () => {
      if ((window as any).L) { initMap(); return }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => initMap()
      document.body.appendChild(script)
    }
    loadLeaflet()
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  const initMap = () => {
    const L = (window as any).L
    if (!L || mapRef.current) return

    const customerPos: [number, number] = [order.latitude, order.longitude]
    mapRef.current = L.map('tracking-map', { zoomControl: false, attributionControl: false }).setView(customerPos, 14)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapRef.current)

    
    const customerIcon = L.divIcon({
      className: '',
      html: `<div class="flex flex-col items-center">
        <div class="w-10 h-10 rounded-full bg-rose-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="mt-1 px-2 py-0.5 bg-rose-950 border border-rose-500/30 rounded text-[10px] font-black text-rose-300">Tu Casa</div>
      </div>`,
      iconSize: [40, 60], iconAnchor: [20, 50]
    })
    L.marker(customerPos, { icon: customerIcon }).addTo(mapRef.current)
  }

  const handleCancelOrder = async () => {
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
        const response = await fetch(`/order/${company.slug}/orders/${order.id}/cancel`, {
          method: 'POST',
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        })
        const data = await response.json()
        if (data.success) {
          Swal.fire({ title: 'Cancelado', text: data.message, icon: 'success', background: '#0f172a', color: '#fff' })
          router.visit(`/order/${company.slug}/history`)
        } else {
          Swal.fire({ title: 'Error', text: data.error || 'No se pudo cancelar', icon: 'error', background: '#0f172a', color: '#fff' })
        }
      } catch (e) {
        Swal.fire({ title: 'Error', text: 'Hubo un problema de conexión', icon: 'error', background: '#0f172a', color: '#fff' })
      }
    }
  }

  
  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapRef.current) return

    if (!order.truck?.latitude) {
      if (truckMarkerRef.current) { truckMarkerRef.current.remove(); truckMarkerRef.current = null }
      if (routePolylineRef.current) { routePolylineRef.current.remove(); routePolylineRef.current = null }
      return
    }

    const truckPos: [number, number] = [order.truck.latitude, order.truck.longitude]

    
    if (order.truck.route_points && order.truck.route_points.length > 1) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(order.truck.route_points)
      } else {
        routePolylineRef.current = L.polyline(order.truck.route_points, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.8,
          dashArray: order.status === 'accepted' ? '8 8' : null,
        }).addTo(mapRef.current)
      }
    }

    if (truckMarkerRef.current) {
      truckMarkerRef.current.setLatLng(truckPos)
    } else {
      const truckIcon = L.divIcon({
        className: '',
        html: `<div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-indigo-500 border-2 border-white shadow-xl shadow-indigo-500/50 flex items-center justify-center text-white animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10a2 2 0 0 0 2 2z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          </div>
          <div class="mt-1 px-2 py-0.5 bg-indigo-950 border border-indigo-500/30 rounded text-[10px] font-black text-indigo-300 truncate max-w-[80px]">
            ${order.truck.plate_number}
          </div>
        </div>`,
        iconSize: [50, 70], iconAnchor: [25, 50]
      })
      truckMarkerRef.current = L.marker(truckPos, { icon: truckIcon }).addTo(mapRef.current)

      
      const customerPos: [number, number] = [order.latitude, order.longitude]
      mapRef.current.fitBounds(L.latLngBounds([customerPos, truckPos]), { padding: [60, 60], maxZoom: 16 })
    }
  }, [order.truck?.latitude, order.truck?.longitude, order.status])

  return (
    <div className="h-[100dvh] w-full bg-slate-950 flex flex-col font-sans overflow-hidden relative">
      <Head title={`Rastreo de Pedido | ${company.name}`} />

      <div className="absolute top-4 left-4 right-4 z-[2000] shrink-0 pointer-events-none">
        <PublicHeader company={company} current_customer={current_customer} />
      </div>

      {}
      <div className="flex-1 relative bg-slate-900">
        <div id="tracking-map" className="absolute inset-0 z-0" />

        {}
        <div className="absolute top-[90px] sm:top-[100px] left-4 right-4 z-[1000] pointer-events-none">
          <div className="mx-auto flex justify-end flex-col items-end">
            {isTopExpanded ? (
              <div 
                className={`w-full bg-slate-950/90 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl transition-all duration-500 cursor-pointer pointer-events-auto ${
                  order.status === 'nearby'  ? 'border-orange-500/40 shadow-orange-500/10' :
                  order.status === 'arrived' ? 'border-emerald-500/40 shadow-emerald-500/20' :
                  'border-white/10'
                }`}
                onClick={() => setIsTopExpanded(false)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${currentStatus.bg} ${currentStatus.pulse ? 'animate-pulse' : ''}`}>
                    <StatusIcon className={`w-5 h-5 ${currentStatus.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</p>
                    <p className={`text-base font-black truncate ${currentStatus.color}`}>{currentStatus.label}</p>
                    {order.status === 'accepted' && countdown !== null && countdown > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        Saliendo en <span className="text-sky-400 font-black tabular-nums">{countdown}s</span>
                      </p>
                    )}
                    {order.status === 'accepted' && countdown === 0 && (
                      <p className="text-xs text-sky-400 mt-0.5 font-bold animate-pulse">¡El repartidor está saliendo!</p>
                    )}
                    {order.status !== 'accepted' && currentStatus.sublabel && (
                      <p className={`text-xs mt-0.5 font-medium ${
                        order.status === 'nearby' ? 'text-orange-300' :
                        order.status === 'arrived' ? 'text-emerald-300 font-bold' :
                        'text-slate-400'
                      }`}>{currentStatus.sublabel}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsTopExpanded(true)}
                className="flex items-center justify-center gap-2 p-2.5 px-4 rounded-full border shadow-xl backdrop-blur-xl bg-slate-900/90 border-white/10 hover:bg-slate-800 transition-all active:scale-95 pointer-events-auto"
              >
                <div className={`w-5 h-5 flex items-center justify-center ${currentStatus.pulse ? 'animate-pulse' : ''}`}>
                  <StatusIcon className={`w-4 h-4 ${currentStatus.color}`} />
                </div>
                <span className={`text-xs font-black truncate ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>

      {}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-[50] bg-slate-950/95 backdrop-blur-2xl rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
          isBottomExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'
        }`}
      >
        {/* Banner atado al borde superior del panel */}
        {order.status === 'pending' && (
          <div className="absolute bottom-full left-4 right-4 mb-4 flex justify-center pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2.5 pointer-events-auto">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              {order.available_trucks_count > 0 ? (
                <p className="text-xs font-bold text-white">Repartidores disponibles</p>
              ) : (
                <p className="text-xs font-bold text-slate-400">Repartidores ocupados temporalmente</p>
              )}
            </div>
          </div>
        )}

        <button 
          className="w-full h-14 shrink-0 flex justify-center items-center cursor-pointer hover:bg-white/5 rounded-t-[2rem] transition-colors"
          onClick={() => setIsBottomExpanded(!isBottomExpanded)}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </button>

        <div className="px-5 pb-8 lg:pb-5 space-y-4 overflow-y-auto scrollbar-hide max-h-[50vh]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dirección de Entrega</p>
              <p className="text-sm font-medium text-white mt-0.5">{order.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detalle del Pedido</p>
              <p className="text-sm font-medium text-white mt-0.5">{order.summary}</p>
            </div>
          </div>

          {order.truck && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Vehículo Asignado</p>
                <p className="text-sm font-bold text-white mt-0.5">{order.truck.plate_number}</p>
                <p className="text-xs text-slate-400">{order.truck.driver_name}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <TruckIcon className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          )}

          {order.status === 'pending' && current_customer && (
            <button 
              onClick={handleCancelOrder}
              className="w-full mt-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-3 px-4 rounded-xl border border-rose-500/20 transition-colors flex items-center justify-center gap-2"
            >
              Cancelar Pedido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
