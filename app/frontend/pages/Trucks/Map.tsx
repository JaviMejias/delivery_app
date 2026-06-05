import { useState, useEffect, useRef, useCallback } from 'react'
import { Head, Link } from '@inertiajs/react'
import { useActionCable } from '@/hooks/useActionCable'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { 
  Truck as TruckIcon, 
  MapPin, 
  Home, 
  Navigation, 
  RefreshCw, 
  ArrowLeft, 
  Package, 
  Box, 
  Activity, 
  Wifi, 
  Compass,
  CheckCircle,
  Mic,
  Zap,
  Users,
  Search
} from 'lucide-react'
import ProductSelector from '@/components/ProductSelector'
import PhoneInput from '@/components/PhoneInput'

interface TruckData {
  id: number
  plate_number: string
  latitude?: number
  longitude?: number
  gps_active: boolean
  has_real_gps?: boolean
  gps_device_token: string
  driver_name: string
  warehouse_name: string
  products: { name: string; quantity: number }[]
  materials: { name: string; quantity: number }[]
  total_llenos: number
  total_vacios: number
  destination?: {
    latitude: number
    longitude: number
    client_name: string
    address: string
  }
  route_coords?: [number, number][]
  departure_time?: string
  metrics?: {
    completed: number
    accepted: number
    cancelled: number
  }
}

// Formatear patentes
const formatPlate = (value: string): string => {
  const upper = value.toUpperCase()
  const clean = upper.replace(/[^A-Z0-9]/g, '')
  if (clean.length === 6) {
    if (/^[A-Z]{4}[0-9]{2}$/.test(clean)) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`
    }
    if (/^[A-Z]{2}[0-9]{4}$/.test(clean)) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 6)}`
    }
  }
  return upper
}

// Formatear tiempo atrás
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

interface Props {
  company_id: number
  brands: any[]
}

