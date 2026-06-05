class ProductsController < ApplicationController
  before_action :require_admin!

  def index
    products = Product.includes(:material, :brand, product_prices: :price_list).recent.search_by_name_or_sku(params[:search])
    pagy, records = pagy(:offset, products, limit: 20)

    materials = Material.active.ordered_by_name
    brands = Brand.active.ordered_by_name
    price_lists = current_tenant.price_lists.active.order(:id)

    products_json = records.as_json(include: [ :material, :brand, product_prices: { include: :price_list } ])
    products_json.each_with_index do |p_json, i|
      p_json["image_url"] = url_for(records[i].image) if records[i].image.attached?
    end

    render inertia: "Catalog/Products/Index", props: {
      products: products_json,
      materials: materials,
      brands: brands,
      priceLists: price_lists,
      pagination: extract_pagy(pagy),
      currentSearch: params[:search]
    }
  end

  def create
    product = Product.new(product_params)
    if product.save
      update_prices(product, params[:prices])
      redirect_to products_path, notice: "Producto creado exitosamente."
    else
      redirect_to products_path, alert: "Error: #{product.errors.full_messages.join(', ')}"
    end
  end

  def update
    product = Product.find(params[:id])
    if product.update(product_params)
      update_prices(product, params[:prices])
      redirect_to products_path, notice: "Producto actualizado."
    else
      redirect_to products_path, alert: "Error: #{product.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    product = Product.find(params[:id])
    if product.destroy
      redirect_to products_path, notice: "Producto eliminado."
    else
      redirect_to products_path, alert: "No se puede eliminar: #{product.errors.full_messages.join(', ')}"
    end
  end

  private

  def update_prices(product, prices)
    UpdateProductPricesService.new(product, prices).call
  end

  def product_params
    params.require(:product).permit(:name, :sku, :material_id, :brand_id, :active, :accepts_vouchers, :available_in_app, :image, :critical_stock_threshold)
  end
end
