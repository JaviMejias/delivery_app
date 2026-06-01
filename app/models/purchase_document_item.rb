class PurchaseDocumentItem < ApplicationRecord
  belongs_to :purchase_document
  belongs_to :product

  before_save :calculate_subtotal
  after_save :update_document_totals
  after_destroy :update_document_totals

  private

  def calculate_subtotal
    self.subtotal = quantity * unit_price
    self.tax_amount = has_iva ? (self.subtotal * 0.19).round : 0
    self.total = self.subtotal + self.tax_amount
  end

  def update_document_totals
    return if purchase_document.purchase_order_id.present?

    doc = purchase_document
    doc.net_amount = doc.purchase_document_items.sum(:subtotal)
    doc.tax_amount = doc.purchase_document_items.sum(:tax_amount)
    doc.total_amount = doc.purchase_document_items.sum(:total)
    doc.save!
  end
end
