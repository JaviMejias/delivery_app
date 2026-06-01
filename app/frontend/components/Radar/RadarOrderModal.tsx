import React from 'react'
import { User, Phone, MapPin, FileText, Clock, Package, Zap, AlertCircle, Navigation } from 'lucide-react'
import { PendingOrder, RadarData } from './types'

interface RadarOrderModalProps {
  order: PendingOrder & { is_proposed?: boolean }
  data: RadarData | null
  accepting: number | null
  acceptError: string | null
  onClose: () => void
  onAccept: (order: PendingOrder) => void
  onReject?: (order: PendingOrder) => void
}

export default function RadarOrderModal({ order, data, accepting, acceptError, onClose, onAccept, onReject }: RadarOrderModalProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 md:top-24 md:right-6 md:bottom-auto md:left-auto md:w-[26rem] z-[500] pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 md:p-5 space-y-3 max-h-[45vh] md:max-h-[calc(100vh-120px)] overflow-y-auto">
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-black text-white text-base">
              {order.is_proposed ? '¡Despacho Asignado!' : 'Detalle del Pedido'}
            </h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${order.is_proposed ? 'text-indigo-400' : 'text-orange-400'}`}>
              {order.is_proposed ? 'Propuesta de administración' : 'Pendiente de aceptación'}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center transition-colors">✕</button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm font-bold text-white">{order.client_name}</span>
          </div>
          {order.phone && (
            <div className="flex items-center justify-between mt-1 mb-1">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${order.phone}`} className="text-sm text-slate-300 hover:text-emerald-300 transition-colors font-semibold">{order.phone}</a>
              </div>
              <a
                href={`https://wa.me/${order.phone.replace(/\\D/g, '').startsWith('569') ? order.phone.replace(/\\D/g, '') : '569' + order.phone.replace(/\\D/g, '').slice(-8)}?text=${encodeURIComponent('Hola ' + order.client_name + ', hemos recibido tu pedido.')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-[10px] font-bold rounded-lg transition-colors pointer-events-auto"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                Chat
              </a>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="text-sm text-slate-300">{order.address}</span>
          </div>
          {order.notes && (
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-sm text-amber-200 italic">{order.notes}</span>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-400">
              {new Date(order.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {order.distance_km !== null && (
              <span className="ml-auto text-xs font-bold text-orange-300">{order.distance_km} km de distancia</span>
            )}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-3.5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Lo que pide</p>
          {order.details.quick_order ? (
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-white font-semibold">{order.details.quick_order}</p>
            </div>
          ) : order.details.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-sm text-slate-200">{item.name}</span>
              </div>
              <span className="font-black text-indigo-400 text-sm">{item.quantity}x</span>
            </div>
          ))}
        </div>

        {data && data.truck.inventory.length > 0 && (
          <div className="bg-slate-800/40 border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tu inventario a bordo</p>
            <div className="flex flex-wrap gap-1.5">
              {data.truck.inventory.map((inv, i) => (
                <span key={i} className="px-2 py-1 bg-slate-900 border border-white/10 rounded text-[10px] font-semibold text-slate-300">
                  {inv.name}: <strong className="text-white">{inv.quantity}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {acceptError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-300">{acceptError}</p>
          </div>
        )}

        <div className={`grid ${order.is_proposed ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-1`}>
          <button
            onClick={onClose}
            className="py-3.5 rounded-2xl bg-slate-800 border border-white/10 text-slate-300 font-bold text-sm transition-all active:scale-95 text-center px-1"
          >
            {order.is_proposed ? 'Luego' : 'Cancelar'}
          </button>

          {order.is_proposed && onReject && (
            <button
              onClick={() => onReject(order)}
              className="py-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 px-1 shadow-[0_0_15px_rgba(225,29,72,0.15)]"
            >
              Rechazar
            </button>
          )}

          <button
            onClick={() => onAccept(order)}
            disabled={accepting === order.id || !!data?.truck.has_destination}
            className={`py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 px-1 ${
              data?.truck.has_destination
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/30'
            }`}
          >
            {accepting === order.id ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> ...</>
            ) : data?.truck.has_destination ? (
              'En Ruta'
            ) : (
              <><Navigation className="w-4 h-4" /> Aceptar</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
