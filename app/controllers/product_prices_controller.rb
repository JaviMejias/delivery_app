class ProductPricesController < ApplicationController
  def create
    product = Product.find(params[:product_id])
    price = product.product_prices.new(price_params)

    if price.save
      redirect_to products_path, notice: "Precio registrado exitosamente."
    else
      redirect_to products_path, alert: "Error al registrar el precio."
    end
  end

  def update
    price = ProductPrice.find(params[:id])
    if price.update(price_params)
      redirect_to products_path, notice: "Precio actualizado."
    else
      redirect_to products_path, alert: "Error al actualizar el precio."
    end
  end

  def destroy
    price = ProductPrice.find(params[:id])
    price.destroy
    redirect_to products_path, notice: "Precio eliminado."
  end

  private

  def price_params
    params.require(:product_price).permit(:price, :channel, :valid_from, :valid_until)
  end
end
