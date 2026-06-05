import { useState, useEffect, useRef, useCallback } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import { useActionCable } from '@/hooks/useActionCable'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import {
  Radar, MapPin, Package, Clock, Navigation,
  CheckCircle, AlertCircle, Truck, ArrowLeft,
  RefreshCw, User, Phone, FileText, Zap, LogOut, Volume2, VolumeX, Palette
} from 'lucide-react'

import { PendingOrder, RadarData } from '@/components/Radar/types'
import RadarActiveDispatch from '@/components/Radar/RadarActiveDispatch'
import RadarOrderList from '@/components/Radar/RadarOrderList'
import RadarOrderModal from '@/components/Radar/RadarOrderModal'

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'Reciente';
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Hace instantes'
  if (diffMins < 60) return `Hace ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours} hr`
  return `Hace ${Math.floor(diffHours / 24)} días`
}

export default function DriverRadar() {
  const page = usePage()
  const auth = page.props.auth as any
  const isDriver = auth?.user?.role === 'driver'

  const [data, setData] = useState<RadarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
  const [accepting, setAccepting] = useState<number | null>(null)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [isFollowing, setIsFollowing] = useState(true)
  const [isBottomExpanded, setIsBottomExpanded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  
  const audioCtxRef = useRef<any>(null)

  const initAudio = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!audioCtxRef.current && AudioContext) {
        audioCtxRef.current = new AudioContext()
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      setAudioEnabled(true)
      
      const ctx = audioCtxRef.current
      if (ctx) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)
      }
    } catch (e) { console.log('Audio init failed', e) }
  }

  const isFollowingRef = useRef(true)
  useEffect(() => {
    isFollowingRef.current = isFollowing
  }, [isFollowing])

  const mapRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const truckMarkerRef = useRef<any>(null)
  const orderMarkersRef = useRef<Record<number, any>>({})
  const destMarkerRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)
  const geoWatchIdRef = useRef<number | null>(null)

  const lastKnownPosRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return


    if (!lastKnownPosRef.current && data?.truck?.latitude && data?.truck?.longitude) {
      lastKnownPosRef.current = { latitude: data.truck.latitude!, longitude: data.truck.longitude!, timestamp: Date.now() }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lastKnownPosRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, timestamp: Date.now() }
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setLatLng([pos.coords.latitude, pos.coords.longitude])
          if (isFollowingRef.current && mapRef.current) {
            mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], mapRef.current.getZoom())
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    )

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        lastKnownPosRef.current = { latitude, longitude, timestamp: Date.now() }
        if (truckMarkerRef.current) {
          truckMarkerRef.current.setLatLng([latitude, longitude])
          if (isFollowingRef.current && mapRef.current) {
            mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())
          }
        }
      },
      (err) => console.warn('Geolocation error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
    geoWatchIdRef.current = watchId


    const interval = setInterval(() => {
      if (!lastKnownPosRef.current) return
      const { latitude, longitude, timestamp } = lastKnownPosRef.current
      
      // Stop sending updates if we haven't received a new GPS signal in 15 seconds
      if (Date.now() - timestamp > 15000) return

      fetch('/driver/radar/update_location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
        },
        body: JSON.stringify({ latitude, longitude })
      }).catch(() => {})
    }, 5000)

    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current)
      }
      clearInterval(interval)
    }
  }, [data?.truck.has_destination])

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
      script.onload = () => { initMap(); fetchRadar(true) }
      document.body.appendChild(script)
    }
    loadLeaflet()

    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.classList.contains('theme-light')
      if (tileLayerRef.current) {
        const newUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        tileLayerRef.current.setUrl(newUrl)
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      observer.disconnect()
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      if (truckMarkerRef.current) { truckMarkerRef.current.remove(); truckMarkerRef.current = null }
      if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null }
      if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null }
      orderMarkersRef.current = {}
    }
  }, [])

  const initMap = () => {
    const L = (window as any).L
    if (!L || mapRef.current) return
    mapRef.current = L.map('radar-map', { zoomControl: false }).setView([-33.4489, -70.6693], 13)
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current)
    
    const isLight = document.documentElement.classList.contains('theme-light')
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 20, maxNativeZoom: 19, className: isLight ? '' : 'map-dark-mode'
    }).addTo(mapRef.current)

    mapRef.current.on('dragstart', () => setIsFollowing(false))
  }

  const fetchRadar = useCallback(async (initial = false) => {
    const L = (window as any).L
    if (!L || !mapRef.current) return
    if (!initial) setRefreshing(true)

    try {
      const resp = await fetch('/driver/radar/orders')
      if (!resp.ok) { setLoading(false); return }
      const radarData: RadarData = await resp.json()
      setData(radarData)
      setLoading(false)
      setRefreshing(false)
      updateMapMarkers(radarData, initial)
    } catch {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const updateMapMarkers = (radarData: RadarData, center = false) => {
    const L = (window as any).L
    if (!L || !mapRef.current) return

    if (radarData.truck.latitude && radarData.truck.longitude) {
      const truckPos: [number, number] = [radarData.truck.latitude, radarData.truck.longitude]
      const truckIconHtml = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 border-3 border-white shadow-2xl shadow-primary-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10a2 2 0 0 0 2 2z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          </div>
          <span class="absolute -top-1 -right-1 flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-primary-500 border border-white"></span>
          </span>
          <div class="mt-1 px-2 py-0.5 bg-[var(--sf-surface)] text-primary-300 text-[9px] font-black rounded border border-primary-500/30">Tú</div>
        </div>
      `
      const truckIcon = L.divIcon({ className: '', html: truckIconHtml, iconSize: [50, 65], iconAnchor: [25, 50] })
      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng(truckPos)
      } else {
        truckMarkerRef.current = L.marker(truckPos, { icon: truckIcon }).addTo(mapRef.current)
      }
      if (center || isFollowingRef.current) {
        mapRef.current.setView(truckPos, mapRef.current.getZoom() || 15)
      }
    }

    if (radarData.truck.has_destination && radarData.truck.destination_latitude && radarData.truck.destination_longitude) {
      const destPos: [number, number] = [radarData.truck.destination_latitude, radarData.truck.destination_longitude]
      
      const destIconHtml = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 border-3 border-white shadow-2xl shadow-emerald-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <span class="absolute -top-1 -right-1 flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
          </span>
          <div class="mt-1 px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[9px] font-black rounded border border-emerald-500/30 truncate max-w-[100px]">${radarData.truck.destination_client_name}</div>
        </div>
      `
      const destIcon = L.divIcon({ className: '', html: destIconHtml, iconSize: [50, 65], iconAnchor: [25, 50] })
      
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng(destPos)
      } else {
        destMarkerRef.current = L.marker(destPos, { icon: destIcon }).addTo(mapRef.current)
      }

      if (radarData.truck.route_points && radarData.truck.route_points.length > 0) {
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs(radarData.truck.route_points)
        } else {
          routeLineRef.current = L.polyline(radarData.truck.route_points, {
            color: '#a855f7',
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(mapRef.current)
        }
      }
    } else {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove()
        destMarkerRef.current = null
      }
      if (routeLineRef.current) {
        routeLineRef.current.remove()
        routeLineRef.current = null
      }
    }

    const currentIds = new Set(radarData.orders.map(o => o.id))

    Object.keys(orderMarkersRef.current).forEach(idStr => {
      const id = parseInt(idStr)
      if (!currentIds.has(id)) {
        orderMarkersRef.current[id].remove()
        delete orderMarkersRef.current[id]
      }
    })

    radarData.orders.forEach(order => {
      const pos: [number, number] = [order.latitude, order.longitude]
      const iconHtml = `
        <div class="flex flex-col items-center cursor-pointer" style="animation: radarPulse 2s ease-in-out infinite">
          <div class="relative">
            <div class="w-11 h-11 rounded-full bg-orange-500 border-2 border-white shadow-2xl shadow-orange-500/60 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border border-white"></span>
            </span>
          </div>
          <div class="mt-1 px-2 py-0.5 bg-orange-950 border border-orange-500/40 rounded shadow text-[9px] font-black text-orange-300 max-w-[80px] truncate">
            ${order.distance_km !== null ? `${order.distance_km} km` : 'Nuevo pedido'}
          </div>
        </div>
      `
      const icon = L.divIcon({ className: '', html: iconHtml, iconSize: [44, 65], iconAnchor: [22, 50] })

      if (!orderMarkersRef.current[order.id]) {
        const marker = L.marker(pos, { icon }).addTo(mapRef.current)
        marker.on('click', () => {
          setSelectedOrder(order)
          mapRef.current.flyTo(pos, 16, { animate: true, duration: 0.8 })
        })
        orderMarkersRef.current[order.id] = marker
      }
    })
  }

  useActionCable('OrdersChannel', (payload) => {
    if (payload.action === 'new_order') {
      try {
        if (audioEnabled && audioCtxRef.current) {
          const ctx = audioCtxRef.current
          if (ctx.state === 'suspended') ctx.resume()
          
          const playTone = (freq: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, startTime)
            gain.gain.setValueAtTime(0, startTime)
            gain.gain.linearRampToValueAtTime(0.8, startTime + 0.05)
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(startTime)
            osc.stop(startTime + duration)
          }
          const now = ctx.currentTime
          playTone(880, now, 0.15)
          playTone(1108.73, now + 0.15, 0.3)
          playTone(880, now + 0.6, 0.15)
          playTone(1108.73, now + 0.75, 0.3)
          playTone(880, now + 1.2, 0.15)
          playTone(1108.73, now + 1.35, 0.5)
        }
      } catch (e) { console.log('Audio blocked', e) }

      Swal.fire({
        icon: 'info',
        title: '¡Nuevo Pedido Cerca!',
        text: `${payload.order.client_name} necesita despacho.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        background: 'var(--sf-glass-panel-bg1)',
        color: 'var(--sf-text-main)'
      })
      fetchRadar(false)
    } else if (payload.action === 'truck_cleared') {
      if (data?.truck.id && payload.truck_id === data.truck.id) {
        Swal.fire({
          icon: 'error',
          title: 'Despacho Cancelado',
          text: 'El administrador ha cancelado tu despacho actual. La ruta ha sido limpiada.',
          confirmButtonColor: '#ef4444',
          background: 'var(--sf-glass-panel-bg1)',
          color: 'var(--sf-text-main)'
        })
        fetchRadar(true)
      }
    } else if (payload.action === 'order_proposed') {
      if (data?.truck.id && payload.truck_id === data.truck.id) {
        fetchRadar(false)
      }
    } else if (payload.action === 'order_accepted' || payload.action === 'order_updated') {
      fetchRadar(false)
    }
  })

  useEffect(() => {
    const timer = setInterval(() => fetchRadar(false), 15000)
    return () => clearInterval(timer)
  }, [fetchRadar])

  const proposedOrderHandledRef = useRef<number | null>(null)

  const handleProposedOrder = async (order: PendingOrder) => {
    setSelectedOrder(order)
    if (mapRef.current) {
      mapRef.current.flyTo([order.latitude, order.longitude], 16, { animate: true, duration: 0.8 })
    }
  }

  const handleRejectOrder = async (order: PendingOrder) => {
    const { value: reason } = await Swal.fire({
      title: 'Motivo de Rechazo',
      input: 'textarea',
      inputPlaceholder: 'Ej: Falta combustible, fuera de horario...',
      showCancelButton: true,
      cancelButtonText: 'Volver',
      confirmButtonText: 'Enviar Rechazo',
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: 'var(--sf-glass-panel-bg1)',
      color: 'white',
      inputValidator: (val) => (!val ? 'Debes indicar un motivo' : null)
    })

    if (reason) {
      try {
        await fetch(`/driver/radar/reject_proposal/${order.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
          },
          body: JSON.stringify({ reason })
        })
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Propuesta rechazada', showConfirmButton: false, timer: 3000, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
        setSelectedOrder(null)
        fetchRadar(true)
      } catch (e) {
        Swal.fire('Error', 'Error de red al rechazar', 'error')
        proposedOrderHandledRef.current = null
      }
    }
  }

  useEffect(() => {
    if (!data?.orders || data.truck.active_order_id) return
    const proposed = data.orders.find((o: any) => o.is_proposed)
    
    if (proposed && proposedOrderHandledRef.current !== proposed.id) {
      proposedOrderHandledRef.current = proposed.id
      handleProposedOrder(proposed)
    }
  }, [data])

  const handleAcceptOrder = async (order: PendingOrder) => {
    setAccepting(order.id)
    setAcceptError(null)
    try {
      const resp = await fetch(`/driver/radar/accept/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
        }
      })
      const result = await resp.json()
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Pedido tomado! 🚀',
          text: 'La ruta fue calculada automáticamente. Ya estás en camino.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          background: 'var(--sf-glass-panel-bg1)',
          color: 'var(--sf-text-main)'
        })
        setSelectedOrder(null)
        fetchRadar(false)
      } else {
        setAcceptError(result.error || 'Error al tomar el pedido')
      }
    } catch {
      setAcceptError('Error de conexión')
    } finally {
      setAccepting(null)
    }
  }

  const handleCompleteOrder = async (reason?: string) => {
    if (!data?.truck.active_order_id) return
    setCompleting(true)
    try {
      const resp = await fetch(`/driver/radar/complete/${data.truck.active_order_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
        },
        body: reason ? JSON.stringify({ reason }) : undefined
      })
      const result = await resp.json()
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Entrega exitosa!',
          text: 'El pedido fue marcado como completado.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          background: 'var(--sf-glass-panel-bg1)',
          color: 'var(--sf-text-main)'
        })
        fetchRadar(false)
      } else {
        alert(result.error || 'Error al completar')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setCompleting(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!data?.truck.active_order_id) return
    
    const { value: reason } = await Swal.fire({
      title: 'Cancelar Entrega',
      input: 'textarea',
      inputLabel: '¿Por qué cancelas este despacho?',
      inputPlaceholder: 'Ej: Cliente no responde, problema técnico...',
      showCancelButton: true,
      confirmButtonText: 'Confirmar Cancelación',
      cancelButtonText: 'Volver',
      background: 'var(--sf-glass-panel-bg1)',
      color: 'var(--sf-text-main)',
      confirmButtonColor: '#ef4444',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un motivo'
        return null
      }
    })

    if (reason) {
      setCompleting(true)
      try {
        const resp = await fetch(`/driver/radar/cancel/${data.truck.active_order_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
          },
          body: JSON.stringify({ reason })
        })
        const result = await resp.json()
        if (result.success) {
          Swal.fire({
            icon: 'info',
            title: 'Despacho cancelado',
            text: 'El pedido fue devuelto a la lista.',
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
            background: 'var(--sf-glass-panel-bg1)', color: 'var(--sf-text-main)'
          })
          fetchRadar(false)
        } else {
          alert(result.error || 'Error al cancelar')
        }
      } catch {
        alert('Error de conexión')
      } finally {
        setCompleting(false)
      }
    }
  }

  const cycleAura = () => {
    const auras = ['indigo', 'red', 'blue', 'amber', 'orange', 'emerald', 'purple', 'rose']
    const current = localStorage.getItem('sf-aura') || 'indigo'
    const nextIndex = (auras.indexOf(current) + 1) % auras.length
    const next = auras[nextIndex]
    localStorage.setItem('sf-aura', next)
    document.documentElement.classList.remove(...auras.map(a => `aura-${a}`))
    document.documentElement.classList.add(`aura-${next}`)
  }

  const totalInventory = data?.truck.inventory.reduce((s, i) => s + i.quantity, 0) ?? 0

  return (
    <AuthenticatedLayout hideHeader={isDriver}>
      <Head title="Radar de Despachos" />

      <div className={`flex flex-col overflow-hidden relative ${isDriver ? 'h-[100dvh] w-full' : 'h-[calc(100vh-5rem)] lg:h-[calc(100vh-9.5rem)] -mx-4 -my-4 lg:-mx-8 lg:-my-8 bg-[var(--sf-bg)] rounded-3xl'}`}>

        
        <div className="flex items-center justify-between p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)]/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            {!isDriver && (
              <Link href="/trucks" className="p-2 rounded-xl bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-muted)] hover:text-white hover:bg-[var(--sf-border)] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 
                  className="text-xl font-black text-[var(--sf-text-main)] tracking-tight active:scale-95 transition-transform"
                  onClick={() => window.location.reload()}
                >
                  Radar de Despachos
                </h1>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                </span>
              </div>
              <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                {data ? `${data.orders.length} pedido(s) pendiente(s) cerca de ti` : 'Cargando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleAura}
              className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-muted)] hover:text-primary-500 hover:bg-[var(--sf-border)] transition-all active:scale-95"
              title="Cambiar Color (Aura)"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchRadar(false)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-main)] hover:bg-[var(--sf-border)] transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <Link
              href="/logout"
              method="delete"
              as="button"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>

        
        <div className="flex-1 flex overflow-hidden relative">

          
          <div id="radar-map" className="flex-1 h-full z-0 bg-[var(--sf-bg)]" />

          {/* Audio Enable Button */}
          {!audioEnabled && (
            <button 
              onClick={initAudio}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] px-4 py-3 bg-red-500/90 backdrop-blur-xl border border-red-400 text-white rounded-full font-bold shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-bounce hover:bg-red-600 hover:scale-105 transition-all pointer-events-auto"
            >
              <Volume2 className="w-5 h-5 animate-pulse" />
              Activar Alertas de Sonido
            </button>
          )}

          {!isFollowing && (
            <button 
              onClick={() => {
                setIsFollowing(true)
                if (mapRef.current && data?.truck.latitude && data?.truck.longitude) {
                  mapRef.current.flyTo([data.truck.latitude, data.truck.longitude], 15, { animate: true, duration: 0.8 })
                }
              }}
              className="absolute top-20 right-4 md:bottom-6 md:top-auto md:right-6 z-[400] w-12 h-12 md:w-14 md:h-14 rounded-full bg-[var(--sf-surface)] border-2 border-[var(--sf-border)] shadow-2xl flex items-center justify-center text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-surface-hover)] transition-colors pointer-events-auto"
              title="Centrar y seguir mi ubicación"
            >
              <Navigation className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes radarPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.08); }
            }
            .leaflet-popup-content-wrapper {
              background: rgba(15, 23, 42, 0.95) !important;
              backdrop-filter: blur(16px) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              border-radius: 16px !important;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75) !important;
            }
            .leaflet-popup-content { margin: 0 !important; padding: 0 !important; }
            .leaflet-popup-tip { background: rgba(15, 23, 42, 0.95) !important; }
            .leaflet-container a.leaflet-popup-close-button { color: rgba(255,255,255,0.4) !important; padding: 10px 10px 0 0 !important; }
            
            /* Push zoom controls above the bottom sheet handle */
            .leaflet-control-zoom { margin-bottom: 80px !important; }
            @media (min-width: 768px) {
              .leaflet-control-zoom { margin-bottom: 20px !important; }
            }
          `}} />

          
          <div className="absolute inset-0 z-10 pointer-events-none p-3 md:p-4">
            <div className="flex flex-col w-full md:w-[22rem] gap-2">
              
              
              <div className="flex flex-col gap-2 mt-0">
                
                {!loading && data && !data.truck.latitude && (
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/90 text-amber-950 font-bold text-xs pointer-events-auto shadow-lg">
                    <AlertCircle className="w-4 h-4" />
                    Sin ubicación GPS
                  </div>
                )}

                
                {data?.truck.has_destination && (
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600/90 text-white font-bold text-xs pointer-events-auto shadow-xl">
                    <Navigation className="w-4 h-4" />
                    Despacho activo en ruta
                  </div>
                )}


              </div>
            </div>
          </div>

          
          <div 
            className={`absolute bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto z-[400] md:w-[22rem] flex flex-col justify-end transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isBottomExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-60px)] md:translate-y-0'
            }`}
          >
            <div className={`flex flex-col shrink-0 max-h-[75vh] md:max-h-[70vh] pointer-events-auto backdrop-blur-2xl rounded-t-[2rem] border-t border-[var(--sf-border)] md:rounded-2xl md:border shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden ${
              data?.truck.has_destination ? 'glass-panel border-primary-500/30' : 'glass-panel'
            }`}>
              
              <div 
                className={`w-full h-14 shrink-0 flex flex-col justify-center items-center cursor-pointer hover:bg-white/5 transition-colors md:hidden ${!isBottomExpanded && data?.orders?.length ? 'animate-pulse bg-primary-900/30' : ''}`}
                onClick={() => setIsBottomExpanded(!isBottomExpanded)}
              >
                <div className={`w-12 h-1.5 rounded-full mb-1.5 ${!isBottomExpanded && data?.orders?.length ? 'bg-primary-400' : 'bg-white/20'}`} />
                {!isBottomExpanded && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${data?.orders?.length ? 'text-primary-300' : 'text-[var(--sf-text-muted)]'}`}>
                    {data?.truck.has_destination ? 'Entrega en curso' : `${data?.orders.length || 0} pedidos cercanos`}
                  </span>
                )}
              </div>

              <div className="overflow-y-auto scrollbar-hide pb-8 md:pb-0 flex flex-col min-h-0">
                {data && data.orders.some((o: any) => o.is_proposed) && data.truck.active_order_id && (
                  <div 
                    className="p-3 mb-2 mx-3 bg-primary-600/90 backdrop-blur-md border border-primary-400 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-between cursor-pointer hover:bg-primary-500 transition-colors shrink-0"
                    onClick={() => {
                      const proposed = data.orders.find((o: any) => o.is_proposed)
                      if (proposed) handleProposedOrder(proposed)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-900/50 rounded-full animate-pulse">
                        <AlertCircle className="w-5 h-5 text-[var(--sf-text-main)]" />
                      </div>
                      <div>
                        <p className="text-white font-black text-xs uppercase tracking-wider">Despacho Propuesto</p>
                        <p className="text-primary-100 text-[10px]">Administración te ha asignado un nuevo pedido</p>
                      </div>
                    </div>
                    <span className="text-white text-[10px] font-bold bg-white/10 px-2 py-1 rounded">Revisar &rarr;</span>
                  </div>
                )}
                {data && (
                  <RadarActiveDispatch 
                    data={data} 
                    completing={completing} 
                    onComplete={handleCompleteOrder} 
                    onCancel={handleCancelOrder} 
                  />
                )}
                <RadarOrderList 
                  data={data} 
                  loading={loading} 
                  selectedOrder={selectedOrder} 
                  onSelectOrder={(order) => {
                    setSelectedOrder(order)
                    setIsBottomExpanded(false)
                    setIsFollowing(false)
                    if (mapRef.current) {
                      const L = (window as any).L
                      if (L) {
                        const targetLatLng = L.latLng(order.latitude, order.longitude)
                        const targetPoint = mapRef.current.project(targetLatLng, 16)
                        // Move the map center south by 25% of the screen height,
                        // so the marker appears in the upper half of the screen!
                        targetPoint.y += window.innerHeight * 0.22
                        const offsetLatLng = mapRef.current.unproject(targetPoint, 16)
                        mapRef.current.flyTo(offsetLatLng, 16, { animate: true, duration: 0.8 })
                      } else {
                        mapRef.current.flyTo([order.latitude, order.longitude], 16, { animate: true, duration: 0.8 })
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>

          {selectedOrder && (
            <RadarOrderModal 
              order={selectedOrder} 
              data={data} 
              accepting={accepting} 
              acceptError={acceptError} 
              onClose={() => { 
                setSelectedOrder(null)
                setAcceptError(null)
                setIsBottomExpanded(true)
              }} 
              onAccept={handleAcceptOrder} 
              onReject={handleRejectOrder}
            />
          )}


        </div>
      </div>
    </AuthenticatedLayout>
  )
}
