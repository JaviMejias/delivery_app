export interface Company {
  id: number
  name: string
  rut: string | null
  address: string | null
  email: string | null
  phone: string | null
  business_activity: string | null
  website: string | null
  legal_representative: string | null
  logo_url: string | null
  active: boolean
  slug: string | null
  enable_public_orders: boolean
}
