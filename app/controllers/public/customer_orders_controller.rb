class Public::CustomerOrdersController < ApplicationController
  skip_before_action :verify_authenticity_token
  skip_before_action :authenticate_user!, raise: false
  skip_before_action :require_admin!, raise: false
  before_action :find_company_by_slug, only: [:new, :create, :show, :history]

  layout 'public'

  def new
    brands_with_products = Public::CustomerOrders::FetchNewOrderDataService.call(@company)
    
    addresses = []
    if current_public_order_customer
      addresses = current_public_order_customer.customer_addresses.order(is_default: :desc, created_at: :desc)
    end

    reorder_data = nil
    if params[:reorder].present?
      order = CustomerOrder.find_by(order_token: params[:reorder])
      if order
        reorder_data = {
          address: order.address,
          latitude: order.latitude,
          longitude: order.longitude,
          details: order.details,
          client_name: order.client_name,
          phone: order.phone
        }
      end
    end

    render inertia: 'Public/Order/New', props: {
      company: @company.slice(:id, :slug, :name, :address, :phone).merge({
        company_phones: @company.company_phones.map { |p| { id: p.id, number: p.number, label: p.label } }
      }),
      brands: brands_with_products,
      reorder_data: reorder_data,
      current_customer: current_public_order_customer ? current_public_order_customer.slice(:id, :first_name, :last_name, :phone, :email, :address, :latitude, :longitude) : nil,
      customer_addresses: addresses,
      is_blocked: current_public_order_customer&.cancellations_in_last_24h.to_i >= 3
    }
  end

  def create
    # Merge customer id if signed in
    order_params = params
    if current_public_order_customer
      if current_public_order_customer.cancellations_in_last_24h >= 3
        render json: { success: false, errors: ['Has excedido el límite de 3 cancelaciones en las últimas 24 horas. Por favor comunícate con soporte.'] }, status: :unprocessable_entity
        return
      end

      order_params = params.deep_dup
      order_params[:customer_id] = current_public_order_customer.id

      # Update customer's latest address to save time next order
      current_public_order_customer.update(
        address: order_params[:address],
        latitude: order_params[:latitude],
        longitude: order_params[:longitude]
      )

      # Save to address book if coordinates are new
      unless current_public_order_customer.customer_addresses.exists?(latitude: order_params[:latitude], longitude: order_params[:longitude])
        current_public_order_customer.customer_addresses.create(
          alias: "Dirección #{current_public_order_customer.customer_addresses.count + 1}",
          address: order_params[:address],
          latitude: order_params[:latitude],
          longitude: order_params[:longitude],
          is_default: current_public_order_customer.customer_addresses.count == 0
        )
      end
    end
    
    result = Public::CustomerOrders::CreateOrderService.call(@company, order_params)

    if result[:success]
      render json: { success: true, order_token: result[:order].order_token }
    else
      render json: { success: false, errors: result[:errors] }, status: :unprocessable_entity
    end
  end

  def show
    @order = CustomerOrder.find_by(order_token: params[:token])
    unless @order
      respond_to do |format|
        format.html { redirect_to public_order_new_path(@company.slug), alert: 'Pedido no encontrado' }
        format.json { render json: { error: 'Pedido no encontrado' }, status: :not_found }
      end
      return
    end
    if @order.completed? || @order.cancelled?
      respond_to do |format|
        format.html { redirect_to public_order_new_path(@company.slug), notice: @order.completed? ? '¡Tu pedido fue entregado! Puedes hacer un nuevo pedido cuando quieras.' : 'Este pedido fue cancelado.' }
        format.json { render json: { expired: true, status: @order.status }, status: :gone }
      end
      return
    end

    order_data = Public::CustomerOrders::FetchOrderTrackingDataService.call(@order, @company)

    respond_to do |format|
      format.html do
        render inertia: 'Public/Tracking', props: {
          company: @company.slice(:id, :slug, :name, :address, :phone),
          order: order_data,
          current_customer: current_public_order_customer ? current_public_order_customer.slice(:id, :first_name).merge(
            cancellations_in_last_24h: current_public_order_customer.cancellations_in_last_24h
          ) : nil
        }
      end
      format.json { render json: order_data }
    end
  end

  def history
    unless current_public_order_customer
      redirect_to new_public_order_customer_session_path(company_slug: @company.slug)
      return
    end

    month = params[:month].present? ? params[:month].to_i : Date.today.month
    year = params[:year].present? ? params[:year].to_i : Date.today.year
    start_date = Date.new(year, month, 1)
    end_date = start_date.end_of_month

    orders = CustomerOrder.where(customer_id: current_public_order_customer.id)
                          .where(created_at: start_date.beginning_of_day..end_date.end_of_day)
                          .order(created_at: :desc)
    
    @pagy, paginated_orders = pagy(orders, limit: 10)
    
    render inertia: 'Public/Order/History', props: {
      company: @company.slice(:id, :slug, :name),
      current_customer: current_public_order_customer.slice(:id, :first_name, :last_name).merge(
        cancellations_in_last_24h: current_public_order_customer.cancellations_in_last_24h
      ),
      orders: paginated_orders.as_json(only: [:id, :order_token, :status, :created_at, :details, :total_price]),
      pagination: extract_pagy(@pagy),
      filters: { month: month, year: year }
    }
  end

  def cancel
    unless current_public_order_customer
      render json: { error: 'No autorizado' }, status: :unauthorized
      return
    end

    @order = CustomerOrder.find_by(id: params[:id], customer_id: current_public_order_customer.id)
    
    if @order.nil?
      render json: { error: 'Pedido no encontrado' }, status: :not_found
    elsif @order.pending?
      @order.update(status: :cancelled)
      render json: { success: true, message: 'Pedido cancelado correctamente' }
    else
      render json: { error: 'No se puede cancelar un pedido que ya está en proceso' }, status: :unprocessable_entity
    end
  end

  private

  def find_company_by_slug
    @company = Company.find_by!(slug: params[:company_slug])
    
    unless @company.enable_public_orders?
      respond_to do |format|
        format.html { render plain: 'Esta empresa no tiene habilitado el portal de pedidos públicos.', status: :not_found }
        format.json { render json: { error: 'Servicio no disponible para esta empresa' }, status: :not_found }
      end
    end
  rescue ActiveRecord::RecordNotFound
    respond_to do |format|
      format.html { render plain: 'Empresa no encontrada', status: :not_found }
      format.json { render json: { error: 'Empresa no encontrada' }, status: :not_found }
    end
  end
end
