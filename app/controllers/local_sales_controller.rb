class LocalSalesController < ApplicationController
  before_action :require_sales_access!

  def index
    sales = FilterSalesService.call(params)

    unless current_user.admin?
      membership = current_user.company_memberships.find_by(company: current_tenant)
      sales = sales.where(warehouse_id: membership.warehouse_id) if membership&.warehouse_id
    end

    if params[:format] == "xlsx"
      send_data ExportSalesService.new(sales).to_xlsx, filename: "ventas-#{Date.today}.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else
      pagy, records = pagy(:offset, sales, limit: 20)
      index_data = FetchLocalSalesIndexDataService.call(records)

      render inertia: "Sales/Local/Index", props: {
        sales: index_data[:sales],
        warehouses: index_data[:warehouses],
        pagination: extract_pagy(pagy),
        currentSearch: params[:search]
      }
    end
  end

  def pos
    props = FetchPosDataService.call(current_tenant, params)
    render inertia: "Sales/Local/Pos", props: props
  end

  def create
    sale = ProcessLocalSaleService.new(current_tenant, params).call
    redirect_to pos_local_sales_path(print_sale_id: sale.id), notice: "Venta registrada exitosamente"
  rescue => e
    redirect_back fallback_location: pos_local_sales_path, alert: e.message
  end
end
