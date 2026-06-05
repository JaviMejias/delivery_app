class FetchRouteSettlementShowDataService
  def self.call(settlement, tenant)
    truck_inventory = Inventory.available_products.products_for(settlement.truck.warehouse_id)
    available_price_lists = tenant.price_lists.where(active: true, available_for_trucks: true)

    {
      settlement: settlement.as_json(
        include: {
          truck: { include: [ :warehouse, :driver ] },
          route_settlement_expenses: {},
          route_settlement_items: {
            include: {
              product: { include: [ :material, :brand, :product_prices ] },
              price_list: {}
            }
          }
        }
      ),
      truck_inventory: truck_inventory.as_json(include: { item: { include: [ :material, :brand, product_prices: { include: :price_list } ] } }),
      available_price_lists: available_price_lists
    }
  end
end
