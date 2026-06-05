import { useState, useRef, useEffect } from 'react'
import { Head, useForm, router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import SearchBar from '@/components/SearchBar'
import Pagination, { PagyProps } from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomSwitch } from '@/components/CustomSwitch'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import Modal from '@/components/Modal'
import { Truck as TruckIcon, Pencil, Save, X, MessageCircle } from 'lucide-react'

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
  technical_revision_date?: string
  circulation_permit_date?: string
  current_km?: number
  next_maintenance_km?: number
  has_gps?: boolean
  mileage_update_frequency?: string
}

interface Props {
  trucks: Truck[]
  drivers: Driver[]
  assigned_driver_ids: Record<number, number>
  base_warehouses: Warehouse[]
  pagination: PagyProps
  currentSearch?: string
  currentWarehouseId?: string
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

export default function TrucksIndex({ trucks, drivers, assigned_driver_ids, base_warehouses, pagination, currentSearch, currentWarehouseId }: Props) {
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const { data, setData, post, patch, processing, reset, errors, clearErrors } = useForm({
    plate_number: '',
    driver_id: '',
    base_warehouse_id: '',
    active: true,
    technical_revision_date: '',
    circulation_permit_date: '',
    current_km: '',
    next_maintenance_km: '',
    has_gps: false,
    mileage_update_frequency: 'weekly'
  })

  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false)
  const [pendingTrucks, setPendingTrucks] = useState<any[]>([])
  const [mileageUpdates, setMileageUpdates] = useState<Record<number, string>>({})
  const [search, setSearch] = useState(currentSearch || '')
  const [warehouseId, setWarehouseId] = useState(currentWarehouseId || '')
  const [isLoading, setIsLoading] = useState(false)

  const applyFilters = () => {
    setIsLoading(true)
    const url = new URL(window.location.href);
    if (search) url.searchParams.set('search', search); else url.searchParams.delete('search');
    if (warehouseId) url.searchParams.set('warehouse_id', warehouseId); else url.searchParams.delete('warehouse_id');
    router.get(url.pathname + url.search, {}, { 
      preserveState: true,
      onFinish: () => setIsLoading(false)
    })
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('action') && searchParams.get('action') === 'update_mileage') {
      setIsMileageModalOpen(true)
      fetchPendingTrucks()
      window.history.replaceState(window.history.state, document.title, window.location.pathname)
    }

