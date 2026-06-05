class PriceList < ApplicationRecord
  acts_as_tenant :company
  belongs_to :company
  has_many :product_prices, dependent: :destroy

  validates :name, presence: true
  validates :active, inclusion: { in: [ true, false ] }
  validates :available_for_trucks, inclusion: { in: [ true, false ] }
  validates :available_for_local, inclusion: { in: [ true, false ] }
end
