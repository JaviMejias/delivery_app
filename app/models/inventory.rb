class Inventory < ApplicationRecord
  acts_as_tenant :company
  belongs_to :warehouse
  belongs_to :item, polymorphic: true

  validates :quantity, presence: true, numericality: true
  validates :item_id, uniqueness: { scope: [:company_id, :warehouse_id, :item_type] }

  scope :available_products, -> { where(item_type: 'Product').where('quantity > 0') }
  scope :products_for, ->(warehouse) { includes(item: [:material, :brand]).where(warehouse: warehouse, item_type: "Product") }
  scope :materials_for, ->(warehouse) { includes(:item).where(warehouse: warehouse, item_type: "Material") }
end
