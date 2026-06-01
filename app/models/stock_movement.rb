class StockMovement < ApplicationRecord
  acts_as_tenant :company
  belongs_to :warehouse
  belongs_to :item, polymorphic: true
  belongs_to :reference, polymorphic: true, optional: true

  enum :movement_type, {
    purchase: 0,
    sale: 1,
    transfer_in: 2,
    transfer_out: 3,
    return_empty: 4,
    adjustment: 5
  }

  validates :quantity, presence: true, numericality: true
  validates :movement_type, presence: true
end
