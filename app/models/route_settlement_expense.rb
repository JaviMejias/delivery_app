class RouteSettlementExpense < ApplicationRecord
  belongs_to :route_settlement

  validates :description, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :payment_method, presence: true, inclusion: { in: %w[cash card transfer] }
end
