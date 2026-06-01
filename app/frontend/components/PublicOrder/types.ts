export interface CompanyData {
  id: number
  slug: string
  name: string
  address?: string
  phone?: string
  company_phones?: { id: number, number: string, label: string }[]
}

export interface ProductData {
  id: number
  name: string
  kg: number
  sku?: string
  image_url?: string
}

export interface BrandData {
  id: number | string
  name: string
  logo_url: string | null
  products: ProductData[]
}

export interface CartItem {
  product_id: number
  name: string
  kg: number
  quantity: number
  brand_name: string
}

export type OrderMode = 'choose' | 'quick' | 'cart'
export type SubmitState = 'idle' | 'submitting' | 'success' | 'error'
