class PurchaseOrderItem < ApplicationRecord
  belongs_to :purchase_order
  belongs_to :product

  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :unit_price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  before_save :calculate_subtotal

  private

  def calculate_subtotal
    self.subtotal = quantity * unit_price
    self.tax_amount = has_iva ? (self.subtotal * 0.19).round : 0
    self.total = self.subtotal + self.tax_amount
  end
end
