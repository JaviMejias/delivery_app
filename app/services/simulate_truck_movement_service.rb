class SimulateTruckMovementService
  def initialize(company)
    @company = company
  end

  def call
    trucks = Truck.where(company_id: @company.id).active.includes(:driver, :warehouse)

    trucks.each do |truck|
      next if truck.gps_active? || truck.gps_last_updated_at.present?

      if truck.base_warehouse.blank?
        if truck.latitude.present? || truck.longitude.present?
          truck.update_columns(latitude: nil, longitude: nil)
        end
        next
      end

      if truck.latitude.blank? || truck.longitude.blank?
        offset_lat = (truck.id % 5) * 0.008 - 0.016
        offset_lng = (truck.id % 5) * 0.008 - 0.016

        base_lat = truck.base_warehouse&.latitude || BigDecimal("-33.4489")
        base_lng = truck.base_warehouse&.longitude || BigDecimal("-70.6693")

        truck.update_columns(
          latitude: base_lat + BigDecimal(offset_lat.to_s),
          longitude: base_lng + BigDecimal(offset_lng.to_s)
        )
      else
        if truck.destination_latitude.present? && truck.destination_longitude.present?
          if truck.departure_time.present? && Time.current < truck.departure_time
            new_lat = truck.latitude
            new_lng = truck.longitude
          elsif truck.route_points.present?
            begin
              route = JSON.parse(truck.route_points)
              current_idx = truck.route_current_index || 0

              if current_idx >= route.length - 1
                new_lat = truck.destination_latitude
                new_lng = truck.destination_longitude
                truck.update_columns(
                  route_points: nil,
                  route_current_index: 0
                )
              else
                next_idx = current_idx
                loop do
                  next_idx += 1
                  break if next_idx >= route.length - 1

                  p_curr = route[current_idx]
                  p_next = route[next_idx]
                  dist = Math.sqrt(((p_next[0] - p_curr[0])**2) + ((p_next[1] - p_curr[1])**2))
                  break if dist >= 0.0008
                end
                next_idx = route.length - 1 if next_idx >= route.length

                new_lat = route[next_idx][0]
                new_lng = route[next_idx][1]
                truck.update_columns(route_current_index: next_idx)
              end
            rescue => e
              new_lat = truck.destination_latitude
              new_lng = truck.destination_longitude
              truck.update_columns(
                route_points: nil,
                route_current_index: 0
              )
            end
          else
            diff_lat = truck.destination_latitude.to_f - truck.latitude.to_f
            diff_lng = truck.destination_longitude.to_f - truck.longitude.to_f
            distance = Math.sqrt((diff_lat ** 2) + (diff_lng ** 2))

            if distance <= 0.0008
              new_lat = truck.destination_latitude
              new_lng = truck.destination_longitude
              truck.update_columns(
                route_points: nil,
                route_current_index: 0
              )
            else
              step_size = 0.0008
              ratio = step_size / distance
              noise_lat = rand(-0.00015..0.00015)
              noise_lng = rand(-0.00015..0.00015)
              new_lat = truck.latitude + BigDecimal((diff_lat * ratio + noise_lat).to_s)
              new_lng = truck.longitude + BigDecimal((diff_lng * ratio + noise_lng).to_s)
            end
          end
        else
          delta_lat = rand(-0.0004..0.0004)
          delta_lng = rand(-0.0004..0.0004)

          new_lat = truck.latitude + BigDecimal(delta_lat.to_s)
          new_lng = truck.longitude + BigDecimal(delta_lng.to_s)

          base_lat = truck.base_warehouse&.latitude || BigDecimal("-33.4489")
          base_lng = truck.base_warehouse&.longitude || BigDecimal("-70.6693")

          if new_lat < base_lat - 0.05 || new_lat > base_lat + 0.05
            new_lat = base_lat
          end
          if new_lng < base_lng - 0.05 || new_lng > base_lng + 0.05
            new_lng = base_lng
          end
        end

        truck.update_columns(
          latitude: new_lat,
          longitude: new_lng
        )
        truck.broadcast_tracking_location
      end
    end
    Truck.where(company_id: @company.id).active.includes(:driver, :warehouse)
  end
end
