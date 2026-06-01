class FetchLocalSalesIndexDataService
  def self.call(records)
    warehouses = Warehouse.active.stationary

    {
      sales: records.as_json(include: {
        warehouse: {},
        local_sale_items: { include: { product: { include: [ :material, :brand ] } } }
      }),
      warehouses: warehouses
    }
  end
end
