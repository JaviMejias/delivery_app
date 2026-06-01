class TreasuryIncome < ApplicationRecord
  acts_as_tenant :company
  belongs_to :company
  belongs_to :source, polymorphic: true

  validates :date, presence: true
  validates :amount, numericality: { greater_than: 0 }
  validates :payment_method, presence: true
end
