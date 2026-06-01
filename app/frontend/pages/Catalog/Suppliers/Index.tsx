import { useState, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { formatRut, formatPhone } from '@/utils/formatters'
import RutInput from '@/components/RutInput'
import PhoneInput from '@/components/PhoneInput'
import { Mail, Phone, Factory, Pencil, Trash2, Save, X, Users } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'

interface Supplier {
  id: number
  name: string
  rut: string
  contact_email: string
  contact_phone: string
  active: boolean
}

interface Props {
  suppliers: Supplier[]
  pagination: any
  currentSearch?: string
}

export default function SuppliersIndex({ suppliers, pagination, currentSearch }: Props) {
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const form = useForm({
    name: '',
    rut: '',
    contact_email: '',
    contact_phone: '',
    active: true,
  })

  const editSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    form.setData({
      name: supplier.name,
      rut: supplier.rut || '',
      contact_email: supplier.contact_email || '',
      contact_phone: supplier.contact_phone || '',
      active: supplier.active,
    })

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingSupplier(null)
    form.reset()
    form.clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSupplier) {
      form.patch(`/catalog/suppliers/${editingSupplier.id}`, {
        onSuccess: () => cancelEdit(),
      })
    } else {
      form.post(`/catalog/suppliers`, {
        onSuccess: () => cancelEdit(),
      })
    }
  }

  const deleteSupplier = (id: number) => {
    Swal.fire({
      title: '¿Eliminar proveedor?',
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
        router.delete(`/catalog/suppliers/${id}`, {
          onSuccess: () => {
            if (editingSupplier?.id === id) {
              cancelEdit()
            }
          }
        })
      }
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Proveedores" />

      <div className="space-y-6">
        <PageHeader 
          icon={<Factory className="w-8 h-8 opacity-80" />}
          title="Proveedores"
          description="Gestiona las empresas que proveen tus productos."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingSupplier ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingSupplier 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingSupplier ? <Pencil className="w-5 h-5 shrink-0" /> : <Users className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingSupplier ? 'Editando Proveedor' : 'Registrar Nuevo Proveedor'}
                    </h2>
                    {editingSupplier && (
                      <p className="text-xs opacity-80 truncate">{editingSupplier.name}</p>
                    )}
                  </div>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Nombre / Razón Social</label>
                    <input
                      type="text"
                      value={form.data.name}
                      onChange={e => form.setData('name', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                    {form.errors.name && <p className="mt-1 text-sm text-red-400">{form.errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">RUT</label>
                    <RutInput
                      value={form.data.rut}
                      onValueChange={(val) => form.setData('rut', val)}
                    />
                    {form.errors.rut && <p className="mt-1 text-sm text-red-400">{form.errors.rut}</p>}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Email</label>
                      <input
                        type="email"
                        value={form.data.contact_email}
                        onChange={e => form.setData('contact_email', e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Teléfono</label>
                      <PhoneInput
                        value={form.data.contact_phone}
                        onValueChange={(val) => form.setData('contact_phone', val)}
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Proveedor Activo"
                      description="Determina si este proveedor aparecerá en las opciones de compras."
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingSupplier ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
                    </button>
                    {editingSupplier && (
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
                <SearchBar routeName="/catalog/suppliers" currentSearch={currentSearch || ""} placeholder="Buscar por nombre o RUT..." />
              </div>
              <div className="flex-1 overflow-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nombre / Razón Social</Table.Th>
                      <Table.Th>RUT</Table.Th>
                      <Table.Th>Contacto</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th className="text-right">Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {suppliers.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay proveedores registrados.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      suppliers.map((s) => (
                        <Table.Tr key={s.id} className={editingSupplier?.id === s.id ? 'bg-indigo-500/5' : ''}>
                          <Table.Td className="text-[var(--sf-text-main)] font-medium">{s.name}</Table.Td>
                          <Table.Td className="text-[var(--sf-text-muted)]">{s.rut || '-'}</Table.Td>
                          <Table.Td>
                            <div className="text-[var(--sf-text-muted)] text-xs">
                              {s.contact_email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {s.contact_email}</div>}
                              {s.contact_phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {formatPhone(s.contact_phone)}</div>}
                              {!s.contact_email && !s.contact_phone && '-'}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              s.active 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {s.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => editSupplier(s)} className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button onClick={() => deleteSupplier(s.id)} className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 transition-colors">
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
