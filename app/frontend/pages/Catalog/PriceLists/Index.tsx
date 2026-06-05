import { useState, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { confirmDelete } from '@/utils/alerts'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { FileText, Pencil, Trash2, Save, X } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'
import { TableFilters } from '@/components/TableFilters'

interface PriceList {
  id: number
  name: string
  code: string | null
  active: boolean
  available_for_trucks: boolean
  available_for_local: boolean
}

interface Props {
  priceLists: PriceList[]
  pagination: any
  currentSearch?: string
}

export default function PriceListsIndex({ priceLists, pagination, currentSearch }: Props) {
  const [editingList, setEditingList] = useState<PriceList | null>(null)
  const [search, setSearch] = useState(currentSearch || '')
  const [isFiltering, setIsFiltering] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const applyFilters = () => {
    router.get('/catalog/price-lists', { search }, { 
      preserveState: true,
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false)
    })
  }

  const form = useForm({
    name: '',
    active: true,
    available_for_trucks: false,
    available_for_local: false
  })

  const editList = (list: PriceList) => {
    setEditingList(list)
    form.setData({
      name: list.name,
      active: list.active,
      available_for_trucks: list.available_for_trucks || false,
      available_for_local: list.available_for_local || false
    })

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingList(null)
    form.reset()
    form.clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingList) {
      form.patch(`/catalog/price-lists/${editingList.id}`, {
        onSuccess: () => cancelEdit(),
      })
    } else {
      form.post(`/catalog/price-lists`, {
        onSuccess: () => cancelEdit(),
      })
    }
  }

  const deleteList = (id: number) => {
    confirmDelete({
      title: '¿Eliminar lista de precios?',
      text: 'Si eliminas la lista, se perderán los precios asociados a ella en todos los productos.',
      onConfirm: () => router.delete(`/catalog/price-lists/${id}`, {
        onSuccess: () => { if (editingList?.id === id) cancelEdit() }
      })
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Listas de Precios" />

      <div className="space-y-6">
        <PageHeader 
          icon={<FileText className="w-8 h-8 opacity-80" />}
          title="Listas de Precios"
          description="Administra los diferentes canales de venta y precios para tus productos."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingList ? 'ring-2 ring-primary-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingList 
                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingList ? <Pencil className="w-5 h-5 shrink-0" /> : <FileText className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingList ? 'Editando Lista' : 'Crear Nueva Lista'}
                    </h2>
                    {editingList && (
                      <p className="text-xs opacity-80 truncate">{editingList.name}</p>
                    )}
                  </div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Nombre de la Lista</label>
                    <input
                      type="text"
                      value={form.data.name}
                      onChange={e => form.setData('name', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                      required
                      placeholder="Ej. Supermercados"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-[var(--sf-border)]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--sf-text-muted)] mb-3">Módulos Permitidos</h3>
                    <div className="space-y-4">
                      <CustomSwitch
                        checked={form.data.available_for_trucks}
                        onChange={(checked) => form.setData('available_for_trucks', checked)}
                        label="Rendición de Camiones"
                        description="Permite que los choferes usen esta lista de precios al rendir ventas."
                      />
                      <CustomSwitch
                        checked={form.data.available_for_local}
                        onChange={(checked) => form.setData('available_for_local', checked)}
                        label="Ventas en Local"
                        description="Habilita esta lista en el Punto de Venta del local."
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--sf-border)]">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Lista Activa"
                      description="Habilita o deshabilita esta lista de precios globalmente."
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingList ? 'Actualizar Lista' : 'Crear Lista'}
                    </button>
                    {editingList && (
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
                      <Table.Th>Nombre de Lista</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th className="text-right">Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {priceLists.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={3} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay listas registradas.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      priceLists.map((l) => (
                        <Table.Tr key={l.id} className={editingList?.id === l.id ? 'bg-primary-500/5' : ''}>
                          <Table.Td className="font-medium text-[var(--sf-text-main)] flex items-center gap-2">
                            {l.name}
                            {l.code && (
                              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest rounded bg-[var(--sf-surface)] border border-[var(--sf-border)] text-[var(--sf-text-muted)]">
                                Defecto
                              </span>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              l.active 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {l.active ? 'Activa' : 'Inactiva'}
                            </span>
                            <div className="flex gap-1.5 mt-2">
                              {l.available_for_trucks && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">Camiones</span>}
                              {l.available_for_local && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Local</span>}
                            </div>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => editList(l)} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button onClick={() => deleteList(l.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
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
