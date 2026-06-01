class TreasuryExpensesController < ApplicationController
  def index
    expenses = TreasuryExpense.order(date: :desc, created_at: :desc).includes(expense_documents: :purchase_document)
    
    if params[:date_from].present?
      expenses = expenses.where('date >= ?', params[:date_from])
    end
    if params[:date_to].present?
      expenses = expenses.where('date <= ?', params[:date_to])
    end

    pagy, records = pagy(:offset, expenses, limit: 20)

    render inertia: "Treasury/Expenses/Index", props: {
      expenses: records.as_json(include: { expense_documents: { include: :purchase_document } }),
      pagination: extract_pagy(pagy)
    }
  end

  def new
    suppliers = Supplier.all.order(:name)
    pending_documents = PurchaseDocument.includes(:supplier, :credit_notes).where(status: [:pending, :partial], document_type: [:invoice, :receipt]).order(:issue_date)

    render inertia: "Treasury/Expenses/New", props: {
      suppliers: suppliers.as_json,
      pending_documents: pending_documents.as_json(include: [:supplier, :credit_notes])
    }
  end

  def create
    expense = TreasuryExpense.new(expense_params)
    expense.company_id = current_tenant.id
    
    ActiveRecord::Base.transaction do
      if expense.save
        if params[:applications].present?
          params[:applications].each do |app|
            next if app[:amount_applied].to_f <= 0
            
            ExpenseDocument.create!(
              treasury_expense: expense,
              purchase_document_id: app[:purchase_document_id],
              amount_applied: app[:amount_applied]
            )
          end
        end
        redirect_to treasury_expenses_path, notice: "Egreso registrado exitosamente."
      else
        redirect_to new_treasury_expense_path, alert: "Error al registrar el egreso: #{expense.errors.full_messages.join(', ')}"
        raise ActiveRecord::Rollback
      end
    end
  end

  def show
    expense = TreasuryExpense.includes(expense_documents: :purchase_document).find(params[:id])
    
    render inertia: "Treasury/Expenses/Show", props: {
      expense: expense.as_json(include: { expense_documents: { include: :purchase_document } })
    }
  end

  private

  def expense_params
    params.require(:treasury_expense).permit(:date, :amount, :payment_method, :reference_number, :notes)
  end
end
