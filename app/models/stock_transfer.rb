class StockTransfer < ApplicationRecord
  acts_as_tenant :company
  belongs_to :source_warehouse, class_name: 'Warehouse'
  belongs_to :destination_warehouse, class_name: 'Warehouse'
  has_many :stock_transfer_items, dependent: :destroy

  enum :status, { draft: 0, completed: 1 }, default: :draft

  validates :source_warehouse_id, presence: true
  validates :destination_warehouse_id, presence: true

  scope :search_by_query, ->(q) { where('stock_transfers.id::text ILIKE :q OR stock_transfers.status ILIKE :q', q: "%#{q}%") if q.present? }
  scope :with_details, -> { includes(:source_warehouse, :destination_warehouse) }
end
