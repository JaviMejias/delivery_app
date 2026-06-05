class ExpenseDocument < ApplicationRecord
  belongs_to :treasury_expense
  belongs_to :purchase_document

  validates :amount_applied, numericality: { greater_than: 0 }

  after_save :update_purchase_document_paid_amount
  after_destroy :update_purchase_document_paid_amount

  private

  def update_purchase_document_paid_amount
    purchase_document.recalculate_paid_amount!
  end
end
