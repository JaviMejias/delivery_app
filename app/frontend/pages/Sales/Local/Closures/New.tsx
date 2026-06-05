import { Head, useForm, router, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import BackButton from '@/components/BackButton'
import { CustomSelect } from '@/components/CustomSelect'
import CurrencyInput from '@/components/CurrencyInput'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import Swal from 'sweetalert2'
import { Lock } from 'lucide-react'

interface Warehouse {
  id: number
  name: string
}

interface Props {
  warehouses: Warehouse[]
  selected_warehouse_id?: string
  selected_date?: string
  already_closed?: boolean
  system_totals: {
    cash: number
    card: number
    transfer: number
    total: number
  }
}

const formatCLP = (amount: number | string) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount))
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function LocalClosureNew({ warehouses, selected_warehouse_id, selected_date, already_closed, system_totals }: Props) {
  const [paramsForm, setParamsForm] = useState({
    warehouse_id: selected_warehouse_id || '',
    date: selected_date || getLocalDateString()
  })

  const form = useForm({
    warehouse_id: selected_warehouse_id || '',
    date: selected_date || getLocalDateString(),
    system_cash: system_totals.cash,
    system_card: system_totals.card,
    system_transfer: system_totals.transfer,
    system_total: system_totals.total,
    declared_cash: '0',
    declared_card: '0',
    declared_transfer: '0',
    declared_total: '0',
    observations: ''
  })

  // Load system totals when warehouse or date changes
  useEffect(() => {
    if (paramsForm.warehouse_id && paramsForm.date && 
       (paramsForm.warehouse_id !== selected_warehouse_id || paramsForm.date !== selected_date)) {
      router.get('/sales/local/closures/new', paramsForm, { preserveState: true, replace: true })
    }
  }, [paramsForm])

  // Automatically calculate total declared
  useEffect(() => {
    const cash = parseFloat(form.data.declared_cash || '0')
    const card = parseFloat(form.data.declared_card || '0')
    const transfer = parseFloat(form.data.declared_transfer || '0')
    form.setData('declared_total', (cash + card + transfer).toString())
  }, [form.data.declared_cash, form.data.declared_card, form.data.declared_transfer])

  // Also keep hidden system inputs up to date with props
  useEffect(() => {
    form.setData({
      ...form.data,
      warehouse_id: selected_warehouse_id || '',
      date: selected_date || getLocalDateString(),
      system_cash: system_totals.cash,
      system_card: system_totals.card,
      system_transfer: system_totals.transfer,
      system_total: system_totals.total
    })
  }, [system_totals, selected_warehouse_id, selected_date])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const totalDeclared = parseFloat(form.data.declared_total || '0')
    const today = getLocalDateString()
    
    const isZero = totalDeclared === 0
    const isDifferentDate = paramsForm.date !== today

    if (isZero || isDifferentDate) {
      let alertText = ''
      
      if (isZero && isDifferentDate) {
        const [yyyy, mm, dd] = paramsForm.date.split('-')
        alertText = `Estás declarando $0 totales Y ADEMÁS estás cerrando con fecha ${dd}-${mm}-${yyyy} (que no es hoy). ¿Estás completamente seguro de que ambos datos son correctos?`
      } else if (isZero) {
        alertText = 'Estás declarando $0 en efectivo, tarjetas y transferencias. ¿Estás seguro de que no hubo ventas o de que los valores están vacíos?'
      } else if (isDifferentDate) {
        const [yyyy, mm, dd] = paramsForm.date.split('-')
        alertText = `Estás registrando un cierre para el día ${dd}-${mm}-${yyyy}, que no es hoy. ¿Estás seguro de que esta es la fecha correcta?`
      }

      const result = await Swal.fire({
        title: 'Verifica los datos',
        text: alertText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sí, registrar',
        cancelButtonText: 'Revisar datos',
        background: 'var(--sf-dark-card)',
        color: 'var(--sf-text-main)'
      })
      
      if (!result.isConfirmed) return
    }

    // Si pasó todas las validaciones (o no hubo advertencias)
    form.post('/sales/local/closures')
  }

  const diffCash = parseFloat(form.data.declared_cash || '0') - system_totals.cash
  const diffCard = parseFloat(form.data.declared_card || '0') - system_totals.card
  const diffTransfer = parseFloat(form.data.declared_transfer || '0') - system_totals.transfer
  const diffTotal = parseFloat(form.data.declared_total || '0') - system_totals.total

  const getDiffColor = (val: number) => {
    if (val === 0) return 'text-emerald-400'
    if (val > 0) return 'text-emerald-400'
    return 'text-red-400'
  }

  const isReady = selected_warehouse_id && selected_date

  return (
    <AuthenticatedLayout>
      <Head title="Nuevo Cierre de Caja" />

      <div className="space-y-6">
        <PageHeader 
          title="Rendir Cierre de Caja Local"
          icon={<Lock className="w-8 h-8 opacity-80" />}
          description="Declara los montos recaudados en el día y verifica si cuadran con el sistema."
          color="indigo"
          backUrl="/sales/local/closures"
        />

        {/* Selección de Parámetros */}
        <Card>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Local / Planta</label>
                <CustomSelect
                  value={paramsForm.warehouse_id ? { value: paramsForm.warehouse_id, label: warehouses.find(w => w.id.toString() === paramsForm.warehouse_id)?.name } : null}
                  onChange={(val: any) => setParamsForm(prev => ({ ...prev, warehouse_id: val?.value || '' }))}
                  options={warehouses.map(w => ({ value: w.id.toString(), label: w.name }))}
                  placeholder="Seleccionar local..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Fecha de Rendición</label>
                <CustomDatePicker
                  value={paramsForm.date}
                  onChange={(date) => setParamsForm(prev => ({ ...prev, date }))}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Warning si ya está cerrado */}
        {already_closed && (
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3">⚠️</span>
            <h2 className="text-xl font-bold mb-2">Caja ya cerrada</h2>
            <p>Ya existe un cierre de caja registrado para esta bodega en esta fecha.</p>
          </div>
        )}

        {/* Formulario de Cierre */}
        {isReady && !already_closed && (
          <form onSubmit={submit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <Card.Body>
                    <h2 className="font-semibold text-xl text-[var(--sf-text-main)] mb-6 border-b border-[var(--sf-border)] pb-4">
                      Ingreso de Valores Declarados
                    </h2>

                    <div className="space-y-6">
                      {/* Efectivo */}
                      <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--sf-bg)] p-4 rounded-xl border border-[var(--sf-border)]">
                        <div className="w-full md:w-1/3">
                          <label className="block font-medium text-[var(--sf-text-main)]">💵 Efectivo Físico</label>
                          <p className="text-xs text-[var(--sf-text-muted)]">Billetes y monedas en caja</p>
                        </div>
                        <div className="w-full md:w-1/3">
                          <CurrencyInput
                            value={form.data.declared_cash}
                            onValueChange={(val) => form.setData('declared_cash', val)}
                            className="text-emerald-400 font-bold text-xl !py-3 text-center"
                            placeholder="0"
                          />
                        </div>
                        <div className="w-full md:w-1/3 text-right">
                          <p className="text-sm text-[var(--sf-text-muted)]">Sistema: {formatCLP(system_totals.cash)}</p>
                          <p className={`font-bold ${getDiffColor(diffCash)}`}>
                            {diffCash > 0 ? '+' : ''}{formatCLP(diffCash)}
                          </p>
                        </div>
                      </div>

                      {/* Tarjetas */}
                      <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--sf-bg)] p-4 rounded-xl border border-[var(--sf-border)]">
                        <div className="w-full md:w-1/3">
                          <label className="block font-medium text-[var(--sf-text-main)]">💳 Boucher de Tarjetas</label>
                          <p className="text-xs text-[var(--sf-text-muted)]">Transbank u otros POS</p>
                        </div>
                        <div className="w-full md:w-1/3">
                          <CurrencyInput
                            value={form.data.declared_card}
                            onValueChange={(val) => form.setData('declared_card', val)}
                            className="text-blue-400 font-bold text-xl !py-3 text-center"
                            placeholder="0"
                          />
                        </div>
                        <div className="w-full md:w-1/3 text-right">
                          <p className="text-sm text-[var(--sf-text-muted)]">Sistema: {formatCLP(system_totals.card)}</p>
                          <p className={`font-bold ${getDiffColor(diffCard)}`}>
                            {diffCard > 0 ? '+' : ''}{formatCLP(diffCard)}
                          </p>
                        </div>
                      </div>

                      {/* Transferencias */}
                      <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--sf-bg)] p-4 rounded-xl border border-[var(--sf-border)]">
                        <div className="w-full md:w-1/3">
                          <label className="block font-medium text-[var(--sf-text-main)]">🏦 Transferencias</label>
                          <p className="text-xs text-[var(--sf-text-muted)]">Pagos comprobados al banco</p>
                        </div>
                        <div className="w-full md:w-1/3">
                          <CurrencyInput
                            value={form.data.declared_transfer}
                            onValueChange={(val) => form.setData('declared_transfer', val)}
                            className="text-purple-400 font-bold text-xl !py-3 text-center"
                            placeholder="0"
                          />
                        </div>
                        <div className="w-full md:w-1/3 text-right">
                          <p className="text-sm text-[var(--sf-text-muted)]">Sistema: {formatCLP(system_totals.transfer)}</p>
                          <p className={`font-bold ${getDiffColor(diffTransfer)}`}>
                            {diffTransfer > 0 ? '+' : ''}{formatCLP(diffTransfer)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--sf-text-muted)] mb-1">Observaciones (Opcional)</label>
                        <textarea
                          value={form.data.observations}
                          onChange={(e) => form.setData('observations', e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-primary-500/50 min-h-[100px]"
                          placeholder="Explica si hay descuadres, ej: Faltó billete de 10.000..."
                        ></textarea>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Panel Lateral de Totales */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <Card.Body>
                    <h2 className="font-semibold text-lg text-[var(--sf-text-main)] mb-6">Resumen del Cierre</h2>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center text-[var(--sf-text-main)]">
                        <span>Total Sistema:</span>
                        <span className="font-mono text-xl">{formatCLP(system_totals.total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[var(--sf-text-main)] pb-4 border-b border-[var(--sf-border)]">
                        <span>Total Declarado:</span>
                        <span className="font-bold text-xl">{formatCLP(parseFloat(form.data.declared_total))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--sf-text-muted)] font-medium">Diferencia:</span>
                        <span className={`font-bold text-2xl ${getDiffColor(diffTotal)}`}>
                          {diffTotal > 0 ? '+' : ''}{formatCLP(diffTotal)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={form.processing}
                      className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                    >
                      <span>🔒</span> Confirmar y Cerrar Caja
                    </button>
                    {form.errors.warehouse_id && (
                      <p className="text-red-400 text-sm mt-3 text-center">{form.errors.warehouse_id}</p>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
