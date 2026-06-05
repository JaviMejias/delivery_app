class InventoryAdjustmentsController < ApplicationController
  before_action :require_inventory_access!

  def new
    # Fetch active warehouses (including trucks)
    warehouses = Warehouse.active_warehouses.order(:name)

    # Fetch active materials (envases) and products (llenos)
    materials = Material.where(active: true).ordered_by_name
    products = Product.includes(:material, :brand).where(active: true).ordered_by_name

    render inertia: "Inventory/Adjustments/New", props: {
      warehouses: warehouses.as_json(only: [ :id, :name ]),
      materials: materials.map { |m| { id: m.id, name: m.full_name } },
      products: products.map do |p|
        {
          id: p.id,
          name: p.name,
          material_name: p.material&.name,
          brand_name: p.brand&.name
        }
      end
    }
  end

  def create
    service = ProcessInventoryAdjustmentService.new(current_tenant, current_user, adjustment_params)
    result = service.call

    if result == true
      redirect_to new_inventory_adjustment_path, notice: "Ajuste de inventario realizado con éxito."
    else
      redirect_to new_inventory_adjustment_path, alert: result
    end
  end

  private

  def adjustment_params
    params.require(:inventory_adjustment).permit(:warehouse_id, :item_type, :item_id, :quantity_change, :reason)
  end
end
