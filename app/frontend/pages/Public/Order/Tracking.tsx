import { useState, useEffect, useRef } from 'react'
import { Head } from '@inertiajs/react'
import { CheckCircle, Clock, Truck, MapPin, Phone, Flame, Navigation, Package } from 'lucide-react'

interface Props {
  token: string
  companyId: number
}

interface OrderStatus {
  status: 'pending' | 'accepted' | 'in_transit' | 'completed' | 'cancelled'
  client_name: string
  address: string
  summary: string
  truck?: {
    latitude: number
    longitude: number
    plate_number: string
    driver_name: string
  }
}

const STATUS_CONFIG = {
  pending: {
    label: 'Buscando repartidor...',
    sublabel: 'Estamos notificando a los camiones cercanos',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: <Clock className="w-8 h-8 text-amber-400" />,
    pulse: true,
  },
  accepted: {
    label: '¡Pedido Aceptado!',
    sublabel: 'El camión está preparándose para partir',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10 border-primary-500/30',
    icon: <Truck className="w-8 h-8 text-primary-400" />,
    pulse: true,
  },
  in_transit: {
    label: 'En Camino 🚀',
    sublabel: 'El camión está en ruta hacia tu dirección',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: <Navigation className="w-8 h-8 text-emerald-400" />,
    pulse: true,
  },
  completed: {
    label: '¡Entregado! 🎉',
    sublabel: 'Tu pedido fue completado con éxito',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: <CheckCircle className="w-8 h-8 text-emerald-400" />,
    pulse: false,
  },
  cancelled: {
    label: 'Pedido Cancelado',
    sublabel: 'El pedido fue cancelado',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    icon: <Clock className="w-8 h-8 text-red-400" />,
    pulse: false,
  },
}

