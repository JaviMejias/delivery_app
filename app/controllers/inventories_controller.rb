class InventoriesController < ApplicationController
  before_action :require_inventory_access!

  def index
    warehouses, warehouse, inventories = FilterInventoryService.call(params)

    if params[:format] == 'xlsx'
      send_data ExportInventoryService.new(inventories).to_xlsx, filename: "inventario-#{warehouse&.name}-#{Date.today}.xlsx", type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    else
      product_inventory = inventories.select { |inv| inv.item.is_a?(Product) }
      material_inventory = inventories.select { |inv| inv.item.is_a?(Material) }

      render inertia: "Inventory/Stock/Index", props: {
        warehouses: warehouses,
        warehouse: warehouse,
        product_inventory: product_inventory.as_json(include: { item: { include: [:material, :brand] } }),
        material_inventory: material_inventory.as_json(include: :item)
      }
    end
  end
end
