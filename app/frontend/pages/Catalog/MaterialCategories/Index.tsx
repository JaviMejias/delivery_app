import { useState, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { Folder, FolderTree, Pencil, Trash2, Save, X } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'

interface Category {
  id: number
  name: string
  active: boolean
}

interface Props {
  categories: Category[]
  pagination: any
  currentSearch?: string
}

export default function MaterialCategoriesIndex({ categories, pagination, currentSearch }: Props) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const form = useForm({
    name: '',
    active: true,
  })

  const editCategory = (category: Category) => {
    setEditingCategory(category)
    form.setData({ name: category.name, active: category.active })
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    form.reset()
    form.clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCategory) {
      form.patch(`/catalog/material-categories/${editingCategory.id}`, {
        onSuccess: () => {
          setEditingCategory(null)
          form.reset()
        },
      })
    } else {
      form.post(`/catalog/material-categories`, {
        onSuccess: () => {
          form.reset()
        },
      })
    }
  }

  const deleteCategory = (id: number) => {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--sf-dark-card)',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(`/catalog/material-categories/${id}`, {
          onSuccess: () => {
            if (editingCategory?.id === id) {
              cancelEdit()
            }
          }
        })
      }
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Categorías de Materiales" />

      <div className="space-y-6">
        <PageHeader 
          title="Categorías de Materiales"
          icon={<Folder className="w-8 h-8 opacity-80" />}
          description="Agrupa tus materiales base."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingCategory ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingCategory 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingCategory ? <Pencil className="w-5 h-5 shrink-0" /> : <FolderTree className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingCategory ? 'Editando Categoría' : 'Registrar Nueva Categoría'}
                    </h2>
                    {editingCategory && (
                      <p className="text-xs opacity-80 truncate">{editingCategory.name}</p>
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
                      className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50"
                      required
                      placeholder="Ej. Cilindros de Gas, Reguladores..."
                    />
                    {form.errors.name && <p className="mt-1 text-sm text-red-400">{form.errors.name}</p>}
                  </div>
                  <div className="pt-2">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Categoría Activa"
                      description="Habilita o deshabilita esta categoría en el sistema."
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingCategory ? 'Actualizar Categoría' : 'Guardar Categoría'}
                    </button>
                    {editingCategory && (
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
              <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)]">
                <SearchBar routeName="/catalog/material-categories" currentSearch={currentSearch || ""} placeholder="Buscar por nombre..." />
              </div>
              <div className="flex-1 overflow-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nombre de Categoría</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th className="text-right">Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {categories.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={3} className="py-12 text-center text-[var(--sf-text-muted)]">
                          No hay categorías registradas.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      categories.map((c) => (
                        <Table.Tr key={c.id} className={editingCategory?.id === c.id ? 'bg-indigo-500/5' : ''}>
                          <Table.Td className="text-[var(--sf-text-main)] font-medium">{c.name}</Table.Td>
                          <Table.Td>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              c.active 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {c.active ? 'Activa' : 'Inactiva'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => editCategory(c)} className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button onClick={() => deleteCategory(c.id)} className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
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
