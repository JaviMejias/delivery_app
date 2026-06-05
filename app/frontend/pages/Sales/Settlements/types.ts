export interface ProductPrice {
  id: number
  channel: string
  price: string
  price_list?: { id: number, name: string }
}

export interface Product {
  id: number
  name: string
  sku: string
  product_prices: ProductPrice[]
}

export interface RouteSettlementItem {
  id: number
  product_id: number
  price_list_id: number
  unit_price: string
  subtotal: string
  sold_quantity: number
  returned_empty_quantity: number
  product?: Product
  price_list?: { name: string }
}

export interface RouteSettlementExpense {
  id: number
  description: string
  amount: string
  payment_method: string
}

export interface RouteSettlement {
  id: number
  date: string
  cash_revenue: string
  card_revenue: string
  transfer_revenue: string
  total_revenue: string
  status: string
  truck: { plate_number: string, driver?: { first_name: string, last_name: string } }
  route_settlement_items: RouteSettlementItem[]
  route_settlement_expenses: RouteSettlementExpense[]
}

export interface TruckInventory {
  id: number
  quantity: number
  item: Product
}
