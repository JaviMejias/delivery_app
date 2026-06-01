import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import { CustomSelect } from '@/components/CustomSelect'
import { Package } from 'lucide-react'

interface Material {
  id: number
  name: string
  unit: string
}

interface Brand {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
  material?: Material
  brand?: Brand
}

interface InventoryRecord {
  id: number
  quantity: number
  item_type: string
  item: Product | Material
}

interface Warehouse {
  id: number
  name: string
}

interface Props {
  warehouses: Warehouse[]
  warehouse: Warehouse | null
  product_inventory: InventoryRecord[]
  material_inventory: InventoryRecord[]
}

export default function StockIndex({ warehouses, warehouse, product_inventory, material_inventory }: Props) {
  const [activeTab, setActiveTab] = useState<'products' | 'materials'>('products')

  const handleWarehouseChange = (warehouseId: string) => {
    router.get('/inventory/stock', { warehouse_id: warehouseId }, { preserveState: true })
  }

  if (!warehouse) {
    return (
      <AuthenticatedLayout>
        <Head title="Stock Actual" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-[var(--sf-text-main)] mb-2">No tienes una bodega activa</h2>
          <p className="text-[var(--sf-text-muted)] mb-6 max-w-md">
            Para poder ver y gestionar el stock, primero debes tener una bodega creada y activa en el sistema.
          </p>
          <Link
            href="/inventory/warehouses"
            className="px-6 py-3 bg-indigo-500 text-[var(--sf-text-main)] font-medium rounded-xl hover:bg-indigo-600 transition-colors"
          >
            Ir a crear Bodega
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Stock: ${warehouse.name}`} />

      <div className="space-y-6">
        <PageHeader 
          title={`Inventario Central`}
          icon={<Package className="w-8 h-8 opacity-80" />}
          description="Consulta el stock disponible de productos llenos para la venta, y el inventario de envases vacíos."
          color="indigo"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-[var(--sf-text-muted)]">Bodega:</span>
              <div className="w-full sm:w-64">
                <CustomSelect
                  value={{ value: warehouse.id.toString(), label: warehouse.name }}
                  onChange={(val: any) => handleWarehouseChange(val?.value || '')}
                  options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                  placeholder="Selecciona una bodega..."
                />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <a href={`/inventory/stock?format=xlsx&warehouse_id=${warehouse.id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-medium bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg hover:bg-[var(--sf-surface)] text-[var(--sf-text-main)] transition-colors">
                ⬇️ EXCEL
              </a>
            </div>
          </div>
        </PageHeader>

        {/* Tabs */}
        <div className="flex border-b border-[var(--sf-border)]">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-bg)]/50'
            }`}
          >
            🔵 Productos (Llenos)
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'materials'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-bg)]/50'
            }`}
          >
            ⚪ Envases (Vacíos)
          </button>
        </div>

        {/* Content */}
        <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--sf-bg)] text-[var(--sf-text-muted)] border-b border-[var(--sf-border)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Ítem</th>
                  {activeTab === 'products' && <th className="px-6 py-4 font-medium">SKU</th>}
                  <th className="px-6 py-4 font-medium text-right">Cantidad en Bodega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sf-dark-border)]">
                {activeTab === 'products' ? (
                  product_inventory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                        No hay stock de productos. Intenta recibir una orden de compra.
                      </td>
                    </tr>
                  ) : (
                    product_inventory.map((inv) => {
                      const prod = inv.item as Product
                      return (
                        <tr key={inv.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                          <td className="px-6 py-4 text-[var(--sf-text-main)] font-medium">{prod.name}</td>
                          <td className="px-6 py-4 text-[var(--sf-text-muted)] font-mono">{prod.sku}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xl font-bold text-[var(--sf-text-main)]">{inv.quantity}</span>
                          </td>
                        </tr>
                      )
                    })
                  )
                ) : (
                  material_inventory.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                        No hay stock de envases vacíos registrados.
                      </td>
                    </tr>
                  ) : (
                    material_inventory.map((inv) => {
                      const mat = inv.item as Material
                      return (
                        <tr key={inv.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                          <td className="px-6 py-4 text-[var(--sf-text-main)] font-medium">{mat.name}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xl font-bold text-[var(--sf-text-main)]">{inv.quantity}</span>
                          </td>
                        </tr>
                      )
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
