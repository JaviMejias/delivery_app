import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import { Package } from 'lucide-react'
import { useExcelExport } from '@/hooks/useExcelExport'
import { TableFilters } from '@/components/TableFilters'

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
  warehouse: Warehouse
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
  currentSearch?: string
  currentBrand?: string
  currentTab?: string
}

export default function StockIndex({ warehouses, warehouse, product_inventory, material_inventory, currentSearch, currentBrand, currentTab }: Props) {
  const [activeTab, setActiveTab] = useState<'products' | 'materials'>(
    (currentTab as 'products' | 'materials') || 'products'
  )
  const [search, setSearch] = useState(currentSearch || '')
  const [brandId, setBrandId] = useState(currentBrand || 'all')
  const [warehouseId, setWarehouseId] = useState(warehouse ? warehouse.id.toString() : 'all')
  const [isFiltering, setIsFiltering] = useState(false)

  const { handleExcelClick } = useExcelExport()

  const applyFilters = () => {
    router.get('/inventory/stock', {
      warehouse_id: warehouseId,
      search,
      brand_id: brandId,
      tab: activeTab
    }, { 
      preserveState: true,
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false)
    })
  }

  // Filter products by currentSearch and currentBrand
  const filteredProducts = product_inventory.filter(inv => {
    const prod = inv.item as Product
    const matchSearch = (currentSearch || '').trim() === '' || 
           prod.name.toLowerCase().includes((currentSearch || '').toLowerCase()) || 
           prod.sku.toLowerCase().includes((currentSearch || '').toLowerCase())
    
    const matchBrand = (currentBrand || 'all') === 'all' || prod.brand?.id.toString() === currentBrand

    return matchSearch && matchBrand
  })

  // Filter materials by currentSearch
  const filteredMaterials = material_inventory.filter(inv => {
    const mat = inv.item as Material
    const measureVal = mat.measure ? Number(mat.measure) : null
    const measurePart = measureVal ? ` ${measureVal}` : ''
    const unitPart = mat.unit && mat.unit !== 'UN' ? ` ${mat.unit}` : ''
    const fullName = `${mat.name}${measurePart}${unitPart}`
    const matchSearch = (currentSearch || '').trim() === '' || fullName.toLowerCase().includes((currentSearch || '').toLowerCase())
    return matchSearch
  })

  // Extract unique brands from inventory
  const uniqueBrands = Array.from(new Map(
    product_inventory
      .filter(inv => (inv.item as Product).brand)
      .map(inv => {
        const brand = (inv.item as Product).brand!
        return [brand.id, brand]
      })
  ).values())

  if (warehouses.length === 0) {
    return (
      <AuthenticatedLayout>
        <Head title="Stock Actual" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-[var(--sf-text-main)] mb-2">No tienes bodegas configuradas</h2>
          <p className="text-[var(--sf-text-muted)] mb-6 max-w-md">
            Para poder ver y gestionar el stock, primero debes crear al menos una bodega o planta en el sistema.
          </p>
          <Link
            href="/company/warehouses"
            className="px-6 py-3 bg-primary-500 text-[var(--sf-text-main)] font-medium rounded-xl hover:bg-primary-600 transition-colors"
          >
            Ir a crear Bodega
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Stock: ${warehouse ? warehouse.name : 'Todas las Bodegas'}`} />

      <div className="space-y-6">
        <PageHeader 
          title={`Inventario Central`}
          icon={<Package className="w-8 h-8 opacity-80" />}
          description="Consulta el stock disponible de productos llenos para la venta, y el inventario de envases vacíos."
          color="indigo"
        />

        {/* Tabs */}
        <div className="flex border-b border-[var(--sf-border)]">
          <button
            onClick={() => {
              setActiveTab('products')
              router.get('/inventory/stock', { warehouse_id: warehouseId, search, brand_id: brandId, tab: 'products' }, { preserveState: true })
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                : 'border-transparent text-[var(--sf-text-muted)] hover:text-[var(--sf-text-main)] hover:bg-[var(--sf-bg)]/50'
            }`}
          >
            🔵 Productos (Llenos)
          </button>
          <button
            onClick={() => {
              setActiveTab('materials')
              router.get('/inventory/stock', { warehouse_id: warehouseId, search, brand_id: brandId, tab: 'materials' }, { preserveState: true })
            }}
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
        <div className="flex flex-col gap-4">
          <TableFilters onApply={applyFilters} isLoading={isFiltering}>
            <TableFilters.Search
              value={search}
              onChange={setSearch}
              onSearch={applyFilters}
              placeholder={activeTab === 'products' ? "Buscar por nombre o SKU..." : "Buscar por envase..."}
              className="w-full sm:w-96"
            />
            <TableFilters.Select
              value={warehouseId}
              onChange={setWarehouseId}
              options={[
                { value: 'all', label: 'Todas las Bodegas' },
                ...warehouses.map(w => ({ value: w.id.toString(), label: w.name }))
              ]}
              className="w-full sm:w-64"
            />
            {activeTab === 'products' && (
              <TableFilters.Select
                value={brandId}
                onChange={setBrandId}
                options={[
                  { value: 'all', label: 'Todas las Marcas' },
                  ...uniqueBrands.map(b => ({ value: b.id.toString(), label: b.name }))
                ]}
                className="w-full sm:w-64"
              />
            )}
          </TableFilters>

          <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--sf-border)] flex items-center justify-between gap-4 bg-[var(--sf-bg)]/50">
              <div className="text-sm font-medium text-[var(--sf-text-main)]">
                Mostrando {activeTab === 'products' ? `${filteredProducts.length} productos` : `${filteredMaterials.length} envases`}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--sf-bg)] text-[var(--sf-text-muted)] border-b border-[var(--sf-border)]">
                <tr>
                  {!warehouse && <th className="px-6 py-4 font-medium">Bodega</th>}
                  <th className="px-6 py-4 font-medium">Ítem</th>
                  {activeTab === 'products' && <th className="px-6 py-4 font-medium">SKU</th>}
                  <th className="px-6 py-4 font-medium text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sf-dark-border)]">
                {activeTab === 'products' ? (
                  filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={warehouse ? 3 : 4} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                        No hay stock que coincida con tu búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((inv) => {
                      const prod = inv.item as Product
                      return (
                        <tr key={inv.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                          {!warehouse && <td className="px-6 py-4 text-[var(--sf-text-muted)]">{inv.warehouse?.name}</td>}
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
                  filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={warehouse ? 2 : 3} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                        No hay envases que coincidan con tu búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((inv) => {
                      const mat = inv.item as Material
                      const measureVal = mat.measure ? Number(mat.measure) : null
                      const measurePart = measureVal ? ` ${measureVal}` : ''
                      const unitPart = mat.unit && mat.unit !== 'UN' ? ` ${mat.unit}` : ''
                      const fullName = `${mat.name}${measurePart}${unitPart}`
                      
                      return (
                        <tr key={inv.id} className="hover:bg-[var(--sf-bg)]/50 transition-colors">
                          {!warehouse && <td className="px-6 py-4 text-[var(--sf-text-muted)]">{inv.warehouse?.name}</td>}
                          <td className="px-6 py-4 text-[var(--sf-text-main)] font-medium">{fullName}</td>
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
      </div>
    </AuthenticatedLayout>
  )
}
