import { useState, useEffect, useRef } from 'react'
import { Head, Link } from '@inertiajs/react'
import { CheckCircle, Copy, MapPin, Package, LogOut, AlertCircle, Phone } from 'lucide-react'
import Swal from 'sweetalert2'
import MapContainer from '@/components/PublicOrder/MapContainer'
import OrderForm from '@/components/PublicOrder/OrderForm'
import { CompanyData, BrandData, CartItem, OrderMode, SubmitState, ProductData } from '@/components/PublicOrder/types'

interface Props {
  company: CompanyData
  brands: BrandData[]
  current_customer?: any
  customer_addresses?: any[]
  reorder_data?: any
  is_blocked?: boolean
}

export default function PublicOrderNew({ company, brands, current_customer, customer_addresses = [], reorder_data, is_blocked }: Props) {
  if (is_blocked) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden text-slate-200">
        <Head title={`Bloqueado - ${company.name}`} />
        <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Pedidos Suspendidos</h2>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Has superado el límite de 3 cancelaciones en las últimas 24 horas. Por seguridad, no podrás realizar nuevos pedidos por el momento. 
            Por favor, comunícate con nosotros para resolverlo:
          </p>
          
          <div className="w-full space-y-2 mb-8">
            {company.company_phones && company.company_phones.length > 0 ? (
              company.company_phones.map(phone => (
                <a key={phone.id} href={`tel:${phone.number}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">{phone.number}</span>
                  </div>
                  {phone.label && <span className="text-[10px] uppercase font-bold text-slate-500">{phone.label}</span>}
                </a>
              ))
            ) : company.phone ? (
              <a href={`tel:${company.phone}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">{company.phone}</span>
                  </div>
              </a>
            ) : null}
          </div>
          <div className="w-full flex flex-col gap-3">
            <Link href={`/order/${company.slug}/history`} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md">
              Ver mis pedidos
            </Link>
            <Link href={`/order/${company.slug}/addresses`} className="w-full py-4 bg-transparent hover:bg-white/5 text-slate-300 font-bold rounded-xl transition-all">
              Mis Direcciones
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const [mode, setMode] = useState<OrderMode>(reorder_data?.details?.quick_order ? 'quick' : 'cart')
  const [clientName, setClientName] = useState(reorder_data?.client_name || (current_customer ? `${current_customer.first_name} ${current_customer.last_name}` : ''))
  const [phone, setPhone] = useState(reorder_data?.phone || (current_customer ? current_customer.phone : ''))
  const [addressText, setAddressText] = useState(reorder_data?.address || (current_customer?.address || ''))
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [notes, setNotes] = useState('')
  const [quickOrder, setQuickOrder] = useState(reorder_data?.details?.quick_order || '')
  const [cart, setCart] = useState<CartItem[]>(reorder_data?.details?.items || [])
  const [latitude, setLatitude] = useState<number | null>(reorder_data?.latitude ? parseFloat(reorder_data.latitude) : (current_customer?.latitude ? parseFloat(current_customer.latitude) : null))
  const [longitude, setLongitude] = useState<number | null>(reorder_data?.longitude ? parseFloat(reorder_data.longitude) : (current_customer?.longitude ? parseFloat(current_customer.longitude) : null))
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [orderToken, setOrderToken] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [currentStep, setCurrentStep] = useState(reorder_data ? 4 : (current_customer ? 1 : 0))
  const [isMapExpanded, setIsMapExpanded] = useState(true)
  const [hasMovedMap, setHasMovedMap] = useState(false)
  const recognitionRef = useRef<any>(null)

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const typingTimeoutRef = useRef<any>(null)

  const mapRef = useRef<any>(null)

  const touchStartY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartY.current) return
    const touchEndY = e.changedTouches[0].clientY
    const distance = touchEndY - touchStartY.current
    
    if (distance > 40 && !isMapExpanded) {
      setIsMapExpanded(true)
    } else if (distance < -40 && isMapExpanded) {
      setIsMapExpanded(false)
    }
    touchStartY.current = 0
  }

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
      if (mapRef.current) { 
        if ((mapRef.current as any)._resizeObserver) {
          (mapRef.current as any)._resizeObserver.disconnect()
        }
        mapRef.current.remove()
        mapRef.current = null 
      }
    }
  }, [])

  const initMap = () => {
    const L = (window as any).L
    if (!L || mapRef.current) return
    mapRef.current = L.map('order-map', { zoomControl: false, attributionControl: false }).setView([-33.4489, -70.6693], 15)
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 20
    }).addTo(mapRef.current)

    const center = mapRef.current.getCenter()
    setLatitude(center.lat)
    setLongitude(center.lng)

    mapRef.current.on('moveend', async () => {
      setHasMovedMap(true)
      const newCenter = mapRef.current.getCenter()
      setLatitude(newCenter.lat)
      setLongitude(newCenter.lng)
      
      setIsGeocoding(true)
      try {
        const resp = await fetch(`/api/v1/reverse_geocode?lat=${newCenter.lat}&lon=${newCenter.lng}`)
        const data = await resp.json()
        if (data && data.display_name) {
          const parts = data.display_name.split(', ')
          const shortAddress = parts.slice(0, 3).join(', ')
          setAddressText(shortAddress)
          setAddressSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error("Geocoding error", error)
      } finally {
        setIsGeocoding(false)
      }
    })

    const mapContainer = document.getElementById('order-map')
    if (mapContainer) {
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      })
      resizeObserver.observe(mapContainer)
      // Store observer in a ref so we can disconnect it on unmount if we wanted, but map unmount is fine
      ;(mapRef.current as any)._resizeObserver = resizeObserver
    }
  }

  useEffect(() => {
    // Also invalidate on mount and step transitions just in case
    if (mapRef.current) {
      const interval = setInterval(() => {
        mapRef.current?.invalidateSize()
      }, 50)
      
      setTimeout(() => {
        clearInterval(interval)
      }, 550)
    }
  }, [currentStep])

  const searchAddress = async () => {
    if (!addressText.trim()) return
    setIsGeocoding(true)
    try {
      const resp = await fetch(`/api/v1/geocode?q=${encodeURIComponent(addressText + ', Chile')}`)
      const data = await resp.json()
      if (data && data.length > 0) {
        const result = data[0]
        centerMapOn(parseFloat(result.lat), parseFloat(result.lon))
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Ubicación encontrada',
          showConfirmButton: false,
          timer: 2000,
          background: 'var(--sf-glass-panel-bg1)',
          color: 'white',
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No encontrado',
          text: 'No pudimos encontrar esa dirección. Intenta ser más específico.',
          background: 'var(--sf-glass-panel-bg1)',
          color: 'white',
          confirmButtonColor: '#f97316'
        })
      }
    } catch (error) {
      console.error("Search address error", error)
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'Hubo un problema al buscar la dirección.',
        background: 'var(--sf-glass-panel-bg1)',
        color: 'white',
        confirmButtonColor: '#f97316'
      })
    } finally {
      setIsGeocoding(false)
    }
  }

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([])
      return
    }
    try {
      const resp = await fetch(`/api/v1/geocode?q=${encodeURIComponent(query)}`)
      const data = await resp.json()
      setAddressSuggestions(data || [])
      setShowSuggestions(true)
    } catch (e) {
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setAddressText(val)
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val)
    }, 400)
  }

  const handleSelectSuggestion = (s: any) => {
    const parts = s.display_name.split(', ')
    const shortAddress = parts.slice(0, 3).join(', ')
    setAddressText(shortAddress)
    setShowSuggestions(false)
    centerMapOn(parseFloat(s.lat), parseFloat(s.lon))
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Ubicación seleccionada',
      showConfirmButton: false,
      timer: 1500,
      background: 'var(--sf-glass-panel-bg1)',
      color: 'white',
    })
  }

  const centerMapOn = (lat: number, lng: number) => {
    if (!mapRef.current) return
    mapRef.current.flyTo([lat, lng], 16, { animate: true, duration: 0.8 })
  }

  const requestGeolocation = () => {
    setLocationStatus('loading')
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus('ok')
        centerMapOn(pos.coords.latitude, pos.coords.longitude)
        setTimeout(() => setLocationStatus('idle'), 3000)
      },
      () => {
        setLocationStatus('error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartItems = cart.filter(i => i.quantity > 0)

  const updateCart = (product: ProductData, brandName: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: Math.max(0, item.quantity + delta) } 
            : item
        )
      } else if (delta > 0) {
        return [...prev, { product_id: product.id, name: product.name, kg: product.kg, quantity: delta, brand_name: brandName }]
      }
      return prev
    })
  }

  const getDetails = () => {
    if (mode === 'quick') return { quick_order: quickOrder }
    return { items: cartItems.map(i => ({ id: i.product_id, name: i.name, quantity: i.quantity, kg: i.kg, brand: i.brand_name })) }
  }

  const toggleDictation = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      Swal.fire({
        icon: 'warning',
        title: 'No soportado',
        text: 'Tu navegador no soporta dictado por voz. Intenta actualizarlo o usar Chrome/Safari.',
        background: 'var(--sf-glass-panel-bg1)',
        color: 'white',
      })
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'es-CL'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('')
      
      setQuickOrder(transcript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') {
        Swal.fire({
          icon: 'error',
          title: 'Micrófono bloqueado',
          text: 'Debes darle permiso al navegador para usar tu micrófono.',
          background: 'var(--sf-glass-panel-bg1)',
          color: 'white',
          confirmButtonColor: '#f97316'
        })
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (e) {
      setIsListening(false)
    }
  }

  const isFormValid = () => {
    if (!clientName.trim() || !phone.trim() || !addressText.trim()) return false
    if (latitude === null || longitude === null) return false
    if (mode === 'quick' && !quickOrder.trim()) return false
    if (mode === 'cart' && cartTotal === 0) return false
    return true
  }

  const handleSubmit = async () => {
    if (!isFormValid()) return
    setSubmitState('submitting')
    setErrorMsg(null)

    try {
      const resp = await fetch(`/order/${company.slug}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
        },
        body: JSON.stringify({
          client_name: clientName,
          phone,
          address: addressText,
          latitude,
          longitude,
          notes,
          details: getDetails()
        })
      })
      const data = await resp.json()
      if (data.success) {
        setOrderToken(data.order_token)
        localStorage.setItem(`last_order_token_${company.slug}`, data.order_token)
        setSubmitState('success')
      } else {
        setErrorMsg(data.errors?.join(', ') || 'Error al enviar pedido')
        setSubmitState('error')
      }
    } catch {
      setErrorMsg('Error de conexión. Intenta nuevamente.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success' && orderToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-[6px] border-emerald-500/20 flex items-center justify-center mx-auto mb-8 animate-[bounce_1s_infinite]">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">¡Pedido Enviado!</h1>
          <p className="text-slate-400 text-base mb-8 leading-relaxed">Tu pedido fue recibido exitosamente. Un repartidor lo tomará en breve.</p>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 text-left shadow-sm">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 text-center">Código de seguimiento</p>
            <div 
              onClick={() => {
                navigator.clipboard.writeText(orderToken)
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Código copiado', showConfirmButton: false, timer: 1500, background: 'var(--sf-glass-panel-bg1)', color: 'white' })
              }}
              className="flex items-center justify-between gap-3 bg-black/50 p-3 px-4 rounded-2xl border border-orange-500/20 cursor-pointer hover:bg-black/70 active:scale-95 transition-all shadow-inner group"
            >
              <p className="font-mono text-orange-400 font-black text-2xl break-all truncate">{orderToken}</p>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors shrink-0">
                <Copy className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>

          <a 
            href={`/order/${company.slug}/track/${orderToken}`}
            className="block w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-black text-center transition-all active:scale-95 shadow-xl shadow-orange-500/20"
          >
            Seguir mi pedido en vivo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] bg-slate-950 flex flex-col lg:flex-row font-sans selection:bg-orange-500/30 overflow-hidden">
      <Head title={`Pedido - ${company.name}`} />

      <MapContainer 
        company={company}
        current_customer={current_customer}
        isMapExpanded={isMapExpanded}
        locationStatus={locationStatus}
        requestGeolocation={requestGeolocation}
        hasMovedMap={hasMovedMap}
        currentStep={currentStep}
        setStep={setCurrentStep}
        isAddressValid={!!addressText.trim() && latitude !== null && longitude !== null}
        customer_addresses={customer_addresses}
        onSelectAddress={(addr) => {
          const lat = parseFloat(addr.latitude)
          const lng = parseFloat(addr.longitude)
          setLatitude(lat)
          setLongitude(lng)
          setAddressText(addr.address)
          setHasMovedMap(true)
          if (addr.notes) setNotes(addr.notes)
          if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.5 })
          }
        }}
      />
      
      <div className={`relative lg:mt-0 lg:w-[500px] xl:w-[600px] bg-slate-950 lg:rounded-none lg:border-l lg:border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] lg:shadow-[-20px_0_40px_rgba(0,0,0,0.5)] flex-1 min-h-0 z-10 overflow-y-auto pb-10 transition-transform duration-500 ${currentStep === 1 ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}>
        {/* On desktop, show a small header if step=1, else just the form */}
        {currentStep === 1 && (
          <div className="hidden lg:flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-white/10 mb-6">
              <span className="text-2xl font-black text-slate-500">1</span>
            </div>
            <h2 className="text-xl font-black text-white mb-3">Selecciona tu ubicación</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-sm">Mueve el mapa de la izquierda hacia tu dirección de entrega y haz clic abajo para continuar con tu pedido.</p>
            
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!(!!addressText.trim() && latitude !== null && longitude !== null)}
              className={`px-8 py-4 rounded-2xl font-black transition-all shadow-xl ${
                !!addressText.trim() && latitude !== null && longitude !== null
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-orange-500/20 hover:scale-105 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
              }`}
            >
              Confirmar Ubicación
            </button>
          </div>
        )}
        
        <div className={currentStep === 1 ? 'hidden' : 'block'}>
          {/* Top Banner for Customers */}
          {current_customer && (
          <div className="bg-slate-900 border-b border-white/5 py-3 px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Hola, {current_customer.first_name} 👋</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Sesión Iniciada</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/order/${company.slug}/customer_addresses`} className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-2 py-1.5 sm:px-3 rounded-lg border border-orange-500/20 active:scale-95" title="Mis Direcciones">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold hidden sm:inline">Direcciones</span>
                </a>
                <a href={`/order/${company.slug}/history`} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1.5 sm:px-3 rounded-lg border border-indigo-500/20 active:scale-95" title="Mis Pedidos">
                  <Package className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold hidden sm:inline">Pedidos</span>
                </a>
                <Link href={`/order/${company.slug}/auth/logout`} method="delete" as="button" className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors bg-slate-800/50 px-2 py-1.5 sm:px-3 rounded-lg border border-white/5 active:scale-95" title="Cerrar Sesión">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold hidden sm:inline">Salir</span>
                </Link>
              </div>
            </div>
          </div>
          )}

          <OrderForm 
            isMapExpanded={isMapExpanded}
            current_customer={current_customer}
            clientName={clientName}
            setClientName={setClientName}
            phone={phone}
            setPhone={setPhone}
            addressText={addressText}
            handleAddressChange={handleAddressChange}
            addressSuggestions={addressSuggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            handleSelectSuggestion={handleSelectSuggestion}
            searchAddress={searchAddress}
            isGeocoding={isGeocoding}
            notes={notes}
            setNotes={setNotes}
            mode={mode}
            setMode={setMode}
            quickOrder={quickOrder}
            setQuickOrder={setQuickOrder}
            isListening={isListening}
            toggleDictation={toggleDictation}
            cart={cart}
            updateCart={updateCart}
            submitState={submitState}
            errorMsg={errorMsg}
            handleSubmit={handleSubmit}
            isFormValid={isFormValid}
            brands={brands}
            currentStep={currentStep}
            setStep={setCurrentStep}
          />
        </div>
      </div>
      {currentStep === 0 && !current_customer && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-slate-950 p-6 z-[100] absolute inset-0 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl mb-8 relative">
             <div className="absolute inset-0 rounded-[2rem] bg-orange-500/20 animate-pulse"></div>
             <span className="text-4xl">🔥</span>
          </div>
          <h1 className="text-3xl font-black text-white text-center mb-2">Bienvenido a {company.name}</h1>
          <p className="text-slate-400 text-center text-sm max-w-sm mb-10 leading-relaxed">
            Pide gas de la forma más rápida y sencilla.
          </p>

          <div className="w-full max-w-sm space-y-4">
            <Link
              href={`/order/${company.slug}/auth/login`}
              className="flex items-center justify-center w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all active:scale-95"
            >
              Iniciar Sesión
            </Link>
            
            <Link
              href={`/order/${company.slug}/auth/register`}
              className="flex items-center justify-center w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-white/5 transition-all active:scale-95"
            >
              Crear una Cuenta
            </Link>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-950 px-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">o</span>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center justify-center w-full py-4 bg-transparent hover:bg-white/5 text-slate-400 font-bold rounded-2xl transition-all active:scale-95"
            >
              Continuar como Invitado
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
