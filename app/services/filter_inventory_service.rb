class FilterInventoryService
  def self.call(params)
    warehouses = Warehouse.active.ordered_by_name
    warehouse = params[:warehouse_id].present? ? warehouses.find_by(id: params[:warehouse_id]) : warehouses.first
    inventories = warehouse ? Inventory.includes(item: [:material, :brand]).where(warehouse: warehouse) : Inventory.none

    [warehouses, warehouse, inventories]
  end
end
