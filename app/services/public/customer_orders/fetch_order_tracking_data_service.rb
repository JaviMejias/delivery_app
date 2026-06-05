module Public
  module CustomerOrders
    class FetchOrderTrackingDataService
      def self.call(order, company)
        truck_data = nil
        if order.truck.present?
          truck_data = {
            latitude: order.truck.latitude.present? ? order.truck.latitude.to_f : nil,
            longitude: order.truck.longitude.present? ? order.truck.longitude.to_f : nil,
            plate_number: order.truck.plate_number,
            driver_name: order.truck.driver&.full_name || "Sin Chofer",
            route_points: order.truck.route_points ? JSON.parse(order.truck.route_points) : nil,
            departure_time: order.truck.departure_time&.iso8601
          }
        end

        available_trucks_count = Truck.active
          .where(company_id: company.id)
          .where.not(latitude: nil)
          .where.not(id: CustomerOrder.where(status: [ :accepted, :in_transit ]).select(:truck_id).compact)
          .count

        {
          id: order.id,
          order_token: order.order_token,
          status: order.status,
          client_name: order.client_name,
          address: order.address,
          latitude: order.latitude.to_f,
          longitude: order.longitude.to_f,
          summary: order.summary_text,
          truck: truck_data,
          available_trucks_count: available_trucks_count
        }
      end
    end
  end
end
