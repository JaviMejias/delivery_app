import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import BackButton from '@/components/BackButton'
import { FileText } from 'lucide-react'

interface LocalClosure {
  id: number
  date: string
  status: string
  system_cash: string
  system_card: string
  system_transfer: string
  system_total: string
  declared_cash: string
  declared_card: string
  declared_transfer: string
  declared_total: string
  observations: string
  created_at: string
  warehouse?: { name: string }
}

interface Props {
  closure: LocalClosure
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
}

export default function LocalClosureShow({ closure }: Props) {
  const getDiffColor = (systemStr: string, declaredStr: string) => {
    const diff = parseFloat(declaredStr) - parseFloat(systemStr)
    if (diff === 0) return 'text-emerald-400'
    if (diff > 0) return 'text-emerald-400'
    return 'text-red-400'
  }

  const getDiffText = (systemStr: string, declaredStr: string) => {
    const diff = parseFloat(declaredStr) - parseFloat(systemStr)
    if (diff === 0) return 'Cuadrado'
    if (diff > 0) return `+${formatCLP(diff)} (Sobrante)`
    return `${formatCLP(diff)} (Faltante)`
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Cierre #${closure.id}`} />

      <div className="space-y-6">
        <PageHeader 
          title={`Cierre de Caja #${closure.id}`}
          icon={<FileText className="w-8 h-8 opacity-80" />}
          description={`Realizado el ${new Date(closure.created_at).toLocaleString()}`}
          color="indigo"
        >
          <BackButton href="/sales/local/closures" />
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-bg)] flex justify-between items-center">
                <h2 className="font-semibold text-[var(--sf-text-main)]">Detalle de Valores</h2>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase">
                  Cerrado ✓
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th className="w-1/3">Método</Table.Th>
                      <Table.Th className="text-right">Sistema</Table.Th>
                      <Table.Th className="text-right">Declarado</Table.Th>
                      <Table.Th className="text-right">Diferencia</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td className="font-medium text-[var(--sf-text-main)]">💵 Efectivo</Table.Td>
                      <Table.Td className="text-right text-[var(--sf-text-muted)] font-mono">{formatCLP(closure.system_cash)}</Table.Td>
                      <Table.Td className="text-right text-[var(--sf-text-main)] font-bold">{formatCLP(closure.declared_cash)}</Table.Td>
                      <Table.Td className={`text-right font-bold ${getDiffColor(closure.system_cash, closure.declared_cash)}`}>
                        {getDiffText(closure.system_cash, closure.declared_cash)}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td className="font-medium text-[var(--sf-text-main)]">💳 Tarjeta</Table.Td>
                      <Table.Td className="text-right text-[var(--sf-text-muted)] font-mono">{formatCLP(closure.system_card)}</Table.Td>
                      <Table.Td className="text-right text-[var(--sf-text-main)] font-bold">{formatCLP(closure.declared_card)}</Table.Td>
                      <Table.Td className={`text-right font-bold ${getDiffColor(closure.system_card, closure.declared_card)}`}>
                        {getDiffText(closure.system_card, closure.declared_card)}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td className="font-medium text-[var(--sf-text-main)]">🏦 Transferencia</Table.Td>
                      <Table.Td className="text-right text-[var(--sf-text-muted)] font-mono">{formatCLP(closure.system_transfer)}</Table.Td>
                      <Table.Td className="text-right text-[var(--sf-text-main)] font-bold">{formatCLP(closure.declared_transfer)}</Table.Td>
                      <Table.Td className={`text-right font-bold ${getDiffColor(closure.system_transfer, closure.declared_transfer)}`}>
                        {getDiffText(closure.system_transfer, closure.declared_transfer)}
                      </Table.Td>
                    </Table.Tr>
                    
                    <tr className="bg-primary-500/5 border-t-2 border-primary-500/20">
                      <td className="px-6 py-4 font-bold text-primary-400 text-right uppercase text-sm">TOTAL</td>
                      <td className="px-6 py-4 text-right text-primary-400 font-bold text-lg">{formatCLP(closure.system_total)}</td>
                      <td className="px-6 py-4 text-right text-primary-400 font-black text-lg">{formatCLP(closure.declared_total)}</td>
                      <td className={`px-6 py-4 text-right font-black text-lg ${getDiffColor(closure.system_total, closure.declared_total)}`}>
                        {getDiffText(closure.system_total, closure.declared_total)}
                      </td>
                    </tr>
                  </Table.Tbody>
                </Table>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <Card.Body>
                <h3 className="text-sm font-medium text-[var(--sf-text-muted)] mb-4 uppercase tracking-wider">Información del Cierre</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[var(--sf-text-muted)] mb-1">Local / Planta</p>
                    <p className="font-medium text-[var(--sf-text-main)]">{closure.warehouse?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--sf-text-muted)] mb-1">Fecha de Rendición</p>
                    <p className="font-medium text-[var(--sf-text-main)]">{new Date(closure.date + 'T12:00:00').toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--sf-text-muted)] mb-1">Fecha de Registro (Sistema)</p>
                    <p className="font-medium text-[var(--sf-text-main)]">{new Date(closure.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {closure.observations && (
              <Card>
                <Card.Body>
                  <h3 className="text-sm font-medium text-[var(--sf-text-muted)] mb-2 uppercase tracking-wider">Observaciones</h3>
                  <p className="text-[var(--sf-text-main)] whitespace-pre-line text-sm">
                    {closure.observations}
                  </p>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
