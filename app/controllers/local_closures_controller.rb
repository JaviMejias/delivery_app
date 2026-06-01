class LocalClosuresController < ApplicationController
  before_action :require_sales_access!

  def index
    closures = LocalClosure.with_details.recent

    pagy, records = pagy(:offset, closures, limit: 20)

    render inertia: "Sales/Local/Closures/Index", props: {
      closures: records.as_json(include: :warehouse),
      pagination: extract_pagy(pagy)
    }
  end

  def new
    warehouse_id = params[:warehouse_id]
    date = params[:date]

    warehouses = Warehouse.where(company_id: current_tenant.id).active_warehouses.stationary

    result = CalculateLocalClosureTotalsService.new(current_tenant, warehouse_id, date).call

    if result
      system_totals = result[:totals]
      already_closed = result[:already_closed]
    else
      system_totals = { cash: 0, card: 0, transfer: 0, total: 0 }
      already_closed = false
    end

    render inertia: "Sales/Local/Closures/New", props: {
      warehouses: warehouses,
      selected_warehouse_id: warehouse_id,
      selected_date: date,
      system_totals: system_totals,
      already_closed: already_closed
    }
  end

  def create
    closure = LocalClosure.new(closure_params)
    closure.company_id = current_tenant.id
    closure.status = :completed

    if closure.save
      redirect_to local_closure_path(closure), notice: "Cierre de caja guardado exitosamente."
    else
      redirect_to new_local_closure_path, alert: closure.errors.full_messages.join(", ")
    end
  end

  def show
    closure = LocalClosure.includes(:warehouse).find_by!(id: params[:id], company_id: current_tenant.id)

    render inertia: "Sales/Local/Closures/Show", props: {
      closure: closure.as_json(include: :warehouse)
    }
  end

  private

  def closure_params
    params.require(:local_closure).permit(
      :warehouse_id,
      :date,
      :system_cash,
      :system_card,
      :system_transfer,
      :system_total,
      :declared_cash,
      :declared_card,
      :declared_transfer,
      :declared_total,
      :observations
    )
  end
end
