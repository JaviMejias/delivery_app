import { useState, useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import { Search, Truck, User as UserIcon, Users, FileText, MapPin, List, Command, CornerDownLeft, ShoppingCart, Receipt, Package, Tag, Building, Building2, ClipboardList, TrendingDown, TrendingUp, Lock, Route as RouteIcon } from 'lucide-react'

interface OmnibarProps {
  categories: any[]
}

export function Omnibar({ categories }: OmnibarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [apiResults, setApiResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [query, apiResults.length])

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      const el = document.getElementById(`omnibar-item-${activeIndex}`)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeIndex, isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    const handleCustomOpen = () => setIsOpen(true)
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-omnibar', handleCustomOpen)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-omnibar', handleCustomOpen)
    }
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    } else {
      setQuery('')
      setApiResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (query.length < 2) {
      setApiResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: { 'Accept': 'application/json' }
        })
        const data = await res.json()
        setApiResults(data.results || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }, 300)

  }, [query])

  const staticResults = categories.flatMap(cat => 
    cat.items.map((item: any) => ({ ...item, category: cat.title, type: 'page' }))
  ).filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5)

  const handleSelect = (href: string) => {
    setIsOpen(false)
    router.visit(href)
  }

  const renderIcon = (type: string) => {
    switch(type) {
      case 'truck': return <Truck className="w-5 h-5" />
      case 'user': return <UserIcon className="w-5 h-5" />
      case 'customer': return <Users className="w-5 h-5" />
      case 'order': return <ShoppingCart className="w-5 h-5 text-amber-400" />
      case 'sale': return <Receipt className="w-5 h-5 text-rose-400" />
      case 'product': return <Package className="w-5 h-5 text-indigo-400" />
      case 'brand': return <Tag className="w-5 h-5 text-fuchsia-400" />
      case 'warehouse': return <Building className="w-5 h-5 text-cyan-400" />
      case 'supplier': return <Building2 className="w-5 h-5 text-emerald-400" />
      case 'purchase_order': return <ClipboardList className="w-5 h-5 text-orange-400" />
      case 'purchase_document': return <FileText className="w-5 h-5 text-blue-400" />
      case 'expense': return <TrendingDown className="w-5 h-5 text-red-400" />
      case 'income': return <TrendingUp className="w-5 h-5 text-green-400" />
      case 'closure': return <Lock className="w-5 h-5 text-slate-400" />
      case 'settlement': return <RouteIcon className="w-5 h-5 text-violet-400" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const allResults = [...apiResults, ...staticResults]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = allResults[activeIndex]
        if (selected) {
           if (selected.type === 'page') handleSelect(selected.href)
           else if (selected.type === 'truck') handleSelect(`/trucks?search=${selected.title.split(' ')[1]}`)
           else if (selected.type === 'user') handleSelect(`/users?search=${encodeURIComponent(selected.title)}`)
           else if (selected.type === 'customer') handleSelect(`/customers?search=${encodeURIComponent(selected.title)}`)
           else if (selected.type === 'order') handleSelect(`/logistics/orders?search=${selected.token || ''}`)
           else if (selected.type === 'sale') handleSelect(`/sales/local?search=${selected.id}`)
           else if (selected.type === 'product') handleSelect(`/catalog/products?search=${encodeURIComponent(selected.title)}`)
           else if (selected.type === 'brand') handleSelect(`/catalog/brands?search=${encodeURIComponent(selected.title)}`)
           else if (selected.type === 'warehouse') handleSelect(`/inventory/warehouses?search=${encodeURIComponent(selected.title)}`)
           else if (selected.type === 'supplier') handleSelect(`/catalog/suppliers?search=${encodeURIComponent(selected.title)}`)
           else if (selected.type === 'purchase_order') handleSelect(`/purchases/orders?search=${selected.id}`)
           else if (selected.type === 'purchase_document') handleSelect(`/purchases/documents?search=${encodeURIComponent(selected.token || '')}`)
           else if (selected.type === 'expense') handleSelect(`/treasury/expenses?search=${selected.id}`)
           else if (selected.type === 'income') handleSelect(`/treasury/incomes`)
           else if (selected.type === 'closure') handleSelect(`/sales/local/closures?search=${encodeURIComponent(selected.title)}`)
           else if (selected.type === 'settlement') handleSelect(`/sales/settlements?search=${selected.id}`)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allResults, activeIndex])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-[var(--sf-bg)]/80 backdrop-blur-md" onClick={() => setIsOpen(false)}></div>
      
      <div 
        className="relative w-full max-w-2xl bg-[var(--sf-surface)]/95 backdrop-blur-xl border border-[var(--sf-glass-border)] rounded-2xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(99,102,241,0.1)] overflow-hidden animate-slide-up ring-1 ring-white/5"
      >
        {/* Header Search Input */}
        <div className="flex items-center px-5 py-4 border-b border-white/5 bg-black/10 relative">
          <Search className={`w-6 h-6 mr-4 transition-colors ${query.length > 0 ? 'text-primary-400' : 'text-[var(--sf-text-muted)]'}`} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-[var(--sf-text-main)] text-xl font-medium outline-none focus:outline-none focus:ring-0 placeholder-[var(--sf-text-muted)]/50"
            placeholder="Buscar por patente, nombre, RUT..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-5 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Results Area */}
        {query.length > 0 && (
          <div className="max-h-[55vh] overflow-y-auto p-3 custom-scrollbar relative">
            {allResults.length > 0 ? (
              allResults.map((result, idx) => {
                const isActive = idx === activeIndex
                return (
                  <div 
                    key={idx} 
                    id={`omnibar-item-${idx}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer mb-1 border ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary-500/10 to-transparent border-primary-500/30 shadow-[inset_4px_0_0_var(--sf-primary-500)]' 
                        : 'border-transparent hover:bg-white/5'
                    }`}
                    onClick={() => {
                      if (result.type === 'page') handleSelect(result.href)
                      else if (result.type === 'truck') handleSelect(`/trucks?search=${result.title.split(' ')[1]}`)
                      else if (result.type === 'user') handleSelect(`/users?search=${encodeURIComponent(result.title)}`)
                      else if (result.type === 'customer') handleSelect(`/customers?search=${encodeURIComponent(result.title)}`)
                      else if (result.type === 'order') handleSelect(`/logistics/orders?search=${result.token || ''}`)
                      else if (result.type === 'sale') handleSelect(`/sales/local?search=${result.id}`)
                      else if (result.type === 'product') handleSelect(`/catalog/products?search=${encodeURIComponent(result.title)}`)
                      else if (result.type === 'brand') handleSelect(`/catalog/brands?search=${encodeURIComponent(result.title)}`)
                      else if (result.type === 'warehouse') handleSelect(`/inventory/warehouses?search=${encodeURIComponent(result.title)}`)
                      else if (result.type === 'supplier') handleSelect(`/catalog/suppliers?search=${encodeURIComponent(result.title)}`)
                      else if (result.type === 'purchase_order') handleSelect(`/purchases/orders?search=${result.id}`)
                      else if (result.type === 'purchase_document') handleSelect(`/purchases/documents?search=${encodeURIComponent(result.token || '')}`)
                      else if (result.type === 'expense') handleSelect(`/treasury/expenses?search=${result.id}`)
                      else if (result.type === 'income') handleSelect(`/treasury/incomes`)
                      else if (result.type === 'closure') handleSelect(`/sales/local/closures?search=${encodeURIComponent(result.title)}`)
                      else if (result.type === 'settlement') handleSelect(`/sales/settlements?search=${result.id}`)
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                        isActive 
                          ? 'bg-primary-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105' 
                          : 'bg-black/20 border border-white/5 text-[var(--sf-text-muted)]'
                      }`}>
                        {renderIcon(result.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[15px] font-semibold tracking-wide transition-colors truncate ${
                          isActive ? 'text-[var(--sf-text-main)]' : 'text-[var(--sf-text-main)]/80'
                        }`}>
                          {result.type === 'page' ? result.name : result.title}
                        </span>
                        <span className={`text-[12px] font-medium transition-colors truncate ${
                          isActive ? 'text-primary-300' : 'text-[var(--sf-text-muted)]'
                        }`}>
                          {result.type === 'page' ? result.category : result.subtitle}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {result.type === 'truck' ? (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSelect(`/trucks?search=${result.title.split(' ')[1]}`) }}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                              isActive ? 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30' : 'bg-white/5 hover:bg-white/10 text-white/70'
                            }`}
                          >
                            <List className="w-3.5 h-3.5" /> Ficha
                          </button>
                          {result.is_active && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelect(`/trucks/map?truck_id=${result.id}`) }}
                              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                isActive ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] text-white' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5" /> Ver Mapa
                            </button>
                          )}
                        </>
                      ) : (
                        <div className={`transition-all duration-300 flex items-center gap-2 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                          <span className="text-[11px] font-semibold text-[var(--sf-text-muted)]">Abrir</span>
                          <kbd className="flex items-center justify-center w-6 h-6 bg-black/40 border border-white/10 rounded-md shadow-sm">
                            <CornerDownLeft className="w-3.5 h-3.5 text-primary-400" />
                          </kbd>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                  <Search className="w-8 h-8 text-[var(--sf-text-muted)] opacity-50" />
                </div>
                <p className="text-[var(--sf-text-main)] font-semibold text-lg">No hay resultados para "{query}"</p>
                <p className="text-[var(--sf-text-muted)] text-sm mt-1">Prueba con otra patente o nombre de chofer.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Footer Keyboard Hints */}
        <div className="px-5 py-3 bg-black/30 border-t border-[var(--sf-glass-border)] flex items-center justify-between text-[11px] font-medium text-[var(--sf-text-muted)] backdrop-blur-md">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="flex gap-1">
                <kbd className="w-5 h-5 flex items-center justify-center bg-white/10 rounded border border-white/5 shadow-sm">↑</kbd>
                <kbd className="w-5 h-5 flex items-center justify-center bg-white/10 rounded border border-white/5 shadow-sm">↓</kbd>
              </span>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-2">
              <kbd className="w-5 h-5 flex items-center justify-center bg-white/10 rounded border border-white/5 shadow-sm"><CornerDownLeft className="w-3 h-3" /></kbd>
              <span>Seleccionar</span>
            </span>
          </div>
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 h-5 flex items-center justify-center bg-white/10 rounded border border-white/5 shadow-sm font-sans tracking-widest">ESC</kbd>
            <span>Cerrar</span>
          </span>
        </div>
      </div>
    </div>
  )
}
