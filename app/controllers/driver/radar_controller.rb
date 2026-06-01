class Driver::RadarController < ApplicationController
  before_action :require_driver_access!
  skip_before_action :verify_authenticity_token, only: [:accept_order, :complete_order, :cancel_order, :update_location]
  def index
    render inertia: 'Driver/Radar'
  end
  def orders
    truck = current_truck
    if truck&.departure_time.present? && Time.current >= truck.departure_time
      pending_transition = CustomerOrder.active_for_truck(truck).where(status: :accepted).first
      pending_transition&.update!(status: :in_transit)
    end
    active_order = truck ? CustomerOrder.active_for_truck(truck).first : nil
    truck_data = if truck
      {
        id: truck.id,
        plate_number: truck.plate_number,
        latitude: truck.latitude&.to_f,
        longitude: truck.longitude&.to_f,
        has_destination: truck.destination_latitude.present?,
        destination_latitude: truck.destination_latitude&.to_f,
        destination_longitude: truck.destination_longitude&.to_f,
        destination_client_name: truck.destination_client_name,
        destination_address: truck.destination_address,
        route_points: truck.route_points ? JSON.parse(truck.route_points) : nil,
        active_order_id: active_order&.id,
        active_order_summary: active_order&.summary_text,
        active_order_phone: active_order&.phone,
        inventory: current_truck_inventory
      }
    else
      { id: nil, plate_number: 'Sin camión', latitude: nil, longitude: nil, has_destination: false, destination_latitude: nil, destination_longitude: nil, destination_client_name: nil, destination_address: nil, route_points: nil, active_order_id: nil, active_order_summary: nil, active_order_phone: nil, inventory: [] }
    end
    pending_orders = CustomerOrder.pending_for_company(current_tenant.id)
      .where("truck_id IS NULL OR truck_id = ?", truck&.id)
      .order(created_at: :asc)
      .limit(30)
      .map do |order|
        {
          id: order.id,
          client_name: order.client_name,
          phone: order.phone,
          address: order.address,
          latitude: order.latitude.to_f,
          longitude: order.longitude.to_f,
          summary: order.summary_text,
          details: order.details,
          notes: order.notes,
          created_at: order.created_at,
          distance_km: truck ? estimate_distance(truck, order) : nil,
          is_proposed: order.truck_id == truck&.id
        }
      end

    render json: { orders: pending_orders, truck: truck_data }
  end
  def accept_order
    truck = current_truck
    order = CustomerOrder.pending_for_company(current_tenant.id).find(params[:order_id])

    Driver::AcceptOrderService.call(order: order, truck: truck, current_tenant: current_tenant)
    render json: { success: true, order_token: order.order_token }
  rescue ActiveRecord::StaleObjectError
    render json: { error: 'Alguien más fue más rápido. Este pedido ya fue tomado por otro repartidor.' }, status: :conflict
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Pedido no encontrado o ya fue tomado por otro camión' }, status: :not_found
  rescue => e
    render json: { success: false, error: e.message }, status: :unprocessable_entity
  end
  def update_location
    truck = current_truck
    return render json: { error: 'Sin camión asignado' }, status: :unprocessable_entity unless truck

    lat = params[:latitude].to_f
    lng = params[:longitude].to_f
    return render json: { error: 'Coordenadas inválidas' }, status: :bad_request if lat == 0 && lng == 0

    truck.update!(latitude: lat, longitude: lng, gps_last_updated_at: Time.current)
    active_order = CustomerOrder.active_for_truck(truck).first
    if active_order
      if active_order.accepted? && truck.departure_time.present? && Time.current >= truck.departure_time
        active_order.update!(status: :in_transit)

      elsif active_order.in_transit? && truck.destination_latitude.present?
        dist_km = haversine_km(lat, lng, truck.destination_latitude.to_f, truck.destination_longitude.to_f)
        if dist_km <= 0.15        # < 150m → arrived
          active_order.update!(status: :arrived)
        elsif dist_km <= 0.5      # < 500m → nearby
          active_order.update!(status: :nearby)
        end

      elsif active_order.nearby? && truck.destination_latitude.present?
        dist_km = haversine_km(lat, lng, truck.destination_latitude.to_f, truck.destination_longitude.to_f)
        if dist_km <= 0.15        # < 150m → arrived
          active_order.update!(status: :arrived)
        end
      end
    end

    render json: { ok: true }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
  def complete_order
    truck = current_truck
    return render json: { error: 'No tienes un camión asignado' }, status: :unprocessable_entity unless truck

    order = CustomerOrder.where(truck: truck, company_id: current_tenant.id)
                         .where(status: %i[accepted in_transit nearby arrived])
                         .find(params[:order_id])
    
    ActiveRecord::Base.transaction do
      if params[:reason].present?
        order.notes = [order.notes, "Entrega Forzada por #{truck.plate_number}: #{params[:reason]}"].reject(&:blank?).join(" | ")
      end
      order.update!(status: :completed)
      truck.update!(
        destination_latitude: nil,
        destination_longitude: nil,
        destination_client_name: nil,
        destination_address: nil,
        route_points: nil,
        route_current_index: 0,
        departure_time: nil
      )
    end

    ActionCable.server.broadcast("orders_#{current_tenant.id}", {
      action: 'order_updated',
      order_id: order.id
    })
    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Pedido no encontrado' }, status: :not_found
  end

  def reject_proposal
    truck = current_truck
    return render json: { error: 'No tienes un camión asignado' }, status: :unprocessable_entity unless truck

    order = CustomerOrder.where(company_id: current_tenant.id, status: :pending, truck_id: truck.id).find(params[:order_id])
    reason = params[:reason].presence || 'Rechazado sin motivo'

    ActiveRecord::Base.transaction do
      order.update!(
        truck_id: nil,
        notes: [order.notes, "Chofer #{truck.plate_number} rechazó la asignación: #{reason}"].reject(&:blank?).join(" | ")
      )
    end

    ActionCable.server.broadcast("orders_#{current_tenant.id}", { action: 'order_updated', order_id: order.id })
    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Pedido no encontrado o ya no está propuesto' }, status: :not_found
  end

  def cancel_order
    truck = current_truck
    return render json: { error: 'No tienes un camión asignado' }, status: :unprocessable_entity unless truck

    order = CustomerOrder.where(truck: truck, company_id: current_tenant.id)
                         .where(status: %i[accepted in_transit nearby arrived])
                         .find(params[:order_id])
    
    reason = params[:reason].presence || 'Cancelado por el chofer sin motivo'

    ActiveRecord::Base.transaction do
      order.update!(
        status: :pending, 
        truck: nil,
        notes: [order.notes, "Cancelado por el chofer #{truck.plate_number}: #{reason}"].reject(&:blank?).join(" | ")
      )
      truck.update!(
        destination_latitude: nil,
        destination_longitude: nil,
        destination_client_name: nil,
        destination_address: nil,
        route_points: nil,
        route_current_index: 0,
        departure_time: nil
      )
    end

    ActionCable.server.broadcast("orders_#{current_tenant.id}", {
      action: 'order_updated',
      order_id: order.id
    })
    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Pedido no encontrado' }, status: :not_found
  rescue => e
    render json: { success: false, error: e.message }, status: :unprocessable_entity
  end

  private

  def require_driver_access!
    unless current_user&.driver? || current_user&.admin?
      redirect_to dashboard_path, alert: 'Acceso denegado: Solo choferes pueden usar el Radar.'
    end
  end

  def current_truck
    return nil unless current_user&.driver?
    @current_truck ||= Truck.active.find_by(driver_id: current_user.id, company_id: current_tenant.id)
  end

  def current_truck_inventory
    return [] unless @current_truck&.warehouse
    Inventory.products_for(@current_truck.warehouse).map do |inv|
      { name: inv.item.name, quantity: inv.quantity, item_id: inv.item.id }
    end
  end

  def estimate_distance(truck, order)
    return nil unless truck.latitude.present? && truck.longitude.present?
    haversine_km(truck.latitude.to_f, truck.longitude.to_f, order.latitude.to_f, order.longitude.to_f).round(1)
  end

  def haversine_km(lat1, lng1, lat2, lng2)
    r = 6371.0
    d_lat = (lat2 - lat1) * Math::PI / 180
    d_lng = (lng2 - lng1) * Math::PI / 180
    a = Math.sin(d_lat / 2)**2 +
        Math.cos(lat1 * Math::PI / 180) * Math.cos(lat2 * Math::PI / 180) * Math.sin(d_lng / 2)**2
    r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  end

end
