import { useState, useRef } from 'react'
import { Head, useForm, router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import SearchBar from '@/components/SearchBar'
import Pagination, { PagyProps } from '@/components/Pagination'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomSwitch } from '@/components/CustomSwitch'
import { Truck as TruckIcon, Pencil, Save, X } from 'lucide-react'

interface Driver {
  id: number
  first_name: string
  last_name: string
  rut?: string
}

interface Warehouse {
  id: number
  name: string
}

interface Truck {
  id: number
  plate_number: string
  active: boolean
  driver?: Driver
  warehouse?: Warehouse
  base_warehouse?: Warehouse
}

interface Props {
  trucks: Truck[]
  drivers: Driver[]
  assigned_driver_ids: Record<number, number>
  base_warehouses: Warehouse[]
  pagination: PagyProps
  currentSearch?: string
}

// Deja al usuario escribir libremente, pero auto-formatea si detecta un patrón chileno válido
const formatPlate = (value: string): string => {
  const upper = value.toUpperCase()
  const clean = upper.replace(/[^A-Z0-9]/g, '')
  
  if (clean.length === 6) {
    // Formato Nuevo: 4 letras, 2 números (ej: ABCD12 -> AB-CD-12)
    if (/^[A-Z]{4}[0-9]{2}$/.test(clean)) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`
    }
    // Formato Antiguo: 2 letras, 4 números (ej: AB1234 -> AB-1234)
    if (/^[A-Z]{2}[0-9]{4}$/.test(clean)) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 6)}`
    }
  }

  // Si no calza o está incompleto, devuelve tal cual lo escribió (en mayúsculas)
  return upper
}

