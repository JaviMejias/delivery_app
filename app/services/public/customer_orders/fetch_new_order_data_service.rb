module Public
  module CustomerOrders
    class FetchNewOrderDataService
      def self.call(company)
        products = company.products.where(active: true, available_in_app: true).includes(:brand, :material)
        products.group_by(&:brand).map do |brand, brand_products|
          {
            id: brand&.id || "generic",
            name: brand&.name || "Otros",
            logo_url: brand&.logo&.attached? ? Rails.application.routes.url_helpers.rails_blob_path(brand.logo, only_path: true) : nil,
            products: brand_products.map do |p|
              {
                id: p.id,
                name: p.name,
                kg: p.material&.measure.to_f,
                sku: p.sku,
                image_url: p.image&.attached? ? Rails.application.routes.url_helpers.rails_blob_path(p.image, only_path: true) : nil
              }
            end
          }
        end
      end
    end
  end
end
