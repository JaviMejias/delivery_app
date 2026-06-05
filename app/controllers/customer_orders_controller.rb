class CustomerOrdersController < ApplicationController
  before_action :require_admin!

  def index
    # Default date range to current month
    @start_date = params[:start_date].presence ? Date.parse(params[:start_date]) : Date.current.beginning_of_month
    @end_date = params[:end_date].presence ? Date.parse(params[:end_date]) : Date.current

    orders = CustomerOrder.where(company_id: current_tenant.id)
                          .includes(truck: :driver)
                          .order(created_at: :desc)
                          .search_by_query(params[:search])
                          .filter_by_status(params[:status])
                          .filter_by_date(@start_date, @end_date)
    if params[:format] == "xlsx"
      send_data ExportCustomerOrdersService.new(orders, params[:theme]).to_xlsx, filename: "pedidos-#{Date.today}.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else
      pagy, records = pagy(:offset, orders, limit: 20)

      # Format the records to include associations and summary text
      formatted_orders = records.map do |order|
      order.as_json(
        include: {
          truck: { include: :driver }
        }
      ).merge({
        "summary_text" => order.summary_text
      })
    end

      render inertia: "Logistics/Orders/Index", props: {
        orders: formatted_orders,
        pagination: extract_pagy(pagy),
        currentSearch: params[:search],
        currentStatus: params[:status] || "all",
        startDate: @start_date.iso8601,
        endDate: @end_date.iso8601
      }
    end
  end
end
