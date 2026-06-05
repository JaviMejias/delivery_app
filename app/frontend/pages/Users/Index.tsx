import { useState, useRef } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { confirmDelete } from '@/utils/alerts'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { Users, Pencil, Trash2, Save, X, Shield, Lock, Phone } from 'lucide-react'
import { TableFilters } from '@/components/TableFilters'
import { CustomSwitch } from '@/components/CustomSwitch'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import RutInput from '@/components/RutInput'
import PhoneInput from '@/components/PhoneInput'
import { formatPhone } from '@/utils/formatters'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  active: boolean
  rut?: string
  phone?: string
  license_type?: string
  license_expiration?: string
  birthday?: string
  warehouse_id?: number | ''
}

interface Warehouse {
  id: number
  name: string
}

interface Props {
  users: User[]
  warehouses: Warehouse[]
  pagination: any
  currentRole?: string
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'warehouse_keeper', label: 'Bodeguero' },
  { value: 'cashier', label: 'Cajero / Vendedor' },
  { value: 'driver', label: 'Chofer' }
]

const TAB_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Administradores' },
  { value: 'warehouse_keeper', label: 'Bodegueros' },
  { value: 'cashier', label: 'Cajeros' },
  { value: 'driver', label: 'Choferes' }
]

export default function UsersIndex({ users, warehouses, pagination, currentRole }: Props) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [role, setRole] = useState(currentRole || 'all')
  const [isFiltering, setIsFiltering] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const applyFilters = () => {
    router.get('/users', { role }, { 
      preserveState: true,
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false)
    })
  }

  const form = useForm({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'warehouse_keeper',
    warehouse_id: '' as number | '',
    active: true,
    rut: '',
    phone: '',
    license_type: '',
    license_expiration: '',
    birthday: ''
  })

  const editUser = (user: User) => {
    setEditingUser(user)
    form.setData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      warehouse_id: user.warehouse_id || '',
      active: user.active,
      rut: user.rut || '',
      phone: user.phone || '',
      license_type: user.license_type || '',
      license_expiration: user.license_expiration || '',
      birthday: user.birthday || ''
    })

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    form.reset()
    form.clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      form.patch(`/users/${editingUser.id}`, {
        onSuccess: () => cancelEdit(),
      })
    } else {
      form.post(`/users`, {
        onSuccess: () => cancelEdit(),
      })
    }
  }

  const disableUser = (id: number) => {
    confirmDelete({
      title: '¿Desactivar usuario?',
      text: 'El usuario ya no podrá iniciar sesión en el sistema.',
      confirmButtonText: 'Sí, desactivar',
      onConfirm: () => router.delete(`/users/${id}`, {
        onSuccess: () => { if (editingUser?.id === id) cancelEdit() }
      })
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Usuarios del Sistema" />

      <div className="space-y-6">
        <PageHeader 
          icon={<Users className="w-8 h-8 opacity-80" />}
          title="Usuarios del Sistema"
          description="Administra los empleados que tienen acceso a esta empresa."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1" ref={formRef}>
            <Card className={editingUser ? 'ring-2 ring-primary-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
              <Card.Body>
                <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
                  editingUser 
                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-400' 
                    : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
                }`}>
                  {editingUser ? <Pencil className="w-5 h-5 shrink-0" /> : <Users className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate">
                      {editingUser ? 'Editando Usuario' : 'Crear Nuevo Usuario'}
                    </h2>
                    {editingUser && (
                      <p className="text-xs opacity-80 truncate">{editingUser.first_name} {editingUser.last_name}</p>
                    )}
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-4" autoComplete="off">
                  {/* Hack agresivo para navegadores que ignoran autoComplete="off" como Firefox/Chrome */}
                  <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
                    <input type="text" name="fake_email_prevent_autocomplete" tabIndex={-1} autoComplete="username" />
                    <input type="password" name="fake_password_prevent_autocomplete" tabIndex={-1} autoComplete="current-password" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Nombre</label>
                      <input
                        type="text"
                        value={form.data.first_name}
                        onChange={e => form.setData('first_name', e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                        required
                        placeholder="Ej. Juan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Apellido</label>
                      <input
                        type="text"
                        value={form.data.last_name}
                        onChange={e => form.setData('last_name', e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                        required
                        placeholder="Ej. Pérez"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">
                        RUT {form.data.role === 'driver' && <span className="text-red-400">*</span>}
                      </label>
                      <RutInput
                        value={form.data.rut}
                        onValueChange={(val) => form.setData('rut', val)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Teléfono</label>
                      <PhoneInput
                        value={form.data.phone}
                        onValueChange={(val) => form.setData('phone', val)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">
                        Correo (Login) {form.data.role === 'driver' && <span className="text-primary-400 normal-case ml-2">(Se auto-generará si se deja en blanco)</span>}
                      </label>
                      <input
                        type="email"
                        value={form.data.email}
                        onChange={e => form.setData('email', e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 transition-shadow"
                        required={form.data.role !== 'driver'}
                        placeholder={form.data.role === 'driver' ? "Se genera automáticamente con el RUT" : "ejemplo@empresa.com"}
                        autoComplete="off"
                        name="email_autocomplete_off"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Fecha de Nacimiento</label>
                      <CustomDatePicker
                        value={form.data.birthday}
                        onChange={(date) => form.setData('birthday', date)}
                        maxDate="today"
                        defaultViewDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Rol en Sistema</label>
                      <CustomSelect
                        value={ROLE_OPTIONS.find(r => r.value === form.data.role) || null}
                        onChange={(val: any) => form.setData('role', val?.value || '')}
                        options={ROLE_OPTIONS}
                        placeholder="Selecciona un rol"
                        required
                      />
                    </div>
                    {['warehouse_keeper', 'cashier'].includes(form.data.role) && (
                      <div>
                        <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Bodega Asignada</label>
                        <CustomSelect
                          value={form.data.warehouse_id ? { value: form.data.warehouse_id.toString(), label: warehouses.find(w => w.id === form.data.warehouse_id)?.name } : null}
                          onChange={(val: any) => form.setData('warehouse_id', val ? parseInt(val.value) : '')}
                          options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                          placeholder="Selecciona bodega"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {form.data.role === 'driver' && (
                    <div className="flex flex-col gap-4 animate-fade-in bg-orange-500/5 p-3 rounded-xl border border-orange-500/20">
                      <div>
                        <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Tipo Licencia</label>
                        <input
                          type="text"
                          value={form.data.license_type}
                          onChange={e => form.setData('license_type', e.target.value.toUpperCase())}
                          className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-orange-500/50 transition-shadow uppercase"
                          placeholder="Ej. A4"
                        />
                      </div>
                      <div>
                        <div className="flex flex-col mb-2">
                          <label className="text-xs font-medium text-[var(--sf-text-muted)] uppercase tracking-wider mb-1">Año de Vencimiento</label>
                          {form.data.birthday && (
                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg font-medium w-fit">
                              Día/Mes automático: {form.data.birthday.split('-')[2]}/{form.data.birthday.split('-')[1]}
                            </span>
                          )}
                        </div>
                        {!form.data.birthday ? (
                          <div className="text-sm text-red-400 p-2 bg-red-400/10 rounded-xl border border-red-400/20">
                            Debes ingresar la fecha de nacimiento primero.
                          </div>
                        ) : (
                          <CustomSelect
                            value={
                              Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => ({ value: y.toString(), label: y.toString() }))
                                .find(y => form.data.license_expiration?.startsWith(y.value)) || null
                            }
                            onChange={(val: any) => {
                              if (val && form.data.birthday) {
                                const [, month, day] = form.data.birthday.split('-')
                                form.setData('license_expiration', `${val.value}-${month}-${day}`)
                              } else {
                                form.setData('license_expiration', '')
                              }
                            }}
                            options={Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => ({ value: y.toString(), label: y.toString() }))}
                            placeholder="Seleccionar año..."
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--sf-border)]">
                    <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Contraseña {editingUser && '(Opcional)'}
                    </label>
                    <input
                      type="password"
                      value={form.data.password}
                      onChange={e => form.setData('password', e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 transition-shadow mb-1"
                      required={!editingUser && form.data.role !== 'driver'}
                      placeholder={editingUser ? "Dejar en blanco para no cambiar la contraseña" : form.data.role === 'driver' ? "Se genera aleatoriamente si está en blanco" : "Mínimo 6 caracteres"}
                      minLength={6}
                      autoComplete="new-password"
                    />
                    {editingUser && (
                      <p className="text-[10px] text-[var(--sf-text-muted)]">
                        * Si no escribes nada, la contraseña seguirá siendo la misma.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[var(--sf-border)]">
                    <CustomSwitch
                      checked={form.data.active}
                      onChange={(checked) => form.setData('active', checked)}
                      label="Usuario Activo"
                      description="Permite que el usuario inicie sesión."
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                    </button>
                    {editingUser && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="w-full mt-2 py-2.5 bg-[var(--sf-surface)] border border-[var(--sf-border)] hover:bg-[var(--sf-border)] text-[var(--sf-text-main)] font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </Card.Body>
            </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <TableFilters onApply={applyFilters} isLoading={isFiltering}>
              <TableFilters.Select
                label="Rol"
                value={role}
                onChange={setRole}
                options={TAB_OPTIONS}
              />
            </TableFilters>
            <Card className="overflow-hidden flex flex-col h-full">
              <div className="flex-1 overflow-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Usuario</Table.Th>
                      <Table.Th>Rol</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th className="text-right">Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay usuarios registrados.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      users.map((u) => {
                        const roleObj = ROLE_OPTIONS.find(r => r.value === u.role)
                        return (
                          <Table.Tr key={u.id} className={`${!u.active ? 'opacity-60 bg-[var(--sf-bg)]' : ''} ${editingUser?.id === u.id ? 'bg-primary-500/5' : ''}`}>
                            <Table.Td>
                              <div className="font-medium text-[var(--sf-text-main)]">{u.first_name} {u.last_name}</div>
                              <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                                {u.rut && <span className="mr-2">RUT: {u.rut}</span>}
                                {u.email}
                              </div>
                            </Table.Td>
                            <Table.Td>
                              <div className="flex items-center gap-1.5 text-sm">
                                {u.role === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                                {roleObj?.label || u.role}
                              </div>
                              {u.warehouse_id && (
                                <div className="text-xs text-primary-400 mt-1 font-medium bg-primary-500/10 px-1.5 py-0.5 rounded inline-block">
                                  🏢 {warehouses.find(w => w.id === u.warehouse_id)?.name}
                                </div>
                              )}
                              {u.role === 'driver' && u.license_type && (
                                <div className="text-xs text-orange-400 mt-1 font-medium bg-orange-500/10 px-1.5 py-0.5 rounded inline-block">
                                  Licencia {u.license_type}
                                </div>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                u.active 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {u.active ? 'Activo' : 'Inactivo'}
                              </span>
                            </Table.Td>
                            <Table.Td className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => editUser(u)} className="p-2 text-[var(--sf-text-muted)] hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors" title="Editar">
                                  <Pencil size={18} />
                                </button>
                                {u.active && (
                                  <button onClick={() => disableUser(u.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Desactivar">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </Table.Td>
                          </Table.Tr>
                        )
                      })
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
