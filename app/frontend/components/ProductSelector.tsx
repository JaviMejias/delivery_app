import React, { useState, useMemo } from 'react'
import { Package, Minus, Plus, AlertCircle, Search, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: number
  name: string
  kg: number
  sku?: string
  image_url?: string | null
}

interface Brand {
  id: number | string
  name: string
  logo_url?: string | null
  products: Product[]
}

interface CartItem {
  product_id: number
  quantity: number
  name: string
  kg: number
  brand_name: string
}

interface ProductSelectorProps {
  brands: Brand[]
  cart: CartItem[]
  updateCart: (product: Product, brandName: string, change: number) => void
}

export default function ProductSelector({ brands, cart, updateCart }: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState<number | string | null>(null)
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({})
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Automatically expand the first brand on mount
  React.useEffect(() => {
    if (brands.length > 0 && Object.keys(expandedBrands).length === 0) {
      setExpandedBrands({ [brands[0].id]: true })
    }
  }, [brands])

  const toggleBrand = (brandId: string | number) => {
    setExpandedBrands(prev => ({ ...prev, [brandId]: !prev[brandId] }))
  }

  const filteredBrands = useMemo(() => {
    let result = brands

    // Filtrar por marca seleccionada
    if (selectedBrandId) {
      result = result.filter(b => b.id === selectedBrandId)
    }

    // Filtrar por búsqueda
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.map(brand => {
        const matchingProducts = brand.products.filter(p => 
          p.name.toLowerCase().includes(lowerQuery) ||
          p.sku?.toLowerCase().includes(lowerQuery) ||
          `${p.kg}kg`.includes(lowerQuery) ||
          `${p.kg} kilos`.includes(lowerQuery)
        )
        return { ...brand, products: matchingProducts }
      }).filter(brand => brand.products.length > 0)
    }

    return result
  }, [brands, searchQuery, selectedBrandId])

  if (!brands || brands.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-3xl border border-white/5">
        <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">No hay productos disponibles por el momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Buscador y Filtros */}
      <div className="space-y-3 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar cilindro, galón, 15kg..." 
            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary-500 outline-none transition-colors shadow-inner"
          />
        </div>
        
        {/* Chips de Marcas (Colapsables) */}
        {brands.length > 1 && (
          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mt-3 shadow-inner">
            <button 
              onClick={(e) => { e.preventDefault(); setIsFiltersOpen(!isFiltersOpen) }}
              className="w-full flex items-center justify-between p-3 px-4 hover:bg-slate-800/80 transition-colors active:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Filtrar por Marca</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">{brands.length}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isFiltersOpen ? 'max-h-[800px] opacity-100 p-4 pt-1' : 'max-h-0 opacity-0 overflow-hidden m-0 p-0'}`}>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); setSelectedBrandId(null); setIsFiltersOpen(false) }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${!selectedBrandId ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white'}`}
                >
                  Todas
                </button>
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={(e) => { e.preventDefault(); setSelectedBrandId(brand.id); setIsFiltersOpen(false) }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${selectedBrandId === brand.id ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-white'}`}
                  >
                    {brand.logo_url && <img src={brand.logo_url} alt={brand.name} className="w-4 h-4 rounded-full bg-white object-contain" />}
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredBrands.length === 0 ? (
        <div className="text-center py-6 bg-slate-950/50 rounded-2xl border border-white/5">
          <p className="text-slate-500 text-sm font-medium">No se encontraron productos.</p>
        </div>
      ) : (
        filteredBrands.map(brand => (
        <div key={brand.id} className="bg-slate-900/40 rounded-3xl border border-white/5 overflow-hidden shadow-inner mb-4 transition-all">
          <button 
            onClick={(e) => { e.preventDefault(); toggleBrand(brand.id) }}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors active:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 rounded-full bg-white object-contain border border-white/10 shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 shadow-sm">
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <h3 className="font-black text-white text-lg tracking-tight">{brand.name}</h3>
            </div>
            <div className={`w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center transition-transform duration-300 ${expandedBrands[brand.id] ? 'rotate-180 bg-primary-500/20 text-primary-400' : 'text-slate-400'}`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>
          
          <div className={`grid gap-2.5 px-2.5 transition-all duration-300 ease-in-out ${expandedBrands[brand.id] ? 'pb-4 opacity-100 max-h-[2000px]' : 'max-h-0 opacity-0 overflow-hidden m-0 p-0'}`}>
            {brand.products.map((product, i) => {
              const cartItem = cart.find(c => c.product_id === product.id)
              const quantity = cartItem?.quantity || 0

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                  key={product.id} 
                  className="flex items-stretch gap-3 p-3 bg-slate-900 rounded-3xl border border-white/5 shadow-md relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  {/* Izquierda: Imagen */}
                  <div className="shrink-0 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white p-2 shadow-inner border border-white/10" />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 flex items-center justify-center shadow-inner border border-white/10">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Derecha: Info y Controles Apilados */}
                  <div className="flex flex-col flex-1 justify-between py-1">
                    <div>
                      <p className="font-black text-white text-sm sm:text-base leading-tight">{product.name}</p>
                      {product.sku && <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">SKU: {product.sku}</p>}
                    </div>
                    
                    {/* Controles de Cantidad */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Añadir</p>
                      <div className="flex items-center gap-1 bg-slate-950/50 rounded-xl p-1 border border-white/5 shadow-inner ml-auto">
                        <button
                          onClick={(e) => { e.preventDefault(); updateCart(product, brand.name, -1) }}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-90 transition-all ${
                            quantity > 0 
                              ? 'bg-slate-800 shadow-sm text-rose-400 hover:bg-slate-700' 
                              : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                          }`}
                          disabled={quantity === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <span className={`w-8 text-center font-black text-sm transition-colors ${quantity > 0 ? 'text-white' : 'text-slate-500'}`}>
                          {quantity}
                        </span>
                        
                        <button
                          onClick={(e) => { e.preventDefault(); updateCart(product, brand.name, 1) }}
                          className="w-9 h-9 rounded-lg bg-primary-500 shadow-md shadow-primary-500/20 text-white hover:bg-primary-400 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        ))
      )}

      {/* Cart Summary */}
      {cart.filter(i => i.quantity > 0).length > 0 && (
        <div className="mt-8 bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2">
          <h4 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-400" /> Resumen de tu pedido
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
            {cart.filter(i => i.quantity > 0).map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                key={item.product_id} 
                className="flex justify-between items-center text-sm bg-black/20 p-2 rounded-xl border border-white/5"
              >
                <span className="text-white font-bold">{item.quantity}x <span className="text-slate-400 font-medium">{item.brand_name} {item.name}</span></span>
                <button
                  onClick={(e) => { e.preventDefault(); updateCart({ id: item.product_id } as any, item.brand_name, -item.quantity) }}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase px-2 py-1 bg-red-400/10 rounded-lg active:scale-95 transition-colors"
                >
                  Quitar
                </button>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
