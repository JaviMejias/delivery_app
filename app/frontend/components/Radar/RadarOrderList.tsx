import React from 'react'
import { Radar, MapPin, Clock, Package, RefreshCw } from 'lucide-react'
import { PendingOrder, RadarData } from './types'

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'Reciente'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Hace instantes'
  if (diffMins < 60) return `Hace ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours} hr`
  return `Hace ${Math.floor(diffHours / 24)} días`
}

interface RadarOrderListProps {
  data: RadarData | null
  loading: boolean
  selectedOrder: PendingOrder | null
  onSelectOrder: (order: PendingOrder) => void
}

export default function RadarOrderList({ data, loading, selectedOrder, onSelectOrder }: RadarOrderListProps) {
  if (loading) {
    return (
      <div className="p-6 text-center shrink-0">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Conectando con el radar...</p>
      </div>
    )
  }

  if (data && data.orders.length === 0 && !data.truck.has_destination) {
    return (
      <div className="p-6 text-center shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <Radar className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-bold text-white mb-1">Sin pedidos pendientes</p>
        <p className="text-xs text-slate-400">Escaneando zona...</p>
      </div>
    )
  }

  if (data && data.orders.length > 0 && !data.truck.has_destination) {
    return (
      <div className="flex flex-col shrink-0 min-h-0">
        <div className="p-4 border-b border-white/10 flex items-center gap-2 shrink-0">
          <Radar className="w-4 h-4 text-orange-400 animate-pulse" />
          <span className="font-bold text-sm text-white">Pedidos Cercanos</span>
          <span className="ml-auto px-2 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-black rounded border border-orange-500/30">{data.orders.length}</span>
        </div>
        <div className="overflow-y-auto space-y-2 p-2.5">
          {data.orders.map(order => (
            <button
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedOrder?.id === order.id
                  ? 'bg-orange-500/15 border-orange-500/50'
                  : 'bg-black/20 border-white/5 hover:bg-black/30 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                  <span className="font-black text-xs text-white truncate">{order.client_name}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {order.distance_km !== null && (
                    <span className="text-[9px] font-bold text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                      {order.distance_km} km
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimeAgo(order.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{order.address}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Package className="w-3 h-3 text-primary-400" />
                <p className="text-[10px] text-primary-300 font-medium truncate">{order.summary}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return null
}
