import { useState, useEffect, useRef } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import Swal from 'sweetalert2'
import type { User } from '@/types'

interface Props {
  children: React.ReactNode
  hideHeader?: boolean
}

import { Sparkles, Grid, Banknote, ShoppingCart, Package, Truck, Monitor, Sun, Moon, Building2, Radar, Menu } from 'lucide-react'

const navigationCategories = [
  {
    title: 'Principal',
    icon: <Sparkles className="w-5 h-5" />,
    items: [
      { name: 'Dashboard', href: '/dashboard' }
    ]
  },
  {
    title: 'Administración',
    icon: <Building2 className="w-5 h-5" />,
    items: [
      { name: 'Empresas', href: '/companies', adminOnly: true },
      { name: 'Bodegas', href: '/inventory/warehouses' },
      { name: 'Usuarios', href: '/users', adminOnly: true },
      { name: 'Clientes', href: '/customers', adminOnly: true }
    ]
  },
  {
    title: 'Catálogo Base',
    icon: <Grid className="w-5 h-5" />,
    items: [
      { name: 'Marcas', href: '/catalog/brands' },
      { name: 'Categorías', href: '/catalog/material-categories' },
      { name: 'Materiales', href: '/catalog/materials' },
      { name: 'Listas de Precios', href: '/catalog/price-lists' },
      { name: 'Productos', href: '/catalog/products' }
    ]
  },
  {
    title: 'Inventario',
    icon: <Package className="w-5 h-5" />,
    items: [
      { name: 'Stock Actual', href: '/inventory/stock' },
      { name: 'Ajuste Manual', href: '/inventory/adjustments/new' }
    ]
  },
  {
    title: 'Compras',
    icon: <ShoppingCart className="w-5 h-5" />,
    items: [
      { name: 'Proveedores', href: '/catalog/suppliers' },
      { name: 'Órdenes de Compra', href: '/purchases/orders' },
      { name: 'Documentos (Facturas)', href: '/purchases/documents' }
    ]
  },
  {
    title: 'Ventas',
    icon: <Banknote className="w-5 h-5" />,
    items: [
      { name: 'Historial Ventas Locales', href: '/sales/local' }
    ]
  },
  {
    title: 'Tesorería',
    icon: <Banknote className="w-5 h-5" />,
    items: [
      { name: 'Egresos (Pagos)', href: '/treasury/expenses' },
      { name: 'Ingresos', href: '/treasury/incomes' },
      { name: 'Cierre de Caja', href: '/sales/local/closures' },
      { name: 'Rendiciones de Ruta', href: '/sales/settlements' }
    ]
  },
  {
    title: 'Logística',
    icon: <Truck className="w-5 h-5" />,
    items: [
      { name: 'Camiones (Flota)', href: '/trucks' },
      { name: 'Monitoreo en Vivo', href: '/trucks/map' },
      { name: 'Radar de Despachos', href: '/driver/radar' },
      { name: 'Carga/Descarga', href: '/inventory/transfers' },
      { name: 'Historial de Pedidos', href: '/logistics/orders' }
    ]
  }
]

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: 'var(--sf-glass-panel-bg1)',
  backdrop: 'transparent',
  color: 'var(--sf-text-main)',
  customClass: {
    popup: 'glass-panel border border-[var(--sf-glass-border)] rounded-xl'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

export default function AuthenticatedLayout({ children, hideHeader = false }: Props) {
  const page = usePage()
  const { auth, flash } = page.props as unknown as {
    auth: {
      user: User,
      current_company?: { id: number, name: string, rut: string },
      available_companies?: { id: number, name: string }[]
    };
    flash: { notice?: string; alert?: string }
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const currentPath = window.location.pathname

  const filteredCategories = navigationCategories.filter(cat => {
    if (auth.user.role === 'admin') return true
    if (auth.user.role === 'warehouse_keeper') {
      return ['Inventario', 'Compras', 'Logística'].includes(cat.title)
    }
    if (auth.user.role === 'cashier') {
      return ['Ventas', 'Tesorería'].includes(cat.title)
    }
    if (auth.user.role === 'driver') {
      return cat.title === 'Logística'
    }
    return false
  }).map(cat => {
    let newItems = cat.items

    // Filter adminOnly items
    if (auth.user.role !== 'admin') {
      newItems = newItems.filter(i => !(i as any).adminOnly)
    } else {
      // If admin, hide 'Radar de Despachos' because they shouldn't accept driver orders
      newItems = newItems.filter(i => i.name !== 'Radar de Despachos')
    }

    if (auth.user.role === 'warehouse_keeper' && cat.title === 'Compras') {
      newItems = newItems.filter(i => i.name === 'Órdenes de Compra')
    }
    if (auth.user.role === 'warehouse_keeper' && cat.title === 'Logística') {
      newItems = newItems.filter(i => i.name === 'Carga/Descarga')
    }
    if (auth.user.role === 'driver' && cat.title === 'Logística') {
      newItems = newItems.filter(i => i.name === 'Radar de Despachos')
    }
    if (auth.user.role === 'cashier' && cat.title === 'Tesorería') {
      newItems = newItems.filter(i => i.name === 'Cierre de Caja')
    }
    return { ...cat, items: newItems }
  }).filter(cat => cat.items.length > 0)

  let longestMatch = -1
  let bestCategory = filteredCategories[0]

  filteredCategories.forEach(cat => {
    cat.items.forEach(item => {
      if (currentPath.startsWith(item.href) || (currentPath === '/' && item.href === '/dashboard')) {
        if (item.href.length > longestMatch) {
          longestMatch = item.href.length
          bestCategory = cat
        }
      }
    })
  })

  const activeCategory = bestCategory

  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system')
  const isManualThemeChange = useRef(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('sf-theme') as 'light' | 'dark' | 'system'
    if (savedTheme) {
      setThemePreference(savedTheme)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const isDark = themePreference === 'dark' || (themePreference === 'system' && mediaQuery.matches)

      const updateDOM = () => {
        if (isDark) {
          document.documentElement.classList.remove('theme-light')
        } else {
          document.documentElement.classList.add('theme-light')
        }
      }

      // @ts-ignore (View Transitions API)
      if (isManualThemeChange.current && document.startViewTransition) {
        // @ts-ignore
        document.startViewTransition(updateDOM)
      } else {
        updateDOM()
      }
      isManualThemeChange.current = false
    }

    applyTheme()

    if (themePreference === 'system') {
      mediaQuery.addEventListener('change', applyTheme)
      return () => mediaQuery.removeEventListener('change', applyTheme)
    }
  }, [themePreference])

  const cycleTheme = () => {
    isManualThemeChange.current = true
    const next = themePreference === 'system' ? 'light' : themePreference === 'light' ? 'dark' : 'system'
    localStorage.setItem('sf-theme', next)
    setThemePreference(next)
  }

  useEffect(() => {
    if (flash?.notice) Toast.fire({ icon: 'success', title: flash.notice })
    if (flash?.alert) Toast.fire({ icon: 'error', title: flash.alert })
  }, [flash])

  useEffect(() => {
    return router.on('success', (event) => {
      const newFlash = event.detail.page.props.flash as any
      if (newFlash?.notice) Toast.fire({ icon: 'success', title: newFlash.notice })
      if (newFlash?.alert) Toast.fire({ icon: 'error', title: newFlash.alert })
    })
  }, [])

  return (
    <div className="min-h-screen bg-[var(--sf-bg)] flex text-[var(--sf-text-main)] selection:bg-indigo-500/30">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 glass border-r border-[var(--sf-glass-border)]
          transform transition-transform duration-300 ease-in-out flex flex-col
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center gap-4 px-6 border-b border-[var(--sf-glass-border)] shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-[var(--sf-text-main)] font-heading font-bold text-lg tracking-wider">SF</span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              StockFlow
            </h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Enterprise</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-hide">
          {filteredCategories.map((cat, index) => {
            const isActive = activeCategory.title === cat.title
            return (
              <Link
                key={cat.title}
                href={cat.items[0].href}
                className={`
                  group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-300 relative overflow-hidden animate-slide-up
                  ${isActive
                    ? 'text-[var(--sf-primary)] bg-[var(--sf-primary)]/10 border border-[var(--sf-primary)]/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                    : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-text-main)]/5 border border-transparent'
                  }
                `}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                )}
                <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'group-hover:scale-110 grayscale group-hover:grayscale-0'}`}>
                  {cat.icon}
                </span>
                <span className="relative z-10">{cat.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 shrink-0">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 w-10 h-10 rounded-full bg-[var(--sf-surface)] border border-[var(--sf-glass-border)] flex items-center justify-center text-[var(--sf-text-main)] text-sm font-bold shadow-inner shrink-0">
              {auth.user.first_name?.[0]}{auth.user.last_name?.[0]}
            </div>

            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--sf-text-main)] truncate">
                {auth.user.first_name} {auth.user.last_name}
              </p>
              <p className="text-[11px] text-[var(--sf-text-muted)] truncate uppercase tracking-wider mt-0.5">
                {auth.user.role === 'admin' ? 'Administrador' :
                  auth.user.role === 'warehouse_keeper' ? 'Bodeguero' : 'Camionero'}
              </p>
            </div>

            <button
              onClick={() => router.delete('/logout')}
              className="relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--sf-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header */}
        {!hideHeader && (
          <header className="h-20 glass border-b border-[var(--sf-glass-border)] flex items-center px-6 shrink-0 relative z-10 justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              <div className="hidden sm:block animate-fade-in">
                <h2 className="font-heading text-lg font-medium text-[var(--sf-text-muted)]">
                  Bienvenido de nuevo, <span className="text-[var(--sf-text-main)] font-bold">{auth.user.first_name}</span>
                </h2>
                {auth.current_company && (
                  <p className="text-xs text-indigo-400 font-medium tracking-wide flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {auth.current_company.name} {auth.current_company.rut ? `(${auth.current_company.rut})` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {auth.user.role === 'admin' && auth.available_companies && auth.available_companies.length > 0 && (
                <div className="relative group">
                  <select
                    className="appearance-none bg-[var(--sf-surface)] border border-[var(--sf-border)] text-[var(--sf-text-main)] text-sm font-medium rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-sm hover:border-indigo-500/30 transition-colors"
                    value={auth.current_company?.id || ''}
                    onChange={(e) => {
                      const companyId = e.target.value
                      if (companyId && parseInt(companyId) !== auth.current_company?.id) {
                        router.post(`/companies/${companyId}/switch`)
                      }
                    }}
                  >
                    {auth.available_companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[var(--sf-text-muted)] group-hover:text-indigo-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              <button
                onClick={cycleTheme}
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-all hover:scale-110"
                title={`Tema: ${themePreference === 'system' ? 'Automático (Sistema)' : themePreference === 'light' ? 'Claro' : 'Oscuro'}`}
              >
                {themePreference === 'system' ? <Monitor className="w-5 h-5" /> : themePreference === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>
        )}

        {/* Sub-navigation Tabs */}
        {!hideHeader && activeCategory.items.length > 1 && (
          <div className="bg-[var(--sf-bg)]/80 backdrop-blur-md border-b border-[var(--sf-glass-border)] shrink-0 relative z-10">
            <div className="px-6 lg:px-8">
              <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                {activeCategory.items.map((item) => {
                  const isActive = currentPath.startsWith(item.href) || (currentPath === '/' && item.href === '/dashboard')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                        ${isActive
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-[var(--sf-text-muted)] hover:border-[var(--sf-glass-border)] hover:text-[var(--sf-text-main)]'
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto relative z-0 ${hideHeader ? 'p-0' : 'p-4 lg:p-8'}`}>
          <div className={`mx-auto w-full animate-fade-in ${hideHeader ? 'h-full' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
