class ProcessRouteSettlementService
  def initialize(settlement, params = {})
    @settlement = settlement
    @company = settlement.company
    @truck = settlement.truck
    @params = params
  end

  def call
    raise 'Esta rendición ya fue completada.' if @settlement.completed?

    ActiveRecord::Base.transaction do
      if @params[:cash_revenue].present? || @params[:card_revenue].present? || @params[:transfer_revenue].present?
        @settlement.update!(
          cash_revenue: @params[:cash_revenue].presence || 0,
          card_revenue: @params[:card_revenue].presence || 0,
          transfer_revenue: @params[:transfer_revenue].presence || 0
        )
      end
      @settlement.route_settlement_items.each do |item|
        if item.sold_quantity > 0
          inv = Inventory.find_or_initialize_by(
            company_id: @company.id,
            warehouse_id: @truck.warehouse_id,
            item: item.product
          )
          inv.quantity = (inv.quantity || 0) - item.sold_quantity
          inv.save!

          StockMovement.create!(
            company_id: @company.id,
            warehouse_id: @truck.warehouse_id,
            item: item.product,
            reference: @settlement,
            quantity: -item.sold_quantity,
            movement_type: :sale,
            reason: "Venta en Rendición ##{@settlement.id}"
          )
        end
        if item.returned_empty_quantity > 0
          inv = Inventory.find_or_initialize_by(
            company_id: @company.id,
            warehouse_id: @truck.warehouse_id,
            item: item.product.material
          )
          inv.quantity = (inv.quantity || 0) + item.returned_empty_quantity
          inv.save!

          StockMovement.create!(
            company_id: @company.id,
            warehouse_id: @truck.warehouse_id,
            item: item.product.material,
            reference: @settlement,
            quantity: item.returned_empty_quantity,
            movement_type: :return_empty,
            reason: "Devolución de envases en Rendición ##{@settlement.id}"
          )
        end
      end
      @settlement.update!(status: :completed)
    end
  end
end
