class PriceListsController < ApplicationController
  before_action :require_admin!

  def index
    lists = current_tenant.price_lists.order(id: :asc)
    pagy, records = pagy(lists, limit: 15)

    render inertia: "Catalog/PriceLists/Index", props: {
      priceLists: records,
      pagination: extract_pagy(pagy)
    }
  end

  def create
    list = current_tenant.price_lists.build(price_list_params)
    if list.save
      redirect_to price_lists_path, notice: "Lista de precios creada exitosamente."
    else
      redirect_to price_lists_path, alert: "Error al crear la lista de precios."
    end
  end

  def update
    list = current_tenant.price_lists.find(params[:id])
    if list.update(price_list_params)
      redirect_to price_lists_path, notice: "Lista de precios actualizada."
    else
      redirect_to price_lists_path, alert: "Error al actualizar la lista."
    end
  end

  def destroy
    list = current_tenant.price_lists.find(params[:id])
    if list.destroy
      redirect_to price_lists_path, notice: "Lista de precios eliminada."
    else
      redirect_to price_lists_path, alert: "No se puede eliminar la lista porque tiene precios asociados u otros problemas."
    end
  end

  private

  def price_list_params
    params.require(:price_list).permit(:name, :code, :active, :available_for_trucks, :available_for_local)
  end
end
