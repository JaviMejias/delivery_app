class LocalSaleItem < ApplicationRecord
  belongs_to :local_sale
  belongs_to :product
  belongs_to :price_list

  validates :quantity, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :returned_empty_quantity, numericality: { greater_than_or_equal_to: 0, only_integer: true }, allow_nil: true
  validates :unit_price, numericality: { greater_than_or_equal_to: 0 }
  validates :subtotal, numericality: { greater_than_or_equal_to: 0 }

  before_validation :set_unit_price_and_subtotal
  validate :voucher_code_must_be_unique_in_company, if: -> { voucher_code.present? }

  private

  def set_unit_price_and_subtotal
    if product && price_list && quantity
      product_price = product.product_prices.find_by(price_list_id: price_list_id)
      self.unit_price = product_price&.price || 0.0
      self.subtotal = self.unit_price * self.quantity
    end
  end

  def voucher_code_must_be_unique_in_company
    exists = LocalSaleItem.joins(:local_sale, :product)
                          .where(local_sales: { company_id: local_sale.company_id })
                          .where(products: { brand_id: product.brand_id })
                          .where(voucher_code: voucher_code)
                          .where.not(id: id)
                          .exists?
    
    if exists
      errors.add(:voucher_code, "ya ha sido utilizado para esta marca (#{product.brand.name})")
    end
  end
end
