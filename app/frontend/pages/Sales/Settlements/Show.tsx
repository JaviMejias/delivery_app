import React, { useState, useMemo, useEffect } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import Swal from 'sweetalert2'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { formatCLP } from '@/utils/formatters'
import { RouteSettlement, TruckInventory } from './types'

import SettlementHeader from './components/SettlementHeader'
import SettlementSummaryCards from './components/SettlementSummaryCards'
import SettlementPaymentForm from './components/SettlementPaymentForm'
import SettlementMovementForm from './components/SettlementMovementForm'
import SettlementHistoryTable from './components/SettlementHistoryTable'

interface Props {
  settlement: RouteSettlement
  truck_inventory: TruckInventory[]
  available_price_lists: { id: number, name: string }[]
}

export default function SettlementShow({ settlement, truck_inventory, available_price_lists }: Props) {
  const isDraft = settlement.status === 'draft'

  // Cálculos de montos esperados
  const expectedTotal = useMemo(() => {
    const salesTotal = settlement.route_settlement_items.reduce((total, item) => {
      return total + parseFloat(item.subtotal || '0')
    }, 0)
    const expensesTotal = settlement.route_settlement_expenses?.reduce((total, exp) => {
      // Solo los gastos pagados con el efectivo de la ruta se descuentan de la recaudación
      if (exp.payment_method === 'cash') {
        return total + parseFloat(exp.amount || '0')
      }
      return total
    }, 0) || 0
    return salesTotal - expensesTotal
  }, [settlement.route_settlement_items, settlement.route_settlement_expenses])

  const declaredTotal = parseFloat(settlement.total_revenue || '0')
  const isBalanced = expectedTotal === declaredTotal

  // Formulario de Productos
  const itemForm = useForm({
    product_id: '',
    price_list_id: '',
    sold_quantity: '',
    returned_empty_quantity: ''
  })

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    itemForm.post(`/sales/settlements/${settlement.id}/items`, {
      onSuccess: () => itemForm.reset('product_id', 'price_list_id', 'sold_quantity', 'returned_empty_quantity'),
      preserveScroll: true
    })
  }

  const deleteItem = (itemId: number) => {
    router.delete(`/sales/settlements/${settlement.id}/items/${itemId}`, { preserveScroll: true })
  }

  // Estado del Switch Gasto / Venta
  const [formType, setFormType] = useState<'sale' | 'expense'>('sale')

  const expenseForm = useForm({
    description: '',
    amount: '',
    payment_method: 'cash'
  })

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault()
    expenseForm.post(`/sales/settlements/${settlement.id}/expenses`, {
      onSuccess: () => expenseForm.reset(),
      preserveScroll: true
    })
  }

  const deleteExpense = (expenseId: number) => {
    router.delete(`/sales/settlements/${settlement.id}/expenses/${expenseId}`, { preserveScroll: true })
  }

  const hasOperations = settlement.route_settlement_items.length > 0 || (settlement.route_settlement_expenses && settlement.route_settlement_expenses.length > 0)

  // Formulario de Pagos (Desglose)
  const paymentForm = useForm({
    cash_revenue: settlement.cash_revenue || '0',
    card_revenue: settlement.card_revenue || '0',
    transfer_revenue: settlement.transfer_revenue || '0',
  })

  const currentDeclaredTotal = 
    parseFloat(paymentForm.data.cash_revenue || '0') + 
    parseFloat(paymentForm.data.card_revenue || '0') + 
    parseFloat(paymentForm.data.transfer_revenue || '0')

  const isFormBalanced = expectedTotal === currentDeclaredTotal

  const savePayments = (e: React.FormEvent) => {
    e.preventDefault()
    paymentForm.patch(`/sales/settlements/${settlement.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        Swal.fire({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
          icon: 'success', title: 'Pagos guardados', background: 'var(--sf-dark-card)', color: '#fff'
        })
      }
    })
  }

  const confirmSettlement = () => {
    if (expectedTotal !== currentDeclaredTotal) {
      Swal.fire({
        title: 'Hay un descuadre',
        text: `El total esperado es ${formatCLP(expectedTotal)} pero has declarado ${formatCLP(currentDeclaredTotal)}. ¿Estás seguro de cerrar la caja con esta diferencia?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6366f1',
        confirmButtonText: 'Sí, confirmar con diferencia',
        cancelButtonText: 'Revisar',
        background: 'var(--sf-dark-card)',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          router.post(`/sales/settlements/${settlement.id}/complete`, {
            cash_revenue: paymentForm.data.cash_revenue,
            card_revenue: paymentForm.data.card_revenue,
            transfer_revenue: paymentForm.data.transfer_revenue
          })
        }
      })
    } else {
      Swal.fire({
        title: '¿Confirmar Rendición?',
        text: 'La rendición está cuadrada. Esto actualizará el inventario del camión.',
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6366f1',
        confirmButtonText: 'Sí, confirmar rendición',
        cancelButtonText: 'Cancelar',
        background: 'var(--sf-dark-card)',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          router.post(`/sales/settlements/${settlement.id}/complete`, {
            cash_revenue: paymentForm.data.cash_revenue,
            card_revenue: paymentForm.data.card_revenue,
            transfer_revenue: paymentForm.data.transfer_revenue
          })
        }
      })
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Rendición #${settlement.id}`} />

      <div className="space-y-6 pb-20">
        <SettlementHeader 
          settlement={settlement} 
          isDraft={isDraft} 
          isFormBalanced={isFormBalanced} 
          onConfirm={confirmSettlement} 
        />

        <SettlementSummaryCards 
          expectedTotal={expectedTotal}
          declaredTotal={declaredTotal}
          currentDeclaredTotal={currentDeclaredTotal}
          isDraft={isDraft}
          isBalanced={isBalanced}
          isFormBalanced={isFormBalanced}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <SettlementPaymentForm 
              data={paymentForm.data}
              setData={paymentForm.setData}
              isDraft={isDraft}
              processing={paymentForm.processing}
              isDirty={paymentForm.isDirty}
              currentDeclaredTotal={currentDeclaredTotal}
              onSave={savePayments}
            />

            {isDraft && (
              <SettlementMovementForm 
                formType={formType}
                setFormType={setFormType}
                truck_inventory={truck_inventory}
                available_price_lists={available_price_lists}
                itemFormData={itemForm.data}
                setItemData={itemForm.setData}
                isItemProcessing={itemForm.processing}
                onAddSale={addItem}
                expenseFormData={expenseForm.data}
                setExpenseData={expenseForm.setData}
                isExpenseProcessing={expenseForm.processing}
                onAddExpense={addExpense}
              />
            )}
          </div>

          <div className="lg:col-span-8">
            <SettlementHistoryTable 
              isDraft={isDraft}
              hasOperations={hasOperations}
              items={settlement.route_settlement_items}
              expenses={settlement.route_settlement_expenses}
              onDeleteItem={deleteItem}
              onDeleteExpense={deleteExpense}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
