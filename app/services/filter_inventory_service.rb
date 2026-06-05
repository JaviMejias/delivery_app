class FilterInventoryService
  def self.call(params)
    warehouses = Warehouse.active.ordered_by_name
    
    if params[:warehouse_id].present? && params[:warehouse_id] != 'all'
      warehouse = warehouses.find_by(id: params[:warehouse_id])
      inventories = warehouse ? Inventory.includes(:warehouse, item: [ :material, :brand ]).where(warehouse: warehouse) : Inventory.none
    else
      warehouse = nil
      inventories = Inventory.includes(:warehouse, item: [ :material, :brand ]).where(warehouse: warehouses)
    end

    [ warehouses, warehouse, inventories ]
  end
end
