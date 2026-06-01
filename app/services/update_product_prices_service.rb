class UpdateProductPricesService
  def initialize(product, prices)
    @product = product
    @prices = prices
  end

  def call
    return unless @prices.present?

    @prices.each do |price_list_id, price_val|
      if price_val.present? && price_val.to_s.strip != ""
        price_record = @product.product_prices.find_or_initialize_by(price_list_id: price_list_id)
        price_record.update!(price: price_val)
      else
        price_record = @product.product_prices.find_by(price_list_id: price_list_id)
        price_record&.destroy!
      end
    end
  end
end
