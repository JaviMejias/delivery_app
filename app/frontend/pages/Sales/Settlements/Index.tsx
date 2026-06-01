import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { ClipboardList } from 'lucide-react'

interface Truck {
  id: number
  plate_number: string
  driver?: { name: string }
}

interface RouteSettlement {
  id: number
  truck_id: number
  date: string
  total_revenue: string
  status: string
  truck: Truck
}

interface Props {
  settlements: RouteSettlement[]
  trucks: Truck[]
  pagination: any
  currentSearch?: string
}

// Formatea la patente
const formatPlate = (p: string) => {
  const c = p.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (c.length <= 2) return c
  if (c.length <= 4) return `${c.slice(0, 2)}-${c.slice(2)}`
  return `${c.slice(0, 2)}-${c.slice(2, 4)}-${c.slice(4, 6)}`
}

export default function SettlementsIndex({ settlements, trucks, pagination, currentSearch }: Props) {
  const { data, setData, post, processing, reset, errors } = useForm({
    truck_id: '',
    date: new Date().toISOString().split('T')[0]
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/sales/settlements', {
      onSuccess: () => {
        reset()
      }
    })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Rendiciones Diarias" />

      <div className="space-y-6">
        <PageHeader 
          title="Rendiciones de Ruta"
          icon={<ClipboardList className="w-8 h-8 opacity-80" />}
          description="Ingresa lo vendido, registra los medios de pago y rinde los envases vacíos."
          color="amber"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <Card className=" sticky top-6" >
              <Card.Body>
              <h2 className="font-semibold text-[var(--sf-text-main)] mb-4">Iniciar Rendición</h2>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">
                    ¿Qué camión rindes?
                  </label>
                  <CustomSelect
                    value={data.truck_id ? { value: data.truck_id, label: (() => {
                      const t = trucks.find(tr => tr.id.toString() === data.truck_id);
                      return t ? `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` : '';
                    })() } : null}
                    onChange={(val: any) => setData('truck_id', val?.value || '')}
                    options={trucks.map(t => ({ value: t.id.toString(), label: `${formatPlate(t.plate_number)} — ${t.driver ? `${t.driver.first_name} ${t.driver.last_name}` : 'Sin chofer'}` }))}
                    placeholder="Selecciona camión..."
                    required
                  />
                  {errors.truck_id && <p className="text-red-400 text-sm mt-1">{errors.truck_id}</p>}
                  {trucks.length === 0 && (
                    <p className="text-orange-400 text-xs mt-1">No hay camiones con inventario. Ve a Cargar Camión primero.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Fecha de Operación</label>
                  <CustomDatePicker
                    value={data.date}
                    onChange={(date) => setData('date', date)}
                  />
                  {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
                </div>
                
                <button
                  type="submit"
                  disabled={processing || !data.truck_id || !data.date}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 mt-2"
                >
                  Siguiente: Detalle de Ventas →
                </button>
              </form>
            </Card.Body>
          </Card>
          </div>

          {/* Lista */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center bg-[var(--sf-surface)] border border-[var(--sf-border)] p-4 rounded-xl mb-4">
              <SearchBar routeName="/sales/settlements" currentSearch={currentSearch || ""} placeholder="Buscar por patente o fecha..." />
            </div>
            <Card className="overflow-hidden ">
              <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Camión</Table.Th>
                      <Table.Th className="text-right">Monto Declarado</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {settlements.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                          No hay rendiciones registradas
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      settlements.map((s) => (
                        <Table.Tr key={s.id}>
                          <Table.Td className="font-mono font-medium text-[var(--sf-text-muted)]">{s.date}</Table.Td>
                          <Table.Td className="text-[var(--sf-text-main)]">
                            <div className="font-mono">{formatPlate(s.truck?.plate_number)}</div>
                            <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">{s.truck?.driver?.name}</div>
                          </Table.Td>
                          <Table.Td className="text-emerald-400 font-bold text-right">
                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(s.total_revenue))}
                          </Table.Td>
                          <Table.Td>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              s.status === 'draft' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {s.status === 'draft' ? 'Borrador' : 'Cerrada'}
                            </span>
                          </Table.Td>
                          <Table.Td className="text-right">
                            <Link href={`/sales/settlements/${s.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                              {s.status === 'draft' ? 'Completar →' : 'Ver →'}
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
