class RouteSettlementItem < ApplicationRecord
  belongs_to :route_settlement
  belongs_to :product
  belongs_to :price_list

  validates :sold_quantity, presence: true, numericality: { greater_than: 0 }
  validates :returned_empty_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :unit_price, numericality: { greater_than_or_equal_to: 0 }

  before_validation :set_unit_price_and_subtotal

  private

  def set_unit_price_and_subtotal
    if product && price_list && sold_quantity
      product_price = product.product_prices.find_by(price_list_id: price_list_id)
      self.unit_price = product_price&.price || 0.0
      self.subtotal = self.unit_price * self.sold_quantity
    end
  end
end
