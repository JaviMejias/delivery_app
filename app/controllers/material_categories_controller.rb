class MaterialCategoriesController < ApplicationController
  before_action :require_admin!

  def index
    categories = MaterialCategory.recent.search_by_name(params[:search])

    pagy, records = pagy(:offset, categories, limit: 20)

    render inertia: "Catalog/MaterialCategories/Index", props: {
      categories: records.as_json,
      pagination: extract_pagy(pagy),
      currentSearch: params[:search]
    }
  end
  def create
    category = MaterialCategory.new(category_params)
    if category.save
      redirect_to material_categories_path, notice: "Categoría creada exitosamente."
    else
      redirect_to material_categories_path, alert: "Error al crear la categoría."
    end
  end

  def update
    category = MaterialCategory.find(params[:id])
    if category.update(category_params)
      redirect_to material_categories_path, notice: "Categoría actualizada."
    else
      redirect_to material_categories_path, alert: "Error al actualizar."
    end
  end

  def destroy
    category = MaterialCategory.find(params[:id])
    if category.destroy
      redirect_to material_categories_path, notice: "Categoría eliminada."
    else
      redirect_to material_categories_path, alert: "No se puede eliminar la categoría porque está en uso."
    end
  end

  private

  def category_params
    params.require(:material_category).permit(:name, :active)
  end
end
