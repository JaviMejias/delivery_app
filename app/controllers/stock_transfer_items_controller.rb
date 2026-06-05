class StockTransferItemsController < ApplicationController
  before_action :require_inventory_access!
  before_action :set_transfer

  def create
    if @transfer.completed?
      redirect_to inventory_transfer_path(@transfer), alert: "No se pueden añadir ítems a una transferencia completada."
      return
    end

    if params[:is_empty].to_s == "true"
      product = Product.find(params[:product_id])
      item = product.material
    else
      item = Product.find(params[:product_id])
    end

    transfer_item = @transfer.stock_transfer_items.new(
      item: item,
      quantity: params[:quantity]
    )

    if transfer_item.save
      redirect_to inventory_transfer_path(@transfer)
    else
      redirect_to inventory_transfer_path(@transfer), alert: "Error: #{transfer_item.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    item = @transfer.stock_transfer_items.find(params[:id])

    unless @transfer.completed?
      item.destroy
    end

    redirect_to inventory_transfer_path(@transfer)
  end

  private

  def set_transfer
    @transfer = StockTransfer.find(params[:transfer_id])
  end
end
