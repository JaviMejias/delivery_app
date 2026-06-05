import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { Banknote, Calendar, FileText, CreditCard, Tag, FileSpreadsheet } from 'lucide-react'
import { formatCLP } from '@/utils/formatters'
import { PaymentBadge } from '@/components/Badges/PaymentBadge'

export default function ExpenseShow({ expense }: any) {
  const formatDocumentType = (type: string) => {
    switch(type) {
      case 'invoice': return 'Factura'
      case 'receipt': return 'Boleta'
      case 'credit_note': return 'Nota de Crédito'
      case 'debit_note': return 'Nota de Débito'
      default: return type
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Egreso #${expense.id}`} />

      <div className="space-y-6">
        <PageHeader 
          title={`Detalle de Egreso`}
          icon={<Banknote className="w-8 h-8 opacity-80" />}
          description={`Revisa la información completa del pago registrado.`}
          color="rose"
          backUrl="/treasury/expenses"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <Card.Body className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                Información del Egreso
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--sf-text-muted)] uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Fecha
                  </div>
                  <div className="text-[var(--sf-text-main)] font-medium">
                    {new Date(expense.date + 'T12:00:00').toLocaleDateString('es-CL')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--sf-text-muted)] uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Referencia
                  </div>
                  <div className="text-[var(--sf-text-main)] font-medium">
                    {expense.reference_number || <span className="text-[var(--sf-text-muted)] italic">Sin referencia</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--sf-text-muted)] uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Medio de Pago
                  </div>
                  <div>
                    <PaymentBadge method={expense.payment_method} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--sf-text-muted)] uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" /> Monto Total
                  </div>
                  <div className="text-rose-500 font-black text-xl">
                    {formatCLP(expense.amount)}
                  </div>
                </div>
              </div>

              {expense.notes && (
                <div className="pt-4 border-t border-[var(--sf-border)]">
                  <div className="text-xs text-[var(--sf-text-muted)] uppercase tracking-wider font-bold mb-2">Notas y Observaciones</div>
                  <p className="text-[var(--sf-text-main)] text-sm bg-[var(--sf-bg)] p-3 rounded-lg border border-[var(--sf-border)]">
                    {expense.notes}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h3 className="text-lg font-bold text-[var(--sf-text-main)] mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-rose-500" />
                Documentos Pagados
              </h3>

              {expense.expense_documents && expense.expense_documents.length > 0 ? (
                <div className="space-y-3">
                  {expense.expense_documents.map((ed: any) => (
                    <div key={ed.id} className="flex flex-col gap-2 p-3 bg-[var(--sf-bg)] rounded-lg border border-[var(--sf-border)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-[var(--sf-text-main)]">
                            {formatDocumentType(ed.purchase_document?.document_type)} N° {ed.purchase_document?.document_number}
                          </div>
                          <div className="text-xs text-[var(--sf-text-muted)] mt-0.5">
                            Fecha de emisión: {ed.purchase_document?.issue_date ? new Date(ed.purchase_document.issue_date + 'T12:00:00').toLocaleDateString('es-CL') : '-'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[var(--sf-text-muted)] uppercase font-bold mb-0.5">Abonado</div>
                          <div className="font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 inline-block">
                            {formatCLP(ed.amount_applied)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center p-3 mt-4 border-t border-[var(--sf-border)] bg-[var(--sf-surface)] rounded-lg">
                    <span className="font-bold text-[var(--sf-text-muted)] uppercase text-sm">Suma de abonos:</span>
                    <span className="font-black text-rose-500 text-lg">
                      {formatCLP(expense.expense_documents.reduce((sum: number, ed: any) => sum + parseFloat(ed.amount_applied || '0'), 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-[var(--sf-bg)] rounded-lg border border-[var(--sf-border)] border-dashed">
                  <p className="text-[var(--sf-text-muted)]">Este egreso no tiene abonos a documentos registrados.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
