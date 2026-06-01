import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { CustomSelect } from '@/components/CustomSelect'
import { ArrowRightLeft } from 'lucide-react'

interface PlantWarehouse {
  id: number
  name: string
}

interface Driver {
  id: number
  first_name?: string
  last_name?: string
}

interface TruckWarehouse {
  id: number
  name: string
}

interface Truck {
  id: number
  plate_number: string
  driver?: Driver
  warehouse?: TruckWarehouse
}

interface StockTransfer {
  id: number
  source_warehouse_id: number
  destination_warehouse_id: number
  status: string
  created_at: string
  source_warehouse: { id: number, name: string }
  destination_warehouse: { id: number, name: string }
}

interface Props {
  transfers: StockTransfer[]
  plant_warehouses: PlantWarehouse[]
  trucks: Truck[]
  pagination: any
  currentSearch?: string
}

// Formatea la patente
const formatPlate = (p: string) => {
  const c = p.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (c.length <= 2) return c
  if (c.length <= 4) return `${c.slice(0, 2)}-${c.slice(2)}`
  return `${c.slice(0, 2)}-${c.slice(2, 4)}-${c.slice(4, 6)}`
}

export default function TransfersIndex({ transfers, plant_warehouses, trucks, pagination, currentSearch }: Props) {
  const [transferType, setTransferType] = useState('load_truck')
  const { data, setData, post, reset, processing } = useForm({
    source_warehouse_id: '',
    destination_warehouse_id: ''
  })

  const handleLoadTruck = (warehouseId: string, truckWarehouseId: string) => {
    setData({ source_warehouse_id: warehouseId, destination_warehouse_id: truckWarehouseId })
  }

  const handleUnloadTruck = (truckWarehouseId: string, warehouseId: string) => {
    setData({ source_warehouse_id: truckWarehouseId, destination_warehouse_id: warehouseId })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/inventory/transfers', { onSuccess: () => { reset() } })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Carga y Descarga de Camiones" />

      <div className="space-y-6">
        <PageHeader 
          title="Carga y Descarga de Camiones"
          icon={<ArrowRightLeft className="w-8 h-8 opacity-80" />}
          description="Carga un camión desde la planta en la mañana, o descarga los envases vacíos al volver."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <Card className="" >
              <Card.Body>
              <h2 className="font-semibold text-[var(--sf-text-main)] mb-4">Nuevo Movimiento</h2>

              {/* Tipo de movimiento */}
              <div className="flex gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => { setTransferType('load_truck'); reset(); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${transferType === 'load_truck' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-transparent text-[var(--sf-text-muted)] border-[var(--sf-border)] hover:bg-[var(--sf-bg)]'}`}
                >
                  🚛 Cargar Camión
                </button>
                <button
                  type="button"
                  onClick={() => { setTransferType('unload_truck'); reset(); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${transferType === 'unload_truck' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-transparent text-[var(--sf-text-muted)] border-[var(--sf-border)] hover:bg-[var(--sf-bg)]'}`}
                >
                  🏭 Descargar a Planta
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {transferType === 'load_truck' ? (
                  <>
                    {/* Bodega origen (solo plantas reales) */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">
                        ¿Desde qué Planta/Bodega sale?
                      </label>
                      <CustomSelect
                        value={data.source_warehouse_id ? { value: data.source_warehouse_id, label: plant_warehouses.find(w => w.id.toString() === data.source_warehouse_id)?.name } : null}
                        onChange={(val: any) => handleLoadTruck(val?.value || '', data.destination_warehouse_id)}
                        options={plant_warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                        placeholder="Selecciona bodega..."
                        required
                      />
                    </div>

                    {/* Búsqueda + Camión destino */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">
                        ¿A qué Camión cargas?
                      </label>
                      <CustomSelect
                        value={data.destination_warehouse_id ? { value: data.destination_warehouse_id, label: (() => {
                          const t = trucks.find(tr => tr.warehouse?.id.toString() === data.destination_warehouse_id);
                          return t ? `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` : '';
                        })() } : null}
                        onChange={(val: any) => handleLoadTruck(data.source_warehouse_id, val?.value || '')}
                        options={trucks.map(t => ({ value: t.warehouse?.id.toString() || '', label: `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` }))}
                        placeholder="Selecciona camión..."
                        required
                      />
                      {trucks.length === 0 && (
                        <p className="text-orange-400 text-xs mt-1">No hay camiones activos. Registra uno primero.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Camión origen */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">
                        ¿Desde qué Camión descargas?
                      </label>
                      <CustomSelect
                        value={data.source_warehouse_id ? { value: data.source_warehouse_id, label: (() => {
                          const t = trucks.find(tr => tr.warehouse?.id.toString() === data.source_warehouse_id);
                          return t ? `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` : '';
                        })() } : null}
                        onChange={(val: any) => handleUnloadTruck(val?.value || '', data.destination_warehouse_id)}
                        options={trucks.map(t => ({ value: t.warehouse?.id.toString() || '', label: `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` }))}
                        placeholder="Selecciona camión..."
                        required
                      />
                    </div>

                    {/* Bodega destino (solo plantas) */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">
                        ¿A qué Planta/Bodega descargas?
                      </label>
                      <CustomSelect
                        value={data.destination_warehouse_id ? { value: data.destination_warehouse_id, label: plant_warehouses.find(w => w.id.toString() === data.destination_warehouse_id)?.name } : null}
                        onChange={(val: any) => handleUnloadTruck(data.source_warehouse_id, val?.value || '')}
                        options={plant_warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                        placeholder="Selecciona bodega..."
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={processing || !data.source_warehouse_id || !data.destination_warehouse_id}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Siguiente: Elegir Productos →
                </button>
              </form>
            </Card.Body>
          </Card>
          </div>

          {/* Historial */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center bg-[var(--sf-surface)] border border-[var(--sf-border)] p-4 rounded-xl mb-4">
              <SearchBar routeName="/inventory/transfers" currentSearch={currentSearch || ""} placeholder="Buscar por ID..." />
            </div>
            <Card className="overflow-hidden ">
              <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Ruta</Table.Th>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {transfers.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay transferencias registradas
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      transfers.map((t) => (
                        <Table.Tr key={t.id}>
                          <Table.Td className="font-mono text-xs text-[var(--sf-text-muted)]">#{t.id}</Table.Td>
                          <Table.Td>
                            <div className="text-sm text-[var(--sf-text-main)] flex items-center gap-1.5">
                              <span className="text-red-400 text-xs">Sale:</span> {t.source_warehouse?.name}
                            </div>
                            <div className="text-sm text-[var(--sf-text-main)] flex items-center gap-1.5 mt-0.5">
                              <span className="text-emerald-400 text-xs">Entra:</span> {t.destination_warehouse?.name}
                            </div>
                          </Table.Td>
                          <Table.Td className="text-[var(--sf-text-muted)] text-xs">
                            {new Date(t.created_at).toLocaleDateString()}
                            <br />
                            <span className="opacity-70 text-[10px]">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </Table.Td>
                          <Table.Td>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              t.status === 'draft'
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {t.status === 'draft' ? '⏳ Borrador' : '✅ Completada'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <Link href={`/inventory/transfers/${t.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
                              {t.status === 'draft' ? 'Editar →' : 'Ver →'}
                            </Link>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
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
