class SuppliersController < ApplicationController
  before_action :require_admin!

  def index
    suppliers = Supplier.ordered_by_name.search_by_name(params[:search])
    pagy, records = pagy(:offset, suppliers, limit: 20)

    render inertia: 'Catalog/Suppliers/Index', props: {
      suppliers: records,
      pagination: extract_pagy(pagy),
      currentSearch: params[:search]
    }
  end

  def create
    supplier = Supplier.new(supplier_params)
    if supplier.save
      redirect_to suppliers_path, notice: 'Proveedor creado exitosamente.'
    else
      redirect_to suppliers_path, alert: 'Error al crear el proveedor.'
    end
  end

  def update
    supplier = Supplier.find(params[:id])
    if supplier.update(supplier_params)
      redirect_to suppliers_path, notice: 'Proveedor actualizado.'
    else
      redirect_to suppliers_path, alert: 'Error al actualizar.'
    end
  end

  def destroy
    supplier = Supplier.find(params[:id])
    supplier.destroy
    redirect_to suppliers_path, notice: 'Proveedor eliminado.'
  end

  private

  def supplier_params
    params.require(:supplier).permit(:name, :rut, :contact_email, :contact_phone, :active)
  end
end
