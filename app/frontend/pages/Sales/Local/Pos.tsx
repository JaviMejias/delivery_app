import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Head, router, Link } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import CurrencyInput from '@/components/CurrencyInput'
import { CustomSelect } from '@/components/CustomSelect'
import BoletaTicket from '@/components/BoletaTicket'
import PageHeader from '@/components/PageHeader'
import { Printer, XCircle, Grid, Keyboard, Plus, ArrowLeft, Store, Search } from 'lucide-react'

interface ProductPrice {
  price_list_id: number
  price: string
}

interface Product {
  id: number
  name: string
  sku: string
  product_prices: ProductPrice[]
  material: { name: string; returnable: boolean }
  brand: { name: string }
  accepts_vouchers: boolean
}

interface Inventory {
  id: number
  quantity: number
  warehouse_id: number
  item: Product
}

interface Warehouse {
  id: number
  name: string
  card_surcharge_type: string
  card_surcharge_amount: number
}

interface PriceList {
  id: number
  name: string
  code: string
}

interface CartItem {
  cartId: string // unique id for cart array
  product: Product
  quantity: number
  returned_empty_quantity: number
  price: number
  useVoucher: boolean
  voucherCode: string
}

interface Props {
  warehouses: Warehouse[]
  price_lists: PriceList[]
  inventories: Inventory[]
  print_sale?: any
  has_sales_today?: boolean
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
}

