import { MapPin, Zap, Flame } from 'lucide-react'
import Swal from 'sweetalert2'
import React, { useState } from 'react'
import PublicHeader from './PublicHeader'

interface CompanyData {
  id: number
  slug: string
  name: string
  address?: string
  phone?: string
}

interface MapContainerProps {
  company: CompanyData
  current_customer?: any
  isMapExpanded: boolean
  locationStatus: 'idle' | 'loading' | 'ok' | 'error'
  requestGeolocation: () => void
  hasMovedMap: boolean
  currentStep: number
  setStep: (step: number) => void
  isAddressValid: boolean
  customer_addresses?: any[]
  onSelectAddress?: (addr: any) => void
}

export default function MapContainer({
  company,
  current_customer,
  isMapExpanded,
  locationStatus,
  requestGeolocation,
  hasMovedMap,
  currentStep,
  setStep,
  isAddressValid,
  customer_addresses = [],
  onSelectAddress
}: MapContainerProps) {
  const [isAddressesOpen, setIsAddressesOpen] = useState(false)

  return (
    <div className={`${currentStep === 1 ? 'flex' : 'hidden lg:flex'} flex-col w-full lg:flex-1 transition-all duration-500 ease-in-out shrink-0 h-full z-0 lg:p-6 lg:pb-6 relative`}>
      <div className="absolute top-4 left-4 right-4 z-[2000] shrink-0 pointer-events-none">
        <PublicHeader company={company} current_customer={current_customer} />
      </div>

      {/* Bottom right Dropdown for Addresses */}
      <div className="absolute bottom-[160px] lg:bottom-24 right-4 lg:right-6 z-[2000] flex flex-col items-end">
        {customer_addresses && customer_addresses.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsAddressesOpen(!isAddressesOpen)}
              className="bg-slate-900/90 backdrop-blur-md border border-white/10 pl-3 pr-4 py-2.5 rounded-full flex items-center gap-2.5 text-white shadow-lg active:scale-95 transition-all hover:bg-slate-800"
            >
              <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Mis Direcciones</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition-transform ${isAddressesOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {isAddressesOpen && (
              <div className="absolute bottom-full right-0 mb-3 w-64 max-h-[50vh] overflow-y-auto scrollbar-hide bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[2001] animate-in fade-in slide-in-from-bottom-2 duration-200">
                {customer_addresses.map((addr: any) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      onSelectAddress?.(addr)
                      setIsAddressesOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                      {addr.alias.toLowerCase().includes('casa') ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{addr.alias}</p>
                      <p className="text-[10px] text-slate-400 truncate">{addr.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative flex-1 lg:rounded-3xl overflow-hidden lg:border border-white/10 shadow-2xl bg-slate-800">
        <div id="order-map" className="w-full h-full" />

        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-900/60 to-transparent z-[400] pointer-events-none" />

        {!hasMovedMap && (
          <div className="absolute top-[6rem] left-1/2 -translate-x-1/2 z-[400] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full font-bold text-xs shadow-xl border border-white/10 animate-bounce">
              Mueve el mapa para ajustar
            </div>
          </div>
        )}

        {/* Bottom Confirm Location Button (Mobile Only) */}
        <div className="absolute bottom-6 left-4 right-4 z-[400] lg:hidden flex flex-col gap-3">
          <button
            onClick={requestGeolocation}
            className={`self-end w-12 h-12 shadow-2xl rounded-full flex items-center justify-center transition-all active:scale-95 border ${
              locationStatus === 'ok' 
                ? 'bg-emerald-500 border-emerald-400' 
                : 'bg-slate-900 border-white/10'
            }`}
          >
            {locationStatus === 'loading' ? (
              <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : locationStatus === 'ok' ? (
              <Zap className="w-5 h-5 text-white animate-pulse" />
            ) : (
              <MapPin className="w-5 h-5 text-orange-500" />
            )}
          </button>

          <button
            onClick={() => setStep(2)}
            disabled={!isAddressValid}
            className={`w-full py-4 rounded-2xl font-black text-center transition-all shadow-xl ${
              isAddressValid
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-orange-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
            }`}
          >
            Confirmar Ubicación
          </button>
        </div>

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
              Mi Dirección
            </div>
          </div>
        </div>

        {/* Desktop Geolocation Button (Desktop Only) */}
        <div className="absolute bottom-6 right-6 z-[400] hidden lg:flex">
          <button
            onClick={requestGeolocation}
            className={`px-6 py-3 shadow-xl rounded-full text-xs font-black flex items-center gap-2 transition-all active:scale-95 border ${
              locationStatus === 'ok' 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-slate-900 text-white border-white/10'
            }`}
          >
            {locationStatus === 'loading' ? (
              <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : locationStatus === 'ok' ? (
              <Zap className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <MapPin className="w-4 h-4 text-orange-500" />
            )}
            {locationStatus === 'loading' ? 'Buscando...' : locationStatus === 'ok' ? '¡Ubicación encontrada!' : 'Centrar GPS'}
          </button>
        </div>
      </div>
    </div>
  )
}
