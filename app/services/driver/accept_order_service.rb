module Driver
  class AcceptOrderService
    def self.call(order:, truck:, current_tenant:)
      raise 'No tienes un camión asignado a tu usuario' unless truck
      raise 'Ya tienes un despacho activo en curso' if truck.destination_latitude.present?

      ActiveRecord::Base.transaction do
        order.update!(status: :accepted, truck: truck)
        set_truck_destination(truck, order)
      end

      ActionCable.server.broadcast("orders_#{current_tenant.id}", {
        action: 'order_accepted',
        order_id: order.id,
        truck_id: truck.id
      })

      true
    end

    private

    def self.set_truck_destination(truck, order)
      start_lat = truck.latitude&.to_f
      start_lng = truck.longitude&.to_f
      dest_lat  = order.latitude.to_f
      dest_lng  = order.longitude.to_f

      route_points = nil
      begin
        require 'net/http'
        url_str = "http://router.project-osrm.org/route/v1/driving/#{start_lng},#{start_lat};#{dest_lng},#{dest_lat}?overview=full&geometries=geojson"
        uri      = URI(url_str)
        response = Net::HTTP.start(uri.host, uri.port, read_timeout: 4, open_timeout: 4) { |h| h.get(uri.request_uri) }
        if response.is_a?(Net::HTTPSuccess)
          result = JSON.parse(response.body)
          if result['code'] == 'Ok' && result['routes']&.first
            coords       = result['routes'].first['geometry']['coordinates']
            route_points = coords.map { |c| [c[1].to_f, c[0].to_f] }.to_json
          end
        end
      rescue => e
        Rails.logger.error "OSRM error in radar: #{e.message}"
      end

      if route_points.blank? && start_lat.present?
        linear = 40.times.map do |i|
          f = i.to_f / 39.0
          [start_lat + (dest_lat - start_lat) * f, start_lng + (dest_lng - start_lng) * f]
        end
        route_points = linear.to_json
      end

      truck.update!(
        destination_latitude:    dest_lat,
        destination_longitude:   dest_lng,
        destination_client_name: order.client_name,
        destination_address:     order.address,
        route_points:            route_points,
        route_current_index:     0,
        departure_time:          Time.current + 15.seconds,
        gps_last_updated_at:     nil
      )
    end
  end
end
