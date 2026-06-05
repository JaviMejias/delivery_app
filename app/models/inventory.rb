class Inventory < ApplicationRecord
  acts_as_tenant :company
  belongs_to :warehouse
  belongs_to :item, polymorphic: true

  validates :quantity, presence: true, numericality: true
  validates :item_id, uniqueness: { scope: [ :company_id, :warehouse_id, :item_type ] }

  scope :available_products, -> { where(item_type: "Product").where("quantity > 0") }
  scope :products_for, ->(warehouse) { includes(item: [ :material, :brand ]).where(warehouse: warehouse, item_type: "Product") }
  scope :materials_for, ->(warehouse) { includes(:item).where(warehouse: warehouse, item_type: "Material") }

  after_commit :check_and_resolve_stock_alert, on: [:create, :update]

  private

  def check_and_resolve_stock_alert
    return unless item_type == "Product"

    query = Inventory.joins("INNER JOIN products ON products.id = inventories.item_id AND inventories.item_type = 'Product'")
                     .where(company_id: company_id, products: { active: true })
    stock_by_product = query.group(:item_id).sum(:quantity)

    product_ids = stock_by_product.keys
    products = Product.where(id: product_ids).index_by(&:id)

    critical_count = 0
    stock_by_product.each do |product_id, qty|
      product = products[product_id]
      next unless product
      
      threshold = product.critical_stock_threshold || 20
      critical_count += 1 if qty <= threshold
    end

    if critical_count == 0
      Notification.where(
        company_id: company_id,
        title: "Stock Crítico"
      ).destroy_all
    end
  end
end
