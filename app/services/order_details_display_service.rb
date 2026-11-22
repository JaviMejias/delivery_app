class OrderDetailsDisplayService
  def self.call(orders, company)
    orders = orders.compact
    product_ids = orders.flat_map do |order|
      ((order.details || {})["items"] || []).map { |item| (item["product_id"] || item["id"]).to_i }
    end.reject(&:zero?).uniq

    product_names = company.products.includes(:material, :brand).where(id: product_ids).each_with_object({}) do |product, names|
      names[product.id] = product.full_name
    end

    orders.each_with_object({}) do |order, result|
      details = (order.details || {}).deep_dup
      (details["items"] || []).each do |item|
        product_id = (item["product_id"] || item["id"]).to_i
        item["name"] = product_names[product_id] if product_names[product_id]
      end

      result[order.id] = {
        details: details,
        summary: summary_for(details)
      }
    end
  end

  def self.summary_for(details)
    return details["quick_order"] if details["quick_order"].present?
    return "Pedido sin detalles" if details["items"].blank?

    details["items"].map { |item| "#{item['quantity']}x #{item['name']}" }.join(", ")
  end
  private_class_method :summary_for
end
