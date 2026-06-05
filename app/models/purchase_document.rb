class PurchaseDocument < ApplicationRecord
  acts_as_tenant :company

  belongs_to :company
  belongs_to :supplier, optional: true
  belongs_to :purchase_order, optional: true
  has_many :purchase_document_items, dependent: :destroy
  has_many :expense_documents, dependent: :destroy
  has_many :treasury_expenses, through: :expense_documents

  belongs_to :reference_document, class_name: "PurchaseDocument", optional: true
  has_many :credit_notes, class_name: "PurchaseDocument", foreign_key: :reference_document_id, dependent: :nullify

  has_many_attached :files

  enum :document_type, { invoice: 0, credit_note: 1, dispatch_guide: 2, receipt: 3 }
  enum :status, { pending: 0, paid: 1, draft: 2, voided: 3, partial: 4 }

  validates :document_number, presence: true, unless: -> { draft? }
  validates :reference_document_id, presence: { message: "es obligatorio para las Notas de Crédito" }, if: -> { credit_note? && !draft? }
  validates :document_number, uniqueness: {
    scope: [ :company_id, :supplier_id, :document_type ],
    message: "ya ha sido registrado para este proveedor"
  }, allow_blank: true
  validates :total_amount, numericality: { greater_than_or_equal_to: 0 }

  after_save :update_reference_document_balance, if: -> { saved_change_to_status? || saved_change_to_total_amount? }

  def recalculate_paid_amount!
    sum_applied = expense_documents.sum(:amount_applied)
    sum_credit_notes = credit_notes.where(status: [ :pending, :partial, :paid ]).sum(:total_amount)

    total_paid = sum_applied + sum_credit_notes

    new_status = if voided? || draft?
                   status
    elsif total_paid >= total_amount && total_amount > 0
                   :paid
    elsif sum_applied > 0 || sum_credit_notes > 0
                   :partial
    else
                   :pending
    end

    update_columns(paid_amount: total_paid, status: PurchaseDocument.statuses[new_status])

    if new_status == :paid
      credit_notes.where(status: [ :pending, :partial ]).each do |cn|
        cn.update_columns(status: PurchaseDocument.statuses[:paid])
      end
    end
  end

  private

  def update_reference_document_balance
    if reference_document_id.present?
      reference_document.recalculate_paid_amount!
    end
  end
end
