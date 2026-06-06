import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Head, router, Link } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import CurrencyInput from '@/components/CurrencyInput'
import { CustomSelect } from '@/components/CustomSelect'
import { useSound } from '@/hooks/useSound'
import { TableFilters } from '@/components/TableFilters'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import Modal from '@/components/Modal'
import BoletaTicket from '@/components/BoletaTicket'
import PageHeader from '@/components/PageHeader'
import { Printer, XCircle, Grid, Keyboard, Plus, ArrowLeft, Store, Search, Banknote, CreditCard, Landmark, Component } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  useVoucher?: boolean
  voucherCodes?: string[]
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
  const { playSound } = useSound()
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
  const [printMode, setPrintMode] = useState<'client' | 'store' | 'both' | 'both_paused'>('both_paused')
  const [forcePrintMode, setForcePrintMode] = useState<'client' | 'store' | null>(null)

  const handlePrint = () => {
    if (printMode === 'both_paused') {
      const onAfterFirstPrint = async () => {
        window.removeEventListener('afterprint', onAfterFirstPrint)
        
        // Wait a bit for browser to fully recover from print dialog
        setTimeout(async () => {
          const res = await Swal.fire({
            target: document.querySelector('dialog.native-modal[open]') as HTMLElement || document.body,
            title: 'Corte el papel ✂️',
            text: 'Se ha enviado la copia del cliente. Corta el papel en tu impresora térmica y presiona Continuar para enviar la copia de comercio.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '🖨️ Imprimir Copia Comercio',
            cancelButtonText: 'Omitir',
            confirmButtonColor: '#3b82f6',
            background: 'var(--sf-dark-card)',
            color: '#fff'
          })
          
          if (res.isConfirmed) {
            setForcePrintMode('store')
            setTimeout(() => {
              const onAfterSecondPrint = () => {
                window.removeEventListener('afterprint', onAfterSecondPrint)
                setForcePrintMode(null)
              }
              window.addEventListener('afterprint', onAfterSecondPrint)
              window.print()
            }, 500)
          }
        }, 300)
      }
      
      window.addEventListener('afterprint', onAfterFirstPrint)
      window.print()
    } else {
      window.print()
    }
  }

  useEffect(() => {
    if (print_sale) {
      setSelectedSaleForTicket(print_sale)
    }
  }, [print_sale])

  const [cash, setCash] = useState('')
  const [card, setCard] = useState('')
  const [transfer, setTransfer] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'cash' | 'card' | 'transfer' | 'mixed'>('cash')
  const [cartStep, setCartStep] = useState<'items' | 'payment'>('items')

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
      playSound('beep')
    } else {
      const newItem: CartItem = {
        cartId: Math.random().toString(36).substring(7),
        product: inv.item,
        quantity: customQty,
        returned_empty_quantity: customEmpty,
        price: price,
        useVoucher: false,
        voucherCodes: []
      }
      setCart([...cart, newItem])
      playSound('beep')
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
    playSound('pop')
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

  const hasMissingVouchers = useMemo(() => {
    return cart.some(item => {
      if (!item.useVoucher) return false
      if (!item.voucherCodes || item.voucherCodes.length < item.quantity) return true
      return item.voucherCodes.slice(0, item.quantity).some(code => !code || code.trim() === '')
    })
  }, [cart])

  useEffect(() => {
    if (totalWithSurcharge === 0) {
      setCash('')
      setCard('')
      setTransfer('')
      return
    }
    
    if (paymentTab === 'cash') {
      setCash(totalWithSurcharge.toString())
      setCard('')
      setTransfer('')
    } else if (paymentTab === 'card') {
      setCard(totalWithSurcharge.toString())
      setCash('')
      setTransfer('')
    } else if (paymentTab === 'transfer') {
      setTransfer(totalWithSurcharge.toString())
      setCash('')
      setCard('')
    }
  }, [paymentTab, totalWithSurcharge])

  const currentDeclared = parseFloat(cash || '0') + parseFloat(card || '0') + parseFloat(transfer || '0')

  const handleCheckout = () => {
    if (cart.length === 0) {
      playSound('error')
      return Swal.fire('Carrito vacío', 'Agrega productos antes de cobrar', 'warning')
    }
    if (totalWithSurcharge > 0 && currentDeclared < totalWithSurcharge) {
      playSound('error')
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
        playSound('error')
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
        voucher_code: item.useVoucher ? item.voucherCodes?.filter(c => c.trim() !== '').join(', ') : null
      }))
    }

    router.post('/sales/local', payload, {
      onSuccess: (page: any) => {
        if (page.props.flash?.alert) {
          playSound('error')
          setIsProcessing(false)
          Swal.fire('Error', page.props.flash.alert, 'error')
          return
        }
        playSound('kaching')
        Swal.fire({
          icon: 'success', title: 'Venta completada', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
          background: 'var(--sf-dark-card)', color: '#fff'
        })
        setCart([])
        setCash('')
        setCard('')
        setTransfer('')
        setCartStep('items')
        setIsProcessing(false)
        
        // Let the controller reload the page with print_sale_id
      },
      onError: (errors: any) => {
        playSound('error')
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
      />

      <TableFilters>
        <TableFilters.Select 
          label="Bodega de Origen"
          value={warehouseId}
          onChange={setWarehouseId}
          options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
          placeholder="Seleccionar bodega..."
          className="w-full sm:w-64 shrink-0"
        />
        
        {price_lists.length > 0 && (
          <TableFilters.Select 
            label="Lista de Precios"
            value={priceListId?.toString() || ''}
            onChange={(val) => setPriceListId(parseInt(val))}
            options={price_lists.map(pl => ({ value: pl.id.toString(), label: pl.name }))}
            placeholder="Seleccionar lista..."
            className="w-full sm:w-64 shrink-0"
          />
        )}
        
        {has_sales_today && (
          <div className="ml-auto">
            <Link
              href="/sales/local/closures"
              className="px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-bold rounded-xl border border-orange-500/20 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2 h-[42px]"
            >
              🔒 Cierres de Caja
            </Link>
          </div>
        )}
      </TableFilters>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-14rem)]">
        
        {/* Catálogo o Formulario */}
        <div className={`flex flex-col bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden transition-all duration-300 ${inputMode === 'fast' ? 'w-full lg:w-[400px] shrink-0' : 'flex-1'} min-h-[450px] lg:min-h-0`}>
          <div className="p-4 border-b border-[var(--sf-border)] flex flex-wrap justify-between items-center bg-[var(--sf-bg)] gap-4">
            <div className="flex bg-[var(--sf-bg)] rounded-xl p-1.5 border border-[var(--sf-border)] shadow-inner">
              <button
                onClick={() => setInputMode('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${inputMode === 'grid' ? 'bg-[var(--sf-surface)] text-primary-400 shadow-sm border border-white/5' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
              >
                <Grid size={16} /> Catálogo
              </button>
              <button
                onClick={() => setInputMode('fast')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${inputMode === 'fast' ? 'bg-[var(--sf-surface)] text-primary-400 shadow-sm border border-white/5' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)]'}`}
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
                      className="flex flex-col text-left p-4 rounded-xl border border-white/5 bg-gradient-to-br from-[var(--sf-surface)] to-transparent hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1 hover:bg-primary-500/5 transition-all duration-300 group"
                    >
                      <div className="flex flex-col items-start gap-1 mb-2 w-full">
                        <span className="text-[var(--sf-text-muted)] text-[10px] sm:text-xs font-mono group-hover:text-primary-400/70 transition-colors truncate w-full">{inv.item.sku}</span>
                        {inv.item.brand?.name && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[9px] sm:text-[10px] text-[var(--sf-text-muted)] font-bold uppercase tracking-wider truncate max-w-full">
                            {inv.item.brand.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[var(--sf-text-main)] font-bold mb-3 group-hover:text-primary-400 transition-colors line-clamp-2 text-xs sm:text-sm leading-tight">{inv.item.name}</div>
                      <div className="mt-auto flex flex-col items-start gap-1.5 w-full">
                        <div className="text-primary-400 font-black text-lg sm:text-xl tracking-tight">{formatCLP(price)}</div>
                        <div className="text-[var(--sf-text-muted)] text-[10px] sm:text-xs font-medium bg-[var(--sf-bg)] px-2 py-1 rounded-md border border-[var(--sf-border)] flex items-center justify-between w-full">
                          <span>Stock:</span>
                          <span className={`font-bold ${inv.quantity <= 5 ? 'text-rose-500' : 'text-[var(--sf-text-main)]'}`}>{inv.quantity}</span>
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
        <div className={`flex flex-col bg-gradient-to-b from-[var(--sf-surface)] to-[var(--sf-bg)] border border-white/10 rounded-2xl overflow-hidden shrink-0 transition-all duration-300 shadow-2xl ${inputMode === 'fast' ? 'flex-1' : 'w-full lg:w-[400px]'} min-h-[450px] lg:min-h-0 relative z-10`}>
          {cartStep === 'items' ? (
            <>
              <div className="p-3 border-b border-white/5 bg-[var(--sf-surface)]/50 backdrop-blur-sm flex justify-between items-center">
                <h2 className="font-black text-[var(--sf-text-main)] text-base tracking-tight">Detalle de Venta</h2>
                <span className="text-xs text-[var(--sf-text-muted)] font-bold px-2 py-0.5 bg-white/5 rounded-full">{cart.length} ítems</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-1.5 animate-fade-in">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--sf-text-muted)] p-6 text-center">
                    <span className="text-4xl mb-2 opacity-50">🛒</span>
                    <p>No hay productos en el carrito</p>
                  </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                {cart.map(item => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -20 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    key={item.cartId} 
                    className="group bg-[var(--sf-bg)] border border-white/5 rounded-lg p-2 hover:border-primary-500/30 transition-colors relative"
                  >
                    <button onClick={() => removeFromCart(item.cartId)} className="absolute top-1.5 right-1.5 text-[var(--sf-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 w-6 h-6 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Eliminar del carrito">✕</button>
                    
                    <div className="pr-7 mb-2 flex justify-between items-start gap-2">
                      <div className="text-[var(--sf-text-main)] font-bold text-[13px] leading-tight">{item.product.name}</div>
                      <div className="text-[13px] font-black text-primary-400 whitespace-nowrap">{formatCLP(item.price)}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center bg-[var(--sf-surface)] border border-white/10 rounded-lg overflow-hidden focus-within:border-primary-500/50 transition-colors">
                        <span className="px-2 text-[10px] font-bold text-[var(--sf-text-muted)] uppercase bg-black/20 border-r border-white/5 h-full flex items-center">Llenos</span>
                        <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => { playSound('pop'); updateCartItem(item.cartId, 'quantity', Math.max(1, item.quantity - 1)) }} className="px-2 py-1 text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5 transition-colors">−</motion.button>
                        <input
                          type="number" min="1" value={item.quantity}
                          onChange={e => updateCartItem(item.cartId, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-10 bg-transparent text-center text-[var(--sf-text-main)] font-bold text-sm px-0 py-1 focus:ring-0 border-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => { playSound('pop'); updateCartItem(item.cartId, 'quantity', item.quantity + 1) }} className="px-2 py-1 text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5 transition-colors">+</motion.button>
                      </div>
                      
                      {item.product.material?.returnable && (
                        <div className="flex items-center bg-[var(--sf-surface)] border border-white/10 rounded-lg overflow-hidden focus-within:border-primary-500/50 transition-colors">
                          <span className="px-2 text-[10px] font-bold text-[var(--sf-text-muted)] uppercase bg-black/20 border-r border-white/5 h-full flex items-center">Vacíos</span>
                          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => { playSound('pop'); updateCartItem(item.cartId, 'returned_empty_quantity', Math.max(0, item.returned_empty_quantity - 1)) }} className="px-2 py-1 text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5 transition-colors">−</motion.button>
                          <input
                            type="number" min="0" value={item.returned_empty_quantity}
                            onChange={e => updateCartItem(item.cartId, 'returned_empty_quantity', parseInt(e.target.value) || 0)}
                            className="w-10 bg-transparent text-center text-[var(--sf-text-main)] font-bold text-sm px-0 py-1 focus:ring-0 border-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => { playSound('pop'); updateCartItem(item.cartId, 'returned_empty_quantity', item.returned_empty_quantity + 1) }} className="px-2 py-1 text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5 transition-colors">+</motion.button>
                        </div>
                      )}
                    </div>

                    {item.product.accepts_vouchers && (
                      <div className="pt-2 mt-2 border-t border-[var(--sf-border)] flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-xs text-[var(--sf-text-muted)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.useVoucher}
                            onChange={e => updateCartItem(item.cartId, 'useVoucher', e.target.checked)}
                            className="rounded border-[var(--sf-border)] bg-[var(--sf-surface)] text-primary-500"
                          />
                          Paga con Vale {item.quantity > 1 && `(${item.quantity} vales necesarios)`}
                        </label>
                        <AnimatePresence>
                        {item.useVoucher && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-col gap-1.5 w-full overflow-hidden"
                          >
                            {Array.from({ length: item.quantity }).map((_, i) => (
                              <input
                                key={i}
                                type="text" placeholder={`Código de Vale #${i + 1}`}
                                value={item.voucherCodes?.[i] || ''}
                                onChange={e => {
                                  const newCodes = [...(item.voucherCodes || [])]
                                  newCodes[i] = e.target.value
                                  updateCartItem(item.cartId, 'voucherCodes', newCodes)
                                }}
                                className="w-full bg-[var(--sf-surface)] border border-primary-500/30 text-primary-300 text-xs rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary-500 uppercase"
                              />
                            ))}
                          </motion.div>
                        )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/10 bg-[var(--sf-surface)]/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[var(--sf-text-muted)] text-[11px] font-bold tracking-wider">SUBTOTAL</span>
              <span className="text-sm font-bold text-[var(--sf-text-main)]"><AnimatedNumber value={subtotal} prefix="$" separator="." /></span>
            </div>
            
            {cardSurcharge > 0 && (
              <div className="flex justify-between items-center mb-2 p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-fade-in">
                <span className="text-blue-400 text-[11px] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Recargo Tarjeta ({currentWarehouse?.card_surcharge_type === 'percentage' ? `${currentWarehouse.card_surcharge_amount}%` : 'Fijo'})
                </span>
                <span className="text-blue-400 font-bold text-[13px]"><AnimatedNumber value={cardSurcharge} prefix="+$" separator="." /></span>
              </div>
            )}

            <div className="flex justify-between items-center mb-3 pt-2 border-t border-white/10">
              <span className="text-[var(--sf-text-main)] font-black uppercase tracking-widest text-[11px]">TOTAL A PAGAR</span>
              <span className="text-2xl font-black text-primary-500 tracking-tighter drop-shadow-md">
                <AnimatedNumber value={totalWithSurcharge} prefix="$" separator="." />
              </span>
            </div>

            <button
              onClick={() => setCartStep('payment')}
              disabled={cart.length === 0 || hasMissingVouchers}
              className={`w-full py-2.5 text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 tracking-widest ${hasMissingVouchers ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 hover:-translate-y-1'}`}
            >
              {hasMissingVouchers ? 'FALTAN CÓDIGOS DE VALE' : '➡️ CONTINUAR AL PAGO'}
            </button>
          </div>
            </>
          ) : (
            <>
              <div className="p-2 border-b border-white/5 bg-[var(--sf-surface)]/50 backdrop-blur-sm animate-fade-in">
                <button onClick={() => setCartStep('items')} className="text-[var(--sf-text-muted)] hover:text-white flex items-center gap-1.5 font-bold transition-colors py-1 px-2 rounded-lg hover:bg-white/5 text-sm">
                  <ArrowLeft size={16} /> Volver a los productos
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 animate-fade-in">
                <div className="text-center mb-5 mt-2">
                  <span className="text-[var(--sf-text-muted)] font-black uppercase tracking-widest text-[10px] block mb-1">TOTAL A PAGAR</span>
                  <span className="text-5xl font-black text-primary-500 tracking-tighter drop-shadow-md">
                    <AnimatedNumber value={totalWithSurcharge} prefix="$" separator="." />
                  </span>
                </div>

            {totalWithSurcharge > 0 && (
              <>
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-4 shadow-inner overflow-x-auto custom-scrollbar">
                  <button onClick={() => setPaymentTab('cash')} className={`flex-1 min-w-[70px] py-1.5 px-1 text-[10px] sm:text-xs font-bold rounded transition-all flex flex-col items-center gap-1.5 ${paymentTab === 'cash' ? 'bg-[var(--sf-surface)] text-primary-400 shadow-sm border border-white/5' : 'text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5'}`}>
                    <Banknote size={18} /> Efectivo
                  </button>
                  <button onClick={() => setPaymentTab('card')} className={`flex-1 min-w-[70px] py-1.5 px-1 text-[10px] sm:text-xs font-bold rounded transition-all flex flex-col items-center gap-1.5 ${paymentTab === 'card' ? 'bg-[var(--sf-surface)] text-blue-400 shadow-sm border border-white/5' : 'text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5'}`}>
                    <CreditCard size={18} /> Tarjeta
                  </button>
                  <button onClick={() => setPaymentTab('transfer')} className={`flex-1 min-w-[70px] py-1.5 px-1 text-[10px] sm:text-xs font-bold rounded transition-all flex flex-col items-center gap-1.5 ${paymentTab === 'transfer' ? 'bg-[var(--sf-surface)] text-purple-400 shadow-sm border border-white/5' : 'text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5'}`}>
                    <Landmark size={18} /> Transf.
                  </button>
                  <button onClick={() => setPaymentTab('mixed')} className={`flex-1 min-w-[70px] py-1.5 px-1 text-[10px] sm:text-xs font-bold rounded transition-all flex flex-col items-center gap-1.5 ${paymentTab === 'mixed' ? 'bg-[var(--sf-surface)] text-orange-400 shadow-sm border border-white/5' : 'text-[var(--sf-text-muted)] hover:text-white hover:bg-white/5'}`}>
                    <Component size={18} /> Mixto
                  </button>
                </div>

                <div className={`mb-5 ${paymentTab === 'mixed' ? 'grid grid-cols-2 gap-3' : 'space-y-0'}`}>
                  {(paymentTab === 'cash' || paymentTab === 'mixed') && (
                    <div className="animate-fade-in col-span-2">
                      <label className="text-[11px] font-medium text-[var(--sf-text-muted)] block mb-1">Efectivo Pagado</label>
                      <CurrencyInput value={cash} onValueChange={setCash} className={`text-primary-400 font-bold text-center ${paymentTab === 'mixed' ? '!py-1.5 text-xs' : '!py-2 text-lg'}`} />
                    </div>
                  )}
                  {(paymentTab === 'card' || paymentTab === 'mixed') && (
                    <div className="animate-fade-in">
                      <label className="text-[10px] font-medium text-[var(--sf-text-muted)] block mb-1 truncate" title="Tarjeta (Suma recargo aut.)">Tarjeta {paymentTab === 'mixed' && '(+Recargo)'}</label>
                      <CurrencyInput value={card} onValueChange={setCard} className={`text-blue-400 font-bold text-center ${paymentTab === 'mixed' ? '!py-1.5 text-xs' : '!py-2 text-lg'}`} />
                    </div>
                  )}
                  {(paymentTab === 'transfer' || paymentTab === 'mixed') && (
                    <div className="animate-fade-in">
                      <label className="text-[10px] font-medium text-[var(--sf-text-muted)] block mb-1 truncate">Transferencia</label>
                      <CurrencyInput value={transfer} onValueChange={setTransfer} className={`text-purple-400 font-bold text-center ${paymentTab === 'mixed' ? '!py-1.5 text-xs' : '!py-2 text-lg'}`} />
                    </div>
                  )}
                </div>

                <div className={`p-3 rounded-xl mb-4 border transition-colors duration-300 shadow-inner ${
                  currentDeclared === totalWithSurcharge ? 'bg-emerald-500/10 border-emerald-500/30' :
                  currentDeclared > totalWithSurcharge ? 'bg-blue-500/10 border-blue-500/30' :
                  'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${
                      currentDeclared === totalWithSurcharge ? 'text-emerald-500' :
                      currentDeclared > totalWithSurcharge ? 'text-blue-500' :
                      'text-rose-500'
                    }`}>
                      {currentDeclared === totalWithSurcharge ? 'Pago Exacto' :
                       currentDeclared > totalWithSurcharge ? 'Vuelto a Entregar:' :
                       'Falta Pagar:'}
                    </span>
                    <span className={`text-2xl font-black tracking-tighter ${
                      currentDeclared === totalWithSurcharge ? 'text-emerald-500 drop-shadow-sm' :
                      currentDeclared > totalWithSurcharge ? 'text-blue-500 drop-shadow-sm' :
                      'text-rose-500'
                    }`}>
                      {currentDeclared === totalWithSurcharge ? '✅' :
                       currentDeclared > totalWithSurcharge ? <AnimatedNumber value={currentDeclared - totalWithSurcharge} prefix="$" separator="." /> :
                       <AnimatedNumber value={totalWithSurcharge - currentDeclared} prefix="$" separator="." />}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="p-3 border-t border-white/10 bg-[var(--sf-surface)]/50 backdrop-blur-sm animate-fade-in">
            <button
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0 || currentDeclared < totalWithSurcharge || hasMissingVouchers}
              className={`w-full py-2.5 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 tracking-widest ${
                hasMissingVouchers
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : currentDeclared >= totalWithSurcharge && cart.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25 hover:-translate-y-1'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
              }`}
            >
              {isProcessing ? (
                'PROCESANDO...'
              ) : hasMissingVouchers ? (
                <>❌ FALTAN CÓDIGOS DE VALE</>
              ) : currentDeclared >= totalWithSurcharge && cart.length > 0 ? (
                <>💸 COBRAR VENTA</>
              ) : (
                <>❌ MONTO INCOMPLETO</>
              )}
            </button>
          </div>
        </>
      )}
    </div>

      </div>

      {/* Modal for Boleta Ticket Auto-Print */}
      <Modal
        show={!!selectedSaleForTicket}
        onClose={() => {
          setSelectedSaleForTicket(null)
          router.get('/sales/local/pos', {}, { preserveState: true })
        }}
        maxWidth="max-w-lg"
        title={
          <>
            <Printer className="w-5 h-5 text-primary-400" />
            Venta Procesada
          </>
        }
      >
        <div className="flex flex-col -m-6 max-h-[calc(100vh-8rem)]">
          <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)] flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <CustomSelect
                options={[
                  { value: 'client', label: 'Solo Cliente' },
                  { value: 'store', label: 'Solo Comercio' },
                  { value: 'both', label: 'Ambas (Tira Continua)' },
                  { value: 'both_paused', label: 'Ambas (Pausa p/ Cortar)' }
                ]}
                value={{ 
                  value: printMode, 
                  label: printMode === 'both' ? 'Ambas (Continuo)' : 
                         printMode === 'both_paused' ? 'Ambas (Pausa)' : 
                         printMode === 'client' ? 'Solo Cliente' : 'Solo Comercio' 
                }}
                onChange={(val: any) => setPrintMode(val.value)}
                isSearchable={false}
              />
            </div>
            <div className="flex-1">
              <CustomSelect
                options={[
                  { value: '80mm', label: '80mm' },
                  { value: '58mm', label: '58mm' }
                ]}
                value={{ value: paperSize, label: paperSize }}
                onChange={(val: any) => setPaperSize(val.value)}
                isSearchable={false}
              />
            </div>
          </div>
          <div className="p-6 overflow-y-auto flex-1 bg-[var(--sf-bg)] flex justify-center custom-scrollbar">
            {selectedSaleForTicket && <BoletaTicket sale={selectedSaleForTicket} paperSize={paperSize} printMode={forcePrintMode || (printMode === 'both_paused' ? 'client' : printMode)} />}
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
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Imprimir Boleta
            </button>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  )
}
