class DailyCriticalStockAlertService
  def self.call
    Company.find_each do |company|
      new(company).call
    end
  end

  def initialize(company)
    @company = company
  end

  def call
    query = Inventory.joins("INNER JOIN products ON products.id = inventories.item_id AND inventories.item_type = 'Product'")
                     .where(company_id: @company.id, products: { active: true })

    stock_by_product = query.group(:item_id).sum(:quantity)

    critical_count = 0
    stock_by_product.each do |product_id, qty|
      product = Product.find_by(id: product_id)
      next unless product
      
      threshold = product.critical_stock_threshold || 20
      critical_count += 1 if qty <= threshold
    end

    if critical_count > 0
      # Delete existing read notifications to prevent spam, or check if unread exists
      unless Notification.exists?(
        company: @company,
        title: "Stock Crítico",
        read_at: nil
      )
        Notification.create!(
          company: @company,
          title: "Stock Crítico",
          message: "Hay #{critical_count} producto(s) bajo el mínimo de stock ideal. Revisa el Dashboard para más detalles.",
          notification_type: "warning",
          action_url: "/dashboard"
        )
      end
    end
  end
end
