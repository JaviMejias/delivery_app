import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination, { PagyProps } from '@/components/Pagination'
import { Lock } from 'lucide-react'

interface LocalClosure {
  id: number
  date: string
  status: string
  system_total: string
  declared_total: string
  warehouse?: { name: string }
}

interface Props {
  closures: LocalClosure[]
  pagination: PagyProps
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
}

export default function LocalClosuresIndex({ closures, pagination }: Props) {
  return (
    <AuthenticatedLayout>
      <Head title="Cierres de Caja" />

      <div className="space-y-6">
        <PageHeader 
          title="Historial de Cierres de Caja"
          icon={<Lock className="w-8 h-8 opacity-80" />}
          description="Control y cuadratura diaria de las ventas en el local."
          color="indigo"
        >
          <div className="flex gap-3">
            <Link
              href="/sales/local/closures/new"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-lg shadow-indigo-500/25"
            >
              + Nuevo Cierre de Caja
            </Link>
          </div>
        </PageHeader>

        <Card className="overflow-hidden">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Local / Bodega</Table.Th>
                <Table.Th>Total Sistema</Table.Th>
                <Table.Th>Total Declarado</Table.Th>
                <Table.Th>Diferencia</Table.Th>
                <Table.Th className="text-right">Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {closures.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="px-6 py-12 text-center text-[var(--sf-text-muted)]">
                    No hay cierres de caja registrados.
                  </Table.Td>
                </Table.Tr>
              ) : (
                closures.map((closure) => {
                  const system = parseFloat(closure.system_total)
                  const declared = parseFloat(closure.declared_total)
                  const diff = declared - system

                  return (
                    <Table.Tr key={closure.id}>
                      <Table.Td className="font-mono text-[var(--sf-text-muted)]">#{closure.id}</Table.Td>
                      <Table.Td className="font-medium text-[var(--sf-text-main)]">
                        {new Date(closure.date + 'T12:00:00').toLocaleDateString()}
                      </Table.Td>
                      <Table.Td className="text-[var(--sf-text-main)]">{closure.warehouse?.name}</Table.Td>
                      <Table.Td className="text-indigo-400 font-medium">{formatCLP(system)}</Table.Td>
                      <Table.Td className="text-[var(--sf-text-main)] font-medium">{formatCLP(declared)}</Table.Td>
                      <Table.Td>
                        {diff === 0 ? (
                          <span className="text-emerald-400 font-medium">Cuadrado ✓</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-400 font-medium">+{formatCLP(diff)} (Sobrante)</span>
                        ) : (
                          <span className="text-red-400 font-medium">{formatCLP(diff)} (Faltante)</span>
                        )}
                      </Table.Td>
                      <Table.Td className="text-right">
                        <Link href={`/sales/local/closures/${closure.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                          Ver Detalle
                        </Link>
                      </Table.Td>
                    </Table.Tr>
                  )
                })
              )}
            </Table.Tbody>
          </Table>
          <div className="p-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)]">
            <Pagination pagination={pagination} />
          </div>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
