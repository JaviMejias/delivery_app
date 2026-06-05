import { useState, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { Building2, Pencil, Trash2, Save, X } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'
import { confirmDelete } from '@/utils/alerts'

interface Warehouse {
  id: number
  name: string
  active: boolean
  card_surcharge_type: string
  card_surcharge_amount: number
  address?: string
  latitude?: string
  longitude?: string
}

interface Props {
  warehouses: Warehouse[]
  pagination: any
  currentSearch?: string
}

export default function WarehousesIndex({ warehouses, pagination, currentSearch }: Props) {
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [search, setSearch] = useState(currentSearch || '')
  const [isFiltering, setIsFiltering] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const applyFilters = () => {
    router.get('/inventory/warehouses', { search }, { 
      preserveState: true,
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false)
    })
  }

  const form = useForm({
    name: '',
    active: true,
    card_surcharge_type: 'fixed',
    card_surcharge_amount: '0',
    address: '',
    latitude: '',
    longitude: '',
  })

  const editWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    form.setData({ 
      name: warehouse.name, 
      active: warehouse.active,
      card_surcharge_type: warehouse.card_surcharge_type || 'fixed',
      card_surcharge_amount: (warehouse.card_surcharge_amount || 0).toString(),
      address: warehouse.address || '',
      latitude: warehouse.latitude || '',
      longitude: warehouse.longitude || ''
    })

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingWarehouse(null)
    form.reset()
    form.clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingWarehouse) {
      form.patch(`/inventory/warehouses/${editingWarehouse.id}`, {
        onSuccess: () => cancelEdit(),
      })
    } else {
      form.post(`/inventory/warehouses`, {
        onSuccess: () => cancelEdit(),
      })
    }
  }

  const deleteWarehouse = (id: number) => {
    confirmDelete({
      title: '¿Eliminar bodega?',
      onConfirm: () => router.delete(`/inventory/warehouses/${id}`, {
        onSuccess: () => { if (editingWarehouse?.id === id) { cancelEdit() } }
      })
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Bodegas" />

      <div className="space-y-6">
        <PageHeader 
          icon={<Building2 className="w-8 h-8 opacity-80" />}
          title="Bodegas (Warehouses)"
          description="Gestiona tus puntos físicos de almacenamiento de stock."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingWarehouse ? 'ring-2 ring-primary-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingWarehouse 
                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingWarehouse ? <Pencil className="w-5 h-5 shrink-0" /> : <Building2 className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingWarehouse ? 'Editando Bodega' : 'Registrar Nueva Bodega'}
                    </h2>
                    {editingWarehouse && (
                      <p className="text-xs opacity-80 truncate">{editingWarehouse.name}</p>
                    )}
                  </div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Nombre</label>
                    <input
                      type="text"
                      value={form.data.name}
                      onChange={e => form.setData('name', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Dirección Física</label>
                    <input
                      type="text"
                      value={form.data.address}
                      onChange={e => form.setData('address', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                      placeholder="Ej: Av. Providencia 1234"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Latitud</label>
                      <input
                        type="text"
                        value={form.data.latitude}
                        onChange={e => form.setData('latitude', e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                        placeholder="Ej: -33.4489"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Longitud</label>
                      <input
                        type="text"
                        value={form.data.longitude}
                        onChange={e => form.setData('longitude', e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                        placeholder="Ej: -70.6693"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Bodega Activa"
                      description="Determina si esta bodega está operativa."
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-[var(--sf-border)]">
                    <h3 className="text-sm font-semibold text-[var(--sf-text-main)] mb-3">Recargo por Tarjeta</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1">Tipo de Recargo</label>
                        <select
                          value={form.data.card_surcharge_type}
                          onChange={e => form.setData('card_surcharge_type', e.target.value)}
                          className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                        >
                          <option value="fixed">Monto Fijo ($)</option>
                          <option value="percentage">Porcentaje (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1">Monto / Porcentaje</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.data.card_surcharge_amount}
                          onChange={e => form.setData('card_surcharge_amount', e.target.value)}
                          className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                          placeholder={form.data.card_surcharge_type === 'percentage' ? 'Ej: 2.9' : 'Ej: 300'}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingWarehouse ? 'Actualizar Bodega' : 'Guardar Bodega'}
                    </button>
                    {editingWarehouse && (
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
            <TableFilters onApply={applyFilters} isLoading={isFiltering}>
              <TableFilters.Search
                value={search}
                onChange={setSearch}
                onSearch={applyFilters}
                placeholder="Buscar por nombre..."
                className="w-full sm:w-96"
              />
            </TableFilters>
            <Card className="overflow-hidden flex flex-col h-full">
              <div className="flex-1 overflow-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nombre</Table.Th>
                      <Table.Th>Dirección</Table.Th>
                      <Table.Th>Recargo Tarjeta</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th className="text-right">Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {warehouses.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay bodegas registradas.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      warehouses.map((w) => (
                        <Table.Tr key={w.id} className={editingWarehouse?.id === w.id ? 'bg-primary-500/5' : ''}>
                          <Table.Td className="text-[var(--sf-text-main)] font-medium">{w.name}</Table.Td>
                          <Table.Td className="min-w-[300px]">
                            {w.address ? (
                              <div className="flex flex-col">
                                <span className="text-[var(--sf-text-main)] text-sm">{w.address}</span>
                                {(w.latitude && w.longitude) && (
                                  <span className="text-xs text-[var(--sf-text-muted)] font-mono">{w.latitude}, {w.longitude}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[var(--sf-text-muted)] italic text-sm">Sin dirección</span>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {(!w.card_surcharge_amount || parseFloat(w.card_surcharge_amount.toString()) === 0) ? (
                              <span className="text-[var(--sf-text-muted)] text-sm">Sin recargo</span>
                            ) : (
                              <span className="text-primary-400 font-medium text-sm">
                                {w.card_surcharge_type === 'percentage' 
                                  ? `+${w.card_surcharge_amount}%` 
                                  : `+$${w.card_surcharge_amount}`}
                              </span>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              w.active 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {w.active ? 'Activa' : 'Inactiva'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => editWarehouse(w)} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button onClick={() => deleteWarehouse(w.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
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
