class InventoriesController < ApplicationController
  before_action :require_inventory_access!

  def index
    warehouses, warehouse, inventories = FilterInventoryService.call(params)

    if params[:format] == "xlsx"
      filename_suffix = warehouse&.name || 'Todas'
      send_data ExportInventoryService.new(inventories, params[:theme]).to_xlsx, filename: "inventario-#{filename_suffix}-#{Date.today}.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else
      product_inventory = inventories.select { |inv| inv.item.is_a?(Product) }
      material_inventory = inventories.select { |inv| inv.item.is_a?(Material) }

      render inertia: "Inventory/Stock/Index", props: {
        warehouses: warehouses,
        warehouse: warehouse,
        product_inventory: product_inventory.as_json(include: { item: { include: [ :material, :brand ] }, warehouse: { only: [:id, :name] } }),
        material_inventory: material_inventory.as_json(include: { item: {}, warehouse: { only: [:id, :name] } }),
        currentSearch: params[:search],
        currentBrand: params[:brand_id],
        currentTab: params[:tab]
      }
    end
  end
end
