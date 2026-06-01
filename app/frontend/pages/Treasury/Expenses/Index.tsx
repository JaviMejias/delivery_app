import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import Table from '@/components/Table'
import Pagination from '@/components/Pagination'
import { Banknote, Plus, ArrowRight, CreditCard, Building2, Ticket } from 'lucide-react'

export default function ExpensesIndex({ expenses, pagination }: any) {
  const formatCLP = (amount: number | string) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <Banknote size={16} className="opacity-80" /> Efectivo
          </span>
        )
      case 'card':
        return (
          <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium">
            <CreditCard size={16} className="opacity-80" /> Tarjeta
          </span>
        )
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1.5 text-purple-400 font-medium">
            <Building2 size={16} className="opacity-80" /> Transferencia
          </span>
        )
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1.5 text-orange-400 font-medium">
            <Ticket size={16} className="opacity-80" /> Cheque
          </span>
        )
      default:
        return <span className="capitalize text-[var(--sf-text-muted)] font-medium">{method}</span>
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title="Egresos" />
      <PageHeader 
        title="Egresos y Pagos"
        icon={<Banknote className="w-8 h-8 opacity-80" />}
        description="Listado de pagos realizados para cubrir facturas y otros documentos."
        color="rose"
      >
        <Link 
          href="/treasury/expenses/new" 
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-5 h-5" /> Registrar Egreso
        </Link>
      </PageHeader>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>N° Referencia</Table.Th>
                <Table.Th>Método</Table.Th>
                <Table.Th>Facturas Pagadas</Table.Th>
                <Table.Th className="text-right">Monto Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {expenses.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} className="text-center py-8 text-[var(--sf-text-muted)]">
                    No hay egresos registrados.
                  </Table.Td>
                </Table.Tr>
              ) : (
                expenses.map((exp: any) => (
                  <Table.Tr key={exp.id}>
                    <Table.Td className="font-medium text-[var(--sf-text-main)]">
                      {new Date(exp.date + 'T12:00:00').toLocaleDateString('es-CL')}
                    </Table.Td>
                    <Table.Td className="text-[var(--sf-text-muted)]">{exp.reference_number || '-'}</Table.Td>
                    <Table.Td>
                      {getMethodBadge(exp.payment_method)}
                    </Table.Td>
                    <Table.Td>
                      <div className="flex flex-col gap-1">
                        {exp.expense_documents?.map((ed: any) => (
                          <span key={ed.id} className="text-xs text-[var(--sf-text-muted)] bg-[var(--sf-bg)] border border-[var(--sf-border)] px-2 py-0.5 rounded-md inline-block max-w-max">
                            Factura #{ed.purchase_document?.document_number} ({formatCLP(ed.amount_applied)})
                          </span>
                        ))}
                      </div>
                    </Table.Td>
                    <Table.Td className="text-right font-bold text-rose-400">
                      {formatCLP(exp.amount)}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
        <div className="p-4 border-t border-[var(--sf-border)]">
          <Pagination pagination={pagination} />
        </div>
      </Card>
    </AuthenticatedLayout>
  )
}
