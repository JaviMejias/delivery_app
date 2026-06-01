class RouteSettlementItemsController < ApplicationController
  before_action :require_route_access!
  before_action :set_settlement

  def create
    if @settlement.completed?
      redirect_to route_settlement_path(@settlement), alert: "No se pueden añadir registros a una rendición completada."
      return
    end

    item = @settlement.route_settlement_items.new(item_params)

    if item.save
      redirect_to route_settlement_path(@settlement)
    else
      redirect_to route_settlement_path(@settlement), alert: "Error: #{item.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    item = @settlement.route_settlement_items.find(params[:id])

    unless @settlement.completed?
      item.destroy
    end

    redirect_to route_settlement_path(@settlement)
  end

  private

  def set_settlement
    @settlement = RouteSettlement.find(params[:route_settlement_id])
  end

  def item_params
    params.require(:route_settlement_item).permit(:product_id, :price_list_id, :sold_quantity, :returned_empty_quantity)
  end
end
