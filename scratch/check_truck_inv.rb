puts Inventory.where(warehouse_id: Truck.last.warehouse_id).map { |i| "#{i.item.name}: #{i.quantity}" }.join(", ")
