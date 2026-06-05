import { useState, useMemo } from 'react'
import { Head, router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import CurrencyInput from '@/components/CurrencyInput'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { Banknote, Save, FileText, CheckCircle2, Search, Plus, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

export default function ExpensesNew({ suppliers, pending_documents }: any) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  // State to hold selected documents and how much is applied to each
  const [applications, setApplications] = useState<Record<number, string>>({})
  
  // To power the search selector
  const [selectedDocIdToAdd, setSelectedDocIdToAdd] = useState('')

  // The list of selected documents to render in the right panel
  const selectedDocuments = useMemo(() => {
    return pending_documents.filter((d: any) => applications[d.id] !== undefined)
  }, [applications, pending_documents])

  const totalApplied = useMemo(() => {
    return Object.values(applications).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
  }, [applications])

  const handleApplyAmount = (docId: number, maxAllowed: number, value: string) => {
    const numericVal = parseFloat(value) || 0
    if (numericVal > maxAllowed) {
      setApplications(prev => ({ ...prev, [docId]: maxAllowed.toString() }))
    } else {
      setApplications(prev => ({ ...prev, [docId]: value }))
    }
  }

  const handleAddDocument = () => {
    if (!selectedDocIdToAdd) return
    const doc = pending_documents.find((d: any) => d.id.toString() === selectedDocIdToAdd)
    if (!doc) return
    
    // Auto-fill with the remaining pending amount
    const pendingAmount = parseFloat(doc.total_amount) - parseFloat(doc.paid_amount || '0')
    setApplications(prev => ({ ...prev, [doc.id]: pendingAmount.toString() }))
    setSelectedDocIdToAdd('')
  }

  const handleRemoveDocument = (id: number) => {
    setApplications(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  const isAmountLocked = selectedDocuments.length > 0;
  const effectiveAmount = isAmountLocked ? totalApplied.toString() : amount;

  const formatCLP = (amount: number | string) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (totalApplied > (parseFloat(effectiveAmount) || 0)) {
      Swal.fire('Error', 'El monto aplicado a las facturas supera el monto del egreso.', 'error')
      return
    }

    const appsArray = Object.keys(applications).map(k => ({
      purchase_document_id: k,
      amount_applied: applications[parseInt(k)]
    })).filter(a => parseFloat(a.amount_applied) > 0)

    router.post('/treasury/expenses', {
      treasury_expense: {
        date,
        amount: effectiveAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes
      },
      applications: appsArray
    })
  }

  // Formatting for CustomSelect options
  const documentOptions = useMemo(() => {
    return pending_documents
      .filter((d: any) => applications[d.id] === undefined) // Only show unselected ones
      .map((d: any) => {
        const pendingAmount = parseFloat(d.total_amount) - parseFloat(d.paid_amount || '0')
        return {
          value: d.id.toString(),
          label: `Factura #${d.document_number} - ${d.supplier?.name || 'Sin Proveedor'} (Pendiente: ${formatCLP(pendingAmount)})`
        }
      })
  }, [pending_documents, applications])

  return (
    <AuthenticatedLayout>
      <Head title="Registrar Egreso" />
      <PageHeader 
        title="Registrar Egreso"
        icon={<Banknote className="w-8 h-8 opacity-80" />}
        description="Registra un pago y aplícalo a las facturas que desees."
        color="rose"
        backUrl="/treasury/expenses"
      />

      <form onSubmit={submit} className="flex flex-col lg:flex-row gap-6">
        {/* Panel Izquierdo: Datos del Egreso */}
        <div className="w-full lg:w-1/3 shrink-0">
          <Card className="sticky top-24">
            <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-bg)]">
              <h2 className="font-bold text-[var(--sf-text-main)]">Datos del Pago</h2>
            </div>
            <Card.Body className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Fecha</label>
                <CustomDatePicker 
                  value={date} 
                  onChange={(val) => setDate(val || new Date().toISOString().split('T')[0])} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Monto Total del Egreso</label>
                {isAmountLocked ? (
                  <div className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg px-4 py-2 text-rose-400 font-bold text-lg flex items-center justify-between opacity-80">
                    <span>{formatCLP(totalApplied)}</span>
                    <span className="text-xs text-[var(--sf-text-muted)] font-normal ml-2">(Suma automática)</span>
                  </div>
                ) : (
                  <CurrencyInput
                    value={amount}
                    onValueChange={setAmount}
                    placeholder="Ej: 150000"
                    className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg px-3 py-2 text-[var(--sf-text-main)] font-bold text-lg text-rose-400"
                  />
                )}
                {isAmountLocked && (
                  <p className="text-xs text-[var(--sf-text-muted)] mt-1">El monto se calcula automáticamente al agregar facturas.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Método de Pago</label>
                <CustomSelect
                  value={{ value: paymentMethod, label: paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : paymentMethod === 'cheque' ? 'Cheque' : 'Transferencia' }}
                  onChange={(v: any) => setPaymentMethod(v?.value || '')}
                  options={[
                    { value: 'transfer', label: 'Transferencia' },
                    { value: 'cash', label: 'Efectivo' },
                    { value: 'cheque', label: 'Cheque' },
                    { value: 'card', label: 'Tarjeta' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">N° Documento / Referencia</label>
                <input 
                  type="text" 
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="Ej: Transferencia 12345"
                  className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg px-3 py-2 text-[var(--sf-text-main)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Notas (Opcional)</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg px-3 py-2 text-[var(--sf-text-main)] min-h-[80px]"
                />
              </div>

              {!isAmountLocked && (
                <div className="pt-4 border-t border-[var(--sf-border)] flex items-center justify-between">
                  <span className="text-sm text-[var(--sf-text-muted)]">Aplicado: <strong className={totalApplied > (parseFloat(amount)||0) ? 'text-red-400' : 'text-[var(--sf-text-main)]'}>{formatCLP(totalApplied)}</strong></span>
                  <span className="text-sm text-[var(--sf-text-muted)]">Falta: <strong>{formatCLP(Math.max(0, (parseFloat(amount)||0) - totalApplied))}</strong></span>
                </div>
              )}

              <button
                type="submit"
                disabled={!effectiveAmount || parseFloat(effectiveAmount) <= 0}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/20"
              >
                <Save size={20} /> Guardar Egreso
              </button>
            </Card.Body>
          </Card>
        </div>

        {/* Panel Derecho: Facturas */}
        <div className="flex-1">
          <Card className="h-full min-h-[500px]">
            <div className="p-4 border-b border-[var(--sf-border)] bg-[var(--sf-surface)] flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="font-bold text-[var(--sf-text-main)]">Facturas a Pagar</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:w-80">
                  <CustomSelect
                    value={selectedDocIdToAdd ? { value: selectedDocIdToAdd, label: documentOptions.find(o => o.value === selectedDocIdToAdd)?.label } : null}
                    onChange={(v: any) => setSelectedDocIdToAdd(v?.value || '')}
                    options={documentOptions}
                    placeholder="Buscar y seleccionar factura..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDocument}
                  disabled={!selectedDocIdToAdd}
                  className="px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] text-[var(--sf-text-main)] font-medium rounded-lg hover:bg-[var(--sf-border)] transition-colors disabled:opacity-50 shrink-0 flex items-center gap-2"
                >
                  <Plus size={18} /> Agregar
                </button>
              </div>
            </div>

            <div className="p-4">
              {selectedDocuments.length === 0 ? (
                <div className="text-center py-16 text-[var(--sf-text-muted)]">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Busca facturas en el buscador de arriba para agregarlas a este egreso.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Distribuir monto removido por lógica de suma automática */}

                  {selectedDocuments.map((doc: any) => {
                    const pendingAmount = parseFloat(doc.total_amount) - parseFloat(doc.paid_amount || '0')
                    const appliedAmount = parseFloat(applications[doc.id] || '0')
                    const newPending = Math.max(0, pendingAmount - appliedAmount)
                    
                    return (
                      <div key={doc.id} className="p-4 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-bg)] flex flex-wrap items-center gap-4 transition-colors hover:border-rose-500/30">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="font-bold text-[var(--sf-text-main)] block">
                                Factura #{doc.document_number}
                              </span>
                              <span className="text-xs text-[var(--sf-text-muted)] block mt-0.5">
                                Proveedor: {doc.supplier?.name || 'Sin Proveedor'}
                              </span>
                              {doc.credit_notes && doc.credit_notes.length > 0 && (
                                <span className="text-xs text-amber-500 font-medium block mt-1">
                                  Tiene {doc.credit_notes.length} NC asociada(s): {doc.credit_notes.map((nc: any) => `#${nc.document_number}`).join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[var(--sf-text-muted)] bg-[var(--sf-surface)] px-2 py-1 rounded-md">{doc.issue_date}</span>
                          </div>
                            <div className="flex gap-4 text-sm mt-3">
                              <div className="text-[var(--sf-text-muted)]">
                                Total: <span className="text-[var(--sf-text-main)]">{formatCLP(doc.total_amount)}</span>
                              </div>
                              <div className={`font-medium ${newPending <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {newPending <= 0 ? 'Saldada con este pago' : `Quedará pendiente: ${formatCLP(newPending)}`}
                              </div>
                            </div>
                        </div>

                        <div className="w-full sm:w-48 shrink-0 flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-[var(--sf-text-muted)] mb-1">Abonar a factura:</label>
                            <CurrencyInput
                              value={applications[doc.id] || ''}
                              onValueChange={(val) => handleApplyAmount(doc.id, pendingAmount, val)}
                              className="w-full bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-lg px-3 py-2 text-[var(--sf-text-main)] font-medium focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
