class ProductPrice < ApplicationRecord
  acts_as_tenant :company
  belongs_to :product
  belongs_to :price_list

  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
