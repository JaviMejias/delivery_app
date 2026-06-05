class MaterialsController < ApplicationController
  before_action :require_admin!

  def index
    materials = Material.includes(:material_category).recent.search_by_name(params[:search])
    
    if params[:category_id].present? && params[:category_id] != 'all'
      materials = materials.where(material_category_id: params[:category_id])
    end

    pagy, records = pagy(:offset, materials, limit: 20)

    categories = MaterialCategory.ordered_by_name

    render inertia: "Catalog/Materials/Index", props: {
      materials: records.as_json(include: :material_category),
      pagination: extract_pagy(pagy),
      currentSearch: params[:search],
      currentCategory: params[:category_id],
      categories: categories
    }
  end

  def create
    material = Material.new(material_params)
    if material.save
      redirect_to materials_path, notice: "Material creado exitosamente."
    else
      redirect_to materials_path, alert: "Error: #{material.errors.full_messages.join(', ')}"
    end
  end

  def update
    material = Material.find(params[:id])
    if material.update(material_params)
      redirect_to materials_path, notice: "Material actualizado."
    else
      redirect_to materials_path, alert: "Error: #{material.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    material = Material.find(params[:id])
    if material.destroy
      redirect_to materials_path, notice: "Material eliminado."
    else
      redirect_to materials_path, alert: "No se puede eliminar: #{material.errors.full_messages.join(', ')}"
    end
  end

  private

  def material_params
    params.require(:material).permit(:name, :material_category_id, :unit, :measure, :active, :returnable)
  end
end
