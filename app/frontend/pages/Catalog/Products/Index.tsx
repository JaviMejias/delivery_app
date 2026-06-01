import { useState, useEffect, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import CurrencyInput from '@/components/CurrencyInput'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { CustomSelect } from '@/components/CustomSelect'
import { ShoppingBag, Pencil, Trash2, Save, X } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'

interface Material {
  id: number
  name: string
  unit: string
  measure: number | null
}

interface Brand {
  id: number
  name: string
}

interface PriceList {
  id: number
  name: string
  code: string | null
  active: boolean
}

interface ProductPrice {
  id: number
  price: string
  price_list_id: number
  price_list?: PriceList
  valid_from: string | null
  valid_until: string | null
}

interface Product {
  id: number
  name: string
  sku: string
  weight_or_size: number
  active: boolean
  available_in_app: boolean
  accepts_vouchers: boolean
  material_id: number
  brand_id: number
  material?: Material
  brand?: Brand
  product_prices?: ProductPrice[]
  image_url?: string
}

interface Props {
  products: Product[]
  materials: Material[]
  brands: Brand[]
  priceLists: PriceList[]
  pagination: any
  currentSearch?: string
}

export default function ProductsIndex({ products, materials, brands, priceLists, pagination, currentSearch }: Props) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const form = useForm({
    name: '',
    sku: '',
    material_id: '',
    brand_id: '',
    active: true,
    available_in_app: true,
    accepts_vouchers: false,
    image: null as File | null,
    prices: {} as Record<number, string>
  })

  // Auto-generar el nombre y SKU cuando cambien el material o la marca
  useEffect(() => {
    if (!editingProduct && form.data.material_id && form.data.brand_id) {
      const mat = materials.find(m => m.id.toString() === form.data.material_id)
      const bra = brands.find(b => b.id.toString() === form.data.brand_id)
      
      if (mat && bra) {
        // Name: "Galón 5 KG Gasco"
        const measurePart = mat.measure ? ` ${mat.measure}` : ''
        const unitPart = mat.unit && mat.unit !== 'UN' ? ` ${mat.unit}` : ''
        const newName = `${mat.name}${measurePart}${unitPart} ${bra.name}`
        
        // SKU: "GAL-5-GAS"
        const matPrefix = mat.name.substring(0, 3).toUpperCase()
        const braPrefix = bra.name.substring(0, 3).toUpperCase()
        const measureSku = mat.measure ? `-${mat.measure}` : ''
        const newSku = `${matPrefix}${measureSku}-${braPrefix}`

        form.setData(data => ({
          ...data,
          name: newName,
          sku: newSku
        }))
      }
    }
  }, [form.data.material_id, form.data.brand_id])

  const editProduct = (product: Product) => {
    setEditingProduct(product)
    
    const pricesObj: Record<number, string> = {}
    product.product_prices?.forEach(p => {
      pricesObj[p.price_list_id] = p.price
    })

    form.setData({
      name: product.name || '',
      sku: product.sku || '',
      material_id: product.material_id.toString(),
      brand_id: product.brand_id.toString(),
      active: product.active,
      available_in_app: product.available_in_app,
      accepts_vouchers: product.accepts_vouchers,
      image: null,
      prices: pricesObj
    })

    // Scroll al formulario para que el usuario note el cambio
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingProduct(null)
    form.reset()
    form.clearErrors()
    if (materials.length > 0) form.setData('material_id', materials[0].id.toString())
    if (brands.length > 0) form.setData('brand_id', brands[0].id.toString())
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      product: {
        name: form.data.name,
        sku: form.data.sku,
        material_id: form.data.material_id,
        brand_id: form.data.brand_id,
        active: form.data.active,
        available_in_app: form.data.available_in_app,
        accepts_vouchers: form.data.accepts_vouchers,
      },
      prices: form.data.prices
    } as any

    if (form.data.image) {
      payload.product.image = form.data.image
    }

    if (editingProduct) {
      if (form.data.image) {
        form.transform(() => ({ ...payload, _method: 'patch' }))
        form.post(`/catalog/products/${editingProduct.id}`, {
          onSuccess: () => cancelEdit(),
        })
      } else {
        form.transform(() => payload)
        form.patch(`/catalog/products/${editingProduct.id}`, {
          onSuccess: () => cancelEdit(),
        })
      }
    } else {
      form.transform(() => payload)
      form.post(`/catalog/products`, {
        onSuccess: () => cancelEdit(),
      })
    }
  }

  const deleteProduct = (id: number) => {
    Swal.fire({
      title: '¿Eliminar producto final?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--sf-dark-card)',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(`/catalog/products/${id}`, {
          onSuccess: () => {
            if (editingProduct?.id === id) {
              cancelEdit()
            }
          }
        })
      }
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Productos Finales" />

      <div className="space-y-6">
        <PageHeader 
          icon={<ShoppingBag className="w-8 h-8 opacity-80" />}
          title="Productos Finales"
          description="La unión entre un Material y una Marca. Estos son los ítems físicos que vendes."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingProduct ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingProduct 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingProduct ? <Pencil className="w-5 h-5 shrink-0" /> : <ShoppingBag className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingProduct ? 'Editando Producto' : 'Registrar Nuevo Producto'}
                    </h2>
                    {editingProduct && (
                      <p className="text-xs opacity-80 truncate">{editingProduct.name}</p>
                    )}
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Material Genérico</label>
                      <CustomSelect
                        value={form.data.material_id ? { 
                          value: form.data.material_id, 
                          label: materials.find(m => m.id.toString() === form.data.material_id) 
                            ? `${materials.find(m => m.id.toString() === form.data.material_id)?.name}${materials.find(m => m.id.toString() === form.data.material_id)?.measure ? ` ${materials.find(m => m.id.toString() === form.data.material_id)?.measure}` : ''}${materials.find(m => m.id.toString() === form.data.material_id)?.unit && materials.find(m => m.id.toString() === form.data.material_id)?.unit !== 'UN' ? ` ${materials.find(m => m.id.toString() === form.data.material_id)?.unit}` : ''}` 
                            : 'Seleccionar material...' 
                        } : null}
                        onChange={(val: any) => form.setData('material_id', val?.value || '')}
                        options={materials.map(m => ({ 
                          value: m.id.toString(), 
                          label: `${m.name}${m.measure ? ` ${m.measure}` : ''}${m.unit && m.unit !== 'UN' ? ` ${m.unit}` : ''}` 
                        }))}
                        placeholder="Material..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Marca</label>
                      <CustomSelect
                        value={form.data.brand_id ? { value: form.data.brand_id, label: brands.find(b => b.id.toString() === form.data.brand_id)?.name || 'Seleccionar marca...' } : null}
                        onChange={(val: any) => form.setData('brand_id', val?.value || '')}
                        options={brands.map(b => ({ value: b.id.toString(), label: b.name }))}
                        placeholder="Marca..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">SKU (Auto-generado)</label>
                    <input
                      type="text"
                      value={form.data.sku}
                      readOnly
                      className="w-full px-4 py-2 bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-muted)] opacity-70 cursor-not-allowed uppercase text-sm"
                      placeholder="CIL-GASCO"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Nombre Final (Auto-generado)</label>
                    <input
                      type="text"
                      value={form.data.name}
                      readOnly
                      className="w-full px-4 py-2 bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-muted)] opacity-70 cursor-not-allowed text-sm font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Imagen del Producto (Opcional)</label>
                    {editingProduct?.image_url && !form.data.image && (
                      <div className="mb-2">
                        <img src={editingProduct.image_url} alt={editingProduct.name} className="h-16 w-auto object-contain bg-white rounded p-1" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => form.setData('image', e.target.files ? e.target.files[0] : null)}
                      className="w-full text-sm text-[var(--sf-text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                    />
                  </div>

                  <div className="flex flex-col gap-4 pt-2">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Producto Activo en Sistema"
                      description="Determina si el producto está disponible para venta en cualquier canal."
                    />
                    
                    <CustomSwitch
                      checked={form.data.available_in_app}
                      onChange={(checked) => form.setData('available_in_app', checked)}
                      label="Mostrar en App Pública (Delivery)"
                      description="Si se desactiva, los clientes no podrán pedirlo desde la aplicación de camiones."
                    />
                    
                    <CustomSwitch
                      checked={form.data.accepts_vouchers}
                      onChange={(checked) => form.setData('accepts_vouchers', checked)}
                      label="Acepta Vales"
                      description="Permite que este producto se cambie por vales o cupones."
                    />
                  </div>

                  <div className="h-px bg-[var(--sf-border)] w-full my-4"></div>
                  
                  <h3 className="text-sm font-bold text-[var(--sf-text-main)] mb-2">Precios de Venta</h3>
                  
                  <div className="flex flex-col gap-4">
                    {priceLists.map(pl => (
                      <div key={pl.id}>
                        <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1">{pl.name} ($)</label>
                        <CurrencyInput
                          value={form.data.prices[pl.id] || ''}
                          onValueChange={val => form.setData('prices', { ...form.data.prices, [pl.id]: val })}
                          className="w-full text-sm font-medium"
                          placeholder="Ej. 10000"
                        />
                      </div>
                    ))}
                    {priceLists.length === 0 && (
                      <div className="col-span-2 text-sm text-[var(--sf-text-muted)] p-4 bg-[var(--sf-bg)] rounded-xl border border-[var(--sf-border)] text-center">
                        No hay listas de precios creadas.
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="w-full mt-2 py-2.5 bg-[var(--sf-surface)] border border-[var(--sf-border)] hover:bg-[var(--sf-border)] text-[var(--sf-text-main)] font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancelar Edición
                      </button>
                    )}
                  </div>
                </form>
              </Card.Body>
            </Card>
          </div>

          {/* Lista */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)]">
                <SearchBar routeName="/catalog/products" currentSearch={currentSearch || ""} placeholder="Buscar por SKU o Nombre..." />
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--sf-bg)] text-[var(--sf-text-muted)] border-b border-[var(--sf-border)]">
                    <tr>
                      <th className="px-6 py-4 font-medium">SKU / Nombre</th>
                      <th className="px-6 py-4 font-medium">Estado</th>
                      <th className="px-6 py-4 font-medium">Precios</th>
                      <th className="px-6 py-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--sf-dark-border)]">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay productos registrados.
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.id} className={`${editingProduct?.id === p.id ? 'bg-indigo-500/5' : 'hover:bg-[var(--sf-bg)]/50'} transition-colors`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-md bg-white object-contain p-1 shrink-0 shadow-sm" />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-[var(--sf-bg)] border border-[var(--sf-border)] flex items-center justify-center shrink-0">
                                  <ShoppingBag className="w-5 h-5 text-[var(--sf-text-muted)]" />
                                </div>
                              )}
                              <div>
                                <p className="text-[var(--sf-text-main)] font-medium">
                                  {p.name}
                                </p>
                                <p className="text-[var(--sf-text-muted)] font-mono text-xs mt-0.5">{p.sku || '-'}</p>
                                <div className="flex gap-2 mt-2">
                                  <span className="px-2 py-0.5 rounded-md bg-[var(--sf-bg)] border border-[var(--sf-border)] text-xs text-[var(--sf-text-muted)]">
                                    {p.brand?.name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-[var(--sf-bg)] border border-[var(--sf-border)] text-xs text-[var(--sf-text-muted)]">
                                    {p.material?.name}{p.material?.measure ? ` ${p.material.measure}` : ''}{p.material?.unit && p.material.unit !== 'UN' ? ` ${p.material.unit}` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2 items-start">
                              {p.active ? (
                                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sistema: Activo</span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">Sistema: Inactivo</span>
                              )}
                              
                              {p.available_in_app ? (
                                <span className="px-2 py-1 rounded text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">App: Visible</span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">App: Oculto</span>
                              )}

                              {p.accepts_vouchers ? (
                                <span className="px-2 py-1 rounded text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">Vales: Sí</span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">Vales: No</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative group cursor-default">
                              {p.product_prices && p.product_prices.length > 0 ? (
                                <>
                                  <div className="flex flex-col gap-1.5">
                                    {p.product_prices.slice(0, 2).map(pr => {
                                      const listName = pr.price_list?.name || 'Precio'
                                      return (
                                        <span key={pr.id} className="px-2.5 py-1 text-xs font-medium rounded-lg border inline-block w-max bg-[var(--sf-surface)] text-[var(--sf-text-main)] border-[var(--sf-border)] shadow-sm">
                                          <span className="text-[var(--sf-text-muted)] mr-1.5">{listName}:</span>
                                          ${parseFloat(pr.price).toLocaleString()}
                                        </span>
                                      )
                                    })}
                                    {p.product_prices.length > 2 && (
                                      <span className="text-[10px] text-indigo-400 font-bold mt-1 w-max">
                                        +{p.product_prices.length - 2} listas más... (Hover)
                                      </span>
                                    )}
                                  </div>

                                  {p.product_prices.length > 2 && (
                                    <div className="absolute -top-2 -left-2 z-50 bg-[var(--sf-bg)] border border-[var(--sf-border)] shadow-2xl rounded-xl p-3 hidden group-hover:flex flex-col gap-1.5 min-w-max">
                                      <div className="text-xs font-bold text-[var(--sf-text-muted)] mb-1 border-b border-[var(--sf-border)] pb-2">Todos los precios de {p.name}</div>
                                      {p.product_prices.map(pr => {
                                        const listName = pr.price_list?.name || 'Precio'
                                        return (
                                          <span key={pr.id} className="px-2.5 py-1 text-xs font-medium rounded-lg border inline-block w-max bg-[var(--sf-surface)] text-[var(--sf-text-main)] border-[var(--sf-border)] shadow-sm">
                                            <span className="text-[var(--sf-text-muted)] mr-1.5">{listName}:</span>
                                            ${parseFloat(pr.price).toLocaleString()}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-[var(--sf-text-muted)]">Sin precios definidos</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right align-top">
                            <div className="flex items-center justify-end gap-3 mt-1">
                              <button onClick={() => editProduct(p)} className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
                <Pagination pagination={pagination} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