export default function TrucksIndex({ trucks, drivers, assigned_driver_ids, base_warehouses, pagination, currentSearch }: Props) {
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const { data, setData, post, patch, processing, reset, errors, clearErrors } = useForm({
    plate_number: '',
    driver_id: '',
    base_warehouse_id: '',
    active: true
  })

  const editTruck = (truck: Truck) => {
    setEditingTruck(truck)
    setData({
      plate_number: truck.plate_number,
      driver_id: truck.driver?.id?.toString() || '',
      base_warehouse_id: truck.base_warehouse?.id?.toString() || '',
      active: truck.active
    })
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingTruck(null)
    reset()
    clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTruck) {
      patch(`/trucks/${editingTruck.id}`, { onSuccess: () => cancelEdit() })
    } else {
      post('/trucks', { onSuccess: () => cancelEdit() })
    }
  }

  const toggleActive = (id: number) => {
    router.patch(`/trucks/${id}/toggle_active`)
  }

  return (
    <AuthenticatedLayout>
      <Head title="Gestión de Camiones" />

      <div className="space-y-6">
        <PageHeader 
          title="Gestión de Camiones en Ruta"
          icon={<TruckIcon className="w-8 h-8 opacity-80" />}
          description="Administra tu flota. Cada camión tiene su propia Bodega Móvil de inventario."
          color="amber"
        >
          <Link
            href="/trucks/map"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 text-sm cursor-pointer"
          >
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Ver Mapa en Vivo
          </Link>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingTruck ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'} >
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingTruck 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingTruck ? <Pencil className="w-5 h-5 shrink-0" /> : <TruckIcon className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingTruck ? 'Editando Camión' : 'Registrar Nuevo Camión'}
                    </h2>
                    {editingTruck && (
                      <p className="text-xs opacity-80 truncate font-mono tracking-widest">{formatPlate(editingTruck.plate_number)}</p>
                    )}
                  </div>
                </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Patente</label>
                  <input
                    type="text"
                    value={data.plate_number}
                    onChange={e => setData('plate_number', formatPlate(e.target.value))}
                    className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 font-mono uppercase text-sm"
                    placeholder="XX-YY-99 o XX-1234"
                    required
                  />
                  {errors.plate_number && <p className="text-red-400 text-sm mt-1">{errors.plate_number}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Chofer Asignado</label>
                  <CustomSelect
                    value={data.driver_id ? { value: data.driver_id, label: drivers.find(d => d.id.toString() === data.driver_id) ? `${drivers.find(d => d.id.toString() === data.driver_id)?.first_name} ${drivers.find(d => d.id.toString() === data.driver_id)?.last_name}` + (drivers.find(d => d.id.toString() === data.driver_id)?.rut ? ` (${drivers.find(d => d.id.toString() === data.driver_id)?.rut})` : '') : '' } : null}
                    onChange={(val: any) => setData('driver_id', val?.value || '')}
                    options={drivers.filter(d => !Object.entries(assigned_driver_ids).some(([tid, did]) => Number(did) === d.id && Number(tid) !== editingTruck?.id)).map(d => ({ value: d.id.toString(), label: `${d.first_name} ${d.last_name}${d.rut ? ` (${d.rut})` : ''}` }))}
                    isClearable
                    placeholder="Seleccionar chofer..."
                  />
                  {errors.driver_id && <p className="text-red-400 text-sm mt-1">{errors.driver_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Bodega Base</label>
                  <CustomSelect
                    value={data.base_warehouse_id ? { value: data.base_warehouse_id, label: base_warehouses.find(w => w.id.toString() === data.base_warehouse_id)?.name || '' } : null}
                    onChange={(val: any) => setData('base_warehouse_id', val?.value || '')}
                    options={base_warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                    isClearable
                    placeholder="Seleccionar bodega base..."
                  />
                  {errors.base_warehouse_id && <p className="text-red-400 text-sm mt-1">{errors.base_warehouse_id}</p>}
                </div>

                <div className="pt-2">
                  <CustomSwitch
                    checked={data.active}
                    onChange={(checked) => setData('active', checked)}
                    label="Camión Activo"
                    description="Si el camión está inactivo, no podrá ser usado en las operaciones."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingTruck ? 'Actualizar Camión' : 'Guardar Camión'}
                  </button>
                  {editingTruck && (
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
              <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
                <SearchBar placeholder="Buscar por patente o chofer..." currentSearch={currentSearch} />
              </div>
              <div className="flex-1 overflow-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Patente</Table.Th>
                      <Table.Th>Chofer</Table.Th>
                      <Table.Th>Bodega Base</Table.Th>
                      <Table.Th className="text-right">Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {trucks.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay camiones registrados
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      trucks.map((truck) => (
                        <Table.Tr key={truck.id} className={`${editingTruck?.id === truck.id ? 'bg-indigo-500/5' : (!truck.active ? 'opacity-50 hover:bg-[var(--sf-bg)]/50' : 'hover:bg-[var(--sf-bg)]/50')} transition-colors`}>
                          
                          <Table.Td>
                            <span className="font-mono font-bold text-[var(--sf-text-main)] tracking-widest">{formatPlate(truck.plate_number)}</span>
                          </Table.Td>

                          <Table.Td>
                            {truck.driver ? (
                              <span className="text-[var(--sf-text-main)]">{truck.driver.first_name} {truck.driver.last_name} {truck.driver.rut ? `(${truck.driver.rut})` : ''}</span>
                            ) : (
                              <span className="text-[var(--sf-text-muted)] italic">Sin chofer asignado</span>
                            )}
                          </Table.Td>

                          <Table.Td>
                            {truck.base_warehouse ? (
                              <span className="text-[var(--sf-text-main)] font-medium">{truck.base_warehouse.name}</span>
                            ) : (
                              <span className="text-[var(--sf-text-muted)] italic text-sm">Sin asignar</span>
                            )}
                          </Table.Td>

                          <Table.Td className="text-right">
                            <div className="flex items-center justify-end gap-3 mt-1">
                              <span
                                className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold rounded border mr-2 ${
                                  truck.active
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}
                              >
                                {truck.active ? 'Activo' : 'Inactivo'}
                              </span>

                              <button onClick={() => editTruck(truck)} className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </div>
              <Pagination pagination={pagination} currentSearch={currentSearch} />
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
