import { useState } from 'react'
import { Head, useForm, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { CustomSelect } from '@/components/CustomSelect'
import { ArrowRightLeft, Calendar, Eye, Pencil } from 'lucide-react'
import { formatPlate } from '@/utils/formatters'

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



export default function TransfersIndex({ transfers, plant_warehouses, trucks, pagination, currentSearch }: Props) {
  const [transferType, setTransferType] = useState('load_truck')
  const [search, setSearch] = useState(currentSearch || '')
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
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${transferType === 'load_truck' ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-transparent text-[var(--sf-text-muted)] border-[var(--sf-border)] hover:bg-[var(--sf-bg)]'}`}
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
                  className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Siguiente: Elegir Productos →
                </button>
              </form>
            </Card.Body>
          </Card>
          </div>

          {/* Historial */}
          <div className="lg:col-span-2">
            <TableFilters>
              <TableFilters.Search
                value={search}
                onChange={setSearch}
                onSearch={() => router.get('/inventory/transfers', { search }, { preserveState: true })}
                placeholder="Buscar por Código..."
                className="w-full"
              />
            </TableFilters>
            <Card className="overflow-hidden ">
              <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Código</Table.Th>
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
                          <Table.Td className="text-[var(--sf-text-muted)] text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5 mb-0.5 text-sm text-[var(--sf-text-main)] font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[var(--sf-text-muted)]" />
                              {new Date(t.created_at).toLocaleDateString()}
                            </div>
                            <span className="opacity-70 text-[10px] ml-5">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                            <Link href={`/inventory/transfers/${t.id}`} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg inline-block transition-colors" title={t.status === 'draft' ? 'Editar' : 'Ver Detalles'}>
                              {t.status === 'draft' ? <Pencil size={18} /> : <Eye size={18} />}
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
