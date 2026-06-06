import React, { useState, useRef, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { MapPin, ArrowLeft, Plus, Trash2, Home, Navigation, CheckCircle, Star, Pen, Map } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import PublicHeader from '@/components/PublicOrder/PublicHeader'
import CustomerLayout from '@/layouts/CustomerLayout'

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

interface Address {
  id: number
  alias: string
  address: string
  latitude: string
  longitude: string
  is_default: boolean
  notes?: string
}

export default function Addresses({ company, current_customer, addresses }: any) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [alias, setAlias] = useState('')
  const [addressText, setAddressText] = useState('')
  const [notes, setNotes] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [saving, setSaving] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const mapRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)

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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (mapRef.current) {
      mapRef.current.flyTo([parseFloat(s.lat), parseFloat(s.lon)], 16, { animate: true, duration: 0.8 })
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadLeaflet = () => {
      if ((window as any).L) { initMap(); return }
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => initMap()
      document.body.appendChild(script)
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
    }
    loadLeaflet()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize()
      }, 100)
    }
  }, [isAdding])

  const initMap = () => {
    const L = (window as any).L
    if (!L || mapRef.current) return
    mapRef.current = L.map('address-map', { zoomControl: false, attributionControl: false }).setView([-33.4489, -70.6693], 15)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 20
    }).addTo(mapRef.current)

    mapRef.current.on('moveend', async () => {
      const center = mapRef.current.getCenter()
      setLatitude(center.lat)
      setLongitude(center.lng)

      setIsGeocoding(true)
      try {
        const resp = await fetch(`/api/v1/reverse_geocode?lat=${center.lat}&lon=${center.lng}`)
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

    const center = mapRef.current.getCenter()
    setLatitude(center.lat)
    setLongitude(center.lng)
  }

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      Swal.fire({
        title: 'Error',
        text: 'Tu navegador no soporta geolocalización',
        icon: 'error',
        confirmButtonColor: '#f97316'
      })
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 17, { duration: 1.5 })
        }
        setLocationStatus('ok')
      },
      (error) => {
        setLocationStatus('error')
        console.error("Error obteniendo ubicación:", error)
        Swal.fire({
          title: 'Permiso denegado',
          text: 'Por favor permite el acceso a tu ubicación para usar esta función',
          icon: 'warning',
          confirmButtonColor: '#f97316'
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSave = () => {
    if (!alias.trim() || !addressText.trim() || !latitude || !longitude) return

    setSaving(true)
    const url = editingId 
      ? `/order/${company.slug}/customer_addresses/${editingId}`
      : `/order/${company.slug}/customer_addresses`

    fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
      },
      body: JSON.stringify({
        customer_address: {
          alias,
          address: addressText,
          latitude,
          longitude,
          notes,
          is_default: editingId ? undefined : (addresses.length === 0)
        }
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setIsAdding(false)
        setEditingId(null)
        setAlias('')
        setAddressText('')
        setNotes('')
        setLatitude(null)
        setLongitude(null)
        router.reload({ only: ['addresses'] })
      } else {
        Swal.fire({
          title: 'Error',
          text: data.errors.join(', '),
          icon: 'error',
          confirmButtonColor: '#f97316'
        })
      }
    })
    .finally(() => setSaving(false))
  }

  const handleSetDefault = (id: number) => {
    router.patch(`/order/${company.slug}/customer_addresses/${id}/set_default`, {}, {
      onSuccess: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Dirección principal actualizada',
          showConfirmButton: false,
          timer: 2000,
          background: 'var(--sf-glass-panel-bg1)',
          color: 'white',
        })
        router.reload({ only: ['addresses'] })
      }
    })
  }

  const handleEdit = (addr: Address) => {
    setIsAdding(true)
    setEditingId(addr.id)
    setAlias(addr.alias)
    setAddressText(addr.address)
    setNotes(addr.notes || '')
    setLatitude(parseFloat(addr.latitude))
    setLongitude(parseFloat(addr.longitude))
    if (mapRef.current) {
      mapRef.current.flyTo([parseFloat(addr.latitude), parseFloat(addr.longitude)], 17, { animate: true, duration: 1.5 })
    }
  }

  const handleDelete = (id: number) => {
    Swal.fire({
      title: '¿Eliminar dirección?',
      text: "No podrás deshacer esto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(`/order/${company.slug}/customer_addresses/${id}`, {
          onSuccess: () => router.reload({ only: ['addresses'] })
        })
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col font-sans selection:bg-orange-500/30 relative">
      <Head title={`Mis Direcciones - ${company.name}`} />

      {/* Global Header */}
      <div className="p-4 z-[2000] shrink-0">
        <PublicHeader company={company} current_customer={current_customer} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Map Area (Top on Mobile, Full left on Desktop) */}
        <div className={`${isAdding ? 'block' : 'hidden lg:block'} w-full h-[40dvh] lg:h-auto lg:flex-1 self-stretch min-h-[40dvh] lg:min-h-0 transition-all duration-500 ease-in-out shrink-0 z-0 relative`}>
          <div className="lg:hidden absolute top-4 left-4 z-[2000]">
          <button 
            onClick={() => setIsAdding(false)}
            className="w-10 h-10 bg-slate-900/90 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-0 lg:inset-6 lg:top-6 lg:rounded-3xl overflow-hidden lg:border border-white/10 shadow-2xl bg-slate-800">
          <div id="address-map" className="absolute inset-0 z-[10]" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none mt-2">
            <div className="flex flex-col items-center relative">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/40 rounded-full blur-[1.5px]"></div>
              
              <div className="relative text-orange-500 drop-shadow-[0_10px_10px_rgba(249,115,22,0.5)] animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3" fill="white" stroke="none" />
                </svg>
              </div>

              <div className="absolute top-[-20px] px-3 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black rounded-full shadow-xl whitespace-nowrap border border-white/10">
                Fijar Ubicación
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-4 z-[400]">
            <button
              onClick={requestGeolocation}
              className={`w-12 h-12 shadow-2xl rounded-full flex items-center justify-center transition-all active:scale-95 border ${
                locationStatus === 'ok' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white' 
                  : locationStatus === 'error'
                  ? 'bg-rose-500 hover:bg-rose-600 border-rose-400 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-orange-500'
              }`}
              title="Usar mi ubicación actual"
            >
              {locationStatus === 'loading' ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Area */}
      <div className={`relative lg:mt-0 lg:w-[500px] xl:w-[600px] bg-slate-950 lg:rounded-none lg:border-l lg:border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] lg:shadow-[-20px_0_40px_rgba(0,0,0,0.5)] flex-1 min-h-0 z-10 overflow-y-auto pb-10 transition-transform duration-500 flex flex-col`}>
        {/* Header */}
        <div className="bg-slate-900 border-b border-white/5 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link href={`/order/${company.slug}`} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-white">{isAdding ? 'Nueva Dirección' : 'Libreta de Direcciones'}</h1>
              <p className="text-xs text-slate-400 font-medium">{isAdding ? 'Fija el pin en el mapa' : 'Gestiona tus lugares de entrega'}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!isAdding ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key="address-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {addresses.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-gradient-to-b from-white/[0.04] to-transparent rounded-[2rem] border border-white/[0.08] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5 relative z-10">
                      <MapPin className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 relative z-10">Sin Direcciones</h3>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-sm mx-auto relative z-10">Guarda tus ubicaciones frecuentes para pedir más rápido en el futuro.</p>
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="relative z-10 w-full group overflow-hidden bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] active:scale-95 border border-white/10 flex items-center justify-center gap-3"
                    >
                      <Plus className="w-5 h-5 text-orange-400 group-hover:scale-125 transition-transform" />
                      Añadir mi primera dirección
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="w-full relative overflow-hidden bg-gradient-to-r from-white/[0.05] to-transparent border border-white/10 hover:border-orange-500/50 p-5 rounded-[2rem] flex items-center gap-5 group transition-all duration-500 active:scale-[0.98] hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/[0.05] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                      <div className="w-14 h-14 bg-orange-500/10 rounded-[1.25rem] flex items-center justify-center group-hover:bg-orange-500 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-300">
                        <Plus className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-left flex-1">
                        <h4 className="text-white font-black text-lg group-hover:text-orange-400 transition-colors">Añadir Dirección</h4>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-wide">Para envíos a casa, trabajo...</p>
                      </div>
                    </button>

                  <motion.div 
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-4 mt-8"
                  >
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2 mb-4 flex items-center gap-2">
                      <Map className="w-4 h-4 opacity-70" />
                      Mis Ubicaciones Guardadas
                    </h3>
                    {addresses.map((addr: Address) => (
                      <motion.div variants={itemVariants} key={addr.id} className="relative bg-gradient-to-r from-white/[0.04] to-transparent backdrop-blur-3xl border border-white/[0.08] p-5 rounded-[2rem] flex flex-col sm:flex-row sm:items-center gap-5 overflow-hidden group hover:border-white/[0.15] transition-all duration-500 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 blur-[50px] rounded-bl-full pointer-events-none transition-colors duration-500 group-hover:bg-primary-500/20 opacity-0 group-hover:opacity-100" />
                        
                        {addr.is_default && (
                          <div className="absolute top-0 right-0 z-10">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-900 text-[10px] font-black px-5 py-1.5 rounded-bl-[1.5rem] uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                              Predeterminada
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-5 w-full sm:w-auto relative z-10">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-primary-500/5 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 group-hover:scale-[1.05] transition-all duration-500 shadow-inner border border-primary-500/20">
                            <Home className="w-6 h-6 text-primary-400 drop-shadow-md" />
                          </div>
                          <div className="flex-1 pr-2 min-w-0">
                            <h4 className="text-white font-black text-lg truncate pr-16 sm:pr-0">{addr.alias}</h4>
                            <p className="text-[13px] text-slate-400 line-clamp-1 font-medium mt-0.5 tracking-wide">{addr.address}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-white/5 sm:border-0 relative z-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-500">
                          <button 
                            onClick={() => handleSetDefault(addr.id)}
                            className={`flex-1 sm:flex-none h-11 px-4 sm:px-0 sm:w-11 rounded-[1rem] flex items-center justify-center transition-all duration-300 active:scale-95 border ${
                              addr.is_default 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' 
                                : 'bg-white/5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-400 border-white/5 hover:border-amber-500/30'
                            }`}
                            title={addr.is_default ? "Dirección Principal" : "Marcar como Principal"}
                            disabled={addr.is_default}
                          >
                            <Star className={`w-5 h-5 ${addr.is_default ? 'fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`} />
                            <span className="ml-2 text-[11px] font-bold sm:hidden tracking-wider">{addr.is_default ? 'Principal' : 'Fijar Principal'}</span>
                          </button>
                          <button 
                            onClick={() => handleEdit(addr)}
                            className="flex-1 sm:flex-none h-11 px-4 sm:px-0 sm:w-11 bg-white/5 rounded-[1rem] flex items-center justify-center text-primary-400 hover:bg-primary-500 hover:text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-300 active:scale-95 border border-white/5 hover:border-primary-500"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            <span className="ml-2 text-[11px] font-bold sm:hidden tracking-wider">Editar</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(addr.id)}
                            className="flex-1 sm:flex-none h-11 px-4 sm:px-0 sm:w-11 bg-white/5 rounded-[1rem] flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(243,24,96,0.3)] transition-all duration-300 active:scale-95 border border-white/5 hover:border-rose-500"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="ml-2 text-[11px] font-bold sm:hidden tracking-wider">Borrar</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex gap-3">
                <Navigation className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-300 leading-relaxed font-medium">
                  El mapa usa una versión satelital gratuita y podría no autocompletar tu dirección escrita, pero <strong className="text-orange-400">lo importante es el pin</strong>. Si lo fijas correctamente, el repartidor llegará por GPS sin problemas.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Nombre (Alias)</label>
                <input
                  type="text"
                  placeholder="Ej: Casa, Trabajo, Casa Mamá"
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Dirección Escrita (Referencial)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej: Avenida Siempre Viva 742, Depto 3B"
                    value={addressText}
                    onChange={handleAddressChange}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner pr-10"
                  />
                  {isGeocoding && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]">
                    {addressSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700/50 border-b border-white/5 last:border-0 transition-colors flex items-start gap-3"
                      >
                        <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">{s.display_name.split(', ')[0]}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.display_name.split(', ').slice(1).join(', ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Instrucciones de entrega (Opcional)</label>
                <textarea
                  placeholder="Ej: Tocar timbre 3 veces, dejar en conserjería..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner resize-none h-24"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setEditingId(null)
                    setAlias('')
                    setAddressText('')
                    setNotes('')
                    setLatitude(null)
                    setLongitude(null)
                  }}
                  className="flex-1 py-4 rounded-xl text-slate-400 font-bold hover:bg-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !alias.trim() || !addressText.trim() || !latitude}
                  className={`flex-1 py-4 rounded-2xl font-black text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
                    saving || !alias.trim() || !addressText.trim() || !latitude
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 active:scale-[0.98]'
                  }`}
                >
                  {saving ? 'Guardando...' : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {editingId ? 'Actualizar' : 'Guardar'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

Addresses.layout = (page: any) => <CustomerLayout>{page}</CustomerLayout>
