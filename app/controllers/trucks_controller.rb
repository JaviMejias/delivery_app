class TrucksController < ApplicationController
  before_action :require_admin!

  def index
    trucks = Truck.includes(:warehouse, :driver).order(:plate_number).search_by_query(params[:search])
    trucks = trucks.where(base_warehouse_id: params[:warehouse_id]) if params[:warehouse_id].present?
    pagy, records = pagy(:offset, trucks, limit: 20)

    active_drivers = User.drivers.active.order(:first_name, :last_name)
    assigned_driver_ids = Truck.where.not(driver_id: nil).pluck(:id, :driver_id).to_h
    base_warehouses = Warehouse.active_warehouses.stationary.order(:name)

    render inertia: "Trucks/Index", props: {
      trucks: records.as_json(include: [ :warehouse, :driver, :base_warehouse ]),
      pagination: extract_pagy(pagy),
      currentSearch: params[:search],
      currentWarehouseId: params[:warehouse_id],
      drivers: active_drivers.as_json,
      assigned_driver_ids: assigned_driver_ids,
      base_warehouses: base_warehouses.as_json
    }
  end

  def create
    truck = Truck.new(truck_params)
    truck.active = true
    if truck.save
      redirect_to trucks_path, notice: "Camión registrado exitosamente."
    else
      redirect_to trucks_path, alert: "Error al registrar camión: #{truck.errors.full_messages.join(', ')}"
    end
  end

  def update
    truck = Truck.find(params[:id])
    if truck.update(truck_params)
      check_maintenance_alert(truck)
      redirect_to trucks_path, notice: "Camión actualizado correctamente."
    else
      redirect_to trucks_path, alert: "Error: #{truck.errors.full_messages.join(', ')}"
    end
  end

  def toggle_active
    truck = Truck.find(params[:id])
    truck.update(active: !truck.active)
    redirect_to trucks_path, notice: truck.active? ? "Camión activado." : "Camión desactivado."
  end
  def map
    company = current_tenant
    products = company.products.where(active: true, available_in_app: true).includes(:brand, :material)
    brands_with_products = products.group_by(&:brand).map do |brand, brand_products|
      {
        id: brand&.id || "generic",
        name: brand&.name || "Otros",
        logo_url: brand&.logo&.attached? ? url_for(brand.logo) : nil,
        products: brand_products.map do |p|
          {
            id: p.id,
            name: p.name,
            kg: p.material&.measure.to_f,
            sku: p.sku,
            image_url: p.image&.attached? ? url_for(p.image) : nil
          }
        end
      }
    end

    render inertia: "Trucks/Map", props: {
      company_id: company.id,
      brands: brands_with_products
    }
  end
  def locations
    SimulateTruckMovementService.new(current_tenant).call
    trucks = Truck.where(company_id: current_tenant.id).active.includes(:driver, :warehouse)

    locations_data = trucks.map do |truck|
      products = Inventory.products_for(truck.warehouse).map do |inv|
        { name: inv.item.name, quantity: inv.quantity }
      end
      materials = Inventory.materials_for(truck.warehouse).map do |inv|
        { name: inv.item.name, quantity: inv.quantity }
      end
      today = Time.current.beginning_of_day..Time.current.end_of_day
      truck_orders_today = CustomerOrder.where(company_id: current_tenant.id, truck_id: truck.id, created_at: today)
      completed_orders = truck_orders_today.where(status: :completed).count
      accepted_orders = truck_orders_today.where(status: [ :accepted, :in_transit ]).count
      cancelled_orders = truck_orders_today.where(status: :cancelled).count
      destination = nil
      if truck.destination_latitude.present? && truck.destination_longitude.present?
        destination = {
          latitude: truck.destination_latitude.to_f,
          longitude: truck.destination_longitude.to_f,
          client_name: truck.destination_client_name.presence || "Despacho Asignado",
          address: truck.destination_address.presence || "Dirección de Entrega"
        }
      end
      route_coords = nil
      if truck.route_points.present?
        begin
          route_coords = JSON.parse(truck.route_points)
        rescue
          route_coords = nil
        end
      end

      {
        id: truck.id,
        plate_number: truck.plate_number,
        latitude: truck.latitude&.to_f,
        longitude: truck.longitude&.to_f,
        gps_active: truck.gps_active?,
        has_real_gps: truck.gps_last_updated_at.present?,
        gps_device_token: truck.gps_device_token,
        driver_name: truck.driver ? truck.driver.full_name : "Sin Chofer",
        driver_phone: truck.driver&.phone,
        warehouse_name: truck.warehouse.name,
        products: products,
        materials: materials,
        total_llenos: products.sum { |p| p[:quantity] },
        total_vacios: materials.sum { |m| m[:quantity] },
        destination: destination,
        route_coords: route_coords,
        departure_time: truck.departure_time,
        metrics: {
          completed: completed_orders,
          accepted: accepted_orders,
          cancelled: cancelled_orders
        }
      }
    end
    active_orders = CustomerOrder.where(company_id: current_tenant.id, status: [ :pending, :accepted, :in_transit ])
                                 .select(:id, :client_name, :address, :latitude, :longitude, :status, :truck_id, :details, :created_at)
                                 .order(created_at: :asc)

    render json: {
      trucks: locations_data,
      orders: active_orders.as_json
    }
  end

  def search_customers
    query = params[:q]
    
    customers = Customer.where(company_id: current_tenant.id).includes(:customer_addresses)
    if query.present?
      customers = customers.search_by_query(query).limit(10)
    else
      customers = customers.order(created_at: :desc).limit(10)
    end
    
    customers_data = customers.map do |c|
      {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        email: c.email,
        addresses: c.customer_addresses.map do |a|
          {
            id: a.id,
            address: a.address,
            latitude: a.latitude,
            longitude: a.longitude,
            reference: a.reference,
            is_default: a.is_default
          }
        end
      }
    end

    render json: { customers: customers_data }
  end

  def pending_mileage_updates
    trucks = current_tenant.trucks.active.where(has_gps: false).includes(:driver)
    data = trucks.map do |t|
      {
        id: t.id,
        plate_number: t.plate_number,
        current_km: t.current_km,
        driver_name: t.driver ? t.driver.full_name : "Sin Chofer",
        driver_phone: t.driver&.phone
      }
    end
    render json: { trucks: data }
  end

  def bulk_update_mileage
    updates = params[:updates] || []
    
    ActiveRecord::Base.transaction do
      updates.each do |update|
        truck = current_tenant.trucks.find_by(id: update[:id])
        if truck && update[:current_km].present?
          if truck.update(current_km: update[:current_km])
            check_maintenance_alert(truck)
          end
        end
      end
    end
    
    render json: { success: true }
  end

  def set_destination
    truck = Truck.find(params[:id])
    start_lat = truck.latitude&.to_f
    start_lng = truck.longitude&.to_f
    dest_lat = params[:destination_latitude]&.to_f
    dest_lng = params[:destination_longitude]&.to_f
    route_points = nil
    if start_lat.present? && start_lng.present? && dest_lat.present? && dest_lng.present?
      begin
        require "net/http"
        require "json"
        url_str = "http://router.project-osrm.org/route/v1/driving/#{start_lng},#{start_lat};#{dest_lng},#{dest_lat}?overview=full&geometries=geojson"
        uri = URI(url_str)
        response = Net::HTTP.start(uri.host, uri.port, read_timeout: 4, open_timeout: 4) do |http|
          http.get(uri.request_uri)
        end

        if response.is_a?(Net::HTTPSuccess)
          result = JSON.parse(response.body)
          if result["code"] == "Ok" && result["routes"]&.first
            geometry = result["routes"].first["geometry"]
            if geometry && geometry["coordinates"]
              raw_points = geometry["coordinates"].map { |coords| [ coords[1].to_f, coords[0].to_f ] }
              route_points = raw_points.to_json
            end
          end
        end
      rescue => e
        Rails.logger.error "Error calculando ruta OSRM: #{e.message}"
      end
    end
    if route_points.blank? && start_lat.present? && start_lng.present? && dest_lat.present? && dest_lng.present?
      linear_points = []
      40.times do |i|
        fraction = i.to_f / 39.0
        p_lat = start_lat + (dest_lat - start_lat) * fraction
        p_lng = start_lng + (dest_lng - start_lng) * fraction
        linear_points << [ p_lat, p_lng ]
      end
      route_points = linear_points.to_json
    end

    if truck.update(
      destination_latitude: params[:destination_latitude],
      destination_longitude: params[:destination_longitude],
      destination_client_name: params[:destination_client_name],
      destination_address: params[:destination_address],
      route_points: route_points,
      route_current_index: 0,
      departure_time: Time.current + 15.seconds,
      gps_last_updated_at: nil # Forzar simulación al desactivar GPS real temporalmente
    )
      render json: { success: true, truck: truck }
    else
      render json: { success: false, errors: truck.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def clear_destination
    truck = Truck.find(params[:id])

    ActiveRecord::Base.transaction do
      # Cancel any active orders assigned to this truck
      active_orders = CustomerOrder.where(truck: truck, company_id: current_tenant.id, status: [ :accepted, :in_transit, :nearby, :arrived ])
      active_orders.each do |order|
        order.update!(
          status: :pending,
          truck: nil,
          notes: [ order.notes, "Cancelado por el Administrador" ].reject(&:blank?).join(" | ")
        )
      end

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

    # Broadcast the cancellation to update the driver's radar and other clients
    ActionCable.server.broadcast("orders_#{current_tenant.id}", { action: "truck_cleared", truck_id: truck.id })

    render json: { success: true, truck: truck }
  rescue => e
    render json: { success: false, errors: [ e.message ] }, status: :unprocessable_entity
  end

  def cancel_order
    order = CustomerOrder.where(company_id: current_tenant.id).find(params[:order_id])
    reason = params[:reason].presence || "Sin motivo especificado"

    ActiveRecord::Base.transaction do
      truck_id = order.truck_id
      order.update!(
        status: :cancelled,
        truck: nil,
        notes: [ order.notes, "Cancelado por el Administrador: #{reason}" ].reject(&:blank?).join(" | ")
      )

      if truck_id
        truck = Truck.find(truck_id)
        # Solo limpiar ruta si no tiene otro pedido asignado
        unless CustomerOrder.where(truck: truck, company_id: current_tenant.id, status: [ :accepted, :in_transit, :nearby, :arrived ]).exists?
          truck.update!(
            destination_latitude: nil,
            destination_longitude: nil,
            destination_client_name: nil,
            destination_address: nil,
            route_points: nil,
            route_current_index: 0,
            departure_time: nil
          )
          ActionCable.server.broadcast("orders_#{current_tenant.id}", { action: "truck_cleared", truck_id: truck_id })
        end
      end
    end

    render json: { success: true }
  rescue => e
    render json: { success: false, errors: [ e.message ] }, status: :unprocessable_entity
  end

  def assign_order
    order = CustomerOrder.where(company_id: current_tenant.id).find(params[:order_id])
    truck = Truck.where(company_id: current_tenant.id, active: true).find(params[:truck_id])

    if order.status != "pending"
      return render json: { success: false, errors: [ "El pedido ya no está disponible" ] }, status: :unprocessable_entity
    end

    ActiveRecord::Base.transaction do
      order.update!(
        truck_id: truck.id,
        notes: [ order.notes, "Asignado por Admin al camión #{truck.plate_number}" ].reject(&:blank?).join(" | ")
      )
    end

    # Notificar a todos que el pedido fue actualizado (desaparecerá para los demás)
    ActionCable.server.broadcast("orders_#{current_tenant.id}", { action: "order_updated", order_id: order.id })
    # Notificar específicamente a los choferes que hay una propuesta nueva
    ActionCable.server.broadcast("orders_#{current_tenant.id}", { action: "order_proposed", order_id: order.id, truck_id: truck.id })

    render json: { success: true }
  rescue => e
    render json: { success: false, errors: [ e.message ] }, status: :unprocessable_entity
  end

  private

  def check_maintenance_alert(truck)
    return unless truck.next_maintenance_km.present? && truck.current_km.present?
    
    # Auto-resolver si el camión ya no requiere mantención ni está próximo
    if (truck.next_maintenance_km - truck.current_km) > 1000
      Notification.where(
        company: current_tenant,
        title: ["Mantenimiento Requerido", "Mantenimiento Próximo"]
      ).where("message LIKE ?", "%patente #{truck.plate_number}%").destroy_all
      return
    end

    if truck.current_km >= truck.next_maintenance_km
      unless Notification.exists?(
        company: current_tenant,
        title: "Mantenimiento Requerido",
        read_at: nil
      )
        Notification.create!(
          company: current_tenant,
          title: "Mantenimiento Requerido",
          message: "El camión patente #{truck.plate_number} alcanzó el kilometraje de mantención (#{truck.current_km.to_i} km).",
          notification_type: "danger",
          action_url: "/trucks"
        )
      end
    elsif (truck.next_maintenance_km - truck.current_km) <= 1000
      unless Notification.exists?(
        company: current_tenant,
        title: "Mantenimiento Próximo",
        read_at: nil
      )
        Notification.create!(
          company: current_tenant,
          title: "Mantenimiento Próximo",
          message: "El camión patente #{truck.plate_number} está a #{truck.next_maintenance_km - truck.current_km} km de su mantención programada.",
          notification_type: "warning",
          action_url: "/trucks"
        )
      end
    end
  end

  def truck_params
    params.require(:truck).permit(
      :plate_number, 
      :driver_id, 
      :base_warehouse_id, 
      :active,
      :technical_revision_date,
      :circulation_permit_date,
      :current_km,
      :next_maintenance_km,
      :has_gps,
      :mileage_update_frequency
    )
  end
end
