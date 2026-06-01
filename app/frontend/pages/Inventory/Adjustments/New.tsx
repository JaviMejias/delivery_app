import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
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
                <div className="flex items-center gap-3 p-4 mb-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
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
                    <p className="text-xs">Usa números positivos (ej. <strong>50</strong>). Ideal para el día 1 de operaciones.</p>
                  </div>

                  <div className="bg-[var(--sf-bg)] p-3 rounded-lg border border-[var(--sf-border)]">
                    <h3 className="text-white font-medium mb-1 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-red-400" /> Para Restar Stock
                    </h3>
                    <p className="text-xs">Usa números negativos (ej. <strong>-5</strong>). Ideal para registrar mermas o pérdidas.</p>
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
                      <select
                        value={data.warehouse_id}
                        onChange={e => setData('warehouse_id', e.target.value)}
                        className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                        required
                        disabled={!isAdmin && !!assignedWarehouseId}
                      >
                        <option value="">Seleccione una ubicación...</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      {errors.warehouse_id && <p className="text-red-400 text-sm mt-1">{errors.warehouse_id}</p>}
                    </div>

                    {/* Tipo de Ítem */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider">Tipo de Ítem</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${data.item_type === 'Product' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold' : 'bg-[var(--sf-bg)] border-[var(--sf-border)] text-slate-400 hover:border-slate-500'}`}>
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
                      <select
                        value={data.item_id}
                        onChange={e => setData('item_id', e.target.value)}
                        className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        required
                      >
                        <option value="">Seleccione un {data.item_type === 'Product' ? 'producto' : 'envase'}...</option>
                        {data.item_type === 'Product' 
                          ? products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))
                          : materials.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))
                        }
                      </select>
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider flex justify-between">
                        <span>Cantidad a Ajustar</span>
                        {isPositive && <span className="text-emerald-400 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Ingreso</span>}
                        {isNegative && <span className="text-red-400 text-xs flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Salida</span>}
                      </label>
                      <input
                        type="number"
                        placeholder="Ej: 50, o -10 para restar"
                        value={data.quantity_change}
                        onChange={e => setData('quantity_change', e.target.value)}
                        className={`w-full bg-[var(--sf-bg)] border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${isPositive ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : isNegative ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[var(--sf-border)] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`}
                        required
                      />
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--sf-text-muted)] uppercase tracking-wider">Motivo / Justificación</label>
                      <input
                        type="text"
                        placeholder="Ej: Saldo inicial, Merma, Ajuste por descuadre..."
                        value={data.reason}
                        onChange={e => setData('reason', e.target.value)}
                        className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end border-t border-[var(--sf-border)]">
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
