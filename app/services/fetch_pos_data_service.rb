class FetchPosDataService
  def self.call(tenant, params)
    warehouses = Warehouse.where(company_id: tenant.id).active_warehouses.stationary
    price_lists = PriceList.where(company_id: tenant.id, active: true, available_for_local: true).order(:id)

    inventories = Inventory.includes(item: [ :material, :brand, :product_prices ])
                           .where(company_id: tenant.id)
                           .available_products

    has_sales_today = LocalSale.where(company_id: tenant.id, date: Date.current).exists?

    props = {
      warehouses: warehouses,
      price_lists: price_lists,
      inventories: inventories.as_json(include: { item: { include: [ :material, :brand, :product_prices ] } }),
      has_sales_today: has_sales_today
    }

    if params[:print_sale_id].present?
      sale = LocalSale.includes(:warehouse, local_sale_items: { product: [ :material, :brand ] }).find_by(id: params[:print_sale_id], company_id: tenant.id)
      if sale
        props[:print_sale] = sale.as_json(include: {
          warehouse: {},
          local_sale_items: { include: { product: { include: [ :material, :brand ] } } }
        })
      end
    end

    props
  end
end