export default function PublicOrderTracking({ token, companyId }: Props) {
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isTopExpanded, setIsTopExpanded] = useState(true)
  const [isBottomExpanded, setIsBottomExpanded] = useState(true)
  const mapRef = useRef<any>(null)
  const truckMarkerRef = useRef<any>(null)
  const destMarkerRef = useRef<any>(null)
  const lineRef = useRef<any>(null)

  // Load Leaflet
  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadLeaflet = () => {
      if ((window as any).L) { initMap(); return }
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.crossOrigin = ''
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.crossOrigin = ''
      script.onload = () => initMap()
      document.body.appendChild(script)
    }
    loadLeaflet()
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  const initMap = () => {
    const L = (window as any).L
    if (!L || mapRef.current) return
    mapRef.current = L.map('tracking-map', { zoomControl: false }).setView([-33.4489, -70.6693], 13)
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      className: 'map-dark-mode'
    }).addTo(mapRef.current)
  }

  const updateMap = (orderData: OrderStatus) => {
    const L = (window as any).L
    if (!L || !mapRef.current) return
    
    // Determine destination position
    let destPos: [number, number] | null = null
    if ((orderData as any).latitude && (orderData as any).longitude) {
      destPos = [(orderData as any).latitude, (orderData as any).longitude]
    }

    // Client Destination Marker
    if (destPos) {
      const destIconHtml = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `
      const destIcon = L.divIcon({ className: '', html: destIconHtml, iconSize: [32, 32], iconAnchor: [16, 32] })
      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker(destPos, { icon: destIcon }).addTo(mapRef.current)
      }
    }

    // Truck Marker
    if (orderData.truck && orderData.truck.latitude && orderData.truck.longitude) {
      const truckPos: [number, number] = [orderData.truck.latitude, orderData.truck.longitude]

      const truckIconHtml = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 border-2 border-white shadow-2xl shadow-emerald-500/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10a2 2 0 0 0 2 2z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          </div>
          <span class="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
          <div class="mt-1 px-2 py-0.5 bg-slate-900 border border-white/20 rounded shadow text-[9px] font-black text-white">En Camino</div>
        </div>
      `
      const truckIcon = L.divIcon({ className: '', html: truckIconHtml, iconSize: [50, 65], iconAnchor: [25, 50] })

      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng(truckPos)
      } else {
        truckMarkerRef.current = L.marker(truckPos, { icon: truckIcon }).addTo(mapRef.current)
      }

      // Draw route line if available
      if ((orderData.truck as any).route_points && (orderData.truck as any).route_points.length > 0) {
        if (lineRef.current) {
          lineRef.current.setLatLngs((orderData.truck as any).route_points)
        } else {
          lineRef.current = L.polyline((orderData.truck as any).route_points, {
            color: '#a855f7',
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(mapRef.current)
        }
      } else {
        if (lineRef.current) {
          lineRef.current.remove()
          lineRef.current = null
        }
      }

      mapRef.current.panTo(truckPos, { animate: true, duration: 1.0 })
    } else {
      // Remove truck marker and line if no truck is assigned
      if (truckMarkerRef.current) {
        truckMarkerRef.current.remove()
        truckMarkerRef.current = null
      }
      if (lineRef.current) {
        lineRef.current.remove()
        lineRef.current = null
      }
      if (destPos) {
        mapRef.current.panTo(destPos, { animate: true, duration: 1.0 })
      }
    }
  }

  const fetchStatus = async () => {
    try {
      const resp = await fetch(`/order/${companyId}/track/${token}`, {
        headers: { 'Accept': 'application/json' }
      })
      if (resp.status === 410) {
        const data = await resp.json()
        setOrder(prev => prev ? { ...prev, status: data.status } : null)
        setLoading(false)
        return
      }
      if (!resp.ok) return
      const data: OrderStatus = await resp.json()
      setOrder(data)
      setLastUpdated(new Date())
      setLoading(false)
      
      // Update map immediately
      setTimeout(() => updateMap(data), 100)
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Poll every 6 seconds while not completed
    const timer = setInterval(() => {
      if (order?.status !== 'completed' && order?.status !== 'cancelled') {
        fetchStatus()
      }
    }, 6000)
    return () => clearInterval(timer)
  }, [token, order?.status])

  // Auto collapse top status after 5 seconds if not completed/cancelled
  useEffect(() => {
    if (order && order.status !== 'completed' && order.status !== 'cancelled' && isTopExpanded) {
      const timer = setTimeout(() => setIsTopExpanded(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [order?.status, isTopExpanded])

  const statusConfig = order ? STATUS_CONFIG[order.status] : null

  return (
    <>
      <Head title="Seguimiento de Pedido" />
      <div className="h-[100dvh] w-full bg-slate-950 relative overflow-hidden">
        
        {/* Map Background */}
        <div id="tracking-map" className="absolute inset-0 z-0" />
        
        {/* Top Darkening Gradient for Status Visibility */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent z-10 pointer-events-none" />

        {loading ? (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm gap-4">
            <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-200 text-sm font-bold">Conectando al GPS...</p>
          </div>
        ) : !order ? (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md gap-3 text-center px-6">
            <p className="text-white text-xl font-black">Pedido no encontrado</p>
            <p className="text-slate-400 text-sm">Verifica el enlace e intenta nuevamente.</p>
          </div>
        ) : (
          <>
            {/* --------------------- */}
            {/* TOP BANNER (STATUS) */}
            {/* --------------------- */}
            {statusConfig && (
              <div 
                className={`absolute top-4 right-4 z-[50] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top-right ${
                  isTopExpanded 
                    ? 'w-[calc(100vw-32px)] max-w-sm scale-100 opacity-100' 
                    : 'w-[140px] scale-90 opacity-95 cursor-pointer hover:scale-95'
                }`}
                onClick={() => { if (!isTopExpanded) setIsTopExpanded(true) }}
              >
                {isTopExpanded ? (
                  // EXPANDED VIEW
                  <div className={`p-5 rounded-3xl border flex flex-col items-center gap-3 text-center shadow-2xl backdrop-blur-xl ${statusConfig.bg}`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsTopExpanded(false) }}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white/50 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    
                    <div className={statusConfig.pulse ? 'animate-pulse' : ''}>
                      {statusConfig.icon}
                    </div>
                    <div>
                      <h2 className={`text-xl font-black ${statusConfig.color}`}>{statusConfig.label}</h2>
                      <p className="text-white/70 text-xs mt-1 font-medium">{statusConfig.sublabel}</p>
                    </div>

                    {order.status !== 'cancelled' && (
                      <div className="flex items-center gap-1.5 mt-2 w-full justify-center">
                        {['pending', 'accepted', 'in_transit', 'completed'].map((step, i) => {
                          const steps = ['pending', 'accepted', 'in_transit', 'completed']
                          const current = steps.indexOf(order.status)
                          const stepIdx = steps.indexOf(step)
                          return (
                            <div key={step} className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full transition-all ${
                                stepIdx <= current ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-black/30'
                              } ${stepIdx === current && step !== 'completed' ? 'animate-pulse ring-2 ring-white/40' : ''}`} />
                              {i < 3 && <div className={`w-8 h-0.5 rounded-full ${stepIdx < current ? 'bg-white/80' : 'bg-black/20'}`} />}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  // COLLAPSED VIEW (PILL)
                  <div className={`flex items-center justify-center gap-2 p-2.5 px-4 rounded-full border shadow-xl backdrop-blur-xl bg-slate-900/90 border-white/10`}>
                    <div className={`w-5 h-5 flex items-center justify-center ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                      {statusConfig.icon}
                    </div>
                    <span className={`text-xs font-black truncate ${statusConfig.color}`}>
                      {statusConfig.label.split(' ')[0]} {statusConfig.label.split(' ')[1] || ''}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* --------------------- */}
            {/* FLOATING CONTROLS     */}
            {/* --------------------- */}
            <div 
              className={`absolute right-4 z-[50] flex flex-col gap-3 transition-all duration-500 ${
                isTopExpanded ? 'top-64 opacity-0 pointer-events-none' : 'top-20 opacity-100'
              }`}
            >
              {order.truck && (
                <button 
                  onClick={() => {
                    if (mapRef.current && order.truck) {
                      mapRef.current.flyTo([order.truck.latitude, order.truck.longitude], 16, { animate: true, duration: 1.0 })
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                  title="Centrar en el camión"
                >
                  <Truck className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => {
                  if (mapRef.current && (order as any).latitude) {
                    mapRef.current.flyTo([(order as any).latitude, (order as any).longitude], 16, { animate: true, duration: 1.0 })
                  }
                }}
                className="w-12 h-12 rounded-full bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 text-rose-400 shadow-2xl flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                title="Centrar en mi destino"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            {/* --------------------- */}
            {/* BOTTOM SHEET          */}
            {/* --------------------- */}
            <div 
              className={`absolute bottom-0 left-0 right-0 z-[50] bg-slate-950/95 backdrop-blur-2xl rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isBottomExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'
              }`}
            >
              {/* Handle */}
              <button 
                className="w-full h-14 flex justify-center items-center cursor-pointer active:bg-white/5 rounded-t-[2rem] transition-colors"
                onClick={() => setIsBottomExpanded(!isBottomExpanded)}
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </button>

              <div className="px-6 pb-10 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                
                {/* Truck info */}
                {order.truck && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-inner">
                        <Truck className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-black text-white text-base">{order.truck.plate_number}</p>
                        <p className="text-sm text-emerald-300 font-medium">{order.truck.driver_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending State Banner */}
                {order.status === 'pending' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center space-y-2 mb-4">
                    <div className="flex justify-center gap-1.5 mb-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-amber-400" style={{ animation: `bounce 1s ${i * 0.15}s infinite` }} />
                      ))}
                    </div>
                    <p className="text-xs text-amber-300 font-semibold">Buscando camiones cercanos...</p>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Detalle del Pedido</h3>
                    <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                      <Package className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-white leading-snug">{order.summary}</p>
                        <p className="text-xs text-slate-400 mt-1">{order.client_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Destino</h3>
                    <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                      <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-300 leading-snug">{order.address}</p>
                    </div>
                  </div>
                </div>

                {/* Completed state */}
                {order.status === 'completed' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-2 mt-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="font-black text-emerald-400 text-lg">¡Entregado!</p>
                    <p className="text-slate-400 text-sm">Tu pedido ha sido completado.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
