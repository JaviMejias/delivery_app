class WarehousesController < ApplicationController
  before_action :require_admin!

  def index
    warehouses = Warehouse.stationary.ordered_by_name.search_by_name(params[:search])
    pagy, records = pagy(:offset, warehouses, limit: 20)

    render inertia: "Inventory/Warehouses/Index", props: {
      warehouses: records.as_json(only: [:id, :name, :active, :card_surcharge_type, :card_surcharge_amount, :address, :latitude, :longitude]),
      pagination: extract_pagy(pagy),
      currentSearch: params[:search]
    }
  end

  def create
    warehouse = Warehouse.new(warehouse_params)
    if warehouse.save
      redirect_to warehouses_path, notice: "Bodega creada exitosamente."
    else
      redirect_to warehouses_path, alert: "Error al crear la bodega."
    end
  end

  def update
    warehouse = Warehouse.find(params[:id])
    if warehouse.update(warehouse_params)
      redirect_to warehouses_path, notice: "Bodega actualizada."
    else
      redirect_to warehouses_path, alert: "Error al actualizar."
    end
  end

  def destroy
    warehouse = Warehouse.find(params[:id])
    if warehouse.destroy
      redirect_to warehouses_path, notice: "Bodega eliminada."
    else
      redirect_to warehouses_path, alert: "No se puede eliminar la bodega."
    end
  end

  private

  def warehouse_params
    params.require(:warehouse).permit(:name, :active, :card_surcharge_type, :card_surcharge_amount, :address, :latitude, :longitude)
  end
end
