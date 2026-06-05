class BrandsController < ApplicationController
  before_action :require_admin!

  def index
    brands = Brand.recent.search_by_name(params[:search])
    pagy, records = pagy(:offset, brands, limit: 20)

    brands_json = records.as_json
    brands_json.each_with_index do |b_json, i|
      b_json["logo_url"] = url_for(records[i].logo) if records[i].logo.attached?
    end

    render inertia: "Catalog/Brands/Index", props: {
      brands: brands_json,
      pagination: extract_pagy(pagy),
      currentSearch: params[:search]
    }
  end

  def create
    brand = Brand.new(brand_params)
    if brand.save
      redirect_to brands_path, notice: "Marca creada exitosamente."
    else
      redirect_to brands_path, alert: "Error al crear la marca."
    end
  end

  def update
    brand = Brand.find(params[:id])
    if brand.update(brand_params)
      redirect_to brands_path, notice: "Marca actualizada."
    else
      redirect_to brands_path, alert: "Error al actualizar."
    end
  end

  def destroy
    brand = Brand.find(params[:id])
    if brand.destroy
      redirect_to brands_path, notice: "Marca eliminada."
    else
      redirect_to brands_path, alert: "No se puede eliminar: #{brand.errors.full_messages.join(', ')}"
    end
  end

  private

  def brand_params
    if params[:brand].present?
      params.require(:brand).permit(:name, :active, :logo)
    else
      params.permit(:name, :active, :logo)
    end
  end
end
