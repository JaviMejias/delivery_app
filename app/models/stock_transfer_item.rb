class StockTransferItem < ApplicationRecord
  belongs_to :stock_transfer
  belongs_to :item, polymorphic: true

  validates :quantity, presence: true, numericality: { greater_than: 0 }
end
