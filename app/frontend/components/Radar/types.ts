export interface InventoryItem {
  name: string
  quantity: number
  item_id: number
}

export interface TruckInfo {
  id: number
  plate_number: string
  latitude: number | null
  longitude: number | null
  has_destination: boolean
  destination_latitude: number | null
  destination_longitude: number | null
  destination_client_name: string | null
  destination_address: string | null
  route_points: [number, number][] | null
  active_order_id: number | null
  active_order_summary: string | null
  active_order_phone: string | null
  inventory: InventoryItem[]
}

export interface PendingOrder {
  id: number
  client_name: string
  phone: string
  address: string
  latitude: number
  longitude: number
  summary: string
  details: {
    quick_order?: string
    items?: { name: string; quantity: number; kg: number }[]
  }
  notes?: string
  created_at: string
  distance_km: number | null
}

export interface RadarData {
  orders: PendingOrder[]
  truck: TruckInfo
}