export default function TrucksMap({ company_id, brands = [] }: Props) {
  const [trucks, setTrucks] = useState<TruckData[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTruckId, setSelectedTruckId] = useState<number | null>(null)
  const [followedTruckId, setFollowedTruckId] = useState<number | null>(null)
  const followedTruckIdRef = useRef<number | null>(null)

  const [searchTruck, setSearchTruck] = useState('')
  const [searchOrder, setSearchOrder] = useState('')

  // Estados para creación de pedidos manuales
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderStep, setOrderStep] = useState(1)
  const [newOrderForm, setNewOrderForm] = useState({
    client_name: '', phone: '', address: '', notes: '', quick_order: ''
  })
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  type OrderMode = 'choose' | 'quick' | 'cart'
  const [mode, setMode] = useState<OrderMode>('choose')
  const [cart, setCart] = useState<any[]>([])

  const updateCart = (product: any, brandName: string, change: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        const newQty = existing.quantity + change
        if (newQty <= 0) return prev.filter(item => item.product_id !== product.id)
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: newQty } : item)
      }
      if (change > 0) {
        return [...prev, {
          product_id: product.id,
          name: product.name,
          kg: product.kg,
          brand_name: brandName,
          quantity: 1
        }]
      }
      return prev
    })
  }

  useEffect(() => {
    followedTruckIdRef.current = followedTruckId
  }, [followedTruckId])

  // Estados de Acordeón
  const [isListExpanded, setIsListExpanded] = useState(true)
  const [isDetailExpanded, setIsDetailExpanded] = useState(false)
  const [isOrdersListExpanded, setIsOrdersListExpanded] = useState(false)
  const [isCustomersListExpanded, setIsCustomersListExpanded] = useState(false)

  // Estados para Clientes
  const [searchCustomer, setSearchCustomer] = useState('')
  const [customersList, setCustomersList] = useState<any[]>([])
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false)

  useEffect(() => {
    if (!isCustomersListExpanded) {
      setCustomersList([])
      return
    }

    if (searchCustomer.trim().length > 0 && searchCustomer.trim().length < 2) {
      setCustomersList([])
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingCustomers(true)
      try {
        const res = await fetch(`/trucks/search_customers?q=${encodeURIComponent(searchCustomer)}`)
        const data = await res.json()
        setCustomersList(data.customers || [])
      } catch (e) {
        console.error("Error searching customers", e)
      } finally {
        setIsSearchingCustomers(false)
      }
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [searchCustomer, isCustomersListExpanded])

  // Reloj local para cuenta regresiva exacta en tiempo real
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

  const getDepartureCountdown = (departureTimeStr?: string) => {
    if (!departureTimeStr) return null
    const depTime = new Date(departureTimeStr).getTime()
    const diff = depTime - now
    if (diff <= 0) return null
    return Math.ceil(diff / 1000)
  }

  // Actualizar popups de los camiones para mostrar la cuenta regresiva en tiempo real cada segundo
  useEffect(() => {
    const L = (window as any).L
    if (!L || !mapRef.current || trucks.length === 0) return

    trucks.forEach(truck => {
      const marker = markersRef.current[truck.id]
      if (marker && marker.isPopupOpen()) {
        const countdown = getDepartureCountdown(truck.departure_time)
        const departureStatusHtml = countdown !== null 
          ? `<span class="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-black text-[9px] animate-pulse">⏳ Partida en ${countdown}s</span>`
          : `<span class="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[9px] uppercase tracking-wider">En Ruta 🚀</span>`

        const popupContent = `
          <div class="p-3.5 min-w-[220px] text-slate-200 font-sans leading-relaxed">
            <div class="flex items-center justify-between border-b border-[var(--sf-border)] pb-2 mb-2.5">
              <span class="font-mono font-black text-sm text-primary-400 tracking-wider">${formatPlate(truck.plate_number)}</span>
              <span class="px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded border ${
                truck.gps_active
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : truck.has_real_gps 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
              }">${truck.gps_active ? 'GPS Activo' : truck.has_real_gps ? 'GPS Inactivo' : 'Simulado'}</span>
            </div>
            
            <p class="text-xs font-semibold mb-2.5 text-slate-300">
              Chofer: <span class="text-[var(--sf-text-main)] font-bold ml-1">${truck.driver_name || 'Sin Chofer'}</span>
              ${truck.driver_phone ? `<br/><span class="text-[10px] text-slate-400 font-mono mt-0.5 block">📞 ${truck.driver_phone}</span>` : ''}
            </p>

            <div class="space-y-1.5 bg-white/5 p-2 rounded-xl border border-[var(--sf-border)] mb-3">
              <p class="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Carga Actual</p>
              <div class="flex justify-between text-xs">
                <span class="text-primary-300 font-medium">Llenos:</span>
                <span class="font-black text-[var(--sf-text-main)]">${truck.total_llenos} cil.</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-purple-300 font-medium">Envases Vacíos:</span>
                <span class="font-black text-[var(--sf-text-main)]">${truck.total_vacios} uds.</span>
              </div>
            </div>

            ${
              truck.destination
                ? `
                <div class="mt-2.5 pt-2.5 border-t border-[var(--sf-border)] flex items-center justify-between gap-2.5">
                  <div class="overflow-hidden flex-1">
                    <div class="flex items-center gap-1.5 mb-1.5">
                      <span class="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Destino Despacho</span>
                      ${departureStatusHtml}
                    </div>
                    <p class="text-xs font-black text-[var(--sf-text-main)] truncate">${truck.destination.client_name}</p>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">${truck.destination.address}</p>
                  </div>
                  <button 
                    onclick="window.clearTruckDispatch(${truck.id})"
                    class="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--sf-text-main)] bg-rose-600 hover:bg-rose-500 border border-rose-500/30 rounded-lg transition-all cursor-pointer shadow-lg shadow-rose-950/20 active:scale-95 shrink-0"
                  >
                    Cancelar Despacho
                  </button>
                </div>
                `
                : ''
            }
          </div>
        `
        marker.setPopupContent(popupContent)
      }
    })
  }, [now, trucks])

  // Estados para despacho express interactivo
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [isCapturingCoords, setIsCapturingCoords] = useState(false)
  const tempMarkerRef = useRef<any>(null)
  
  const mapRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const markersRef = useRef<Record<number, any>>({})
  const destinationsRef = useRef<Record<number, any>>({})
  const pathsRef = useRef<Record<number, any>>({})
  const ordersMarkersRef = useRef<Record<number, any>>({})
  const isLeafletLoaded = useRef(false)

  const clearTempMarker = () => {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove()
      tempMarkerRef.current = null
    }
    setLatitude(null)
    setLongitude(null)
    setIsCapturingCoords(false)
  }

  useEffect(() => {
    clearTempMarker()
  }, [selectedTruckId])

  useEffect(() => {
    // No longer attaching a map.on('click') listener.
    // Coordinates are captured by dragging the map and clicking "Confirmar Destino" floating button.
  }, [isCapturingCoords])

  const handleOpenOrderModal = () => {
    setIsOrderModalOpen(true)
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingOrder(true)
    
    // Si no hay coords, usar el centro de la vista
    let finalLat = latitude
    let finalLng = longitude
    
    if (!finalLat || !finalLng) {
      const center = mapRef.current.getCenter()
      finalLat = center.lat
      finalLng = center.lng
    }

    let finalQuickOrder = newOrderForm.quick_order
    let finalItems = []

    if (mode === 'cart' && cart.length > 0) {
      finalItems = cart.map(item => ({
        product_id: item.product_id,
        name: `${item.brand_name} ${item.name}`,
        quantity: item.quantity
      }))
    }

    try {
      const response = await fetch('/api/v1/dispatch/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          order: {
            client_name: newOrderForm.client_name,
            phone: newOrderForm.phone,
            address: newOrderForm.address,
            latitude: finalLat,
            longitude: finalLng,
            notes: newOrderForm.notes,
            details: { 
              quick_order: finalQuickOrder,
              items: finalItems
            }
          }
        })
      })
      const data = await response.json()
      
      if (data.error) {
        Swal.fire('Error', data.error, 'error')
      } else {
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success', title: 'Pedido Creado', timer: 2000, showConfirmButton: false, background: 'var(--sf-glass-panel-bg1)', color: '#fff'
        })
        setIsOrderModalOpen(false)
        clearTempMarker()
        setNewOrderForm({ client_name: '', phone: '', address: '', notes: '', quick_order: '' })
        setCart([])
        setMode('choose')
        setOrderStep(1)
        fetchLocations(false)
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error de red al crear el pedido.', background: 'var(--sf-glass-panel-bg1)', color: 'white' })
    } finally {
      setCreatingOrder(false)
    }
  }

  const handleAdminCancelOrder = async (orderId: number) => {
    const { value: reason } = await Swal.fire({
      title: 'Rechazar Pedido',
      text: '¿Por qué vas a cancelar este pedido? Se removerá del sistema y del chofer asignado.',
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Ej: Fuera de zona, pedido falso, repetido...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Volver',
      background: 'var(--sf-glass-panel-bg1)',
      color: 'white',
      confirmButtonColor: '#ef4444',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un motivo'
        return null
      }
    })

    if (reason) {
      try {
        const resp = await fetch(`/trucks/cancel_order/${orderId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({ reason })
        })
        const result = await resp.json()
        if (result.success) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pedido Rechazado', showConfirmButton: false, timer: 3000, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
          fetchLocations(false)
        } else {
          Swal.fire('Error', result.errors?.join(', ') || 'Error al rechazar', 'error')
        }
      } catch (e) {
        Swal.fire('Error', 'Error de red', 'error')
      }
    }
  }

  const handleAdminAssignOrder = async (orderId: number) => {
    const inputOptions: Record<string, string> = {}
    trucks.forEach(t => {
      inputOptions[t.id.toString()] = `${t.plate_number} (${t.driver_name || 'Sin Chofer'})`
    })

    const { value: truckId } = await Swal.fire({
      title: 'Asignar a Camión',
      text: 'Selecciona el camión al que le quieres proponer este despacho:',
      input: 'select',
      inputOptions,
      inputPlaceholder: 'Elige un camión...',
      showCancelButton: true,
      confirmButtonText: 'Asignar',
      cancelButtonText: 'Cancelar',
      background: 'var(--sf-glass-panel-bg1)',
      color: 'white',
      inputValidator: (value) => {
        if (!value) return 'Debes seleccionar un camión'
        return null
      }
    })

    if (truckId) {
      try {
        const resp = await fetch(`/trucks/assign_order/${orderId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify({ truck_id: truckId })
        })
        const result = await resp.json()
        if (result.success) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Asignación enviada al chofer', showConfirmButton: false, timer: 3000, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
          fetchLocations(false)
        } else {
          Swal.fire('Error', result.errors?.join(', ') || 'Error al asignar', 'error')
        }
      } catch (e) {
        Swal.fire('Error', 'Error de red', 'error')
      }
    }
  }

  const toggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      Swal.fire('Error', 'Tu navegador no soporta dictado por voz.', 'error')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        }
      }
      if (finalTranscript) {
        setNewOrderForm(prev => ({ ...prev, quick_order: prev.quick_order + (prev.quick_order ? ' ' : '') + finalTranscript.trim() }))
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    recognitionRef.current = recognition
  }

  const adminCancelOrderRef = useRef<(orderId: number) => void>(() => {})
  adminCancelOrderRef.current = handleAdminCancelOrder

  const adminAssignOrderRef = useRef<(orderId: number) => void>(() => {})
  adminAssignOrderRef.current = handleAdminAssignOrder

  const handleClearDestination = async (truckId: number) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Cancelar Despacho?',
      text: '¿Seguro que quieres cancelar este despacho? El pedido se cancelará y se quitará la ruta del chofer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Cancelar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#e11d48',
      background: 'var(--sf-glass-panel-bg1)',
      color: 'white'
    })

    if (!isConfirmed) return

    try {
      const response = await fetch(`/trucks/${truckId}/clear_destination`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
        }
      })
      const data = await response.json()
      if (data.success) {
        fetchLocations(false)
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: "Error al limpiar despacho: " + data.errors.join(', '), background: 'var(--sf-glass-panel-bg1)', color: 'white' })
      }
    } catch (error) {
      console.error("Error al limpiar despacho:", error)
    }
  }

  // Refs de callbacks globales para popups interactivos (previene clousures desactualizados)
  const selectTruckAndPrepareDispatchRef = useRef<(truckId: number) => void>(() => {})
  const clearTruckDispatchRef = useRef<(truckId: number) => void>(() => {})
  const startSimulationRef = useRef<() => Promise<void>>(async () => {})

  selectTruckAndPrepareDispatchRef.current = (truckId: number) => {
    setSelectedTruckId(truckId)
    setIsCapturingCoords(true)
    setIsListExpanded(false)
    setIsDetailExpanded(true)
    const L = (window as any).L
    const truck = trucks.find(t => t.id === truckId)
    if (truck && truck.latitude && truck.longitude && mapRef.current) {
      mapRef.current.flyTo([truck.latitude, truck.longitude], 15, {
        animate: true,
        duration: 1.0
      })
      const marker = markersRef.current[truckId]
      if (marker) {
        marker.closePopup()
      }
    }
  }

  clearTruckDispatchRef.current = (truckId: number) => {
    handleClearDestination(truckId)
    const marker = markersRef.current[truckId]
    if (marker) {
      marker.closePopup()
    }
  }

  startSimulationRef.current = handleOpenOrderModal

  useEffect(() => {
    (window as any).selectTruckAndPrepareDispatch = (truckId: number) => {
      selectTruckAndPrepareDispatchRef.current(truckId)
    }
    (window as any).clearTruckDispatch = (truckId: number) => {
      clearTruckDispatchRef.current(truckId)
    }
    (window as any).confirmTemporaryDestination = () => {
      startSimulationRef.current()
    }
    (window as any).adminCancelOrder = (orderId: number) => {
      adminCancelOrderRef.current(orderId)
    }
    (window as any).adminAssignOrder = (orderId: number) => {
      adminAssignOrderRef.current(orderId)
    }

    return () => {
      delete (window as any).selectTruckAndPrepareDispatch
      delete (window as any).clearTruckDispatch
      delete (window as any).confirmTemporaryDestination
      delete (window as any).adminCancelOrder
      delete (window as any).adminAssignOrder
    }
  }, [trucks])

  // Carga asíncrona de Leaflet mediante CDN para evitar bugs clásicos de Vite assets
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = () => {
      if ((window as any).L) {
        initMap()
        return
      }

      // 1. Cargar CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)

      // 2. Cargar JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => {
        isLeafletLoaded.current = true
        initMap()
      }
      document.body.appendChild(script)
    }

    loadLeaflet()

    // Observer para el tema (Claro/Oscuro) en Leaflet
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
      // Limpieza del mapa al desmontar
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Inicializar Mapa
  const initMap = () => {
    const L = (window as any).L
    if (!L || mapRef.current) return

    // Coordenadas iniciales en Santiago Centro
    mapRef.current = L.map('fleet-map', {
      zoomControl: false // Desactivamos el control por defecto para poner uno elegante en otra esquina
    }).setView([-33.4489, -70.6693], 12)

    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapRef.current)

    // Capa de mapa dinámica (claro vs oscuro)
    const isLight = document.documentElement.classList.contains('theme-light')
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
      maxNativeZoom: 19,
      className: isLight ? '' : 'map-dark-mode'
    }).addTo(mapRef.current)

    mapRef.current.on('dragstart', () => {
      setFollowedTruckId(null)
    })

    // Cargar datos iniciales
    fetchLocations(true)
  }


  const fetchLocations = useCallback(async (shouldCenter = false) => {
    if (typeof window === 'undefined') return
    const L = (window as any).L
    if (!L || !mapRef.current) return

    try {
      setRefreshing(true)
      const response = await fetch('/trucks/locations')
      const data = await response.json()
      setTrucks(data.trucks || [])
      setOrders(data.orders || [])
      setLoading(false)
      setRefreshing(false)

      updateMapMarkers(data.trucks || [], data.orders || [], shouldCenter)
    } catch (error) {
      console.error("Error cargando ubicaciones de camiones:", error)
      setLoading(false)
      setRefreshing(false)
    }
  }, [])
  useActionCable('OrdersChannel', (payload) => {
    if (payload.action === 'new_order') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const ctx = new AudioContext()
          
          // En navegadores modernos, si ya hubo interacción previa en el dominio,
          // resume() lo desbloquea inmediatamente aunque se llame asíncronamente
          if (ctx.state === 'suspended') {
            ctx.resume()
          }

          const playTone = (freq: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, startTime)
            gain.gain.setValueAtTime(0, startTime)
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(startTime)
            osc.stop(startTime + duration)
          }
          const now = ctx.currentTime
          playTone(880, now, 0.15)
          playTone(1108.73, now + 0.1, 0.3)
        }
      } catch (e) { console.log('Audio error', e) }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: '¡Nuevo Pedido Recibido!',
        text: `${payload.order?.client_name || 'Cliente'} en ${payload.order?.address || 'ubicación'}`,
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        background: 'var(--sf-glass-panel-bg1)',
        color: 'white',
        iconColor: '#38bdf8' // sky-400
      })
    }
    // We just refresh the map on any order event (created, accepted, completed, cancelled)
    fetchLocations(false)
  })

  // Polling continuo cada 15 segundos (fallback)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLocations(false)
    }, 15000)

    return () => clearInterval(timer)
  }, [fetchLocations])


  // Actualizar marcadores, destinos y polilíneas dinámicamente
  const updateMapMarkers = (truckList: TruckData[], ordersList: any[], shouldCenter = false) => {
    const L = (window as any).L
    if (!L || !mapRef.current) return

    const bounds: any[] = []

    truckList.forEach(truck => {
      if (!truck.latitude || !truck.longitude) return

      const truckPos: [number, number] = [truck.latitude, truck.longitude]
      bounds.push(truckPos)

      // --- 1. MANEJAR MARCADOR DE CAMIÓN ---
      // Marcador personalizado con Tailwind, patente y animación pulsante
      const truckIconHtml = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-2xl transition-all duration-300 ${
            truck.gps_active
              ? 'bg-emerald-500 border-emerald-300 text-[var(--sf-text-main)] shadow-emerald-500/30'
              : truck.has_real_gps
                ? 'bg-amber-500 border-amber-300 text-amber-950 shadow-amber-500/30'
                : 'bg-primary-500 border-primary-300 text-[var(--sf-text-main)] shadow-primary-500/30'
          }">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10a2 2 0 0 0 2 2z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          </div>
          ${
            truck.gps_active 
              ? '<span class="absolute top-0 right-0 flex h-3.5 w-3.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span></span>'
              : truck.has_real_gps
                ? '<span class="absolute top-0 right-0 flex h-3.5 w-3.5"><span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span></span>'
                : ''
          }
          <div class="px-1.5 py-0.5 mt-1 bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded shadow text-[9px] font-black text-[var(--sf-text-main)] font-mono tracking-widest uppercase">
            ${formatPlate(truck.plate_number)}
          </div>
        </div>
      `

      const customTruckIcon = L.divIcon({
        className: 'custom-truck-marker',
        html: truckIconHtml,
        iconSize: [40, 60],
        iconAnchor: [20, 45]
      })

      // Popup visualmente premium con colores de alto contraste y botones interactivos
      const popupContent = `
        <div class="p-3.5 min-w-[220px] text-slate-200 font-sans leading-relaxed">
          <div class="flex items-center justify-between border-b border-[var(--sf-border)] pb-2 mb-2.5">
            <span class="font-mono font-black text-sm text-primary-400 tracking-wider">${formatPlate(truck.plate_number)}</span>
            <span class="px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded border ${
              truck.gps_active
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
            }">${truck.gps_active ? 'GPS Real' : 'Simulado'}</span>
          </div>
          
          <p class="text-xs font-semibold mb-2.5 text-slate-300">
            Chofer: <span class="text-[var(--sf-text-main)] font-bold ml-1">${truck.driver_name || 'Sin Chofer'}</span>
            ${truck.driver_phone ? `<br/><span class="text-[10px] text-slate-400 font-mono mt-0.5 block">📞 ${truck.driver_phone}</span>` : ''}
          </p>

          <div class="space-y-1.5 bg-white/5 p-2 rounded-xl border border-[var(--sf-border)] mb-3">
            <p class="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Carga Actual</p>
            <div class="flex justify-between text-xs">
              <span class="text-primary-300 font-medium">Llenos:</span>
              <span class="font-black text-[var(--sf-text-main)]">${truck.total_llenos} cil.</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-purple-300 font-medium">Envases Vacíos:</span>
              <span class="font-black text-[var(--sf-text-main)]">${truck.total_vacios} uds.</span>
            </div>
          </div>

          ${
            truck.destination
              ? (() => {
                  const countdown = getDepartureCountdown(truck.departure_time)
                  const departureStatusHtml = countdown !== null 
                    ? `<span class="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-black text-[9px] animate-pulse">⏳ Partida en ${countdown}s</span>`
                    : `<span class="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[9px] uppercase tracking-wider">En Ruta 🚀</span>`
                  return `
                  <div class="mt-2.5 pt-2.5 border-t border-[var(--sf-border)] flex items-center justify-between gap-2.5">
                    <div class="overflow-hidden flex-1">
                      <div class="flex items-center gap-1.5 mb-1.5">
                        <span class="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Destino Despacho</span>
                        ${departureStatusHtml}
                      </div>
                      <p class="text-xs font-black text-[var(--sf-text-main)] truncate">${truck.destination.client_name}</p>
                      <p class="text-[10px] text-slate-400 truncate mt-0.5">${truck.destination.address}</p>
                    </div>
                    <button 
                      onclick="window.clearTruckDispatch(${truck.id})"
                      class="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--sf-text-main)] bg-rose-600 hover:bg-rose-500 border border-rose-500/30 rounded-lg transition-all cursor-pointer shadow-lg shadow-rose-950/20 active:scale-95 shrink-0"
                    >
                      Cancelar Despacho
                    </button>
                  </div>
                  `
                })()
              : ''
          }
        </div>
      `

      if (markersRef.current[truck.id]) {
        // Actualizar posición e icono suavemente
        markersRef.current[truck.id].setLatLng(truckPos)
        markersRef.current[truck.id].setIcon(customTruckIcon)
        markersRef.current[truck.id].setPopupContent(popupContent)
      } else {
        // Crear marcador nuevo
        const marker = L.marker(truckPos, { icon: customTruckIcon })
          .addTo(mapRef.current)
          .bindPopup(popupContent)
        
        marker.on('click', () => {
          setSelectedTruckId(truck.id)
          setIsListExpanded(false)
          setIsDetailExpanded(true)
        })

        markersRef.current[truck.id] = marker
      }

      if (followedTruckIdRef.current === truck.id) {
        mapRef.current.setView(truckPos, mapRef.current.getZoom() || 15)
      }

      // --- 2. MANEJAR MARCADOR DE CLIENTE (DESTINO DESPACHO DIRECTO) ---
      if (truck.destination) {
        const destPos: [number, number] = [truck.destination.latitude, truck.destination.longitude]
        bounds.push(destPos)

        const destIconHtml = `
          <div class="flex flex-col items-center">
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div class="px-1.5 py-0.5 mt-0.5 bg-rose-950 border border-rose-500/30 rounded shadow text-[8px] font-black text-rose-300 max-w-[90px] truncate">
              ${truck.destination.client_name}
            </div>
          </div>
        `

        const destIcon = L.divIcon({
          className: 'custom-destination-marker',
          html: destIconHtml,
          iconSize: [30, 50],
          iconAnchor: [15, 35]
        })

        const destPopupContent = `
          <div class="p-2 text-[var(--sf-text-main)]">
            <p class="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Cliente de Despacho</p>
            <h4 class="font-black text-sm text-[var(--sf-text-main)] mb-1">${truck.destination.client_name}</h4>
            <p class="text-xs text-gray-300">${truck.destination.address}</p>
            <p class="text-[10px] text-gray-500 mt-2">Camión Asignado: <span class="font-mono text-primary-400">${formatPlate(truck.plate_number)}</span></p>
          </div>
        `

        if (destinationsRef.current[truck.id]) {
          destinationsRef.current[truck.id].setLatLng(destPos)
          destinationsRef.current[truck.id].setIcon(destIcon)
          destinationsRef.current[truck.id].setPopupContent(destPopupContent)
        } else {
          const destMarker = L.marker(destPos, { icon: destIcon })
            .addTo(mapRef.current)
            .bindPopup(destPopupContent)
          
          destinationsRef.current[truck.id] = destMarker
        }

        // --- 3. TRAZAR LÍNEA DISCONTINUA DE RUTA POR CALLES REALES ---
        const pathPoints: [number, number][] = []
        pathPoints.push(truckPos)
        
        if (truck.route_coords && truck.route_coords.length > 0) {
          // Filtrar los puntos ya recorridos para que la línea empiece exactamente en la posición del camión
          // Buscamos el punto de la ruta más cercano a la posición actual del camión
          let closestIdx = 0
          let minDist = Infinity
          truck.route_coords.forEach((pt, idx) => {
            const d = Math.sqrt(((pt[0] - truckPos[0])**2) + ((pt[1] - truckPos[1])**2))
            if (d < minDist) {
              minDist = d
              closestIdx = idx
            }
          })
          
          // Agregamos sólo los puntos restantes de la ruta por recorrer
          for (let i = closestIdx; i < truck.route_coords.length; i++) {
            pathPoints.push(truck.route_coords[i])
          }
        }
        
        pathPoints.push(destPos)

        if (pathsRef.current[truck.id]) {
          pathsRef.current[truck.id].setLatLngs(pathPoints)
        } else {
          const line = L.polyline(pathPoints, {
            color: '#a855f7',
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(mapRef.current)

          pathsRef.current[truck.id] = line
        }
      } else {
        // Si ya no tiene destino, limpiar elementos visuales asociados
        if (destinationsRef.current[truck.id]) {
          destinationsRef.current[truck.id].remove()
          delete destinationsRef.current[truck.id]
        }
        if (pathsRef.current[truck.id]) {
          pathsRef.current[truck.id].remove()
          delete pathsRef.current[truck.id]
        }
      }
    })

    // --- 4. MANEJAR MARCADORES DE PEDIDOS (CUSTOMER ORDERS) ---
    // Recopilamos IDs actuales para eliminar los que ya no están
    const currentOrderIds = new Set(ordersList.map(o => o.id))
    Object.keys(ordersMarkersRef.current).forEach(idStr => {
      const orderId = parseInt(idStr)
      if (!currentOrderIds.has(orderId)) {
        ordersMarkersRef.current[orderId].remove()
        delete ordersMarkersRef.current[orderId]
      }
    })

    ordersList.forEach(order => {
      if (!order.latitude || !order.longitude) return
      
      const orderPos: [number, number] = [order.latitude, order.longitude]
      bounds.push(orderPos)

      // Colores dependiendo del estado
      let bgColor = 'bg-sky-500'
      let borderColor = 'border-sky-300'
      let shadowColor = 'shadow-sky-500/30'
      let statusText = 'Pendiente'
      
      if (order.status === 'accepted' || order.status === 'in_transit') {
        bgColor = 'bg-primary-500'
        borderColor = 'border-primary-300'
        shadowColor = 'shadow-primary-500/30'
        statusText = 'En Camino'
      }

      const orderIconHtml = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-xl ${bgColor} ${borderColor} text-white ${shadowColor}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </div>
          <div class="px-1.5 py-0.5 mt-1 bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded shadow text-[8px] font-black text-[var(--sf-text-main)] uppercase truncate max-w-[80px]">
            ${order.client_name.split(' ')[0]}
          </div>
        </div>
      `

      const customOrderIcon = L.divIcon({
        className: 'custom-order-marker',
        html: orderIconHtml,
        iconSize: [30, 45],
        iconAnchor: [15, 35]
      })

      const popupContent = `
        <div class="p-3 min-w-[200px] text-slate-200 font-sans leading-relaxed">
          <div class="flex items-center justify-between border-b border-[var(--sf-border)] pb-2 mb-2.5">
            <span class="font-black text-sm text-sky-400 truncate pr-2">${order.client_name}</span>
            <span class="px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded border border-[var(--sf-border)] bg-white/10 text-[var(--sf-text-main)] shrink-0">${statusText}</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-[10px] text-slate-400 truncate">${order.address}</p>
            <span class="text-[9px] font-bold text-emerald-400 ml-2 shrink-0">${formatTimeAgo(order.created_at)}</span>
          </div>
          <div class="bg-[var(--sf-surface)] rounded-lg p-2 border border-[var(--sf-border)] mb-2">
            <p class="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">Detalle del Pedido</p>
            ${order.details?.quick_order ? `
              <p class="text-xs font-medium text-[var(--sf-text-main)] flex items-center gap-1.5">⚡ ${order.details.quick_order}</p>
            ` : order.details?.items?.length > 0 ? `
              <div class="space-y-1 mt-1.5">
                ${order.details.items.map((item: any) => `
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-300 truncate pr-2">📦 ${item.name}</span>
                    <span class="font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">${item.quantity}x</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-xs font-medium text-slate-400 italic">Sin detalle</p>
            `}
          </div>
          ${order.truck_id ? `<p class="text-[9px] text-primary-300 font-bold uppercase text-center mt-2 border-t border-[var(--sf-border)] pt-2">Asignado a camión ID #${order.truck_id}</p>` : ''}
          <button onclick="window.adminCancelOrder(${order.id})" class="mt-2 w-full py-2 text-[9px] uppercase tracking-wider font-black bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 rounded transition-colors shadow-sm">
            Rechazar Pedido
          </button>
          ${!order.truck_id ? `<button onclick="window.adminAssignOrder(${order.id})" class="mt-1 w-full py-2 text-[9px] uppercase tracking-wider font-black bg-primary-600/20 hover:bg-primary-600/40 text-primary-400 border border-primary-500/30 rounded transition-colors shadow-sm">Asignar a Chofer</button>` : ''}
        </div>
      `

      if (ordersMarkersRef.current[order.id]) {
        ordersMarkersRef.current[order.id].setLatLng(orderPos)
        ordersMarkersRef.current[order.id].setIcon(customOrderIcon)
        ordersMarkersRef.current[order.id].setPopupContent(popupContent)
      } else {
        const marker = L.marker(orderPos, { icon: customOrderIcon })
          .addTo(mapRef.current)
          .bindPopup(popupContent)
        ordersMarkersRef.current[order.id] = marker
      }
    })

    // Centrar mapa inicialmente para abarcar todos los camiones activos
    if (shouldCenter && bounds.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] })
    }
  }

  // Volar suavemente hacia un camión específico
  const flyToTruck = (truck: TruckData) => {
    if (!truck.latitude || !truck.longitude || !mapRef.current) return
    
    setSelectedTruckId(truck.id)
    setIsListExpanded(false)
    setIsDetailExpanded(true)
    mapRef.current.flyTo([truck.latitude, truck.longitude], 15, {
      animate: true,
      duration: 1.5
    })

    // Abrir popup de forma programada
    const marker = markersRef.current[truck.id]
    if (marker) {
      setTimeout(() => {
        marker.openPopup()
      }, 1500)
    }
  }

  const selectedTruck = trucks.find(t => t.id === selectedTruckId)

  return (
    <AuthenticatedLayout>
      <Head title="Mapa de Flota en Vivo" />
      
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Header Superior */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)]/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/trucks" className="p-2 rounded-xl bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-border)] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[var(--sf-text-main)] tracking-tight">Monitoreo de Flota</h1>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tracking-wider">En Vivo</span>
              </div>
              <p className="text-xs text-[var(--sf-text-muted)] mt-0.5">Seguimiento cartográfico de camiones y despacho directo.</p>
            </div>
          </div>
          
          <button 
            onClick={() => fetchLocations(false)} 
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-main)] hover:bg-[var(--sf-border)] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>

        {/* Panel Principal */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* MAPA (Leaflet) */}
          <div id="fleet-map" className="flex-1 h-full z-0 bg-slate-950" />

          {/* Botón flotante para nuevo pedido */}
          <button
            onClick={() => { 
              if (isOrderModalOpen) {
                setIsOrderModalOpen(false)
              } else {
                setOrderStep(1)
                setIsOrderModalOpen(true)
                clearTempMarker()
                setIsCapturingCoords(false)
              }
            }}
            className={`absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-[400] flex items-center gap-2 px-5 py-3 lg:px-6 lg:py-4 rounded-full font-black text-sm uppercase shadow-2xl transition-all border ${
              isOrderModalOpen ? 'bg-amber-500 text-amber-950 border-amber-400' : 'bg-primary-600 hover:bg-primary-500 text-white border-primary-500/50'
            }`}
          >
            <Package className="w-5 h-5" /> {isOrderModalOpen ? 'Cerrar' : 'Nuevo Pedido'}
          </button>

          {/* Banner de ayuda interactiva cuando se capturan coordenadas */}
          {isCapturingCoords && (
            <>
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="glass-panel text-[var(--sf-text-main)] px-4 py-2 rounded-full font-bold text-xs shadow-xl border border-[var(--sf-border)] animate-bounce">
                  Mueve el mapa para ajustar
                </div>
              </div>

              {/* Pin Fijo en el centro */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none mt-2">
                <div className="flex flex-col items-center relative">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-[var(--sf-surface)] rounded-full blur-[1.5px]"></div>
                  
                  <div className="relative text-amber-500 drop-shadow-[0_10px_10px_rgba(245,158,11,0.5)] animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3" fill="white" stroke="none" />
                    </svg>
                  </div>

                  <div className="absolute top-[-20px] px-3 py-1 glass-panel text-[var(--sf-text-main)] text-[10px] font-black rounded-full shadow-xl whitespace-nowrap border border-[var(--sf-border)]">
                    Destino
                  </div>
                </div>
              </div>

              {/* Botones Flotantes Inferiores */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsCapturingCoords(false); }}
                  className="px-6 py-4 rounded-full font-black text-sm uppercase shadow-2xl transition-all border bg-slate-800 hover:bg-slate-700 text-[var(--sf-text-main)] border-[var(--sf-border)] active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (mapRef.current) {
                      const center = mapRef.current.getCenter()
                      setLatitude(center.lat)
                      setLongitude(center.lng)
                      
                      // Auto Reverse Geocode for convenience
                      fetch(`/api/v1/reverse_geocode?lat=${center.lat}&lon=${center.lng}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data && data.display_name) {
                            const parts = data.display_name.split(', ')
                            const shortAddress = parts.slice(0, 3).join(', ')
                            setNewOrderForm(prev => ({ ...prev, address: shortAddress }))
                          }
                        })
                        .catch(err => console.error('Error reverse geocoding:', err))
                    }
                    setIsCapturingCoords(false)
                    setIsOrderModalOpen(true)
                  }}
                  className="px-8 py-4 rounded-full font-black text-sm uppercase shadow-2xl transition-all border bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 border-amber-400 active:scale-95"
                >
                  Confirmar Destino
                </button>
              </div>
            </>
          )}

          {/* SIDEBAR FLOTANTE DE CONTROL (Glassmorphic) */}
          <div className="absolute top-4 left-4 z-10 w-96 max-h-[calc(100%-32px)] bg-[var(--sf-surface)]/70 backdrop-blur-xl border border-[var(--sf-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            
            {/* Cabecera del Acordeón para la Lista de Vehículos */}
            <div 
              onClick={() => {
                setIsListExpanded(!isListExpanded)
                if (!isListExpanded) {
                  setIsDetailExpanded(false)
                  setIsOrdersListExpanded(false)
                }
              }}
              className="p-4 border-b border-[var(--sf-border)] bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors select-none shrink-0"
            >
              <h2 className="font-bold text-sm text-[var(--sf-text-main)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-400" />
                Vehículos ({trucks.length})
              </h2>
              <div className="flex items-center gap-2.5">
                {refreshing && <span className="text-[10px] font-medium text-primary-400 animate-pulse">Actualizando...</span>}
                <span className="text-gray-400 hover:text-[var(--sf-text-main)] transition-colors text-[10px]">
                  {isListExpanded ? '▲ COLAPSAR' : '▼ EXPANDIR'}
                </span>
              </div>
            </div>

            {/* Contenido de la Lista de Vehículos */}
            <div className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isListExpanded ? 'flex-1 flex flex-col' : 'h-0 border-b-0'}`}>
              {isListExpanded && (
                <div className="p-3 border-b border-[var(--sf-border)] shrink-0 bg-[var(--sf-surface-hover)]">
                  <input
                    type="text"
                    placeholder="Buscar por patente o chofer..."
                    value={searchTruck}
                    onChange={(e) => setSearchTruck(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg px-3 py-2 text-xs text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)] focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50"
                  />
                </div>
              )}
              {loading ? (
                <div className="p-8 text-center text-[var(--sf-text-muted)] flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
                  <p className="text-xs font-bold">Cargando mapa y flota...</p>
                </div>
              ) : (
                <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                  {trucks.filter(t => t.plate_number.toLowerCase().includes(searchTruck.toLowerCase()) || (t.driver_name && t.driver_name.toLowerCase().includes(searchTruck.toLowerCase()))).length === 0 ? (
                    <div className="p-8 text-center text-[var(--sf-text-muted)] italic text-xs">
                      No se encontraron vehículos.
                    </div>
                  ) : (
                    trucks.filter(t => t.plate_number.toLowerCase().includes(searchTruck.toLowerCase()) || (t.driver_name && t.driver_name.toLowerCase().includes(searchTruck.toLowerCase()))).map(truck => {
                      const countdown = getDepartureCountdown(truck.departure_time)
                      return (
                        <div 
                          key={truck.id}
                          onClick={() => flyToTruck(truck)}
                          className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                            selectedTruckId === truck.id
                              ? 'bg-primary-500/10 border-primary-500/50 shadow-lg shadow-primary-500/5'
                              : 'bg-[var(--sf-surface)] hover:bg-[var(--sf-surface-hover)] border-[var(--sf-border)] hover:border-[var(--sf-border)]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-lg ${
                                truck.gps_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary-500/10 text-primary-400'
                              }`}>
                                <TruckIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-mono font-black text-sm text-[var(--sf-text-main)] tracking-widest block">
                                  {formatPlate(truck.plate_number)}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {truck.driver_name}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded border flex items-center gap-1 ${
                              truck.gps_active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                            }`}>
                              {truck.gps_active ? (
                                <><Wifi className="w-2.5 h-2.5" /> GPS Real</>
                              ) : (
                                <><Compass className="w-2.5 h-2.5" /> Simulado</>
                              )}
                            </span>
                          </div>

                          {/* Info de stock a bordo */}
                          <div className="mt-3 grid grid-cols-2 gap-2 bg-[var(--sf-surface)] p-2 rounded-lg border border-[var(--sf-border)]">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Package className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                              <span className="text-gray-400">Llenos:</span>
                              <strong className="text-[var(--sf-text-main)] ml-auto">{truck.total_llenos}</strong>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <Box className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span className="text-gray-400">Vacíos:</span>
                              <strong className="text-[var(--sf-text-main)] ml-auto">{truck.total_vacios}</strong>
                            </div>
                          </div>

                          {/* Alerta de Despacho Activo */}
                          {truck.destination && (
                            <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-[10px]">
                              <Home className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="text-gray-300 font-medium">Despacho Directo:</span>
                              <strong className="text-rose-300 truncate max-w-[100px]">{truck.destination.client_name}</strong>
                              
                              {countdown !== null ? (
                                <span className="ml-auto px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-black text-[9px] animate-pulse whitespace-nowrap">
                                  ⏳ Partida {countdown}s
                                </span>
                              ) : (
                                <span className="ml-auto flex items-center gap-1 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                  En Ruta
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Cabecera del Acordeón para la Lista de Pedidos */}
            <div 
              onClick={() => {
                setIsOrdersListExpanded(!isOrdersListExpanded)
                if (!isOrdersListExpanded) {
                  setIsListExpanded(false)
                  setIsDetailExpanded(false)
                }
              }}
              className="p-4 border-b border-[var(--sf-border)] bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors select-none shrink-0"
            >
              <h2 className="font-bold text-sm text-[var(--sf-text-main)] flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Pedidos Activos ({orders.length})
              </h2>
              <div className="flex items-center gap-2.5">
                <span className="text-gray-400 hover:text-[var(--sf-text-main)] transition-colors text-[10px]">
                  {isOrdersListExpanded ? '▲ COLAPSAR' : '▼ EXPANDIR'}
                </span>
              </div>
            </div>

            {/* Contenido de la Lista de Pedidos */}
            <div className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isOrdersListExpanded ? 'flex-1 flex flex-col border-b border-[var(--sf-border)] bg-white/5' : 'h-0'}`}>
              {isOrdersListExpanded && (
                <div className="p-3 border-b border-[var(--sf-border)] shrink-0 bg-[var(--sf-surface-hover)]">
                  <input
                    type="text"
                    placeholder="Buscar por cliente o dirección..."
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg px-3 py-2 text-xs text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              )}
              <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                {orders.filter((o: any) => o.client_name.toLowerCase().includes(searchOrder.toLowerCase()) || o.address.toLowerCase().includes(searchOrder.toLowerCase())).length === 0 ? (
                  <div className="p-8 text-center text-[var(--sf-text-muted)] italic text-xs">
                    No se encontraron pedidos.
                  </div>
                ) : (
                  orders.filter((o: any) => o.client_name.toLowerCase().includes(searchOrder.toLowerCase()) || o.address.toLowerCase().includes(searchOrder.toLowerCase())).map((order: any) => {
                    const isPending = order.status === 'pending'
                    const isAccepted = order.status === 'accepted' || order.status === 'in_transit'
                    return (
                      <div 
                        key={order.id}
                        onClick={() => {
                          if (order.latitude && order.longitude && mapRef.current) {
                            mapRef.current.flyTo([order.latitude, order.longitude], 16, { animate: true, duration: 1.5 })
                            const marker = ordersMarkersRef.current[order.id]
                            if (marker) setTimeout(() => marker.openPopup(), 1500)
                          }
                        }}
                        className="p-3 rounded-xl border bg-[var(--sf-surface)] hover:bg-[var(--sf-surface-hover)] border-[var(--sf-border)] hover:border-[var(--sf-border)] transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-black text-sm text-[var(--sf-text-main)] block">{order.client_name}</span>
                            <span className="text-[10px] text-gray-400 block truncate max-w-[180px]">{order.address}</span>
                            <details className="mt-2 group" onClick={(e) => e.stopPropagation()}>
                              <summary className="text-[10px] text-slate-300 font-medium cursor-pointer select-none hover:text-[var(--sf-text-main)] transition-colors list-none flex items-center gap-1">
                                <span className="text-[8px] opacity-50 transition-transform group-open:rotate-90">▶</span>
                                Ver detalle
                              </summary>
                              <div className="mt-1.5 pl-3 border-l-2 border-slate-700/50 space-y-1">
                                {order.details?.quick_order ? (
                                  <p className="text-[10px] text-slate-300">⚡ {order.details.quick_order}</p>
                                ) : order.details?.items?.length > 0 ? (
                                  order.details.items.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 truncate pr-2">{item.name}</span>
                                      <span className="font-bold text-primary-400">{item.quantity}x</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic">Sin detalle</p>
                                )}
                              </div>
                            </details>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded border ${
                              isPending ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                            }`}>
                              {isPending ? 'Pendiente' : 'En Camino'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAdminCancelOrder(order.id)
                              }}
                              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider"
                            >
                              Rechazar
                            </button>
                            {!order.truck_id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAdminAssignOrder(order.id)
                                }}
                                className="text-[9px] font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-wider"
                              >
                                Asignar
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">{formatTimeAgo(order.created_at)}</span>
                          {order.truck_id && <span className="font-mono text-primary-400 font-bold">Camión #{order.truck_id}</span>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Cabecera del Acordeón para la Lista de Clientes */}
            <div 
              onClick={() => {
                setIsCustomersListExpanded(!isCustomersListExpanded)
                if (!isCustomersListExpanded) {
                  setIsListExpanded(false)
                  setIsDetailExpanded(false)
                  setIsOrdersListExpanded(false)
                }
              }}
              className="p-4 border-b border-[var(--sf-border)] bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors select-none shrink-0"
            >
              <h2 className="font-bold text-sm text-[var(--sf-text-main)] flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Clientes (CRM)
              </h2>
              <div className="flex items-center gap-2.5">
                <span className="text-gray-400 hover:text-[var(--sf-text-main)] transition-colors text-[10px]">
                  {isCustomersListExpanded ? '▲ COLAPSAR' : '▼ EXPANDIR'}
                </span>
              </div>
            </div>

            {/* Contenido de la Lista de Clientes */}
            <div className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isCustomersListExpanded ? 'flex-1 flex flex-col border-b border-[var(--sf-border)] bg-white/5' : 'h-0 border-b-0'}`}>
              {isCustomersListExpanded && (
                <div className="p-3 border-b border-[var(--sf-border)] shrink-0 bg-[var(--sf-surface-hover)]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--sf-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, teléfono..."
                      value={searchCustomer}
                      onChange={(e) => setSearchCustomer(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                    />
                    {isSearchingCustomers && (
                      <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400 animate-spin" />
                    )}
                  </div>
                </div>
              )}
              <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                {searchCustomer.trim().length > 0 && searchCustomer.trim().length < 2 ? (
                  <div className="p-8 text-center text-[var(--sf-text-muted)] italic text-xs">
                    Escribe al menos 2 letras para buscar.
                  </div>
                ) : customersList.length === 0 ? (
                  <div className="p-8 text-center text-[var(--sf-text-muted)] italic text-xs">
                    {isSearchingCustomers ? 'Buscando...' : 'No se encontraron clientes.'}
                  </div>
                ) : (
                  customersList.map((customer: any) => (
                    <div 
                      key={customer.id}
                      className="p-3 rounded-xl border bg-[var(--sf-surface)] border-[var(--sf-border)]"
                    >
                      <div className="flex items-start justify-between mb-2 border-b border-[var(--sf-border)] pb-2">
                        <div>
                          <span className="font-black text-sm text-[var(--sf-text-main)] block">{customer.first_name} {customer.last_name}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{customer.phone}</span>
                        </div>
                      </div>
                      
                      {customer.addresses?.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Direcciones Guardadas</p>
                          {customer.addresses.map((addr: any) => (
                            <button
                              key={addr.id}
                              onClick={() => {
                                setNewOrderForm({
                                  ...newOrderForm,
                                  client_name: `${customer.first_name} ${customer.last_name}`,
                                  phone: customer.phone,
                                  address: addr.address,
                                })
                                setLatitude(addr.latitude || null)
                                setLongitude(addr.longitude || null)
                                setIsOrderModalOpen(true)
                                if (addr.latitude && addr.longitude && mapRef.current) {
                                  mapRef.current.flyTo([addr.latitude, addr.longitude], 17)
                                }
                              }}
                              className="w-full text-left p-2 rounded-lg bg-[var(--sf-surface-hover)] hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-colors group flex items-start gap-2"
                            >
                              <MapPin className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-[var(--sf-text-main)] line-clamp-1">{addr.address}</p>
                                {addr.reference && <p className="text-[9px] text-gray-500 line-clamp-1 mt-0.5">{addr.reference}</p>}
                              </div>
                              <span className="text-[9px] font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">Pedir</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic">Sin direcciones guardadas.</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cabecera del Acordeón para el Detalle del Camión Seleccionado */}
            {selectedTruck && (
              <div 
                onClick={() => {
                  setIsDetailExpanded(!isDetailExpanded)
                  if (!isDetailExpanded) {
                    setIsListExpanded(false)
                    setIsOrdersListExpanded(false)
                  }
                }}
                className="p-4 border-t border-[var(--sf-border)] bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors select-none shrink-0"
              >
                <h3 className="font-bold text-sm text-[var(--sf-text-main)] flex items-center gap-2">
                  <TruckIcon className="w-4 h-4 text-primary-400 animate-pulse" />
                  Detalle Camión: {formatPlate(selectedTruck.plate_number)}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (followedTruckId === selectedTruck.id) {
                        setFollowedTruckId(null)
                      } else {
                        setFollowedTruckId(selectedTruck.id)
                        flyToTruck(selectedTruck)
                      }
                    }}
                    className={`px-2 py-1 text-[9px] font-black uppercase rounded border transition-colors ${
                      followedTruckId === selectedTruck.id
                        ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/30'
                        : 'bg-transparent text-primary-400 border-primary-500/50 hover:bg-primary-500/20'
                    }`}
                  >
                    {followedTruckId === selectedTruck.id ? 'Dejar de Seguir' : 'Seguir'}
                  </button>
                  <span className="text-gray-400 hover:text-[var(--sf-text-main)] transition-colors text-[10px]">
                    {isDetailExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            )}

            {/* Contenido del Detalle (Ficha Resumen) */}
            {selectedTruck && (
              <div className={`transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isDetailExpanded ? 'flex-1 p-4 border-t border-[var(--sf-border)] bg-white/5 overflow-y-auto gap-3' : 'h-0'}`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-black text-xs uppercase tracking-wider text-gray-400">Rendimiento Hoy</h3>
                  </div>
                  {selectedTruck.metrics && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                        <span className="block text-[10px] uppercase font-bold text-emerald-400 mb-0.5">Completados</span>
                        <span className="block text-lg font-black text-[var(--sf-text-main)]">{selectedTruck.metrics.completed}</span>
                      </div>
                      <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-2 text-center">
                        <span className="block text-[10px] uppercase font-bold text-primary-400 mb-0.5">En Curso</span>
                        <span className="block text-lg font-black text-[var(--sf-text-main)]">{selectedTruck.metrics.accepted}</span>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 text-center">
                        <span className="block text-[10px] uppercase font-bold text-rose-400 mb-0.5">Cancelados</span>
                        <span className="block text-lg font-black text-[var(--sf-text-main)]">{selectedTruck.metrics.cancelled}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-2 pt-2 border-t border-[var(--sf-border)]">
                    <h3 className="font-black text-xs uppercase tracking-wider text-gray-400">Bodega Móvil</h3>
                    <span className="text-[10px] font-mono text-gray-400 italic font-medium">{selectedTruck.warehouse_name}</span>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {selectedTruck.products.length === 0 && selectedTruck.materials.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic text-center py-2">Sin stock cargado a bordo.</p>
                    ) : (
                      <>
                        {selectedTruck.products.map((prod, idx) => (
                          <div key={`prod-${idx}`} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 truncate max-w-[180px]">{prod.name}</span>
                            <span className="font-black text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/10 shrink-0">
                              {prod.quantity} unidades
                            </span>
                          </div>
                        ))}
                        {selectedTruck.materials.map((mat, idx) => (
                          <div key={`mat-${idx}`} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 truncate max-w-[180px] font-medium italic">{mat.name} (Vacío)</span>
                            <span className="font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10 shrink-0">
                              {mat.quantity} unidades
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Panel de Despacho Express / Simulación */}
                {selectedTruck.destination ? (
                  <div className="pt-3 border-t border-[var(--sf-border)]">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <span className="text-[8px] uppercase tracking-wider text-rose-400 font-extrabold block mb-1">Ruta de Despacho Activa</span>
                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="font-black text-xs text-[var(--sf-text-main)] truncate max-w-[120px]">{selectedTruck.destination.client_name}</h4>
                          {getDepartureCountdown(selectedTruck.departure_time) !== null ? (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-black text-[9px] animate-pulse whitespace-nowrap">
                              ⏳ Espera: {getDepartureCountdown(selectedTruck.departure_time)}s
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[9px] uppercase tracking-wider whitespace-nowrap">
                              En Ruta 🚀
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{selectedTruck.destination.address}</p>
                        <p className="text-[9px] font-mono text-gray-500 mt-1">Lat: {selectedTruck.destination.latitude.toFixed(4)}, Lng: {selectedTruck.destination.longitude.toFixed(4)}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleClearDestination(selectedTruck.id); }}
                        className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--sf-text-main)] bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/30 rounded-lg transition-all shrink-0 active:scale-95"
                      >
                        Cancelar Despacho
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

          </div>

        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          /* Estilos Oscuros/Glassmorphic premium para Popups de Leaflet */
          .leaflet-popup-content-wrapper {
            background: rgba(15, 23, 42, 0.93) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 16px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75) !important;
          }

          .leaflet-popup-content {
            margin: 0 !important;
            padding: 0 !important;
          }

          .leaflet-popup-tip {
            background: rgba(15, 23, 42, 0.93) !important;
            border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          }

          .leaflet-container a.leaflet-popup-close-button {
            color: rgba(255, 255, 255, 0.4) !important;
            padding: 10px 10px 0 0 !important;
            font-size: 16px !important;
            font-weight: 300 !important;
            transition: color 0.2s ease !important;
          }

          .leaflet-container a.leaflet-popup-close-button:hover {
            color: #ffffff !important;
            background: none !important;
          }

          /* Marcadores y polilíneas personalizadas */
          .custom-truck-marker, .custom-destination-marker, .temp-destination-marker {
            transition: transform 0.2s ease-out !important;
          }
        `}} />

        {/* Modal UI */}
        {isOrderModalOpen && (
          <div className="absolute inset-0 z-[1000] bg-[var(--sf-surface)] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-6 w-full max-w-md md:max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
              <h2 className="text-xl font-black text-[var(--sf-text-main)] mb-2 flex items-center gap-2 shrink-0">
                <Package className="text-primary-400" /> Crear Pedido Manual
              </h2>
              
              <div className="flex items-center gap-2 mb-6 shrink-0">
                <div className={`h-1.5 flex-1 rounded-full ${orderStep >= 1 ? 'bg-primary-500' : 'bg-white/10'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${orderStep >= 2 ? 'bg-primary-500' : 'bg-white/10'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${orderStep >= 3 ? 'bg-primary-500' : 'bg-white/10'}`} />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {orderStep === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className={`p-3 rounded-xl flex items-center justify-between border ${
                      latitude ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        {latitude ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> : <MapPin className="w-5 h-5 text-amber-400 shrink-0" />}
                        <p className={`text-xs ${latitude ? 'text-emerald-200' : 'text-amber-200'} leading-tight`}>
                          {latitude ? 'Ubicación capturada del mapa.' : 'Falta ubicar en el mapa (Se usará el centro si omites).'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOrderModalOpen(false)
                          setIsCapturingCoords(true)
                        }}
                        className="px-3 py-1.5 shrink-0 bg-[var(--sf-surface)] hover:bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg text-[10px] font-black uppercase text-[var(--sf-text-main)] transition-all active:scale-95"
                      >
                        {latitude ? 'Cambiar' : 'Fijar Mapa'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Nombre Cliente</label>
                        <input value={newOrderForm.client_name} onChange={e => setNewOrderForm({...newOrderForm, client_name: e.target.value})} className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg p-2 text-[var(--sf-text-main)] outline-none focus:border-primary-500" placeholder="Ej: Juan Pérez" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Teléfono</label>
                        <PhoneInput
                          value={newOrderForm.phone}
                          onValueChange={(val) => setNewOrderForm({...newOrderForm, phone: val})}
                          className="!w-full !bg-[var(--sf-surface)] !border-[var(--sf-border)] !rounded-lg !p-2 !text-[var(--sf-text-main)] !outline-none focus:!border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">
                        Dirección Escrita {latitude ? <span className="text-emerald-400 font-normal">(Ubicada en mapa)</span> : ''}
                      </label>
                      <div className="flex gap-2">
                        <input value={newOrderForm.address} onChange={e => setNewOrderForm({...newOrderForm, address: e.target.value})} className="flex-1 bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg p-2 text-[var(--sf-text-main)] outline-none focus:border-primary-500" placeholder="Ej: Av. Providencia 1234" />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newOrderForm.address) return;
                            try {
                              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newOrderForm.address + ', Chile')}`);
                              const data = await res.json();
                              if (data && data.length > 0) {
                                const lat = parseFloat(data[0].lat);
                                const lon = parseFloat(data[0].lon);
                                  // We do NOT place tempMarker anymore, just go into map capture mode centered there.
                                  setIsOrderModalOpen(false);
                                  setIsCapturingCoords(true);
                                  if (mapRef.current) {
                                    mapRef.current.flyTo([lat, lon], 17);
                                  }
                              } else {
                                Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se encontró la dirección en el mapa', showConfirmButton: false, timer: 3000, background: 'var(--sf-glass-panel-bg1)', color: 'white' });
                              }
                            } catch (e) {
                              Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error de red al buscar', showConfirmButton: false, timer: 2000, background: 'var(--sf-glass-panel-bg1)', color: 'white' });
                            }
                          }}
                          className="shrink-0 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-xs transition-all active:scale-95"
                        >
                          Buscar en Mapa
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {orderStep === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-400">¿Qué pide el cliente?</label>
                      {mode !== 'choose' && (
                        <button type="button" onClick={() => setMode('choose')} className="text-[10px] font-bold text-primary-400 hover:text-primary-300">
                          Cambiar Modalidad
                        </button>
                      )}
                    </div>

                    {mode === 'choose' && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          type="button"
                          onClick={() => setMode('cart')}
                          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[var(--sf-surface)] hover:bg-[var(--sf-surface)] border border-[var(--sf-border)] hover:border-primary-500/50 transition-all active:scale-95 text-center group"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 shadow-inner flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--sf-text-main)] text-xs">Catálogo</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">Elegir envases</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMode('quick')}
                          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-[var(--sf-surface)] hover:bg-[var(--sf-surface)] border border-[var(--sf-border)] hover:border-amber-500/50 transition-all active:scale-95 text-center group"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 shadow-inner flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[var(--sf-text-main)] text-xs">Rápido</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">Escribir/Hablar</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {mode === 'quick' && (
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-amber-400/80 mb-1">Dictar o Escribir pedido <Mic className="inline w-3 h-3 text-red-400 animate-pulse ml-1" style={{ display: isListening ? 'inline' : 'none' }} /></label>
                        <div className="relative">
                          <input value={newOrderForm.quick_order} onChange={e => setNewOrderForm({...newOrderForm, quick_order: e.target.value})} className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg p-2 pr-10 text-[var(--sf-text-main)] outline-none focus:border-amber-500/50" placeholder="Ej: 1x 15kg, 2x 11kg" autoFocus />
                          <button
                            type="button"
                            onClick={toggleDictation}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isListening 
                                ? 'bg-red-500 text-[var(--sf-text-main)] shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' 
                                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-[var(--sf-text-main)]'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'cart' && (
                      <div className="max-h-[50vh] overflow-y-auto pr-1">
                        <ProductSelector brands={brands} cart={cart} updateCart={updateCart} />
                      </div>
                    )}
                  </div>
                )}

                {orderStep === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-xl p-4">
                      <h3 className="text-[var(--sf-text-main)] font-bold text-sm mb-3">Resumen del Pedido</h3>
                      <p className="text-xs text-gray-400 mb-1"><strong className="text-gray-300">Cliente:</strong> {newOrderForm.client_name || 'Sin nombre'} {newOrderForm.phone && `(${newOrderForm.phone})`}</p>
                      <p className="text-xs text-gray-400 mb-3"><strong className="text-gray-300">Dirección:</strong> {newOrderForm.address || 'Marcada en mapa'}</p>
                      
                      <div className="border-t border-[var(--sf-border)] pt-3">
                        <strong className="text-gray-300 text-xs block mb-1">Productos:</strong>
                        {mode === 'quick' ? (
                          <p className="text-amber-400 text-sm font-bold">{newOrderForm.quick_order || 'Nada especificado'}</p>
                        ) : cart.length > 0 ? (
                          <ul className="text-sm text-primary-300 font-medium">
                            {cart.map((item, i) => <li key={i}>{item.quantity}x {item.brand_name} {item.name}</li>)}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-xs italic">Nada seleccionado</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Notas Adicionales (Opcional)</label>
                      <textarea rows={2} value={newOrderForm.notes} onChange={e => setNewOrderForm({...newOrderForm, notes: e.target.value})} className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg p-2 text-[var(--sf-text-main)] outline-none focus:border-primary-500 resize-none" placeholder="Instrucciones de entrega, color de la casa, etc..." />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--sf-border)] mt-4 shrink-0">
                {orderStep === 1 ? (
                  <button type="button" onClick={() => { setIsOrderModalOpen(false); setOrderStep(1); }} className="flex-1 py-2.5 rounded-xl border border-[var(--sf-border)] hover:bg-white/5 text-gray-300 font-bold transition-colors">Cancelar</button>
                ) : (
                  <button type="button" onClick={() => setOrderStep(orderStep - 1)} className="flex-1 py-2.5 rounded-xl border border-[var(--sf-border)] hover:bg-white/5 text-gray-300 font-bold transition-colors">Atrás</button>
                )}

                {orderStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (orderStep === 1) {
                        if (!newOrderForm.client_name.trim()) {
                          Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'El Nombre del Cliente es obligatorio', showConfirmButton: false, timer: 3000, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
                          return
                        }
                        const cleanPhone = newOrderForm.phone.replace(/\D/g, '')
                        if (cleanPhone.length < 11) {
                          Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Ingresa un número de teléfono válido (Ej: +56 9 1234 5678)', showConfirmButton: false, timer: 4000, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
                          return
                        }
                        if (!newOrderForm.address.trim() && !latitude) {
                          Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Falta la dirección o ubicación', showConfirmButton: false, timer: 3000, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
                          return
                        }
                      }
                      if (orderStep === 2 && mode === 'choose') {
                        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Selecciona una modalidad', showConfirmButton: false, timer: 2000, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
                        return
                      }
                      setOrderStep(orderStep + 1)
                    }} 
                    className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-colors"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={creatingOrder} 
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {creatingOrder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                    Confirmar Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthenticatedLayout>
  )
}
