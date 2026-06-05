import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomSwitch } from '@/components/CustomSwitch'
import { Save, PackagePlus, TrendingUp, TrendingDown, Info } from 'lucide-react'

interface Warehouse {
  id: number
  name: string
}

interface Material {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  material_name: string
  brand_name: string
}

interface Props {
  warehouses: Warehouse[]
  materials: Material[]
  products: Product[]
}

export default function NewInventoryAdjustment({ warehouses, materials, products, auth }: any) {
  const assignedWarehouseId = auth?.user?.assigned_warehouse_id?.toString()
  const isAdmin = auth?.user?.role === 'admin'

  const { data, setData, post, processing, errors, reset } = useForm({
    warehouse_id: assignedWarehouseId || '',
    item_type: 'Product',
    item_id: '',
    quantity_change: '',
    reason: ''
  })

  const [isSubtracting, setIsSubtracting] = useState(false)

  const handleQuantityInput = (val: string) => {
    if (!val) {
      setData('quantity_change', '')
      return
    }
    const absVal = Math.abs(Number(val))
    setData('quantity_change', isSubtracting ? `-${absVal}` : `${absVal}`)
  }

  const handleSwitchChange = (checked: boolean) => {
    setIsSubtracting(checked)
    if (data.quantity_change) {
      const absVal = Math.abs(Number(data.quantity_change))
      setData('quantity_change', checked ? `-${absVal}` : `${absVal}`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/inventory/adjustments', {
      onSuccess: () => reset('item_id', 'quantity_change')
    })
  }

  const isPositive = parseInt(data.quantity_change) > 0
  const isNegative = parseInt(data.quantity_change) < 0

  return (
    <AuthenticatedLayout>
      <Head title="Ajuste de Inventario" />

      <div className="space-y-6">
        <PageHeader 
          icon={<PackagePlus className="w-8 h-8 opacity-80" />}
          title="Ajuste Manual de Inventario"
          description="Inyecta o descuenta stock directamente de una bodega o camión. Ideal para carga de saldos iniciales."
          color="emerald"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bloque Izquierdo: Información y Ayuda */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <Card.Body>
                <div className="flex items-center gap-3 p-4 mb-4 rounded-xl border bg-primary-500/10 border-primary-500/30 text-emerald-400">
                  <Info className="w-5 h-5 shrink-0" />
                  <div>
                    <h2 className="font-semibold text-sm">¿Cómo usar esta herramienta?</h2>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm text-[var(--sf-text-muted)]">
                  <p>
                    Esta herramienta está diseñada para <strong>Saldos Iniciales</strong> o <strong>Cuadraturas de Caja</strong>.
                  </p>
                  
                  <div className="bg-[var(--sf-bg)] p-3 rounded-lg border border-[var(--sf-border)]">
                    <h3 className="text-white font-medium mb-1 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Para Sumar Stock
                    </h3>
                    <p className="text-xs">Deja el interruptor apagado y escribe la cantidad. Ideal para inyectar saldos el día 1.</p>
                  </div>

                  <div className="bg-[var(--sf-bg)] p-3 rounded-lg border border-[var(--sf-border)]">
                    <h3 className="text-white font-medium mb-1 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-red-400" /> Para Restar Stock
                    </h3>
                    <p className="text-xs">Enciende el interruptor <strong>¿Descontar stock?</strong> y escribe la cantidad. Ideal para registrar mermas o correcciones.</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Bloque Derecho: Formulario */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Body>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col gap-6">
                    
                    {/* Bodega / Camión */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider">Bodega o Camión</label>
                      <CustomSelect
                        options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                        value={warehouses.map(w => ({ value: w.id.toString(), label: w.name })).find(o => o.value === data.warehouse_id?.toString()) || null}
                        onChange={(val: any) => setData('warehouse_id', val ? val.value : '')}
                        placeholder="Seleccione una ubicación..."
                        isDisabled={!isAdmin && !!assignedWarehouseId}
                      />
                      {errors.warehouse_id && <p className="text-red-400 text-sm mt-1">{errors.warehouse_id as string}</p>}
                    </div>

                    {/* Tipo de Ítem */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider">Tipo de Ítem</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${data.item_type === 'Product' ? 'bg-primary-500/20 border-primary-500 text-primary-300 font-bold' : 'bg-[var(--sf-bg)] border-[var(--sf-border)] text-slate-400 hover:border-slate-500'}`}>
                          <input 
                            type="radio" 
                            name="item_type" 
                            value="Product" 
                            checked={data.item_type === 'Product'}
                            onChange={() => setData({ ...data, item_type: 'Product', item_id: '' })}
                            className="hidden" 
                          />
                          Producto (Lleno)
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${data.item_type === 'Material' ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold' : 'bg-[var(--sf-bg)] border-[var(--sf-border)] text-slate-400 hover:border-slate-500'}`}>
                          <input 
                            type="radio" 
                            name="item_type" 
                            value="Material" 
                            checked={data.item_type === 'Material'}
                            onChange={() => setData({ ...data, item_type: 'Material', item_id: '' })}
                            className="hidden" 
                          />
                          Envase (Vacío)
                        </label>
                      </div>
                    </div>

                    {/* Ítem Específico */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider">Seleccionar Ítem</label>
                      <CustomSelect
                        options={data.item_type === 'Product' 
                          ? products.map(p => ({ value: p.id.toString(), label: `${p.name} (${p.brand_name})` }))
                          : materials.map(m => ({ value: m.id.toString(), label: `${m.name}${m.measure ? ` ${m.measure}` : ''}${m.unit && m.unit !== 'UN' ? ` ${m.unit}` : ''}` }))
                        }
                        value={(data.item_type === 'Product' 
                          ? products.map(p => ({ value: p.id.toString(), label: `${p.name} (${p.brand_name})` }))
                          : materials.map(m => ({ value: m.id.toString(), label: `${m.name}${m.measure ? ` ${m.measure}` : ''}${m.unit && m.unit !== 'UN' ? ` ${m.unit}` : ''}` }))
                        ).find(o => o.value === data.item_id?.toString()) || null}
                        onChange={(val: any) => setData('item_id', val ? val.value : '')}
                        placeholder={`Seleccione un ${data.item_type === 'Product' ? 'producto' : 'envase'}...`}
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider flex justify-between w-full items-center">
                          <span>Cantidad a Ajustar</span>
                          <CustomSwitch 
                            checked={isSubtracting} 
                            onChange={handleSwitchChange} 
                            label="¿Descontar stock?" 
                          />
                        </label>
                      </div>

                      <div className="relative flex items-center">
                        {isSubtracting && (
                          <div className="absolute left-4 text-red-500 font-black text-2xl flex items-center pointer-events-none select-none z-10">
                            -
                          </div>
                        )}
                        <input
                          type="number"
                          min="1"
                          placeholder={isSubtracting ? "Ej: 10 (se descontarán)" : "Ej: 50 (se sumarán)"}
                          value={data.quantity_change ? Math.abs(Number(data.quantity_change)).toString() : ''}
                          onChange={e => handleQuantityInput(e.target.value)}
                          className={`w-full bg-[var(--sf-bg)] border rounded-xl ${isSubtracting ? 'pl-8 pr-4' : 'px-4'} py-3 text-white focus:outline-none transition-all ${!isSubtracting && data.quantity_change ? 'border-primary-500/50 focus:border-primary-500 focus:ring-1 focus:ring-primary-500' : isSubtracting && data.quantity_change ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[var(--sf-border)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500'}`}
                          required
                        />
                      </div>
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider">Motivo / Justificación</label>
                      <input
                        type="text"
                        placeholder="Ej: Saldo inicial, Merma, Ajuste por descuadre..."
                        value={data.reason}
                        onChange={e => setData('reason', e.target.value)}
                        className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end border-t border-[var(--sf-border)]">
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5" />
                      Procesar Ajuste
                    </button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
