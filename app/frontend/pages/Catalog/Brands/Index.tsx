import { useState, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { confirmDelete } from '@/utils/alerts'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { Tag, Pencil, Trash2, Save, X } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'

interface Brand {
  id: number
  name: string
  active: boolean
  logo_url?: string
}

interface Props {
  brands: Brand[]
  pagination: any
  currentSearch?: string
}

export default function BrandsIndex({ brands, pagination, currentSearch }: Props) {
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState(currentSearch || '')
  const [isFiltering, setIsFiltering] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const applyFilters = () => {
    router.get('/catalog/brands', { search }, { 
      preserveState: true,
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false)
    })
  }

  const form = useForm({
    name: '',
    active: true,
    logo: null as File | null
  })

  const editBrand = (brand: Brand) => {
    setEditingBrand(brand)
    form.setData({ name: brand.name, active: brand.active, logo: null })

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingBrand(null)
    form.reset()
    form.clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingBrand) {
      form.patch(`/catalog/brands/${editingBrand.id}`, {
        onSuccess: () => {
          setEditingBrand(null)
          form.reset()
        },
      })
    } else {
      form.post(`/catalog/brands`, {
        onSuccess: () => {
          form.reset()
        },
      })
    }
  }

  const deleteBrand = (id: number) => {
    confirmDelete({
      title: '¿Eliminar marca?',
      onConfirm: () => router.delete(`/catalog/brands/${id}`, {
        onSuccess: () => { if (editingBrand?.id === id) cancelEdit() }
      })
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Marcas" />

      <div className="space-y-6">
        <PageHeader 
          icon={<Tag className="w-8 h-8 opacity-80" />}
          title="Marcas"
          description="Gestiona las marcas de los productos."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingBrand ? 'ring-2 ring-primary-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingBrand 
                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingBrand ? <Pencil className="w-5 h-5 shrink-0" /> : <Tag className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingBrand ? 'Editando Marca' : 'Registrar Nueva Marca'}
                    </h2>
                    {editingBrand && (
                      <p className="text-xs opacity-80 truncate">{editingBrand.name}</p>
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
                    {form.errors.name && <p className="mt-1 text-sm text-red-400">{form.errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Logo de la Marca (Opcional)</label>
                    {editingBrand?.logo_url && !form.data.logo && (
                      <div className="mb-2">
                        <img src={editingBrand.logo_url} alt={editingBrand.name} className="h-12 w-auto object-contain bg-white rounded p-1" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => form.setData('logo', e.target.files ? e.target.files[0] : null)}
                      className="w-full text-sm text-[var(--sf-text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20"
                    />
                  </div>
                  <div className="pt-2">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Marca Activa"
                      description="Habilita o deshabilita esta marca en el sistema."
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingBrand ? 'Actualizar Marca' : 'Guardar Marca'}
                    </button>
                    {editingBrand && (
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
                      <Table.Th>Nombre de la Marca</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th className="text-right">Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {brands.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={3} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay marcas registradas.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      brands.map((b) => (
                        <Table.Tr key={b.id} className={editingBrand?.id === b.id ? 'bg-primary-500/5' : ''}>
                          <Table.Td className="text-[var(--sf-text-main)] font-medium">
                            <div className="flex items-center gap-3">
                              {b.logo_url ? (
                                <img src={b.logo_url} alt={b.name} className="w-8 h-8 rounded-md bg-white object-contain p-1" />
                              ) : (
                                <div className="w-8 h-8 rounded-md bg-[var(--sf-bg)] border border-[var(--sf-border)] flex items-center justify-center">
                                  <Tag className="w-4 h-4 text-[var(--sf-text-muted)]" />
                                </div>
                              )}
                              <span>{b.name}</span>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              b.active 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {b.active ? 'Activa' : 'Inactiva'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => editBrand(b)} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button onClick={() => deleteBrand(b.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
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
