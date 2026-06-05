class DashboardController < ApplicationController
  def show
    if current_user.driver?
      redirect_to driver_radar_path
      return
    elsif current_user.cashier?
      redirect_to local_sales_path
      return
    elsif current_user.warehouse_keeper?
      redirect_to inventory_stock_path
      return
    end

    dashboard_data = DashboardAnalyticsService.new(current_tenant, params).call
    render inertia: "Dashboard/Index", props: dashboard_data
  end
end
