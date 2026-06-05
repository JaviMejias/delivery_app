class RouteSettlementsController < ApplicationController
  before_action :require_route_access!

  def index
    settlements = RouteSettlement.with_details.includes(:route_settlement_expenses, route_settlement_items: { product: :material }).recent
    
    if params[:search].present?
      settlements = settlements.search_by_query(params[:search])
    end

    start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : Date.today.beginning_of_month
    end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.today

    settlements = settlements.where(date: start_date..end_date)
    if current_user.driver? && !current_user.admin?
      truck_ids = Truck.where(driver_id: current_user.id, company_id: current_tenant.id).pluck(:id)
      settlements = settlements.where(truck_id: truck_ids)
    end

    pagy, records = pagy(:offset, settlements, limit: 20)

    index_data = FetchRouteSettlementIndexDataService.call(records, current_user, current_tenant)

    render inertia: "Sales/Settlements/Index", props: {
      settlements: index_data[:settlements],
      trucks: index_data[:trucks],
      pagination: extract_pagy(pagy),
      currentSearch: params[:search]
    }
  end

  def create
    settlement = RouteSettlement.new(settlement_params)
    settlement.status = :draft

    if settlement.save
      redirect_to route_settlement_path(settlement), notice: "Rendición iniciada. Agrega las ventas."
    else
      redirect_to route_settlements_path, alert: "Error: #{settlement.errors.full_messages.join(', ')}"
    end
  end

  def update
    settlement = RouteSettlement.find(params[:id])

    if settlement.update(settlement_update_params)
      puts "Update successful! New values: #{settlement.slice(:cash_revenue, :card_revenue, :transfer_revenue).inspect}"
      redirect_to route_settlement_path(settlement), notice: "Montos actualizados correctamente."
    else
      puts "Update failed! Errors: #{settlement.errors.full_messages}"
      redirect_to route_settlement_path(settlement), alert: "Error: #{settlement.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    settlement = RouteSettlement.find(params[:id])
    if settlement.draft?
      settlement.destroy
      redirect_to route_settlements_path, notice: "Borrador de rendición eliminado correctamente."
    else
      redirect_to route_settlements_path, alert: "No se puede eliminar una rendición que ya fue completada."
    end
  end

  def show
    settlement = RouteSettlement.with_full_details.find(params[:id])

    show_data = FetchRouteSettlementShowDataService.call(settlement, current_tenant)

    render inertia: "Sales/Settlements/Show", props: show_data
  end

  def complete
    settlement = RouteSettlement.find(params[:id])

    ProcessRouteSettlementService.new(settlement, params).call

    redirect_to route_settlement_path(settlement), notice: "Rendición completada. El inventario del camión ha sido actualizado."
  rescue => e
    redirect_to route_settlement_path(settlement), alert: "Error al cerrar la caja: #{e.message}"
  end

  private

  def settlement_params
    params.require(:route_settlement).permit(:truck_id, :date)
  end

  def settlement_update_params
    params.permit(:cash_revenue, :card_revenue, :transfer_revenue)
  end
end
