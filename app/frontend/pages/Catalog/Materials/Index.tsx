import { useState, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { confirmDelete } from '@/utils/alerts'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { TableFilters } from '@/components/TableFilters'
import { CustomSelect } from '@/components/CustomSelect'
import { Package, Pencil, Trash2, Save, X } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'

interface Category {
  id: number
  name: string
  active: boolean
}

interface Material {
  id: number
  name: string
  unit: string
  measure: number | null
  active: boolean
  returnable: boolean
  material_category_id: number
  material_category: Category
}

interface Props {
  materials: Material[]
  categories: Category[]
  pagination: any
  currentSearch?: string
  currentCategory?: string
}

export default function MaterialsIndex({ materials, categories, pagination, currentSearch, currentCategory }: Props) {
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [search, setSearch] = useState(currentSearch || '')
  const [category, setCategory] = useState(currentCategory || 'all')
  const [isFiltering, setIsFiltering] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const applyFilters = () => {
    router.get('/catalog/materials', { search, category_id: category }, { 
      preserveState: true,
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false)
    })
  }

  const form = useForm({
    name: '',
    unit: 'UN',
    measure: '',
    material_category_id: '',
    active: true,
    returnable: true,
  })

  const editMaterial = (material: Material) => {
    setEditingMaterial(material)
    form.setData({
      name: material.name,
      unit: material.unit || 'UN',
      measure: material.measure ? material.measure.toString() : '',
      material_category_id: material.material_category_id.toString(),
      active: material.active,
      returnable: material.returnable,
    })

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingMaterial(null)
    form.reset()
    form.clearErrors()
    if (categories.length > 0) {
      form.setData('material_category_id', categories[0].id.toString())
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMaterial) {
      form.patch(`/catalog/materials/${editingMaterial.id}`, {
        onSuccess: () => {
          setEditingMaterial(null)
          form.reset()
          if (categories.length > 0) form.setData('material_category_id', categories[0].id.toString())
        },
      })
    } else {
      form.post(`/catalog/materials`, {
        onSuccess: () => {
          form.reset()
          if (categories.length > 0) form.setData('material_category_id', categories[0].id.toString())
        },
      })
    }
  }

  const deleteMaterial = (id: number) => {
    confirmDelete({
      title: '¿Eliminar material?',
      onConfirm: () => router.delete(`/catalog/materials/${id}`, {
        onSuccess: () => { if (editingMaterial?.id === id) cancelEdit() }
      })
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Materiales Base" />

      <div className="space-y-6">
        <PageHeader
          title="Catálogo de Materiales"
          icon={<Package className="w-8 h-8 opacity-80" />}
          description="Gestiona los materiales base de la empresa."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingMaterial ? 'ring-2 ring-primary-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${editingMaterial
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                  : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                  }`}>
                  {editingMaterial ? <Pencil className="w-5 h-5 shrink-0" /> : <Package className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingMaterial ? 'Editando Material' : 'Registrar Nuevo Material'}
                    </h2>
                    {editingMaterial && (
                      <p className="text-xs opacity-80 truncate">{editingMaterial.name}</p>
                    )}
                  </div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Categoría</label>
                    <CustomSelect
                      value={form.data.material_category_id ? { value: form.data.material_category_id, label: categories.find(c => c.id.toString() === form.data.material_category_id)?.name } : null}
                      onChange={(val: any) => form.setData('material_category_id', val?.value || '')}
                      options={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                      placeholder="Seleccionar categoría..."
                      required
                    />
                    {form.errors.material_category_id && <p className="mt-1 text-sm text-red-400">{form.errors.material_category_id}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Nombre del Envase/Accesorio</label>
                    <input
                      type="text"
                      value={form.data.name}
                      onChange={e => form.setData('name', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                      required
                      placeholder="Ej. Cilindro, Regulador, Bidón..."
                    />
                    {form.errors.name && <p className="mt-1 text-sm text-red-400">{form.errors.name}</p>}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Medida/Cantidad (Ej. 15, 5)</label>
                      <input
                        type="number"
                        value={form.data.measure}
                        onChange={e => form.setData('measure', e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50"
                        placeholder="Ej. 15"
                      />
                      {form.errors.measure && <p className="mt-1 text-sm text-red-400">{form.errors.measure}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Unidad</label>
                      <CustomSelect
                        value={{ value: form.data.unit, label: form.data.unit === 'UN' ? 'Unidades' : form.data.unit === 'KG' ? 'Kilos (KG)' : form.data.unit === 'LTS' ? 'Litros (LTS)' : 'Gramos (GR)' }}
                        onChange={(val: any) => form.setData('unit', val?.value || '')}
                        options={[
                          { value: 'UN', label: 'Unidades' },
                          { value: 'KG', label: 'Kilos (KG)' },
                          { value: 'LTS', label: 'Litros (LTS)' },
                          { value: 'GR', label: 'Gramos (GR)' }
                        ]}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-4">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Material Activo"
                      description="Habilita o deshabilita este material base en el sistema."
                    />

                    <CustomSwitch
                      checked={form.data.returnable}
                      onChange={(checked) => form.setData('returnable', checked)}
                      label="Es Retornable"
                      description="Indica si este material requiere devolución de envases vacíos."
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingMaterial ? 'Actualizar Material' : 'Guardar Material'}
                    </button>
                    {editingMaterial && (
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
              <TableFilters.Select
                value={category}
                onChange={setCategory}
                options={[
                  { value: 'all', label: 'Todas las categorías' },
                  ...categories.map(c => ({ value: c.id.toString(), label: c.name }))
                ]}
                className="w-full sm:w-64"
              />
            </TableFilters>
            <Card className="overflow-hidden flex flex-col h-full">
              <div className="flex-1 overflow-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nombre del Material</Table.Th>
                      <Table.Th className="hidden md:table-cell">Unidad</Table.Th>
                      <Table.Th className="hidden md:table-cell">Categoría</Table.Th>
                      <Table.Th className="whitespace-nowrap">Tipo</Table.Th>
                      <Table.Th className="whitespace-nowrap">Estado</Table.Th>
                      <Table.Th className="text-right">Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {materials.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay materiales registrados.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      materials.map((m) => (
                        <Table.Tr key={m.id} className={editingMaterial?.id === m.id ? 'bg-primary-500/5' : ''}>
                          <Table.Td className="text-[var(--sf-text-main)] font-medium">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span className="whitespace-nowrap">{m.name}</span>
                              {m.measure && <span className="text-xs text-[var(--sf-text-muted)] bg-[var(--sf-bg)] px-1.5 py-0.5 rounded border border-[var(--sf-border)] w-max whitespace-nowrap">{Number(m.measure)} {m.unit}</span>}
                              {/* Show category inline on mobile */}
                              <span className="md:hidden text-[10px] uppercase font-bold text-[var(--sf-text-muted)] truncate">{m.material_category?.name}</span>
                            </div>
                          </Table.Td>
                          <Table.Td className="text-[var(--sf-text-muted)] hidden md:table-cell">{m.unit}</Table.Td>
                          <Table.Td className="text-[var(--sf-text-muted)] hidden md:table-cell">
                            <span className="px-2.5 py-1 rounded-md bg-[var(--sf-bg)] border border-[var(--sf-border)] text-xs whitespace-nowrap">
                              {m.material_category?.name}
                            </span>
                          </Table.Td>
                          <Table.Td className="whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${m.returnable
                              ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                              : 'bg-[var(--sf-surface)] text-[var(--sf-text-muted)] border-[var(--sf-border)]'
                              }`}>
                              {m.returnable ? 'Retornable' : 'Desechable'}
                            </span>
                          </Table.Td>
                          <Table.Td className="whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${m.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                              {m.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => editMaterial(m)} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button onClick={() => deleteMaterial(m.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
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
