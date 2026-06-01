export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'warehouse_keeper' | 'driver'
  active: boolean
  created_at: string
  updated_at: string
}

export interface PageProps {
  auth: {
    user: User
  }
  flash: {
    notice?: string
    alert?: string
  }
}

// Inertia shared data type augmentation
declare module '@inertiajs/react' {
  interface PageProps {
    auth: {
      user: User
    }
    flash: {
      notice?: string
      alert?: string
    }
  }
}
