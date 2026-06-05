class FetchRouteSettlementIndexDataService
  def self.call(records, current_user = nil, current_tenant = nil)
    truck_ids_with_stock = Inventory.available_products.select(:warehouse_id)
    trucks = Truck.active_with_driver.where(warehouse_id: truck_ids_with_stock)

    if current_user&.driver? && !current_user&.admin?
      trucks = trucks.where(driver_id: current_user.id)
    end

    {
      settlements: records.as_json(include: { 
        truck: { include: [ :warehouse, :driver ] },
        route_settlement_expenses: {},
        route_settlement_items: { include: { product: { include: :material } } }
      }),
      trucks: trucks.as_json(include: :driver)
    }
  end
end
