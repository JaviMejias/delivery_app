import { useState, useEffect, useRef } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import Swal from 'sweetalert2'
import type { User } from '@/types'

interface Props {
  children: React.ReactNode
  hideHeader?: boolean
}

import { Sparkles, Grid, Banknote, ShoppingCart, Package, Truck, Monitor, Sun, Moon, Building2, Radar, Menu, Palette, Check, Bell, Trash2, Search, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { CustomSelect } from '@/components/CustomSelect'
import { Omnibar } from '@/components/Omnibar'
import { useSound } from '@/hooks/useSound'
import { motion, AnimatePresence } from 'framer-motion'

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
  const { auth, flash, app_name } = page.props as unknown as {
    auth: {
      user: User,
      current_company?: { id: number, name: string, rut: string },
      available_companies?: { id: number, name: string }[]
    };
    flash: { notice?: string; alert?: string };
    app_name: string;
  }
  const { playSound } = useSound()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sf-sidebar-collapsed') === 'true')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const currentPath = window.location.pathname

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sf-sidebar-collapsed', newState ? 'true' : 'false')
  }

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
  const [auraPreference, setAuraPreference] = useState<string>('indigo')
  const [showAuraMenu, setShowAuraMenu] = useState(false)
  const auraMenuRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { headers: { 'Accept': 'application/json' } })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications)
          setUnreadCount(data.unread_count)
        }
      } catch (e) {
        console.error("Error fetching notifications", e)
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  // Global Ripple Effect
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement
      
      while (target && target.tagName !== 'BUTTON' && target.tagName !== 'A') {
        if (target.tagName === 'BODY' || target.classList.contains('button-like')) break
        target = target.parentElement as HTMLElement
      }
      
      if (target && (target.tagName === 'BUTTON' || target.classList.contains('button-like') || (target.tagName === 'A' && (target.className.includes('bg-') || target.className.includes('btn'))))) {
        if (target.tagName === 'BUTTON' && !target.className.includes('bg-') && !target.className.includes('hover:bg') && !target.className.includes('border')) return
        
        const computedStyle = window.getComputedStyle(target)
        if (computedStyle.position === 'static') {
          target.style.position = 'relative'
        }
        if (computedStyle.overflow !== 'hidden' && computedStyle.overflow !== 'clip') {
          target.style.overflow = 'hidden'
        }

        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        const ripple = document.createElement('span')
        ripple.classList.add('ripple-element')
        
        const size = Math.max(rect.width, rect.height)
        ripple.style.width = `${size}px`
        ripple.style.height = `${size}px`
        ripple.style.left = `${x - size / 2}px`
        ripple.style.top = `${y - size / 2}px`
        
        target.appendChild(ripple)
        
        setTimeout(() => {
          ripple.remove()
        }, 600)
      }
    }
    
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  const markAllRead = async () => {
    try {
      const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
      await fetch('/api/notifications/mark_all_read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch (e) { }
  }

  const markAsRead = async (id: number) => {
    try {
      const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
      await fetch(`/api/notifications/${id}/mark_as_read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) { }
  }

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      })
      const isUnread = !notifications.find(n => n.id === id)?.read_at
      if (isUnread) setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e) { }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (auraMenuRef.current && !auraMenuRef.current.contains(event.target as Node)) {
        setShowAuraMenu(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const AURAS = [
    { id: 'indigo', name: 'Original (Índigo)', color: 'bg-[#6366f1]' },
    { id: 'red', name: 'Rojo', color: 'bg-red-500' },
    { id: 'blue', name: 'Azul', color: 'bg-blue-500' },
    { id: 'amber', name: 'Amarillo', color: 'bg-amber-500' },
    { id: 'orange', name: 'Naranjo', color: 'bg-orange-500' }
  ]

  useEffect(() => {
    const savedAura = localStorage.getItem('sf-aura') || 'indigo'
    setAuraPreference(savedAura)
    document.documentElement.classList.remove('aura-indigo', 'aura-red', 'aura-blue', 'aura-amber', 'aura-orange')
    document.documentElement.classList.add(`aura-${savedAura}`)
  }, [])

  const changeAura = (auraId: string) => {
    localStorage.setItem('sf-aura', auraId)
    setAuraPreference(auraId)
    document.documentElement.classList.remove('aura-indigo', 'aura-red', 'aura-blue', 'aura-amber', 'aura-orange')
    document.documentElement.classList.add(`aura-${auraId}`)
    setShowAuraMenu(false)
  }

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
    if (flash?.notice) {
      playSound('success')
      Toast.fire({ icon: 'success', title: flash.notice })
    }
    if (flash?.alert) {
      playSound('error')
      Toast.fire({ icon: 'error', title: flash.alert })
    }
  }, [flash, playSound])

  useEffect(() => {
    return router.on('success', (event) => {
      const newFlash = event.detail.page.props.flash as any
      if (newFlash?.notice) {
        playSound('success')
        Toast.fire({ icon: 'success', title: newFlash.notice })
      }
      if (newFlash?.alert) {
        playSound('error')
        Toast.fire({ icon: 'error', title: newFlash.alert })
      }
    })
  }, [playSound])

  const getInitials = (name: string) => {
    if (!name) return 'SF'
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return name.substring(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--sf-app-bg)] flex lg:p-4 lg:gap-4 text-[var(--sf-text-main)] selection:bg-primary-500/30">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden transition-opacity animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-[var(--sf-bg)] border-r border-[var(--sf-border)]
          transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col
          lg:static lg:bg-transparent lg:border-none lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
          ${isCollapsed ? 'lg:w-24' : 'lg:w-64'}
        `}
        style={{ viewTransitionName: 'sidebar' }}
      >
        <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-[var(--sf-glass-border)] shrink-0 transition-all`}>
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
              <span className="text-[var(--sf-text-main)] font-heading font-bold text-lg tracking-wider">{getInitials(app_name)}</span>
            </div>
            {!isCollapsed && (
              <h1 className="font-heading font-bold text-xl bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent tracking-tight whitespace-nowrap animate-fade-in">
                {app_name}
              </h1>
            )}
          </div>
          
          <button 
            onClick={toggleCollapse} 
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-surface)] transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-hide">
          {auth.user.role === 'admin' && !isCollapsed && (
            <button 
              onClick={() => { setSidebarOpen(false); window.dispatchEvent(new CustomEvent('open-omnibar')) }}
              className="w-full flex items-center text-left text-sm font-bold text-[var(--sf-text-main)] bg-[var(--sf-surface)] border border-[var(--sf-border)] hover:bg-[var(--sf-surface-hover)] px-4 py-3 rounded-xl transition-colors mb-4 lg:hidden group shadow-sm"
            >
              <Search className="w-5 h-5 mr-3 text-[var(--sf-text-muted)] group-hover:text-primary-400 transition-colors" />
              Buscar...
            </button>
          )}
          {filteredCategories.map((cat, index) => {
            const isActive = activeCategory.title === cat.title
            return (
              <Link 
                key={cat.title} 
                href={cat.items[0].href} 
                className="block outline-none relative group/link"
                onMouseEnter={(e) => {
                  if (!isCollapsed) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  setTooltipPos({ top: rect.top + rect.height / 2, left: rect.right + 12 })
                  setHoveredCategory(cat.title)
                }}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5 px-4'} py-3 rounded-xl text-sm font-medium
                    transition-all duration-300 relative overflow-hidden animate-slide-up
                    ${isActive
                      ? 'text-[var(--sf-text-main)] bg-[var(--sf-surface)] border border-[var(--sf-border)] shadow-sm'
                      : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-surface-hover)] border border-transparent'
                    }
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full shadow-[0_0_10px_var(--sf-primary-500)] opacity-80" />
                  )}
                  <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] text-primary-500' : 'group-hover:scale-110 grayscale group-hover:grayscale-0'}`}>
                    {cat.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="relative z-10 whitespace-nowrap">{cat.title}</span>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 shrink-0 flex flex-col gap-3">
          {auth.user.role === 'admin' && auth.available_companies && auth.available_companies.length > 0 && !isCollapsed && (
            <div className="lg:hidden w-full relative z-[60]">
              <CustomSelect
                value={auth.current_company ? { value: auth.current_company.id.toString(), label: auth.current_company.name } : null}
                onChange={(val: any) => {
                  const companyId = val?.value
                  if (companyId && parseInt(companyId) !== auth.current_company?.id) {
                    router.post(`/companies/${companyId}/switch`)
                  }
                }}
                options={auth.available_companies.map((c: any) => ({ value: c.id.toString(), label: c.name }))}
                placeholder="Empresa..."
                menuPlacement="top"
              />
            </div>
          )}

          <div className={`bg-[var(--sf-surface)] rounded-2xl ${isCollapsed ? 'p-2 justify-center flex-col' : 'p-4 flex-row'} flex items-center gap-3 relative overflow-hidden group border border-[var(--sf-border)] shadow-sm transition-all`}>
            <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 w-10 h-10 rounded-full bg-[var(--sf-bg)] border border-[var(--sf-border)] flex items-center justify-center text-[var(--sf-text-main)] text-sm font-bold shadow-inner shrink-0" title={isCollapsed ? `${auth.user.first_name} ${auth.user.last_name}` : undefined}>
              {auth.user.first_name?.[0]}{auth.user.last_name?.[0]}
            </div>

            {!isCollapsed && (
              <div className="relative z-10 flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-bold text-[var(--sf-text-main)] truncate">
                  {auth.user.first_name} {auth.user.last_name}
                </p>
                <p className="text-[11px] text-[var(--sf-text-muted)] truncate uppercase tracking-wider mt-0.5">
                  {auth.user.role === 'admin' ? 'Administrador' :
                    auth.user.role === 'warehouse_keeper' ? 'Bodeguero' : 'Camionero'}
                </p>
              </div>
            )}

            <button
              onClick={() => router.delete('/logout')}
              className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--sf-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer ${isCollapsed ? 'mt-2' : ''}`}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div 
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[var(--sf-bg)] lg:rounded-[2rem] lg:border lg:border-[var(--sf-border)] lg:shadow-2xl"
        style={{ viewTransitionName: 'main-container' }}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        {!hideHeader && (
          <header className="h-20 bg-[var(--sf-bg)]/80 backdrop-blur-xl border-b border-[var(--sf-border)] flex items-center px-6 shrink-0 relative z-30 justify-between">
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
                <h2 className="font-heading text-lg font-semibold text-[var(--sf-text-main)]">
                  {auth.user.first_name} {auth.user.last_name}
                </h2>
                {auth.current_company && (
                  <p className="text-xs text-[var(--sf-text-muted)] font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-primary-500" />
                    {auth.current_company.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {auth.user.role === 'admin' && (
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-omnibar'))}
                  className="hidden lg:flex items-center text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] bg-[var(--sf-surface)] hover:bg-[var(--sf-surface-hover)] px-3 py-1.5 rounded-lg border border-[var(--sf-border)] transition-all text-sm gap-2 mr-2 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar...</span>
                  <kbd className="ml-2 bg-black/20 border border-[var(--sf-border)] rounded px-1.5 py-0.5 text-[10px] font-mono">Ctrl K</kbd>
                </button>
              )}

              {auth.user.role === 'admin' && auth.available_companies && auth.available_companies.length > 0 && (
                <div className="hidden lg:block w-[220px] relative z-[60]">
                  <CustomSelect
                    value={auth.current_company ? { value: auth.current_company.id.toString(), label: auth.current_company.name } : null}
                    onChange={(val: any) => {
                      const companyId = val?.value
                      if (companyId && parseInt(companyId) !== auth.current_company?.id) {
                        router.post(`/companies/${companyId}/switch`)
                      }
                    }}
                    options={auth.available_companies.map((c: any) => ({ value: c.id.toString(), label: c.name }))}
                    placeholder="Empresa..."
                  />
                </div>
              )}

              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-[var(--sf-surface)] border border-[var(--sf-border)] flex items-center justify-center text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:border-[var(--sf-border-hover)] transition-all relative shadow-sm"
                  title="Notificaciones"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-[var(--sf-glass-bg)]" />
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed left-4 right-4 top-20 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-80 glass-panel border border-[var(--sf-glass-border)] rounded-2xl shadow-2xl z-[100] py-2 overflow-hidden animate-slide-up">
                    <div className="px-4 py-2 border-b border-[var(--sf-glass-border)] flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--sf-text-muted)] uppercase tracking-wider">Notificaciones</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-bold text-primary-500 hover:text-primary-400">
                          Marcar todo leído
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[var(--sf-text-muted)]">
                          No tienes notificaciones
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className={`group relative block px-4 py-3 border-b border-[var(--sf-glass-border)]/50 last:border-0 hover:bg-[var(--sf-surface-hover)] transition-colors ${!notif.read_at ? 'bg-primary-500/5' : ''}`}>
                            <Link
                              href={notif.action_url || '#'}
                              onClick={() => { if (!notif.read_at) markAsRead(notif.id) }}
                              className="flex items-start gap-3 pr-8"
                            >
                              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.notification_type === 'danger' ? 'bg-rose-500' : notif.notification_type === 'warning' ? 'bg-amber-500' : 'bg-primary-500'}`} />
                              <div>
                                <p className={`text-sm ${!notif.read_at ? 'font-bold text-[var(--sf-text-main)]' : 'font-medium text-[var(--sf-text-muted)]'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-[var(--sf-text-muted)] mt-0.5 line-clamp-2">{notif.message}</p>
                              </div>
                            </Link>
                            <button
                              onClick={(e) => deleteNotification(notif.id, e)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[var(--sf-text-muted)] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                              title="Eliminar Notificación"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={auraMenuRef}>
                <button
                  onClick={() => setShowAuraMenu(!showAuraMenu)}
                  className="w-10 h-10 rounded-full bg-[var(--sf-surface)] border border-[var(--sf-border)] flex items-center justify-center text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:border-[var(--sf-border-hover)] transition-all shadow-sm"
                  title="Cambiar Color (Aura)"
                >
                  <Palette className="w-5 h-5" />
                </button>

                {showAuraMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-panel border border-[var(--sf-glass-border)] rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-slide-up">
                    <div className="px-3 pb-2 mb-2 border-b border-[var(--sf-glass-border)]">
                      <p className="text-xs font-bold text-[var(--sf-text-muted)] uppercase tracking-wider">Color de Marca</p>
                    </div>
                    {AURAS.map(aura => (
                      <button
                        key={aura.id}
                        onClick={() => changeAura(aura.id)}
                        className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between transition-colors ${auraPreference === aura.id ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--sf-text-main)] hover:bg-[var(--sf-surface-hover)]'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full shadow-inner ${aura.color}`} />
                          {aura.name}
                        </div>
                        {auraPreference === aura.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={cycleTheme}
                className="w-10 h-10 rounded-full bg-[var(--sf-surface)] border border-[var(--sf-border)] flex items-center justify-center text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:border-[var(--sf-border-hover)] transition-all shadow-sm"
                title={`Tema: ${themePreference === 'system' ? 'Automático (Sistema)' : themePreference === 'light' ? 'Claro' : 'Oscuro'}`}
              >
                {themePreference === 'system' ? <Monitor className="w-5 h-5" /> : themePreference === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>
        )}

        {!hideHeader && activeCategory.items.length > 1 && (
          <div className="bg-[var(--sf-bg)]/80 backdrop-blur-xl border-b border-[var(--sf-border)] shrink-0 relative z-10">
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
                          ? 'border-primary-500 text-primary-400'
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

        <AnimatePresence mode="wait">
          <motion.main 
            key={usePage().url} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`flex-1 overflow-x-hidden overflow-y-auto relative z-0 ${hideHeader ? 'p-0' : 'p-4 lg:p-8'}`}
          >
            <div className={`mx-auto w-full ${hideHeader ? 'h-full' : ''}`}>
              {children}
            </div>
          </motion.main>
        </AnimatePresence>
      </div>

      {auth.user.role === 'admin' && (
        <Omnibar categories={navigationCategories} />
      )}

      {isCollapsed && hoveredCategory && (
        <div 
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateY(-50%)' }}
          className="fixed px-3 py-1.5 bg-[var(--sf-surface)] border border-[var(--sf-glass-border)] rounded-lg text-[13px] font-bold text-[var(--sf-text-main)] shadow-xl z-[1000] whitespace-nowrap pointer-events-none animate-slide-up glass-panel"
        >
          {hoveredCategory}
        </div>
      )}
    </div>
  )
}
