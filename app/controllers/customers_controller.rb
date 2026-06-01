class CustomersController < ApplicationController
  before_action :require_admin!

  def index
    customers = Customer.where(company_id: current_tenant.id)
                        .search_by_query(params[:search])
                        .filter_by_status(params[:status])
                        .order(created_at: :desc)
    
    pagy, records = pagy(customers, limit: 20)
    
    paginated_json = records.map do |c|
      blocked = c.cancellations_in_last_24h >= 3
      c.as_json.merge(
        blocked: blocked,
        cancellations_count: c.cancellations_in_last_24h
      )
    end

    render inertia: "Customers/Index", props: {
      customers: paginated_json,
      pagination: extract_pagy(pagy),
      currentSearch: params[:search] || '',
      currentStatus: params[:status] || 'all'
    }
  end

  def unblock
    customer = Customer.find_by(id: params[:id], company_id: current_tenant.id)
    if customer
      customer.update(cancellations_reset_at: Time.current)
      redirect_back fallback_location: customers_path, notice: "El cliente ha sido desbloqueado exitosamente."
    else
      redirect_back fallback_location: customers_path, alert: "Cliente no encontrado."
    end
  end
end
