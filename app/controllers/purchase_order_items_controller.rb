class PurchaseOrderItemsController < ApplicationController
  before_action :require_inventory_access!
  before_action :set_order

  def create
    item = @order.purchase_order_items.new(item_params)

    if item.save
      update_order_total
      redirect_to purchase_order_path(@order), notice: "Producto añadido a la orden."
    else
      redirect_to purchase_order_path(@order), alert: "Error al añadir el producto."
    end
  end

  def destroy
    item = @order.purchase_order_items.find(params[:id])
    item.destroy
    update_order_total

    redirect_to purchase_order_path(@order), notice: "Producto eliminado."
  end

  private

  def set_order
    @order = PurchaseOrder.find(params[:purchase_order_id])
    unless @order.draft?
      redirect_to purchase_order_path(@order), alert: "Solo puedes modificar órdenes en borrador."
    end
  end

  def item_params
    params.permit(:product_id, :quantity, :unit_price, :has_iva)
  end

  def update_order_total
    total = @order.grand_total
    @order.update(total: total)
  end
end
