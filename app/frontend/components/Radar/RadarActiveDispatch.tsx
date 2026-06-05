import React, { useState } from 'react'
import { Navigation, MapPin, Phone, Package, CheckCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import { RadarData } from './types'

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

interface RadarActiveDispatchProps {
  data: RadarData
  completing: boolean
  onComplete: (reason?: string) => void
  onCancel: () => void
}

export default function RadarActiveDispatch({ data, completing, onComplete, onCancel }: RadarActiveDispatchProps) {
  // Internal collapse state removed since it's controlled by parent

  if (!data.truck.has_destination) return null

  const dist = (data.truck.latitude && data.truck.destination_latitude) 
    ? getDistanceKm(data.truck.latitude, data.truck.longitude!, data.truck.destination_latitude, data.truck.destination_longitude!) 
    : null
  const tooFar = dist !== null && dist > 0.5

  return (
    <div className="relative overflow-hidden flex flex-col shrink-0 transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-emerald-500"></div>
      
      <div className="p-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <Navigation className="w-4 h-4" /> 
          <span className="truncate max-w-[150px]">Entrega Actual</span>
        </div>
        <div className="flex items-center gap-3">
          {dist !== null && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                <span className="text-[10px] font-black text-emerald-300">
                  ~{Math.ceil(dist < 5 ? dist * 3.5 : dist < 15 ? dist * 2.0 : dist * 1.2)} min
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-y-auto p-4 pt-0">

        <div className="space-y-1 mb-3">
          <p className="text-[var(--sf-text-main)] font-black text-lg truncate w-[75%]">{data.truck.destination_client_name}</p>
          <div className="flex items-start gap-1.5 text-slate-300 text-sm">
            <MapPin className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="line-clamp-2">{data.truck.destination_address}</p>
          </div>
          {data.truck.active_order_phone && (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                <Phone className="w-4 h-4 shrink-0 text-emerald-400" />
                <a href={`tel:${data.truck.active_order_phone}`} className="hover:text-emerald-300 transition-colors font-semibold">{data.truck.active_order_phone}</a>
              </div>
              <a
                href={`https://wa.me/${data.truck.active_order_phone.replace(/\D/g, '').startsWith('569') ? data.truck.active_order_phone.replace(/\D/g, '') : '569' + data.truck.active_order_phone.replace(/\D/g, '').slice(-8)}?text=${encodeURIComponent('Hola ' + data.truck.destination_client_name + ', soy el repartidor y voy en camino con tu pedido.')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold rounded-lg transition-colors pointer-events-auto"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                Avisar
              </a>
            </div>
          )}
          {data.truck.active_order_summary && (
            <div className="flex items-start gap-1.5 text-primary-300 text-xs mt-2 p-2 bg-primary-500/10 rounded-lg">
              <Package className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>{data.truck.active_order_summary}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${data.truck.destination_latitude},${data.truck.destination_longitude}`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition-colors border border-[var(--sf-border)] pointer-events-auto"
          >
            🗺️ Google Maps
          </a>
          <a
            href={`https://waze.com/ul?ll=${data.truck.destination_latitude},${data.truck.destination_longitude}&navigate=yes`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition-colors border border-[var(--sf-border)] pointer-events-auto"
          >
            🚗 Waze
          </a>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={async () => {
              if (tooFar) {
                const { value: reason } = await Swal.fire({
                  title: '¿Forzar Entrega?',
                  text: 'El GPS indica que estás lejos del destino. Debes ingresar un motivo para forzar la entrega.',
                  icon: 'warning',
                  input: 'textarea',
                  inputPlaceholder: 'Ej. Mala señal, le entregué a 3 cuadras...',
                  showCancelButton: true,
                  confirmButtonColor: '#10b981',
                  cancelButtonColor: '#64748b',
                  confirmButtonText: 'Forzar Entrega',
                  cancelButtonText: 'Cancelar',
                  background: '#1e293b',
                  color: '#f8fafc',
                  inputValidator: (value) => {
                    if (!value) return 'Debes ingresar un motivo'
                    return null
                  }
                })
                
                if (reason) {
                  onComplete(reason)
                }
              } else {
                onComplete()
              }
            }}
            disabled={completing}
            className={`w-full py-2.5 font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 pointer-events-auto ${
              tooFar 
                ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-amber-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20'
            }`}
          >
            {completing ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Procesando...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Entregado {tooFar && '(Forzar)'}</>
            )}
          </button>
          {tooFar && (
            <p className="text-[10px] text-amber-400 font-bold text-center mt-1">
              Estás a {dist.toFixed(1)} km del destino.
            </p>
          )}

          <button
            onClick={onCancel}
            disabled={completing}
            className="w-full py-2 bg-transparent hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-lg transition-colors mt-1 pointer-events-auto"
          >
            Cancelar Entrega
          </button>
        </div>
      </div>
    </div>
  )
}
