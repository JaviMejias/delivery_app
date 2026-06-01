class ProcessLocalSaleService
  def initialize(company, params)
    @company = company
    @params = params
  end

  def call
    ActiveRecord::Base.transaction do
      sale = LocalSale.new(
        company_id: @company.id,
        warehouse_id: @params[:warehouse_id],
        sale_type: @params[:sale_type],
        status: :completed,
        cash_revenue: @params[:cash_revenue] || 0,
        card_revenue: @params[:card_revenue] || 0,
        transfer_revenue: @params[:transfer_revenue] || 0,
        voucher_revenue: @params[:voucher_revenue] || 0,
        card_surcharge: @params[:card_surcharge] || 0
      )
      
      sale.total_revenue = sale.cash_revenue + sale.card_revenue + sale.transfer_revenue + sale.voucher_revenue
      sale.save!
      items_data = @params[:items] || []
      
      items_data.each do |item_data|
        product = Product.find(item_data[:product_id])
        quantity = item_data[:quantity].to_i
        empty_qty = item_data[:returned_empty_quantity].to_i
        sale.local_sale_items.create!(
          product_id: product.id,
          price_list_id: item_data[:price_list_id],
          quantity: quantity,
          returned_empty_quantity: empty_qty,
          subtotal: item_data[:subtotal] || 0,
          voucher_code: item_data[:voucher_code]
        )

        process_full_inventory(sale, product, quantity) if quantity > 0
        process_empty_inventory(sale, product, empty_qty) if empty_qty > 0 && product.material.returnable
      end
      
      sale
    end
  end

  private

  def process_full_inventory(sale, product, quantity)
    inventory_full = Inventory.find_or_initialize_by(
      company_id: @company.id,
      warehouse_id: sale.warehouse_id,
      item: product
    )
    
    if inventory_full.quantity.to_i < quantity
      raise "No hay suficiente stock de #{product.name} en esta bodega."
    end
    
    inventory_full.quantity -= quantity
    inventory_full.save!

    StockMovement.create!(
      company_id: @company.id,
      warehouse_id: sale.warehouse_id,
      item: product,
      movement_type: :sale,
      quantity: quantity,
      reference: sale,
      reason: "Venta Local ##{sale.id}"
    )
  end

  def process_empty_inventory(sale, product, empty_qty)
    inventory_empty = Inventory.find_or_initialize_by(
      company_id: @company.id,
      warehouse_id: sale.warehouse_id,
      item: product.material # El vacío es el material base
    )
    inventory_empty.quantity = inventory_empty.quantity.to_i + empty_qty
    inventory_empty.save!

    StockMovement.create!(
      company_id: @company.id,
      warehouse_id: sale.warehouse_id,
      item: product.material,
      movement_type: :return_empty,
      quantity: empty_qty,
      reference: sale,
      reason: "Retorno Envases (Venta Local ##{sale.id})"
    )
  end
end