export default function Pos({ warehouses, inventories, price_lists, print_sale, has_sales_today, auth }: any) {
  const assignedWarehouseId = auth?.user?.assigned_warehouse_id?.toString()
  const isAdmin = auth?.user?.role === 'admin'

  const [warehouseId, setWarehouseId] = useState(assignedWarehouseId || '')
  const [priceListId, setPriceListId] = useState<number | ''>(price_lists.length > 0 ? price_lists[0].id : '')
  const [cart, setCart] = useState<CartItem[]>([])

  const [inputMode, setInputMode] = useState<'grid' | 'fast'>('fast')
  const [fastProductId, setFastProductId] = useState('')
  const [fastQuantity, setFastQuantity] = useState<number>(1)
  const [fastEmpty, setFastEmpty] = useState<number>(0)
  const [gridSearch, setGridSearch] = useState('')

  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<any | null>(print_sale || null)
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>('80mm')

  useEffect(() => {
    if (print_sale) {
      setSelectedSaleForTicket(print_sale)
    }
  }, [print_sale])

  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [transfer, setTransfer] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter inventory by selected warehouse
  const currentInventory = useMemo(() => {
    return inventories.filter(inv => inv.item && inv.quantity > 0 && inv.warehouse_id.toString() === warehouseId)
  }, [inventories, warehouseId])

  const filteredGridInventory = useMemo(() => {
    if (!gridSearch) return currentInventory
    const query = gridSearch.toLowerCase()
    return currentInventory.filter(inv => 
      inv.item.name.toLowerCase().includes(query) || 
      inv.item.sku.toLowerCase().includes(query) ||
      (inv.item.brand?.name && inv.item.brand.name.toLowerCase().includes(query)) ||
      (inv.item.material?.name && inv.item.material.name.toLowerCase().includes(query))
    )
  }, [currentInventory, gridSearch]) // Assuming plant inventory is global or filtered by backend, but here backend gives all with qty > 0. We should ideally filter by warehouseId if inventory has it. 
  // Wait, the backend sends ALL inventories for the company right now. We should filter by warehouse.
  // Actually backend sends `inventories` but we didn't include warehouse_id in the JSON? We did. Let's just use all provided since they are for the company.
  // To be safe, if we need to filter by warehouse: 
  // const currentInventory = inventories.filter(i => i.warehouse_id.toString() === warehouseId)
  // Let's assume the plant warehouse is what's loaded.

  const getProductPrice = (product: Product, plId: number | string) => {
    if (!plId) return 0
    const pp = product.product_prices?.find((p: any) => p.price_list_id.toString() === plId.toString())
    return pp ? parseFloat(pp.price) : 0
  }

  const addToCart = (inv: Inventory, customQty: number = 1, customEmpty: number = 0) => {
    const price = getProductPrice(inv.item, priceListId)
    // Check if item already in cart
    const existingIndex = cart.findIndex(c => c.product.id === inv.item.id && !c.useVoucher)
    if (existingIndex >= 0) {
      const newCart = [...cart]
      newCart[existingIndex].quantity += customQty
      newCart[existingIndex].returned_empty_quantity += customEmpty
      setCart(newCart)
    } else {
      const newItem: CartItem = {
        cartId: Math.random().toString(36).substring(7),
        product: inv.item,
        quantity: customQty,
        returned_empty_quantity: customEmpty,
        price: price,
        useVoucher: false,
        voucherCode: ''
      }
      setCart([...cart, newItem])
    }
  }

  const handleFastAdd = () => {
    if (!fastProductId || fastQuantity <= 0) return
    const inv = currentInventory.find(i => i.item.id.toString() === fastProductId)
    if (inv) {
      addToCart(inv, fastQuantity, fastEmpty)
      setFastProductId('')
      setFastQuantity(1)
      setFastEmpty(0)
    }
  }

  const selectedFastInv = useMemo(() => {
    if (!fastProductId) return null
    return currentInventory.find(i => i.item.id.toString() === fastProductId) || null
  }, [fastProductId, currentInventory])

  // Global Barcode Scanner Listener
  useEffect(() => {
    let barcodeBuffer = ''
    let lastKeyTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now()
      
      // If more than 50ms between keys, it's a human typing. Reset buffer.
      // (Scanners usually type a character every 10-30ms)
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = ''
      }
      lastKeyTime = currentTime

      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        // It's a barcode scan!
        e.preventDefault()
        
        // If an input is focused and the user scanned, the scanner typed into the input.
        // We should clear the active element to prevent submitting wrong data.
        if (document.activeElement instanceof HTMLInputElement) {
          document.activeElement.blur()
        }

        const scannedSku = barcodeBuffer
        barcodeBuffer = ''

        // Search for product by SKU
        const inv = currentInventory.find(i => i.item.sku.toLowerCase() === scannedSku.toLowerCase())
        if (inv) {
          addToCart(inv, 1, 0)
          Swal.fire({
            title: 'Escaneado',
            text: `${inv.item.name} agregado (x1)`,
            icon: 'success',
            toast: true,
            position: 'top-end',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--sf-dark-card)', color: '#fff'
          })
        } else {
          Swal.fire({
            title: 'No encontrado',
            text: `SKU: ${scannedSku} no existe en esta bodega`,
            icon: 'warning',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
            background: 'var(--sf-dark-card)', color: '#fff'
          })
        }
        return
      }

      // Accumulate printable characters (ignoring Shift, Ctrl, etc)
      if (e.key.length === 1) {
        barcodeBuffer += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentInventory, priceListId, cart])

  const updateCartItem = (cartId: string, field: keyof CartItem, value: any) => {
    setCart(cart.map(item => item.cartId === cartId ? { ...item, [field]: value } : item))
  }

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.useVoucher ? 0 : (item.price * item.quantity)), 0)
  }, [cart])

  const currentWarehouse = useMemo(() => warehouses.find(w => w.id.toString() === warehouseId), [warehouses, warehouseId])

  const cardAmount = parseFloat(card || '0')
  const cardSurcharge = useMemo(() => {
    if (cardAmount <= 0 || !currentWarehouse) return 0
    if (!currentWarehouse.card_surcharge_amount || currentWarehouse.card_surcharge_amount <= 0) return 0
    
    if (currentWarehouse.card_surcharge_type === 'percentage') {
      return (cardAmount * currentWarehouse.card_surcharge_amount) / 100
    }
    return parseFloat(currentWarehouse.card_surcharge_amount.toString())
  }, [cardAmount, currentWarehouse])

  const totalWithSurcharge = subtotal + cardSurcharge

  const currentDeclared = parseFloat(cash || '0') + parseFloat(card || '0') + parseFloat(transfer || '0')

  const handleCheckout = () => {
    if (cart.length === 0) return Swal.fire('Carrito vacío', 'Agrega productos antes de cobrar', 'warning')
    if (totalWithSurcharge > 0 && currentDeclared < totalWithSurcharge) {
      return Swal.fire('Pago Incompleto', 'El monto ingresado es menor al total de la venta.', 'error')
    }

    let finalCash = parseFloat(cash || '0')
    let finalCard = parseFloat(card || '0')
    let finalTransfer = parseFloat(transfer || '0')

    if (currentDeclared > totalWithSurcharge) {
      const vuelto = currentDeclared - totalWithSurcharge
      if (finalCash >= vuelto) {
        finalCash -= vuelto
      } else {
        return Swal.fire('Error de Pago', 'El pago con tarjeta/transferencia supera el total. El vuelto solo se puede dar sobre pagos en efectivo.', 'error')
      }
    }

    setIsProcessing(true)
    
    const payload = {
      warehouse_id: warehouseId,
      sale_type: 'warehouse',
      cash_revenue: finalCash.toString(),
      card_revenue: finalCard.toString(),
      transfer_revenue: finalTransfer.toString(),
      voucher_revenue: '0',
      card_surcharge: cardSurcharge.toString(),
      items: cart.map(item => ({
        product_id: item.product.id,
        price_list_id: priceListId,
        quantity: item.quantity,
        returned_empty_quantity: item.returned_empty_quantity,
        subtotal: item.useVoucher ? 0 : (item.price * item.quantity),
        voucher_code: item.useVoucher ? item.voucherCode : null
      }))
    }

    router.post('/sales/local', payload, {
      onSuccess: (page: any) => {
        if (page.props.flash?.alert) {
          setIsProcessing(false)
          return
        }
        Swal.fire({
          icon: 'success', title: 'Venta completada', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
          background: 'var(--sf-dark-card)', color: '#fff'
        })
        setCart([])
        setCash('')
        setCard('')
        setTransfer('')
        setIsProcessing(false)
        
        // Let the controller reload the page with print_sale_id
      },
      onError: (errors: any) => {
        setIsProcessing(false)
        if (errors.voucher_code) {
          Swal.fire('Error de Vale', errors.voucher_code, 'error')
        } else {
          Swal.fire('Error', 'Ocurrió un error al procesar la venta.', 'error')
        }
      }
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Punto de Venta" />

      <PageHeader 
        title="Punto de Venta Local"
        icon={<Store className="w-8 h-8 opacity-80" />}
        description="Selecciona la bodega y la lista de precios para comenzar a despachar."
        color="indigo"
        backUrl="/sales/local"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <div className="w-full sm:w-64 shrink-0">
            <CustomSelect
              value={warehouseId ? { value: warehouseId, label: warehouses.find(w => w.id.toString() === warehouseId)?.name } : null}
              onChange={(val: any) => setWarehouseId(val?.value || '')}
              options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
              placeholder="Bodega origen..."
              isDisabled={!isAdmin && !!assignedWarehouseId}
            />
          </div>
          
          <div className="flex bg-[var(--sf-surface)] rounded-lg p-1 border border-[var(--sf-border)] w-full overflow-x-auto custom-scrollbar">
            {price_lists.length === 0 ? (
              <span className="px-3 py-1.5 text-sm text-[var(--sf-text-muted)]">Sin listas de precio</span>
            ) : (
              price_lists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => setPriceListId(pl.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${priceListId === pl.id ? 'bg-primary-500 text-[var(--sf-text-main)]' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
                >
                  {pl.name}
                </button>
              ))
            )}
          </div>
          
          {has_sales_today && (
            <Link
              href="/sales/local/closures"
              className="px-4 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 font-bold rounded-lg border border-orange-500/20 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
            >
              🔒 Cierres de Caja
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-14rem)]">
        
        {/* Catálogo o Formulario */}
        <div className={`flex flex-col bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden transition-all duration-300 ${inputMode === 'fast' ? 'w-full lg:w-[400px] shrink-0' : 'flex-1'} min-h-[450px] lg:min-h-0`}>
          <div className="p-4 border-b border-[var(--sf-border)] flex flex-wrap justify-between items-center bg-[var(--sf-bg)] gap-4">
            <div className="flex bg-[var(--sf-surface)] rounded-lg p-1 border border-[var(--sf-border)]">
              <button
                onClick={() => setInputMode('grid')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${inputMode === 'grid' ? 'bg-[var(--sf-border)] text-[var(--sf-text-main)] shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
              >
                <Grid size={16} /> Catálogo
              </button>
              <button
                onClick={() => setInputMode('fast')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${inputMode === 'fast' ? 'bg-[var(--sf-border)] text-[var(--sf-text-main)] shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
              >
                <Keyboard size={16} /> Rápido
              </button>
            </div>
            
            {inputMode === 'grid' && (
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sf-text-muted)]" />
                <input 
                  type="text" 
                  value={gridSearch} 
                  onChange={e => setGridSearch(e.target.value)}
                  placeholder="Filtrar catálogo..."
                  className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-main)] text-sm rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {warehouseId === '' ? (
              <div className="flex flex-col items-center justify-center p-12 text-[var(--sf-text-muted)] border-2 border-dashed border-[var(--sf-border)] m-4 rounded-xl">
                <span className="text-4xl mb-3 opacity-50">🏢</span>
                <p className="font-medium text-lg">Selecciona una Bodega</p>
                <p className="text-sm opacity-70">Elige la bodega desde donde despacharás para ver los productos.</p>
              </div>
            ) : currentInventory.length === 0 ? (
              <div className="text-center p-6 text-[var(--sf-text-muted)]">No hay stock disponible en esta bodega.</div>
            ) : inputMode === 'grid' ? (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredGridInventory.map(inv => {
                  const price = getProductPrice(inv.item, priceListId)
                  return (
                    <button
                      key={inv.id}
                      onClick={() => addToCart(inv)}
                      className="flex flex-col text-left p-4 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-bg)] hover:bg-[var(--sf-surface)] hover:border-primary-500/50 transition-all group interactive-card"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[var(--sf-text-muted)] text-xs font-mono">{inv.item.sku}</span>
                        {inv.item.brand?.name && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--sf-surface)] border border-[var(--sf-border)] text-[10px] text-[var(--sf-text-muted)] font-bold uppercase">
                            {inv.item.brand.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[var(--sf-text-main)] font-bold mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">{inv.item.name}</div>
                      <div className="mt-auto flex justify-between items-end w-full">
                        <div className="text-primary-400 font-black text-lg">{formatCLP(price)}</div>
                        <div className="text-[var(--sf-text-muted)] text-xs font-medium bg-[var(--sf-dark-border)] px-2 py-1 rounded-md">
                          Stock: {inv.quantity}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto p-6 mt-6">
                <div className="bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-[var(--sf-text-main)] mb-6 flex items-center gap-2">
                    <Keyboard className="text-primary-400" /> Ingreso Rápido de Producto
                  </h2>
                  
                  <form onSubmit={e => { e.preventDefault(); handleFastAdd(); }} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-2">Producto</label>
                      <CustomSelect
                        value={fastProductId ? { value: fastProductId, label: currentInventory.find(i => i.item.id.toString() === fastProductId)?.item.name || '' } : null}
                        onChange={(val: any) => {
                          setFastProductId(val?.value || '')
                          const inv = currentInventory.find(i => i.item.id.toString() === val?.value)
                          if (inv && inv.item.material?.returnable) {
                            setFastEmpty(1)
                          } else {
                            setFastEmpty(0)
                          }
                        }}
                        options={currentInventory.map(inv => ({ 
                          value: inv.item.id.toString(), 
                          label: `${inv.item.sku} - ${inv.item.name}` 
                        }))}
                        placeholder="Buscar por SKU o Nombre..."
                      />
                      
                      {selectedFastInv && (
                        <div className="mt-3 bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 flex justify-between items-center text-sm">
                          <div>
                            <span className="text-[var(--sf-text-muted)]">Precio: </span>
                            <span className="font-bold text-primary-400">{formatCLP(getProductPrice(selectedFastInv.item, priceListId))}</span>
                          </div>
                          <div>
                            <span className="text-[var(--sf-text-muted)]">Stock disp: </span>
                            <span className="font-bold text-[var(--sf-text-main)]">{selectedFastInv.quantity}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-2">Cantidad (Llenos)</label>
                        <input
                          type="number" min="1" value={fastQuantity}
                          onChange={e => setFastQuantity(parseInt(e.target.value) || 1)}
                          className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] text-[var(--sf-text-main)] text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-2">Vacíos (Recibe)</label>
                        <input
                          type="number" min="0" value={fastEmpty} disabled={!selectedFastInv?.item.material?.returnable}
                          onChange={e => setFastEmpty(parseInt(e.target.value) || 0)}
                          className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] text-[var(--sf-text-main)] text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 text-center font-bold disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!fastProductId || fastQuantity <= 0}
                      className="w-full py-4 mt-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> AGREGAR A LA VENTA (Enter)
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carrito */}
        <div className={`flex flex-col bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden shrink-0 transition-all duration-300 ${inputMode === 'fast' ? 'flex-1' : 'w-full lg:w-[400px]'} min-h-[450px] lg:min-h-0`}>
          <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
            <h2 className="font-bold text-[var(--sf-text-main)] text-lg">Detalle de Venta</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--sf-text-muted)] p-6 text-center">
                <span className="text-4xl mb-2 opacity-50">🛒</span>
                <p>No hay productos en el carrito</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.cartId} className="bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-[var(--sf-text-main)] font-bold text-sm">{item.product.name}</div>
                        <div className="text-xs text-[var(--sf-text-muted)]">{formatCLP(item.price)} x {item.quantity}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-300 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/10 transition-colors">✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] text-[var(--sf-text-muted)] uppercase tracking-wider font-bold block mb-1">Llenos (Venta)</label>
                        <input
                          type="number" min="1" value={item.quantity}
                          onChange={e => updateCartItem(item.cartId, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] text-[var(--sf-text-main)] text-sm rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      {item.product.material?.returnable && (
                        <div>
                          <label className="text-[10px] text-[var(--sf-text-muted)] uppercase tracking-wider font-bold block mb-1">Vacíos (Recibe)</label>
                          <input
                            type="number" min="0" value={item.returned_empty_quantity}
                            onChange={e => updateCartItem(item.cartId, 'returned_empty_quantity', parseInt(e.target.value) || 0)}
                            className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] text-[var(--sf-text-main)] text-sm rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>

                    {item.product.accepts_vouchers && (
                      <div className="pt-2 mt-2 border-t border-[var(--sf-border)] flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs text-[var(--sf-text-muted)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.useVoucher}
                            onChange={e => updateCartItem(item.cartId, 'useVoucher', e.target.checked)}
                            className="rounded border-[var(--sf-border)] bg-[var(--sf-surface)] text-primary-500"
                          />
                          Paga con Vale
                        </label>
                        {item.useVoucher && (
                          <input
                            type="text" placeholder="Código de Vale"
                            value={item.voucherCode}
                            onChange={e => updateCartItem(item.cartId, 'voucherCode', e.target.value)}
                            className="flex-1 bg-[var(--sf-surface)] border border-primary-500/30 text-primary-300 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-primary-500 uppercase"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-bg)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[var(--sf-text-muted)] text-sm font-semibold">SUBTOTAL</span>
              <span className="text-lg font-bold text-[var(--sf-text-main)]">{formatCLP(subtotal)}</span>
            </div>
            
            {cardSurcharge > 0 && (
              <div className="flex justify-between items-center mb-3 animate-fade-in">
                <span className="text-blue-400 text-sm font-medium">Recargo por Tarjeta ({currentWarehouse?.card_surcharge_type === 'percentage' ? `${currentWarehouse.card_surcharge_amount}%` : 'Fijo'})</span>
                <span className="text-blue-400 font-bold">+{formatCLP(cardSurcharge)}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-5 pt-3 border-t border-[var(--sf-border)]">
              <span className="text-[var(--sf-text-main)] font-black uppercase tracking-wider text-sm">TOTAL A PAGAR</span>
              <span className="text-2xl font-black text-primary-500">{formatCLP(totalWithSurcharge)}</span>
            </div>

            {totalWithSurcharge > 0 && (
              <>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-xs font-medium text-[var(--sf-text-muted)] block mb-1">Efectivo Pagado</label>
                    <CurrencyInput value={cash} onValueChange={setCash} className="text-primary-400 font-bold !py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--sf-text-muted)] block mb-1">Tarjeta (Suma recargo aut.)</label>
                      <CurrencyInput value={card} onValueChange={setCard} className="text-blue-400 font-bold !py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--sf-text-muted)] block mb-1">Transferencia</label>
                      <CurrencyInput value={transfer} onValueChange={setTransfer} className="text-purple-400 font-bold !py-2 text-sm" />
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl mb-6 border ${
                  currentDeclared === totalWithSurcharge ? 'bg-emerald-500/10 border-emerald-500/30' :
                  currentDeclared > totalWithSurcharge ? 'bg-blue-500/10 border-blue-500/30' :
                  'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold uppercase tracking-wider ${
                      currentDeclared === totalWithSurcharge ? 'text-emerald-500' :
                      currentDeclared > totalWithSurcharge ? 'text-blue-500' :
                      'text-red-500'
                    }`}>
                      {currentDeclared === totalWithSurcharge ? 'Pago Exacto' :
                       currentDeclared > totalWithSurcharge ? 'Vuelto a Entregar:' :
                       'Falta Pagar:'}
                    </span>
                    <span className={`text-xl font-black ${
                      currentDeclared === totalWithSurcharge ? 'text-emerald-500' :
                      currentDeclared > totalWithSurcharge ? 'text-blue-500' :
                      'text-red-500'
                    }`}>
                      {currentDeclared === totalWithSurcharge ? '✅' :
                       currentDeclared > totalWithSurcharge ? formatCLP(currentDeclared - totalWithSurcharge) :
                       formatCLP(totalWithSurcharge - currentDeclared)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0 || currentDeclared < subtotal}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-black rounded-xl transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? 'PROCESANDO...' : '💰 COBRAR VENTA'}
            </button>
          </div>
        </div>

      </div>

      {/* Modal for Boleta Ticket Auto-Print */}
      {selectedSaleForTicket && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
            <div className="flex flex-wrap justify-between items-center gap-4 p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)] shrink-0">
              <h3 className="text-lg font-semibold text-[var(--sf-text-main)] flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary-400" />
                Venta Procesada
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-[var(--sf-bg)] rounded-lg p-1 border border-[var(--sf-border)]">
                  <button
                    onClick={() => setPaperSize('80mm')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${paperSize === '80mm' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
                  >
                    80mm
                  </button>
                  <button
                    onClick={() => setPaperSize('58mm')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${paperSize === '58mm' ? 'bg-primary-500 text-white shadow-sm' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
                  >
                    58mm
                  </button>
                </div>
                
                <button onClick={() => {
                  setSelectedSaleForTicket(null)
                  // clear the print_sale_id from url without reloading
                  router.get('/sales/local/pos', {}, { preserveState: true })
                }} className="text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[var(--sf-bg)] flex justify-center custom-scrollbar">
              <BoletaTicket sale={selectedSaleForTicket} paperSize={paperSize} />
            </div>

            <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)] shrink-0 flex gap-3">
              <button
                onClick={() => {
                  setSelectedSaleForTicket(null)
                  router.get('/sales/local/pos', {}, { preserveState: true })
                }}
                className="flex-1 py-2.5 bg-[var(--sf-surface)] hover:bg-[var(--sf-border)] border border-[var(--sf-border)] text-[var(--sf-text-main)] font-semibold rounded-xl transition-colors"
              >
                Nueva Venta
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimir Boleta
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AuthenticatedLayout>
  )
}
