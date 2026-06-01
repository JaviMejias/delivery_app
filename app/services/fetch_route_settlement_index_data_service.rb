class FetchRouteSettlementIndexDataService
  def self.call(records)
    truck_ids_with_stock = Inventory.available_products.select(:warehouse_id)
    trucks = Truck.active_with_driver.where(warehouse_id: truck_ids_with_stock)

    {
      settlements: records.as_json(include: { truck: { include: [ :warehouse, :driver ] } }),
      trucks: trucks.as_json(include: :driver)
    }
  end
end