    const editTruckId = searchParams.get('edit_truck_id')
    if (editTruckId) {
      const truck = trucks.find((t: any) => t.id.toString() === editTruckId)
      if (truck) {
        editTruck(truck)
        window.history.replaceState(window.history.state, document.title, window.location.pathname)
      }
    }
  }, [trucks])

  const fetchPendingTrucks = async () => {
    try {
      const res = await fetch('/trucks/pending_mileage_updates')
      const json = await res.json()
      setPendingTrucks(json.trucks || [])
      const initialUpdates: Record<number, string> = {}
      json.trucks?.forEach((t: any) => {
        initialUpdates[t.id] = ''
      })
      setMileageUpdates(initialUpdates)
    } catch (e) {
      console.error(e)
    }
  }

  const submitMileageUpdates = async () => {
    const hasErrors = pendingTrucks.some(truck => {
      const val = mileageUpdates[truck.id]
      return val && Number(val) < (truck.current_km || 0)
    })

    if (hasErrors) {
      Swal.fire({
        icon: 'error',
        title: 'Kilometraje Inválido',
        text: 'No puedes ingresar un kilometraje menor al actual. Por favor corrige los valores en rojo.',
        confirmButtonColor: 'var(--sf-primary)'
      })
      return
    }

    const updates = Object.entries(mileageUpdates)
      .filter(([id, val]) => val !== '')
      .map(([id, current_km]) => ({ id, current_km }))
      
    if (updates.length === 0) {
      setIsMileageModalOpen(false)
      return
    }
    try {
      await fetch('/trucks/bulk_update_mileage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({ updates })
      })
      setIsMileageModalOpen(false)
      router.reload()
    } catch (e) {
      console.error(e)
    }
  }

  const editTruck = (truck: Truck) => {
    setEditingTruck(truck)
    setData({
      plate_number: truck.plate_number,
      driver_id: truck.driver?.id?.toString() || '',
      base_warehouse_id: truck.base_warehouse?.id?.toString() || '',
      active: truck.active,
      technical_revision_date: truck.technical_revision_date || '',
      circulation_permit_date: truck.circulation_permit_date || '',
      current_km: truck.current_km || '',
      next_maintenance_km: truck.next_maintenance_km || '',
      has_gps: truck.has_gps || false,
      mileage_update_frequency: truck.mileage_update_frequency || 'weekly'
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
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all hover:scale-105 active:scale-95 text-sm cursor-pointer"
          >
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Ver Mapa en Vivo
          </Link>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingTruck ? 'ring-2 ring-primary-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'} >
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingTruck 
                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
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
                    className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 font-mono uppercase text-sm"
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

                {/* Sección de Documentos y Mantenimiento */}
                <div className="pt-4 border-t border-[var(--sf-border)]">
                  <h3 className="text-sm font-bold text-[var(--sf-text-main)] mb-3">Documentos y Mantenimiento</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--sf-text-muted)] uppercase tracking-wider mb-1">Vencimiento Rev. Técnica</label>
                      <CustomDatePicker
                        value={data.technical_revision_date}
                        onChange={(val: string) => setData('technical_revision_date', val)}
                        placeholder="Seleccionar Fecha"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--sf-text-muted)] uppercase tracking-wider mb-1">Vencimiento Permiso y SOAP</label>
                      <CustomDatePicker
                        value={data.circulation_permit_date}
                        onChange={(val: string) => setData('circulation_permit_date', val)}
                        placeholder="Seleccionar Fecha"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--sf-text-muted)] uppercase tracking-wider mb-1">Kilometraje Actual</label>
                      <input
                        type="number"
                        value={data.current_km}
                        onChange={e => setData('current_km', e.target.value)}
                        placeholder="Ej: 150000"
                        className="w-full px-3 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] text-xs focus:ring-1 focus:ring-primary-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--sf-text-muted)] uppercase tracking-wider mb-1">Km Próx. Mantención</label>
                      <input
                        type="number"
                        value={data.next_maintenance_km}
                        onChange={e => setData('next_maintenance_km', e.target.value)}
                        placeholder="Ej: 160000"
                        className="w-full px-3 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] text-xs focus:ring-1 focus:ring-primary-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--sf-border)] space-y-4">
                  <CustomSwitch
                    checked={data.has_gps}
                    onChange={(checked) => setData('has_gps', checked)}
                    label="Tiene GPS Físico Integrado"
                    description="Si el camión tiene GPS, no se te pedirá actualizar el kilometraje manualmente."
                  />

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
                    className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="lg:col-span-2 flex flex-col gap-4">
            <TableFilters onApply={applyFilters} isLoading={isLoading}>
              <TableFilters.Search
                value={search}
                onChange={setSearch}
                onSearch={applyFilters}
                placeholder="Buscar patente o chofer (Nombre/RUT)..."
                className="w-full sm:flex-1 min-w-[250px]"
              />
              <TableFilters.Select
                value={warehouseId}
                onChange={setWarehouseId}
                options={[
                  { value: '', label: 'Todas las bodegas' },
                  ...base_warehouses.map(w => ({ value: w.id.toString(), label: w.name }))
                ]}
                placeholder="Todas las bodegas"
                className="w-full sm:w-[200px]"
              />
            </TableFilters>
            <Card className="overflow-hidden flex flex-col flex-1">
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
                        <Table.Tr key={truck.id} className={`${editingTruck?.id === truck.id ? 'bg-primary-500/5' : (!truck.active ? 'opacity-50 hover:bg-[var(--sf-bg)]/50' : 'hover:bg-[var(--sf-bg)]/50')} transition-colors`}>
                          
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

                              <button onClick={() => editTruck(truck)} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Editar">
                                <Pencil size={18} />
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

      {/* Modal de Actualización de Kilometraje Masiva */}
      <Modal show={isMileageModalOpen} onClose={() => setIsMileageModalOpen(false)} title="Actualización Rápida de Kilómetros" maxWidth="max-w-3xl">
        <div className="p-6 space-y-6">
          <p className="text-sm text-[var(--sf-text-muted)]">
            A continuación se listan los camiones activos que no poseen GPS físico y requieren actualización manual de kilometraje.
          </p>
          
          <div className="border border-[var(--sf-border)] rounded-xl overflow-hidden bg-[var(--sf-surface)]">
            
            {/* VISTA DESKTOP (Tabla) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--sf-surface)] border-b border-[var(--sf-border)]">
                  <tr>
                    <th className="px-4 py-3 font-medium text-[var(--sf-text-muted)]">Camión</th>
                    <th className="px-4 py-3 font-medium text-[var(--sf-text-muted)]">Chofer</th>
                    <th className="px-4 py-3 font-medium text-[var(--sf-text-muted)] text-center w-32">Km Registrado</th>
                    <th className="px-4 py-3 font-medium text-[var(--sf-text-muted)] w-48">Nuevo Km</th>
                    <th className="px-4 py-3 font-medium text-[var(--sf-text-muted)] w-16 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sf-border)]">
                  {pendingTrucks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--sf-text-muted)]">No hay camiones pendientes de actualización</td>
                    </tr>
                  ) : (
                    pendingTrucks.map((truck) => (
                      <tr key={truck.id} className="hover:bg-[var(--sf-surface)]/50">
                        <td className="px-4 py-3 font-mono font-bold tracking-widest">{formatPlate(truck.plate_number)}</td>
                        <td className="px-4 py-3 text-[var(--sf-text-main)]">{truck.driver_name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[var(--sf-text-main)] font-medium bg-[var(--sf-surface-hover)] px-3 py-1 rounded-lg">
                            {truck.current_km ? truck.current_km.toLocaleString('es-CL') : '0'}
                          </span>
                        </td>
                        <td className="px-4 py-3 relative">
                          <input
                            type="number"
                            value={mileageUpdates[truck.id] || ''}
                            onChange={(e) => setMileageUpdates({ ...mileageUpdates, [truck.id]: e.target.value })}
                            className={`w-full px-3 py-1.5 bg-[var(--sf-bg)] border rounded-lg text-sm focus:ring-1 focus:ring-primary-500/50 ${
                              mileageUpdates[truck.id] && Number(mileageUpdates[truck.id]) < (truck.current_km || 0)
                                ? 'border-red-500 text-red-500 bg-red-500/10'
                                : 'border-[var(--sf-border)] text-[var(--sf-text-main)]'
                            }`}
                            placeholder="Ej: 150000"
                          />
                          {mileageUpdates[truck.id] && Number(mileageUpdates[truck.id]) < (truck.current_km || 0) && (
                            <span className="absolute -bottom-0.5 left-4 text-[10px] text-red-500 whitespace-nowrap font-bold">Debe ser mayor al actual</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {truck.driver_phone ? (
                            <a
                              href={`https://wa.me/${truck.driver_phone.replace(/\+/g, '')}?text=${encodeURIComponent(`Hola ${truck.driver_name}, ¿me podrías confirmar el kilometraje actual del camión patente ${formatPlate(truck.plate_number)}?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Consultar por WhatsApp"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[var(--sf-text-muted)] italic">Sin Teléfono</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* VISTA MOBILE (Tarjetas) */}
            <div className="block sm:hidden divide-y divide-[var(--sf-border)]">
              {pendingTrucks.length === 0 ? (
                <div className="p-8 text-center text-[var(--sf-text-muted)] text-sm">No hay camiones pendientes</div>
              ) : (
                pendingTrucks.map((truck) => (
                  <div key={truck.id} className="p-4 space-y-4 hover:bg-[var(--sf-surface-hover)]/30 transition-colors">
                    {/* Header: Camión y Actual */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="font-mono font-bold tracking-widest text-lg text-[var(--sf-text-main)]">{formatPlate(truck.plate_number)}</div>
                        <div className="text-[var(--sf-text-muted)] text-sm mt-0.5">{truck.driver_name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)] font-bold mb-1">Actual</div>
                        <div className="text-[var(--sf-text-main)] font-bold bg-[var(--sf-surface-hover)] border border-[var(--sf-border)] px-2.5 py-1 rounded-lg text-sm inline-block shadow-sm">
                          {truck.current_km ? truck.current_km.toLocaleString('es-CL') : '0'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer: Input y Acción */}
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 relative">
                        <label className="block text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)] font-bold mb-1">Nuevo Kilometraje</label>
                        <input
                          type="number"
                          value={mileageUpdates[truck.id] || ''}
                          onChange={(e) => setMileageUpdates({ ...mileageUpdates, [truck.id]: e.target.value })}
                          className={`w-full px-4 py-2.5 bg-[var(--sf-bg)] border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/50 shadow-inner ${
                            mileageUpdates[truck.id] && Number(mileageUpdates[truck.id]) < (truck.current_km || 0)
                              ? 'border-red-500 text-red-500 bg-red-500/10'
                              : 'border-[var(--sf-border)] text-[var(--sf-text-main)]'
                          }`}
                          placeholder="Ingresa el km..."
                        />
                        {mileageUpdates[truck.id] && Number(mileageUpdates[truck.id]) < (truck.current_km || 0) && (
                          <span className="absolute -bottom-4 left-1 text-[10px] text-red-500 font-bold">¡Debe ser mayor al actual!</span>
                        )}
                      </div>
                      
                      {truck.driver_phone && (
                        <a
                          href={`https://wa.me/${truck.driver_phone.replace(/\+/g, '')}?text=${encodeURIComponent(`Hola ${truck.driver_name}, ¿me podrías confirmar el kilometraje actual del camión patente ${formatPlate(truck.plate_number)}?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-[42px] px-4 flex items-center justify-center bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl transition-colors shrink-0 shadow-sm"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--sf-border)]">
            <button
              type="button"
              onClick={() => setIsMileageModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-[var(--sf-text-main)] bg-[var(--sf-surface)] border border-[var(--sf-border)] hover:bg-[var(--sf-border)] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitMileageUpdates}
              disabled={pendingTrucks.length === 0 || pendingTrucks.some(t => mileageUpdates[t.id] && Number(mileageUpdates[t.id]) < (t.current_km || 0))}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Kilometrajes
            </button>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  )
}
