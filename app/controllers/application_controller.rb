class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include Pagy::Method

  before_action :authenticate_user!

  set_current_tenant_through_filter
  before_action :set_tenant

  def set_tenant
    if current_user
      if current_user.super_admin?
        set_current_tenant(current_user.current_company)
      else
        tenant = current_user.current_company || current_user.companies.first
        set_current_tenant(tenant)
      end
    end
  end

  inertia_share do
    user_json = current_user&.as_json(only: %i[id email first_name last_name role active current_company_id])
    if current_user && ActsAsTenant.current_tenant
      membership = CompanyMembership.find_by(user: current_user, company: ActsAsTenant.current_tenant)
      user_json["assigned_warehouse_id"] = membership&.warehouse_id if user_json
    end

    {
      auth: {
        user: user_json,
        current_company: ActsAsTenant.current_tenant&.as_json(only: %i[id name rut address business_activity phone]),
        available_companies: current_user&.admin? ? Company.order(:name).as_json(only: %i[id name]) : []
      },
      flash: {
        notice: flash[:notice],
        alert: flash[:alert]
      },
      app_name: ENV.fetch('APP_NAME', 'StockFlow')
    }
  end

  protected

  def after_sign_in_path_for(resource)
    if resource.is_a?(PublicOrderCustomer)
      # PublicOrderCustomers are authenticated via the public order flow.
      # Because the path requires the company slug, we can get it from the resource if possible,
      # but Devise doesn't pass the company slug easily here.
      # Wait, how do we know the company slug?
      # We could get it from the params if it was present, or we can look at their last order,
      # or just redirect back if request.referer is present.

      stored_location_for(resource) || public_order_new_path(company_slug: params[:company_slug]) rescue root_path
    else
      dashboard_path
    end
  end

  def require_admin!
    unless current_user.admin?
      redirect_to dashboard_path, alert: "Acceso denegado: Se requieren permisos de Administrador."
    end
  end

  def require_inventory_access!
    unless current_user.admin? || current_user.warehouse_keeper?
      redirect_to dashboard_path, alert: "Acceso denegado: Área exclusiva de Bodega."
    end
  end

  def require_sales_access!
    unless current_user.admin? || current_user.cashier?
      redirect_to dashboard_path, alert: "Acceso denegado: Área exclusiva de Ventas."
    end
  end

  def require_route_access!
    unless current_user.admin? || current_user.cashier? || current_user.driver?
      redirect_to dashboard_path, alert: "Acceso denegado: Área exclusiva de Ruta."
    end
  end

  def extract_pagy(pagy)
    {
      page: pagy.page,
      pages: pagy.pages,
      count: pagy.count,
      prev: pagy.previous,
      next: pagy.next,
      series: pagy.send(:series)
    }
  end
end
