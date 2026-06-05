import React, { useState, useRef, useEffect } from 'react'
import { Link } from '@inertiajs/react'
import { Flame, ChevronDown, MapPin, Package, LogOut, Navigation, User } from 'lucide-react'
import Swal from 'sweetalert2'

interface PublicHeaderProps {
  company: any
  current_customer?: any
}

export default function PublicHeader({ company, current_customer }: PublicHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTrackOrder = () => {
    setIsDropdownOpen(false)
    const lastCode = current_customer ? '' : localStorage.getItem(`last_order_token_${company.slug}`)
    Swal.fire({
      title: 'Rastrear Pedido',
      input: 'text',
      inputValue: lastCode || '',
      inputLabel: 'Ingresa el código de tu pedido',
      inputPlaceholder: 'Ej: ABCD123',
      showCancelButton: true,
      confirmButtonText: 'Rastrear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#334155',
      background: '#0f172a',
      color: '#fff',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un código'
      },
      showLoaderOnConfirm: true,
      preConfirm: async (value) => {
        const token = value.trim()
        try {
          const response = await fetch(`/order/${company.slug}/track/${token}`, {
            headers: { 'Accept': 'application/json' }
          })
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Pedido no encontrado o ya entregado')
          }
          return token
        } catch (error: any) {
          Swal.showValidationMessage(error.message)
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `/order/${company.slug}/track/${result.value}`
      }
    })
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-lg border border-white/10 p-3 sm:p-4 flex items-center justify-between gap-4 pointer-events-auto w-full z-[3000]">
      <Link href={`/order/${company.slug}`} className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
          <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h1 className="font-black text-white text-lg sm:text-xl leading-tight tracking-tight line-clamp-1">{company.name}</h1>
          <p className="text-[10px] sm:text-xs font-bold text-orange-500 uppercase tracking-widest">Servicio de Gas</p>
        </div>
      </Link>

      {current_customer ? (
        <div className="relative shrink-0" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-white/5 transition-all active:scale-95"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
            </div>
            <span className="hidden sm:block text-sm font-bold text-slate-200">
              Hola, {current_customer.first_name}
            </span>
            <span className="sm:hidden text-xs font-bold text-slate-200">
              {current_customer.first_name}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[3000]">
              <div className="p-2 space-y-1">
                <Link 
                  href={`/order/${company.slug}`}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors"
                >
                  <Flame className="w-4 h-4" />
                  Hacer Nuevo Pedido
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <Link 
                  href={`/order/${company.slug}/history`}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <Package className="w-4 h-4 text-primary-400" />
                  Mis Pedidos
                </Link>
                <Link 
                  href={`/order/${company.slug}/customer_addresses`}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Mis Direcciones
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <Link 
                  href={`/order/${company.slug}/auth/logout`}
                  method="delete"
                  as="button"
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleTrackOrder}
            className="hidden sm:flex px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs text-orange-400 font-bold uppercase tracking-widest transition-colors items-center gap-2 active:scale-95 shadow-inner"
          >
            <Navigation className="w-4 h-4" />
            Rastrear
          </button>
          <Link 
            href={`/order/${company.slug}/auth/login`}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 px-4 py-2.5 rounded-xl transition-colors active:scale-95 text-sm font-bold text-white shadow-lg shadow-primary-500/20"
          >
            <User className="w-4 h-4" />
            Ingresar
          </Link>
        </div>
      )}
    </div>
  )
}
